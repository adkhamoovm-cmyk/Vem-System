import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin, sendNotification, sendRawNotification, hashPassword, pinRateLimiter, webpush, asyncHandler, validateBody, adminSchemas, userSchemas, getUzbDayNow, getUzbToday } from "../lib/helpers";
import { users, depositRequests, withdrawalRequests, balanceHistory, investments, promoCodes, promoCodeUsages, stajyorRequests } from "@shared/schema";
import { eq, and, desc, sql as dsql } from "drizzle-orm";
import { db } from "../db";
import { pool } from "../db";

const router = Router();

router.get("/api/admin/users", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const allUsers = await storage.getAllUsers();
  res.json(allUsers.map(u => ({ ...u, password: undefined, fundPassword: undefined })));
}));

router.get("/api/admin/users/:id", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const user = await storage.getUser(req.params.id as string);
  if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
  const methods = await storage.getUserPaymentMethods(user.id);
  const deposits = await storage.getUserDepositRequests(user.id);
  const withdrawals = await storage.getUserWithdrawalRequests(user.id);
  const investments = await storage.getUserInvestments(user.id);
  const referralStats = await storage.getReferralStats(user.id);
  const referralTree = await storage.getReferralTree(user.id);
  const enrichedReferralTree = await Promise.all(
    referralTree.map(async (r) => {
      const referred = await storage.getUser(r.referredId);
      return {
        ...r,
        referredPhone: referred?.phone || "—",
        referredNumericId: referred?.numericId || "—",
        referredVipLevel: referred?.vipLevel ?? -1,
        referredBalance: referred?.balance || "0",
        referredCreatedAt: referred?.createdAt || null,
      };
    })
  );
  let invitedBy = null;
  if (user.referredBy) {
    const referrer = await storage.getUser(user.referredBy);
    if (referrer) {
      invitedBy = { id: referrer.id, phone: referrer.phone, numericId: referrer.numericId };
    }
  }
  const { password: _, fundPassword: _fp, ...safeUser } = user;
  res.json({
    user: safeUser,
    invitedBy,
    paymentMethods: methods,
    deposits,
    withdrawals,
    investments,
    referralStats,
    referralTree: enrichedReferralTree,
  });
}));

router.post("/api/admin/users/:id/ban", requireAdmin, validateBody(adminSchemas.banUser), asyncHandler(async (req: Request, res: Response) => {
  const { isBanned } = req.body;
  await storage.banUser(req.params.id as string, isBanned);
  res.json({ message: isBanned ? "Foydalanuvchi bloklandi" : "Foydalanuvchi blokdan chiqarildi" });
}));

router.post("/api/admin/users/:id/withdrawal-ban", requireAdmin, validateBody(adminSchemas.withdrawalBan), asyncHandler(async (req: Request, res: Response) => {
  const { banned } = req.body;
  await storage.setWithdrawalBan(req.params.id as string, banned);
  res.json({ message: banned ? "Pul yechish taqiqlandi" : "Pul yechish ruxsat berildi" });
}));

router.post("/api/admin/users/:id/balance", requireAdmin, validateBody(adminSchemas.setBalance), asyncHandler(async (req: Request, res: Response) => {
  const { amount, mode } = req.body;
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: "Noto'g'ri balans qiymati" });
  }
  const targetId = req.params.id as string;
  const delta = mode === "subtract" ? -numAmount : numAmount;

  await db.transaction(async (tx) => {
    const [locked] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, targetId)).for("update");
    if (!locked) throw new Error("USER_NOT_FOUND");
    const oldBalance = Number(locked.balance);
    const newBalance = Math.max(0, oldBalance + delta);
    await tx.update(users).set({ balance: newBalance.toFixed(2) }).where(eq(users.id, targetId));
    const actualDiff = newBalance - oldBalance;
    await tx.insert(balanceHistory).values({ userId: targetId, type: "admin_adjust", amount: actualDiff.toFixed(2), description: `Texnik bo'lim tomonidan balans o'zgartirildi` });
  }).catch((err) => {
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
    }
    throw err;
  });

  if (res.headersSent) return;
  res.json({ message: "Balans yangilandi" });
}));

