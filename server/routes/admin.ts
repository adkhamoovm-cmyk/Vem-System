import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { requireAuth, requireAdmin, sendNotification, sendRawNotification, hashPassword, pinRateLimiter, webpush, asyncHandler } from "../lib/helpers";
import { users, depositRequests, withdrawalRequests, balanceHistory, investments } from "@shared/schema";
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

router.post("/api/admin/users/:id/ban", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { isBanned } = req.body;
  await storage.banUser(req.params.id as string, isBanned);
  if (isBanned) {
    await pool.query(
      `DELETE FROM user_sessions WHERE (sess->>'userId') = $1`,
      [req.params.id]
    );
  }
  res.json({ message: isBanned ? "Foydalanuvchi bloklandi" : "Foydalanuvchi blokdan chiqarildi" });
}));

router.post("/api/admin/users/:id/withdrawal-ban", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { banned } = req.body;
  await storage.setWithdrawalBan(req.params.id as string, banned);
  res.json({ message: banned ? "Pul yechish taqiqlandi" : "Pul yechish ruxsat berildi" });
}));

router.post("/api/admin/users/:id/balance", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { balance } = req.body;
  const numBalance = Number(balance);
  if (isNaN(numBalance) || numBalance < 0) {
    return res.status(400).json({ message: "Noto'g'ri balans qiymati" });
  }
  const targetUser = await storage.getUser(req.params.id as string);
  if (!targetUser) return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
  const oldBalance = Number(targetUser.balance);
  const diff = numBalance - oldBalance;
  await storage.setUserBalance(req.params.id as string, numBalance.toFixed(2));
  await storage.addBalanceHistory({ userId: req.params.id as string, type: "admin_adjust", amount: diff.toFixed(2), description: `Texnik bo'lim tomonidan balans o'zgartirildi` });
  res.json({ message: "Balans yangilandi" });
}));

router.post("/api/admin/users/:id/vip", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
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

router.post("/api/admin/users/:id/password", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
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

router.post("/api/admin/vip-packages/:id/toggle-lock", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
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
  const deposit = await storage.getDepositById(req.params.id as string);
  if (!deposit) return res.status(404).json({ message: "Depozit topilmadi" });
  if (deposit.status !== "pending") return res.status(400).json({ message: "Faqat kutilayotgan depozitlar tasdiqlanishi mumkin" });

  let amountInUSDT = deposit.amount;
  if (deposit.currency === "UZS") {
    amountInUSDT = (Number(deposit.amount) / 12100).toFixed(2);
  }

  await db.transaction(async (tx) => {
    await tx.update(depositRequests).set({ status: "approved", reviewedAt: new Date() }).where(eq(depositRequests.id, deposit.id));
    await tx.update(users).set({ balance: dsql`${users.balance}::numeric + ${amountInUSDT}::numeric` }).where(eq(users.id, deposit.userId));
    await tx.update(users).set({ totalDeposit: dsql`${users.totalDeposit}::numeric + ${amountInUSDT}::numeric` }).where(eq(users.id, deposit.userId));
    const entries = await tx.select().from(balanceHistory)
      .where(and(eq(balanceHistory.userId, deposit.userId), eq(balanceHistory.type, "deposit")))
      .orderBy(desc(balanceHistory.createdAt))
      .limit(10);
    const match = entries.find(e => e.amount === deposit.amount || e.amount === "0");
    if (match) {
      await tx.update(balanceHistory).set({ amount: amountInUSDT, description: `Depozit tasdiqlandi (${deposit.currency === "UZS" ? deposit.amount + " UZS → " : ""}${amountInUSDT} USDT)` }).where(eq(balanceHistory.id, match.id));
    }
  });
  sendNotification(deposit.userId, "deposit_confirmed", "deposit_approved", "deposit_approved", { amount: amountInUSDT });
  res.json({ message: "Depozit tasdiqlandi va balansga qo'shildi" });
}));