router.post("/api/admin/users/:id/vip", requireAdmin, validateBody(adminSchemas.setVip), asyncHandler(async (req: Request, res: Response) => {
  const { level, dailyLimit } = req.body;
  const numLevel = Number(level);
  const numLimit = Number(dailyLimit);
  if (isNaN(numLevel) || numLevel < -1 || numLevel > 10 || isNaN(numLimit) || numLimit < 0) {
    return res.status(400).json({ message: "Noto'g'ri VIP daraja yoki limit qiymati" });
  }
  await storage.setUserVipLevel(req.params.id as string, numLevel, numLimit);
  res.json({ message: "VIP daraja yangilandi" });
}));

router.delete("/api/admin/users/:id", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  await storage.deleteUser(req.params.id as string);
  res.json({ message: "Foydalanuvchi o'chirildi" });
}));

router.post("/api/admin/users/:id/password", requireAdmin, validateBody(adminSchemas.setPassword), asyncHandler(async (req: Request, res: Response) => {
  const { password, fundPassword } = req.body;
  if (password) {
    const hashed = await hashPassword(password);
    await storage.updateUserPassword(req.params.id as string, hashed);
  }
  if (fundPassword) {
    const hashed = await hashPassword(fundPassword);
    await storage.updateUserFundPassword(req.params.id as string, hashed);
  }
  res.json({ message: "Parol yangilandi" });
}));

router.post("/api/admin/vip-packages/:id/toggle-lock", requireAdmin, validateBody(adminSchemas.toggleLock), asyncHandler(async (req: Request, res: Response) => {
  const { locked } = req.body;
  await storage.toggleVipPackageLock(req.params.id as string, locked);
  res.json({ message: locked ? "Daraja yopildi" : "Daraja ochildi" });
}));

router.delete("/api/admin/payment-methods/:id", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  await storage.deletePaymentMethod(req.params.id as string);
  res.json({ message: "To'lov usuli o'chirildi" });
}));

router.get("/api/admin/deposits", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const deposits = await storage.getAllDepositRequests();
  res.json(deposits);
}));

router.post("/api/admin/deposits/:id/approve", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const depositId = req.params.id as string;

  let amountInUSDT = "";
  let depositUserId = "";

  await db.transaction(async (tx) => {
    const [lockedDeposit] = await tx.select().from(depositRequests).where(eq(depositRequests.id, depositId)).for("update");
    if (!lockedDeposit) throw new Error("NOT_FOUND");
    if (lockedDeposit.status !== "pending") throw new Error("ALREADY_PROCESSED");

    amountInUSDT = lockedDeposit.amount;
    depositUserId = lockedDeposit.userId;
    if (lockedDeposit.currency === "UZS") {
      amountInUSDT = (Number(lockedDeposit.amount) / 12100).toFixed(2);
    }

    await tx.update(depositRequests).set({ status: "approved", reviewedAt: new Date() }).where(eq(depositRequests.id, lockedDeposit.id));
    await tx.update(users).set({ balance: dsql`${users.balance}::numeric + ${amountInUSDT}::numeric` }).where(eq(users.id, lockedDeposit.userId));
    await tx.update(users).set({ totalDeposit: dsql`${users.totalDeposit}::numeric + ${amountInUSDT}::numeric` }).where(eq(users.id, lockedDeposit.userId));
    const entries = await tx.select().from(balanceHistory)
      .where(and(eq(balanceHistory.userId, lockedDeposit.userId), eq(balanceHistory.type, "deposit")))
      .orderBy(desc(balanceHistory.createdAt))
      .limit(50);
    let match = entries.find(e => e.description?.startsWith("pending|") && e.description?.includes(lockedDeposit.id));
    if (!match) {
      const searchStr = `${Number(lockedDeposit.amount).toFixed(2)} ${lockedDeposit.currency}`;
      match = entries.find(e => e.description?.startsWith("pending|") && e.description?.includes(searchStr));
    }
    if (match) {
      await tx.update(balanceHistory).set({ amount: amountInUSDT, description: `Depozit tasdiqlandi (${lockedDeposit.currency === "UZS" ? lockedDeposit.amount + " UZS → " : ""}${amountInUSDT} USDT)` }).where(eq(balanceHistory.id, match.id));
    }
  });
  sendNotification(depositUserId, "deposit_confirmed", "deposit_approved", "deposit_approved", { amount: amountInUSDT });
  res.json({ message: "Depozit tasdiqlandi va balansga qo'shildi" });
}));

router.post("/api/admin/deposits/:id/reject", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const depositId = req.params.id as string;
  let depositAmount = "";
  let depositCurrency = "";
  let depositUserId = "";

  await db.transaction(async (tx) => {
    const [lockedDeposit] = await tx.select().from(depositRequests).where(eq(depositRequests.id, depositId)).for("update");
    if (!lockedDeposit) throw new Error("NOT_FOUND");
    if (lockedDeposit.status !== "pending") throw new Error("ALREADY_PROCESSED");

    depositAmount = lockedDeposit.amount;
    depositCurrency = lockedDeposit.currency || "USDT";
    depositUserId = lockedDeposit.userId;

    let amountInUSDT = lockedDeposit.amount;
    if (lockedDeposit.currency === "UZS") {
      amountInUSDT = (Number(lockedDeposit.amount) / 12100).toFixed(2);
    }

    await tx.update(depositRequests).set({ status: "rejected", reviewedAt: new Date() }).where(eq(depositRequests.id, lockedDeposit.id));
    const entries = await tx.select().from(balanceHistory)
      .where(and(eq(balanceHistory.userId, lockedDeposit.userId), eq(balanceHistory.type, "deposit")))
      .orderBy(desc(balanceHistory.createdAt))
      .limit(50);
    let match = entries.find(e => e.description?.startsWith("pending|") && e.description?.includes(lockedDeposit.id));
    if (!match) {
      const searchStr = `${Number(lockedDeposit.amount).toFixed(2)} ${lockedDeposit.currency}`;
      match = entries.find(e => e.description?.startsWith("pending|") && e.description?.includes(searchStr));
    }
    if (match) {
      const origParts = (match.description || "").split("|");
      const methodPart = origParts[1] || "";
      const amountPart = origParts[2] || `${amountInUSDT} USDT`;
      await tx.update(balanceHistory).set({ amount: "0.00", description: `rejected|${methodPart}|${amountPart}` }).where(eq(balanceHistory.id, match.id));
    }
  });
  sendNotification(depositUserId, "system", "deposit_rejected", "deposit_rejected", { amount: depositAmount, currency: depositCurrency });
  res.json({ message: "Depozit rad etildi" });
}));

router.get("/api/admin/withdrawals", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const withdrawals = await storage.getAllWithdrawalRequests();
  const methods = await storage.getAllPaymentMethods();
  const methodMap: Record<string, typeof methods[number]> = {};
  for (const m of methods) { methodMap[m.id] = m; }
  const enriched = withdrawals.map(w => ({
    ...w,
    paymentMethod: methodMap[w.paymentMethodId] || null,
  }));
  res.json(enriched);
}));

router.post("/api/admin/withdrawals/:id/approve", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const withdrawalId = req.params.id as string;
  let wUserId = "";
  let wNetAmount = "";

  await db.transaction(async (tx) => {
    const [lockedW] = await tx.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, withdrawalId)).for("update");
    if (!lockedW) throw new Error("NOT_FOUND");
    if (lockedW.status !== "pending") throw new Error("ALREADY_PROCESSED");

    wUserId = lockedW.userId;
    wNetAmount = lockedW.netAmount;

    await tx.update(withdrawalRequests).set({ status: "approved", reviewedAt: new Date() }).where(eq(withdrawalRequests.id, lockedW.id));
    const entries = await tx.select().from(balanceHistory)
      .where(and(eq(balanceHistory.userId, lockedW.userId), eq(balanceHistory.type, "withdrawal")))
      .orderBy(desc(balanceHistory.createdAt))
      .limit(50);
    const match = entries.find(e => e.description?.includes(lockedW.id));
    if (match) {
      const matchParts = match.description?.split("|") || [];
      matchParts[0] = "approved";
      await tx.update(balanceHistory).set({ description: matchParts.join("|") }).where(eq(balanceHistory.id, match.id));
    }
  });
  sendNotification(wUserId, "withdrawal_done", "withdrawal_approved", "withdrawal_approved", { amount: wNetAmount });
  res.json({ message: "Yechish tasdiqlandi" });
}));