router.post("/api/admin/deposits/:id/reject", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const deposit = await storage.getDepositById(req.params.id as string);
  if (!deposit) return res.status(404).json({ message: "Depozit topilmadi" });
  if (deposit.status !== "pending") return res.status(400).json({ message: "Faqat kutilayotgan depozitlar rad etilishi mumkin" });

  let amountInUSDT = deposit.amount;
  if (deposit.currency === "UZS") {
    amountInUSDT = (Number(deposit.amount) / 12100).toFixed(2);
  }

  await storage.updateDepositStatus(deposit.id, "rejected");
  await storage.updateDepositHistoryStatus(deposit.userId, deposit.amount, deposit.currency, "rejected", amountInUSDT);
  sendNotification(deposit.userId, "system", "deposit_rejected", "deposit_rejected", { amount: deposit.amount, currency: deposit.currency });
  res.json({ message: "Depozit rad etildi" });
}));

router.get("/api/admin/withdrawals", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const withdrawals = await storage.getAllWithdrawalRequests();
  const methods = await storage.getAllPaymentMethods();
  const methodMap: Record<string, any> = {};
  for (const m of methods) { methodMap[m.id] = m; }
  const enriched = withdrawals.map(w => ({
    ...w,
    paymentMethod: methodMap[w.paymentMethodId] || null,
  }));
  res.json(enriched);
}));

router.post("/api/admin/withdrawals/:id/approve", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const withdrawal = await storage.getWithdrawalById(req.params.id as string);
  if (!withdrawal) return res.status(404).json({ message: "So'rov topilmadi" });
  if (withdrawal.status !== "pending") return res.status(400).json({ message: "Faqat kutilayotgan so'rovlar tasdiqlanishi mumkin" });
  await storage.updateWithdrawalStatus(withdrawal.id, "approved");
  await storage.updateWithdrawalHistoryStatus(withdrawal.userId, withdrawal.id, "approved");
  sendNotification(withdrawal.userId, "withdrawal_done", "withdrawal_approved", "withdrawal_approved", { amount: withdrawal.netAmount });
  res.json({ message: "Yechish tasdiqlandi" });
}));

router.post("/api/admin/withdrawals/:id/reject", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const withdrawal = await storage.getWithdrawalById(req.params.id as string);
  if (!withdrawal) return res.status(404).json({ message: "So'rov topilmadi" });
  if (withdrawal.status !== "pending") return res.status(400).json({ message: "Faqat kutilayotgan so'rovlar rad etilishi mumkin" });

  await db.transaction(async (tx) => {
    await tx.update(withdrawalRequests).set({ status: "rejected", reviewedAt: new Date() }).where(eq(withdrawalRequests.id, withdrawal.id));
    await tx.update(users).set({ balance: dsql`${users.balance}::numeric + ${withdrawal.amount}::numeric` }).where(eq(users.id, withdrawal.userId));
    const entries = await tx.select().from(balanceHistory)
      .where(and(eq(balanceHistory.userId, withdrawal.userId), eq(balanceHistory.type, "withdrawal")))
      .orderBy(desc(balanceHistory.createdAt))
      .limit(10);
    const match = entries.find(e => e.description?.includes(withdrawal.id));
    if (match) {
      await tx.update(balanceHistory).set({ description: `Yechish rad etildi — qaytarildi ${withdrawal.amount} USDT` }).where(eq(balanceHistory.id, match.id));
    }
    await tx.insert(balanceHistory).values({ userId: withdrawal.userId, type: "withdrawal_cancel", amount: withdrawal.amount, description: `Yechish bekor qilindi — qaytarildi ${withdrawal.amount} USDT` });
  });
  sendNotification(withdrawal.userId, "system", "withdrawal_rejected", "withdrawal_rejected", { amount: withdrawal.amount });
  res.json({ message: "Yechish rad etildi va balans qaytarildi" });
}));

router.get("/api/admin/deposit-settings", requireAdmin, asyncHandler(async (_req: Request, res: Response) => {
  const settings = await storage.getDepositSettings();
  res.json(settings);
}));