router.post("/api/admin/withdrawals/:id/reject", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const withdrawalId = req.params.id as string;
  let wUserId = "";
  let wAmount = "";

  await db.transaction(async (tx) => {
    const [lockedW] = await tx.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, withdrawalId)).for("update");
    if (!lockedW) throw new Error("NOT_FOUND");
    if (lockedW.status !== "pending") throw new Error("ALREADY_PROCESSED");

    wUserId = lockedW.userId;
    wAmount = lockedW.amount;

    await tx.update(withdrawalRequests).set({ status: "rejected", reviewedAt: new Date() }).where(eq(withdrawalRequests.id, lockedW.id));
    await tx.update(users).set({ balance: dsql`${users.balance}::numeric + ${lockedW.amount}::numeric` }).where(eq(users.id, lockedW.userId));
    const entries = await tx.select().from(balanceHistory)
      .where(and(eq(balanceHistory.userId, lockedW.userId), eq(balanceHistory.type, "withdrawal")))
      .orderBy(desc(balanceHistory.createdAt))
      .limit(50);
    const match = entries.find(e => e.description?.includes(lockedW.id));
    if (match) {
      const matchParts = match.description?.split("|") || [];
      matchParts[0] = "rejected";
      await tx.update(balanceHistory).set({ description: matchParts.join("|") }).where(eq(balanceHistory.id, match.id));
    }
    await tx.insert(balanceHistory).values({ userId: lockedW.userId, type: "withdrawal_cancel", amount: lockedW.amount, description: `refund|${lockedW.amount}|${lockedW.commission}` });
  });
  sendNotification(wUserId, "system", "withdrawal_rejected", "withdrawal_rejected", { amount: wAmount });
  res.json({ message: "Yechish rad etildi va balans qaytarildi" });
}));

router.get("/api/admin/deposit-settings", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const settings = await storage.getDepositSettings();
  res.json(settings);
}));

router.post("/api/admin/deposit-settings", requireAdmin, validateBody(adminSchemas.depositSetting), asyncHandler(async (req: Request, res: Response) => {
  const setting = await storage.upsertDepositSetting(req.body);
  res.json({ setting, message: "Rekvizit saqlandi" });
}));

router.delete("/api/admin/deposit-settings/:id", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  await storage.deleteDepositSetting(req.params.id as string);
  res.json({ message: "Rekvizit o'chirildi" });
}));

router.get("/api/admin/top-referrers", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const top = await storage.getTopReferrers(10);
  const enriched = await Promise.all(
    top.map(async (r: { referrerId: string; totalCommission: string; count: number }) => {
      const user = await storage.getUser(r.referrerId);
      return { ...r, phone: user?.phone, numericId: user?.numericId, vipLevel: user?.vipLevel };
    })
  );
  res.json(enriched);
}));

router.get("/api/admin/multi-accounts", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const groups = await storage.getMultiAccountGroups();
  res.json(groups);
}));

router.get("/api/admin/referral-tree/:userId", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const tree = await storage.getReferralTree(req.params.userId as string);
  res.json(tree);
}));

router.post("/api/stajyor/request", requireAuth, validateBody(userSchemas.stajyorRequest), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const { message } = req.body;

  const user = await storage.getUser(userId);
  if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

  if (user.vipLevel >= 0) {
    return res.status(400).json({ message: "Sizda allaqachon VIP daraja mavjud" });
  }

  if (user.stajyorUsed) {
    return res.status(400).json({ message: "Stajyor faqat bir marta faollashtiriladi. VIP paket sotib oling." });
  }

  const existing = await storage.getUserStajyorRequests(userId);
  const hasApproved = existing.some(r => r.status === "approved");
  if (hasApproved) {
    return res.status(400).json({ message: "Stajyor allaqachon faollashtirilgan. VIP paket sotib oling." });
  }

  const pending = existing.find(r => r.status === "pending");
  if (pending) {
    return res.status(400).json({ message: "Sizning so'rovingiz allaqachon yuborilgan. Iltimos javobini kuting." });
  }

  const request = await storage.createStajyorRequest(userId, message);
  res.json({ request, message: "So'rov yuborildi! Tekshirgandan so'ng Stajyor lavozimi faollashtiriladi." });
}));

router.get("/api/stajyor/status", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const requests = await storage.getUserStajyorRequests(req.session.userId!);
  res.json(requests);
}));

router.get("/api/admin/stajyor-requests", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const requests = await storage.getAllStajyorRequests();
  res.json(requests);
}));