router.post("/api/admin/deposit-settings", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
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
    top.map(async (r: any) => {
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

router.post("/api/stajyor/request", requireAuth, asyncHandler(async (req: Request, res: Response) => {
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

  await storage.updateStajyorRequestStatus(request.id, "approved");
  await storage.setUserVipLevel(request.userId, 0, 3);
  const stajyorExpiry = new Date();
  stajyorExpiry.setDate(stajyorExpiry.getDate() + 3);
  await storage.setUserVipExpiry(request.userId, stajyorExpiry);
  await storage.setStajyorUsed(request.userId);
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
  res.json(settings.filter((s: any) => s.isActive));
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

router.post("/api/admin/platform-settings", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
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

router.post("/api/admin/broadcasts", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Sarlavha va xabar majburiy" });
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

router.post("/api/admin/push-send", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { title, message, targetUserId } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Sarlavha va xabar majburiy" });

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

router.post("/api/promo/use", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code || typeof code !== "string") return res.status(400).json({ message: "Promokod kiriting" });

  const promo = await storage.getPromoCodeByCode(code.trim().toUpperCase());
  if (!promo) return res.status(404).json({ message: "Bunday promokod topilmadi" });
  if (!promo.isActive) return res.status(400).json({ message: "Bu promokod faol emas" });

  if (promo.isOneTime) {
    if (promo.currentUses >= 1) return res.status(400).json({ message: "Bu promokod allaqachon ishlatilgan" });
  } else if (promo.maxUses && promo.currentUses >= promo.maxUses) {
    return res.status(400).json({ message: "Bu promokod limiti tugagan" });
  }

  const existingUsage = await storage.getUserPromoCodeUsage(req.session.userId!, promo.id);
  if (existingUsage) return res.status(400).json({ message: "Siz bu promokodni allaqachon ishlatgansiz" });

  await storage.createPromoCodeUsage({ promoCodeId: promo.id, userId: req.session.userId!, amount: promo.amount });
  await storage.incrementPromoCodeUsage(promo.id);
  await storage.updateUserBalance(req.session.userId!, promo.amount);
  await storage.addBalanceHistory({ userId: req.session.userId!, type: "earning", amount: promo.amount, description: `Promokod: ${promo.code}` });
  sendNotification(req.session.userId!, "deposit_confirmed", "promo_applied", "promo_applied", { amount: promo.amount });

  if (promo.isOneTime) {
    await storage.deactivatePromoCode(promo.id);
  } else if (promo.maxUses && promo.currentUses + 1 >= promo.maxUses) {
    await storage.deactivatePromoCode(promo.id);
  }

  res.json({ message: `${promo.amount} USDT hisobingizga qo'shildi!`, amount: promo.amount });
}));

router.get("/api/promo/history", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const allPromos = await storage.getAllPromoCodes();
  const userUsages = [];
  for (const promo of allPromos) {
    const usage = await storage.getUserPromoCodeUsage(req.session.userId!, promo.id);
    if (usage) userUsages.push({ ...usage, code: promo.code });
  }
  res.json(userUsages);
}));

router.post("/api/admin/promo-codes", requireAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { code, amount, isOneTime, maxUses } = req.body;
  if (!code || !amount) return res.status(400).json({ message: "Kod va miqdorni kiriting" });
  if (Number(amount) <= 0) return res.status(400).json({ message: "Miqdor 0 dan katta bo'lishi kerak" });

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
      const today = new Date().toISOString().split("T")[0];

      for (const inv of activeInvestments) {
        if (inv.lastProfitDate === today) continue;

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

          if (inv.endDate && new Date(inv.endDate) <= new Date()) {
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
      }
    } catch (error) {
      console.error("[Cron] Error processing daily profits:", error);
    }
  }

  setInterval(processDailyProfits, 24 * 60 * 60 * 1000);
  setTimeout(processDailyProfits, 5000);
}

export default router;