router.post("/api/admin/stajyor-requests/:id/approve", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const requests = await storage.getAllStajyorRequests();
  const request = requests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ message: "So'rov topilmadi" });
  if (request.status !== "pending") return res.status(400).json({ message: "Bu so'rov allaqachon ko'rib chiqilgan" });

  const stajyorExpiry = new Date();
  stajyorExpiry.setDate(stajyorExpiry.getDate() + 3);
  await db.transaction(async (tx) => {
    await tx.update(users).set({ vipLevel: 0, dailyTasksLimit: 3, stajyorUsed: true, vipExpiresAt: stajyorExpiry, vipPurchasedAt: new Date() }).where(eq(users.id, request.userId));
    await tx.update(stajyorRequests).set({ status: "approved", reviewedAt: new Date() }).where(eq(stajyorRequests.id, request.id));
  });
  sendNotification(request.userId, "system", "stajyor_approved", "stajyor_approved");
  res.json({ message: "Stajyor lavozimi faollashtirildi! (3 kun)" });
}));

router.post("/api/admin/stajyor-requests/:id/reject", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const requests = await storage.getAllStajyorRequests();
  const request = requests.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ message: "So'rov topilmadi" });
  if (request.status !== "pending") return res.status(400).json({ message: "Bu so'rov allaqachon ko'rib chiqilgan" });

  await storage.updateStajyorRequestStatus(request.id, "rejected");
  sendNotification(request.userId, "system", "stajyor_rejected", "stajyor_rejected");
  res.json({ message: "So'rov rad etildi" });
}));

router.get("/api/deposit-settings/active", requireAuth, asyncHandler(async (_req: Request, res: Response) => {
  const settings = await storage.getDepositSettings();
  res.json(settings.filter((s) => s.isActive));
}));

router.get("/api/platform-settings", requireAuth, asyncHandler(async (_req: Request, res: Response) => {
  const rows = await storage.getPlatformSettings();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  res.json({
    withdrawalCommissionPercent: Number(map["withdrawal_commission_percent"] ?? "10"),
    minWithdrawalUsdt: Number(map["min_withdrawal_usdt"] ?? "3"),
    minWithdrawalBank: Number(map["min_withdrawal_bank"] ?? "2"),
    withdrawalStartHour: Number(map["withdrawal_start_hour"] ?? "11"),
    withdrawalEndHour: Number(map["withdrawal_end_hour"] ?? "17"),
    maxDailyWithdrawals: Number(map["max_daily_withdrawals"] ?? "1"),
    withdrawalEnabled: map["withdrawal_enabled"] !== "false",
  });
}));

router.get("/api/admin/platform-settings", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const rows = await storage.getPlatformSettings();
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  res.json({
    withdrawalCommissionPercent: map["withdrawal_commission_percent"] ?? "10",
    minWithdrawalUsdt: map["min_withdrawal_usdt"] ?? "3",
    minWithdrawalBank: map["min_withdrawal_bank"] ?? "2",
    withdrawalStartHour: map["withdrawal_start_hour"] ?? "11",
    withdrawalEndHour: map["withdrawal_end_hour"] ?? "17",
    maxDailyWithdrawals: map["max_daily_withdrawals"] ?? "1",
    withdrawalEnabled: map["withdrawal_enabled"] !== "false",
  });
}));

router.post("/api/admin/platform-settings", requireAdmin, validateBody(adminSchemas.platformSettings), asyncHandler(async (req: Request, res: Response) => {
  const { withdrawalCommissionPercent, minWithdrawalUsdt, minWithdrawalBank, withdrawalStartHour, withdrawalEndHour, maxDailyWithdrawals, withdrawalEnabled } = req.body;
  const updates: [string, string][] = [
    ["withdrawal_commission_percent", String(withdrawalCommissionPercent)],
    ["min_withdrawal_usdt", String(minWithdrawalUsdt)],
    ["min_withdrawal_bank", String(minWithdrawalBank)],
    ["withdrawal_start_hour", String(withdrawalStartHour)],
    ["withdrawal_end_hour", String(withdrawalEndHour)],
    ["max_daily_withdrawals", String(maxDailyWithdrawals)],
    ["withdrawal_enabled", withdrawalEnabled === false ? "false" : "true"],
  ];
  for (const [key, value] of updates) {
    await storage.upsertPlatformSetting(key, value);
  }
  res.json({ message: "Sozlamalar saqlandi" });
}));

router.get("/api/broadcasts/unread", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const unread = await storage.getUnreadBroadcasts(userId);
  res.json(unread);
}));

router.post("/api/broadcasts/:id/read", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  await storage.markBroadcastRead(String(req.params.id), userId);
  res.json({ ok: true });
}));

router.get("/api/admin/broadcasts", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const all = await storage.getAllBroadcasts();
  res.json(all);
}));

router.post("/api/admin/broadcasts", requireAdmin, validateBody(adminSchemas.createBroadcast), asyncHandler(async (req: Request, res: Response) => {
  const { title, message } = req.body;
  const b = await storage.createBroadcast({ title, message });

  try {
    const allUsers = await storage.getAllUsers();
    for (const u of allUsers) {
      sendRawNotification(u.id, "broadcast", title, message);
    }
  } catch (e) {
    console.error("Broadcast notification error:", e);
  }

  res.json(b);
}));

router.delete("/api/admin/broadcasts/:id", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  await storage.deleteBroadcast(String(req.params.id));
  res.json({ ok: true });
}));

router.post("/api/admin/push-send", requireAdmin, validateBody(adminSchemas.pushSend), asyncHandler(async (req: Request, res: Response) => {
  const { title, message, targetUserId } = req.body;

  let sentCount = 0;
  if (targetUserId) {
    sendRawNotification(targetUserId, "broadcast", title, message);
    sentCount = 1;
  } else {
    const allUsers = await storage.getAllUsers();
    for (const u of allUsers) {
      sendRawNotification(u.id, "broadcast", title, message);
    }
    sentCount = allUsers.length;
  }
  res.json({ message: `${sentCount} ta foydalanuvchiga yuborildi`, count: sentCount });
}));

router.get("/api/admin/push-stats", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const result = await storage.getPushSubscriptionCount();
  res.json({ subscribedUsers: result });
}));

router.post("/api/promo/use", requireAuth, validateBody(userSchemas.usePromo), asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;
  const userId = req.session.userId!;
  const trimmedCode = code.trim().toUpperCase();

  const promo = await storage.getPromoCodeByCode(trimmedCode);
  if (!promo) return res.status(404).json({ message: "Bunday promokod topilmadi" });

  let appliedAmount: string = "0";

  await db.transaction(async (tx) => {
    const [lockedPromo] = await tx.select().from(promoCodes).where(eq(promoCodes.id, promo.id)).for("update");
    if (!lockedPromo || !lockedPromo.isActive) throw new Error("PROMO_INACTIVE");

    if (lockedPromo.isOneTime && lockedPromo.currentUses >= 1) throw new Error("PROMO_USED");
    if (!lockedPromo.isOneTime && lockedPromo.maxUses && lockedPromo.currentUses >= lockedPromo.maxUses) throw new Error("PROMO_LIMIT");

    const [existingUsage] = await tx.select().from(promoCodeUsages).where(
      and(eq(promoCodeUsages.promoCodeId, promo.id), eq(promoCodeUsages.userId, userId))
    ).limit(1);
    if (existingUsage) throw new Error("PROMO_ALREADY_USED_BY_USER");

    appliedAmount = lockedPromo.amount;
    await tx.insert(promoCodeUsages).values({ promoCodeId: promo.id, userId, amount: appliedAmount });
    await tx.update(promoCodes).set({ currentUses: dsql`${promoCodes.currentUses} + 1` }).where(eq(promoCodes.id, promo.id));
    await tx.update(users).set({ balance: dsql`${users.balance}::numeric + ${appliedAmount}::numeric` }).where(eq(users.id, userId));
    await tx.insert(balanceHistory).values({ userId, type: "earning", amount: appliedAmount, description: `Promokod: ${lockedPromo.code}` });

    if (lockedPromo.isOneTime || (lockedPromo.maxUses && lockedPromo.currentUses + 1 >= lockedPromo.maxUses)) {
      await tx.update(promoCodes).set({ isActive: false }).where(eq(promoCodes.id, promo.id));
    }
  }).catch((err) => {
    if (err.message === "PROMO_INACTIVE") return res.status(400).json({ message: "Bu promokod faol emas" });
    if (err.message === "PROMO_USED") return res.status(400).json({ message: "Bu promokod allaqachon ishlatilgan" });
    if (err.message === "PROMO_LIMIT") return res.status(400).json({ message: "Bu promokod limiti tugagan" });
    if (err.message === "PROMO_ALREADY_USED_BY_USER") return res.status(400).json({ message: "Siz bu promokodni allaqachon ishlatgansiz" });
    throw err;
  });

  if (res.headersSent) return;
  sendNotification(userId, "deposit_confirmed", "promo_applied", "promo_applied", { amount: appliedAmount });
  res.json({ message: `${appliedAmount} USDT hisobingizga qo'shildi!`, amount: appliedAmount });
}));

router.get("/api/promo/history", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userUsages = await storage.getUserPromoHistory(req.session.userId!);
  res.json(userUsages);
}));

router.post("/api/admin/promo-codes", requireAdmin, validateBody(adminSchemas.createPromoCode), asyncHandler(async (req: Request, res: Response) => {
  const { code, amount, isOneTime, maxUses } = req.body;

  const existing = await storage.getPromoCodeByCode(code.trim().toUpperCase());
  if (existing) return res.status(400).json({ message: "Bu kod allaqachon mavjud" });

  const promo = await storage.createPromoCode({
    code: code.trim().toUpperCase(),
    amount: String(amount),
    isOneTime: isOneTime !== false,
    maxUses: isOneTime === false ? (maxUses || null) : null,
  });
  res.json(promo);
}));

router.get("/api/admin/promo-codes", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const promos = await storage.getAllPromoCodes();
  res.json(promos);
}));

router.get("/api/admin/promo-codes/:id/usages", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const usages = await storage.getPromoCodeUsages(req.params.id as string);
  res.json(usages);
}));

router.post("/api/admin/promo-codes/:id/deactivate", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  await storage.deactivatePromoCode(req.params.id as string);
  res.json({ message: "Promokod o'chirildi" });
}));

router.delete("/api/admin/promo-codes/:id", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  await storage.deletePromoCode(req.params.id as string);
  res.json({ message: "Promokod o'chirildi" });
}));

export function setupDailyProfits() {
  async function processDailyProfits() {
    try {
      const activeInvestments = await storage.getActiveInvestments();
      const uzbNow = getUzbDayNow();
      const today = getUzbToday();

      for (const inv of activeInvestments) {
        if (inv.lastProfitDate === today) continue;

        try {
          const plan = await storage.getFundPlan(inv.fundPlanId);
          const planName = inv.planName || plan?.name || "Fund";
          const notificationsToSend: Array<{ userId: string; type: string; titleKey: string; msgKey: string; params: Record<string, string> }> = [];

          await db.transaction(async (tx) => {
            const [lockedInv] = await tx.select({ lastProfitDate: investments.lastProfitDate, status: investments.status })
              .from(investments).where(eq(investments.id, inv.id)).for("update");
            if (!lockedInv || lockedInv.lastProfitDate === today || lockedInv.status !== "active") return;

            await tx.update(users)
              .set({ balance: dsql`${users.balance}::numeric + ${inv.dailyProfit}::numeric` })
              .where(eq(users.id, inv.userId));
            await tx.update(investments)
              .set({ lastProfitDate: today })
              .where(eq(investments.id, inv.id));
            await tx.insert(balanceHistory).values({ userId: inv.userId, type: "fund_profit", amount: inv.dailyProfit, description: `${planName} fond daromadi +${inv.dailyProfit} USDT` });
            notificationsToSend.push({ userId: inv.userId, type: "task_reward", titleKey: "fund_profit", msgKey: "fund_profit", params: { amount: inv.dailyProfit, name: planName } });

            if (inv.endDate && new Date(inv.endDate) <= uzbNow) {
              await tx.update(investments)
                .set({ status: "completed" })
                .where(eq(investments.id, inv.id));
              if (plan?.returnPrincipal) {
                await tx.update(users)
                  .set({ balance: dsql`${users.balance}::numeric + ${inv.investedAmount}::numeric` })
                  .where(eq(users.id, inv.userId));
                await tx.insert(balanceHistory).values({ userId: inv.userId, type: "fund_return", amount: inv.investedAmount, description: `${planName} fond investitsiyasi qaytarildi — ${inv.investedAmount} USDT` });
                notificationsToSend.push({ userId: inv.userId, type: "deposit_confirmed", titleKey: "fund_returned", msgKey: "fund_returned", params: { amount: inv.investedAmount, name: planName } });
              }
            }
          });

          for (const n of notificationsToSend) {
            sendNotification(n.userId, n.type, n.titleKey, n.msgKey, n.params);
          }
        } catch (invError) {
          console.error(`[Cron] Error processing investment ${inv.id}:`, invError);
        }
      }
    } catch (error) {
      console.error("[Cron] Fatal error in daily profits:", error);
    }
  }

  setInterval(processDailyProfits, 60 * 60 * 1000);
  setTimeout(processDailyProfits, 5000);
}

export default router;
