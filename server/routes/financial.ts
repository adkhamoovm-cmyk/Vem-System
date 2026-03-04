import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { users, balanceHistory as balanceHistoryTable, investments, withdrawalRequests } from "@shared/schema";
import { eq, sql as dsql } from "drizzle-orm";
import { requireAuth, withdrawRateLimiter, sendNotification, uploadReceipt, comparePasswords, validateBody, financialSchemas, asyncHandler, checkFundPinLock, recordFundPinFailure, resetFundPinAttempts, getUzbDayNow, getUzbToday, getUzbRealNow, DAY_OFFSET_MS } from "../lib/helpers";

const router = Router();

router.get("/api/fund-plans", requireAuth, asyncHandler(async (_req: Request, res: Response) => {
  const plans = await storage.getFundPlans();
  res.json(plans);
}));

router.get("/api/investments", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const userInvestments = await storage.getUserInvestments(userId);

  const allPlans = await storage.getFundPlans();
  const enriched = userInvestments.map(inv => {
    const planName = inv.planName || allPlans.find(p => p.id === inv.fundPlanId)?.name || "Fund";
    const now = Date.now();
    const startMs = new Date(inv.startDate).getTime();
    const endMs = inv.endDate ? new Date(inv.endDate).getTime() : null;
    const currentMs = endMs ? Math.min(now, endMs) : now;
    const elapsedDays = Math.floor((currentMs - startMs) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.max(1, elapsedDays + 1);
    const maxDays = endMs ? Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24))) : Infinity;
    const effectiveDays = Math.min(daysPassed, maxDays);
    const totalEarned = (Number(inv.dailyProfit) * effectiveDays);
    const daysLeft = maxDays === Infinity ? null : Math.max(0, maxDays - daysPassed);
    return {
      ...inv,
      totalEarned: totalEarned.toFixed(2),
      daysPassed,
      maxDays: maxDays === Infinity ? null : maxDays,
      daysLeft,
      planName,
    };
  });
  res.json(enriched);
}));

router.post("/api/fund/invest", requireAuth, withdrawRateLimiter, validateBody(financialSchemas.invest), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const { fundPlanId, amount, fundPassword } = req.body;

  const user = await storage.getUser(userId);
  if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

  if (user.isBanned) {
    return res.status(403).json({ message: "Sizning hisobingiz bloklangan." });
  }
  if (!user.fundPassword) {
    return res.status(400).json({ message: "Moliya kodi sozlanmagan. Profildan avval sozlang." });
  }
  const investPinLock = checkFundPinLock(userId);
  if (investPinLock.locked) {
    return res.status(429).json({ message: `Moliya kodi blokland. ${investPinLock.minutesLeft} daqiqadan so'ng urinib ko'ring.` });
  }
  const isPinValid = await comparePasswords(fundPassword, user.fundPassword);
  if (!isPinValid) {
    const fail = recordFundPinFailure(userId);
    if (fail.locked) return res.status(429).json({ message: `5 marta noto'g'ri PIN. ${fail.minutesLeft} daqiqa blokland.` });
    return res.status(400).json({ message: `Moliya kodi noto'g'ri. ${fail.attemptsLeft} ta urinish qoldi.` });
  }
  resetFundPinAttempts(userId);

  const existingInvestments = await storage.getUserInvestments(userId);
  const hasActive = existingInvestments.some(i => i.status === "active");
  if (hasActive) {
    return res.status(400).json({ message: "Sizda allaqachon faol investitsiya mavjud. Muddat tugagandan so'ng yangi investitsiya qo'sha olasiz." });
  }

  const plan = await storage.getFundPlan(fundPlanId);
  if (!plan) return res.status(404).json({ message: "Tarif topilmadi" });

  const investAmount = Number(amount);
  if (isNaN(investAmount) || investAmount <= 0) {
    return res.status(400).json({ message: "Noto'g'ri summa" });
  }

  if (investAmount < Number(plan.minDeposit)) {
    return res.status(400).json({ message: `Minimal depozit: $${plan.minDeposit}` });
  }

  if (plan.maxDeposit && investAmount > Number(plan.maxDeposit)) {
    return res.status(400).json({ message: `Maksimal depozit: $${plan.maxDeposit}` });
  }

  if (Number(user.balance) < investAmount) {
    return res.status(400).json({ message: "Balans yetarli emas" });
  }

  const dailyProfit = (investAmount * Number(plan.dailyRoi) / 100).toFixed(2);
  let endDate: Date | null = null;
  if (plan.lockDays) {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.lockDays);
  }

  const today = getUzbToday();
  let investment: typeof investments.$inferSelect;

  try {
    await db.transaction(async (tx) => {
      const [lockedUser] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, userId)).for("update");
      if (!lockedUser || Number(lockedUser.balance) < investAmount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      await tx.update(users)
        .set({ balance: dsql`${users.balance}::numeric - ${String(investAmount)}::numeric` })
        .where(eq(users.id, userId));

      const [inv] = await tx.insert(investments).values({
        userId,
        fundPlanId,
        planName: plan.name,
        investedAmount: investAmount.toFixed(2),
        dailyProfit,
        endDate,
        lastProfitDate: today,
      }).returning();
      investment = inv;

      await tx.insert(balanceHistoryTable).values({ userId, type: "fund_invest", amount: String(-investAmount), description: `${plan.name} fondiga investitsiya` });

      await tx.update(users)
        .set({ balance: dsql`${users.balance}::numeric + ${dailyProfit}::numeric` })
        .where(eq(users.id, userId));
      await tx.insert(balanceHistoryTable).values({ userId, type: "fund_profit", amount: dailyProfit, description: `${plan.name} fond daromadi +${dailyProfit} USDT` });
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({ message: "Balans yetarli emas" });
    }
    throw err;
  }

  sendNotification(userId, "system", "fund_invested", "fund_invested", { name: plan.name, amount: String(investAmount) });

  res.json({ 
    investment: investment!, 
    message: "Investitsiya muvaffaqiyatli amalga oshirildi!",
    celebration: {
      type: "fund_invested",
      planName: plan.name,
      amount: investAmount,
      dailyProfit,
      dailyRoi: plan.dailyRoi,
      durationDays: plan.durationDays,
    }
  });
}));

router.get("/api/payment-methods", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const methods = await storage.getUserPaymentMethods(userId);
  res.json(methods);
}));

router.post("/api/payment-methods", requireAuth, validateBody(financialSchemas.createPaymentMethod), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const { type, bankName, exchangeName, cardNumber, walletAddress, holderName, fundPassword } = req.body;

  const user = await storage.getUser(userId);
  if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

  const pmPinLock = checkFundPinLock(userId);
  if (pmPinLock.locked) {
    return res.status(429).json({ message: `Moliya kodi blokland. ${pmPinLock.minutesLeft} daqiqadan so'ng urinib ko'ring.` });
  }
  const fundPassValid = await comparePasswords(fundPassword, user.fundPassword);
  if (!fundPassValid) {
    const fail = recordFundPinFailure(userId);
    if (fail.locked) return res.status(429).json({ message: `5 marta noto'g'ri PIN. ${fail.minutesLeft} daqiqa blokland.` });
    return res.status(400).json({ message: `Moliya paroli noto'g'ri. ${fail.attemptsLeft} ta urinish qoldi.` });
  }
  resetFundPinAttempts(userId);
  const existing = await storage.getUserPaymentMethods(userId);
  const sameType = existing.filter(m => m.type === type);
  if (sameType.length > 0) {
    return res.status(400).json({ message: "Siz allaqachon " + (type === "bank" ? "bank kartasi" : "USDT hamyon") + " qo'shgansiz. O'zgartirish uchun texnik yordamga murojaat qiling." });
  }

  const method = await storage.createPaymentMethod({
    userId,
    type,
    bankName: type === "bank" ? bankName : undefined,
    exchangeName: type === "usdt" ? exchangeName : undefined,
    cardNumber: type === "bank" ? cardNumber : undefined,
    walletAddress: type === "usdt" ? walletAddress : undefined,
    holderName: type === "bank" ? holderName : undefined,
  });

  res.json({ method, message: "To'lov usuli saqlandi!" });
}));

router.post("/api/deposit", requireAuth, withdrawRateLimiter, uploadReceipt.single("receipt"), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const { amount, currency, paymentType } = req.body;

  const depositUser = await storage.getUser(userId);
  if (depositUser?.isBanned) {
    return res.status(403).json({ message: "Sizning hisobingiz bloklangan." });
  }

  if (!amount || !currency || !paymentType) {
    return res.status(400).json({ message: "Barcha maydonlarni to'ldiring" });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: "Miqdor noto'g'ri" });
  }

  const minUsd = 10;
  if (currency === "USDT" && numAmount < minUsd) {
    return res.status(400).json({ message: `Minimal miqdor: ${minUsd} USDT` });
  }
  if (currency === "UZS" && numAmount < minUsd * 12100) {
    return res.status(400).json({ message: `Minimal miqdor: ${(minUsd * 12100).toLocaleString()} UZS` });
  }

  const receiptUrl = req.file ? `/uploads/receipts/${req.file.filename}` : undefined;

  const deposit = await storage.createDepositRequest({
    userId,
    amount: numAmount.toFixed(2),
    currency,
    paymentType,
    receiptUrl,
  });

  const depositMethodLabel = paymentType === "crypto" ? `USDT (Crypto)` : `Bank karta (${currency})`;
  const pendingAmountUSDT = currency === "UZS" ? (numAmount / 12100).toFixed(2) : numAmount.toFixed(2);
  await storage.addBalanceHistory({ userId, type: "deposit", amount: pendingAmountUSDT, description: `pending|${depositMethodLabel}|${numAmount.toFixed(2)} ${currency}` });

  res.json({ deposit, message: "So'rov yuborildi! Moliya bo'limi tekshirgandan so'ng balansingizga qo'shiladi." });
}));

router.get("/api/deposits", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const deposits = await storage.getUserDepositRequests(userId);
  res.json(deposits);
}));

router.post("/api/withdraw", requireAuth, withdrawRateLimiter, validateBody(financialSchemas.withdraw), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const { paymentMethodId, amount, fundPassword } = req.body;

  const user = await storage.getUser(userId);
  if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

  if (user.isBanned) {
    return res.status(403).json({ message: "Sizning hisobingiz bloklangan." });
  }

  if (user.withdrawalBanned) {
    return res.status(403).json({ message: "Sizning pul yechish huquqingiz cheklangan. Texnik yordamga murojaat qiling." });
  }

  if (Number(user.vipLevel) < 1) {
    const hasInvestments = await storage.hasUserInvestments(userId);
    if (!hasInvestments) {
      return res.status(400).json({ message: "Pul yechish uchun VIP paket sotib oling yoki Fondga pul qo'ying. Stajyor paketda yechish mumkin emas!" });
    }
  }

  const wdPinLock = checkFundPinLock(userId);
  if (wdPinLock.locked) {
    return res.status(429).json({ message: `Moliya kodi blokland. ${wdPinLock.minutesLeft} daqiqadan so'ng urinib ko'ring.` });
  }
  const fundPassOk = await comparePasswords(fundPassword, user.fundPassword);
  if (!fundPassOk) {
    const fail = recordFundPinFailure(userId);
    if (fail.locked) return res.status(429).json({ message: `5 marta noto'g'ri PIN. ${fail.minutesLeft} daqiqa blokland.` });
    return res.status(400).json({ message: `Moliya paroli noto'g'ri. ${fail.attemptsLeft} ta urinish qoldi.` });
  }
  resetFundPinAttempts(userId);
  const settingsRows = await storage.getPlatformSettings();
  const settingsMap: Record<string, string> = {};
  for (const r of settingsRows) settingsMap[r.key] = r.value;

  const withdrawalEnabled = settingsMap["withdrawal_enabled"] !== "false";
  if (!withdrawalEnabled) {
    return res.status(400).json({ message: "Pul yechish vaqtincha to'xtatilgan. Iltimos, keyinroq urinib ko'ring." });
  }

  const commissionPercent = Number(settingsMap["withdrawal_commission_percent"] ?? "10");
  const minWithdrawalUsdt = Number(settingsMap["min_withdrawal_usdt"] ?? "3");
  const minWithdrawalBank = Number(settingsMap["min_withdrawal_bank"] ?? "2");
  const withdrawalStartHour = Number(settingsMap["withdrawal_start_hour"] ?? "11");
  const withdrawalEndHour = Number(settingsMap["withdrawal_end_hour"] ?? "17");
  const maxDailyWithdrawals = Number(settingsMap["max_daily_withdrawals"] ?? "1");

  const uzbDayNow = getUzbDayNow();
  const uzbRealNow = getUzbRealNow();

  if (uzbDayNow.getUTCDay() === 0) {
    return res.status(400).json({ message: "Yakshanba kuni dam olish kuni. Pul yechish faqat Dushanba-Shanba kunlari mumkin." });
  }
  const uzbHour = uzbRealNow.getUTCHours();
  if (uzbHour < withdrawalStartHour || uzbHour >= withdrawalEndHour) {
    return res.status(400).json({ message: `Pul yechish faqat ${withdrawalStartHour}:00 dan ${withdrawalEndHour}:00 gacha mumkin` });
  }
  const todayStr = getUzbToday();
  const todayWithdrawals = await storage.getUserWithdrawalRequests(userId);
  const withdrawalsToday = todayWithdrawals.filter(w => {
    if (w.status === "rejected") return false;
    const wDay = new Date(new Date(w.createdAt).getTime() + DAY_OFFSET_MS);
    const wDate = wDay.toISOString().split("T")[0];
    return wDate === todayStr;
  });
  if (withdrawalsToday.length >= maxDailyWithdrawals) {
    return res.status(400).json({ message: `Kuniga faqat ${maxDailyWithdrawals} marta pul yechish mumkin. Ertaga qayta urinib ko'ring.` });
  }

  const numAmount = Number(amount);
  const method = (await storage.getUserPaymentMethods(userId)).find(m => m.id === paymentMethodId);
  if (!method) {
    return res.status(400).json({ message: "To'lov usuli topilmadi" });
  }
  const isCrypto = method.type === "usdt";
  const minAmount = isCrypto ? minWithdrawalUsdt : minWithdrawalBank;
  if (isNaN(numAmount) || numAmount < minAmount) {
    return res.status(400).json({ message: isCrypto ? `Kripto uchun minimal yechish miqdori: ${minWithdrawalUsdt} USDT` : `Minimal yechish miqdori: ${minWithdrawalBank} USDT` });
  }

  const balance = Number(user.balance);
  if (balance < numAmount) {
    return res.status(400).json({ message: "Balansingiz yetarli emas" });
  }

  const commission = numAmount * (commissionPercent / 100);
  const netAmount = numAmount - commission;

  const methodLabel = isCrypto
    ? `BSC (BEP20)${method.walletAddress ? ` — ${method.walletAddress.slice(0, 6)}...${method.walletAddress.slice(-4)}` : ""}`
    : `${method.bankName || "Bank karta"}${method.cardNumber ? ` — ****${method.cardNumber.slice(-4)}` : ""}`;

  let withdrawal: Awaited<ReturnType<typeof storage.createWithdrawalRequest>>;

  try {
    await db.transaction(async (tx) => {
      const [lockedUser] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, userId)).for("update");
      if (!lockedUser || Number(lockedUser.balance) < numAmount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      await tx.update(users)
        .set({ balance: dsql`${users.balance}::numeric - ${numAmount.toFixed(2)}::numeric` })
        .where(eq(users.id, userId));

      const [wd] = await tx.insert(withdrawalRequests).values({
        userId,
        paymentMethodId,
        amount: numAmount.toFixed(2),
        commission: commission.toFixed(2),
        netAmount: netAmount.toFixed(2),
      }).returning();
      withdrawal = wd;

      await tx.insert(balanceHistoryTable).values({ userId, type: "withdrawal", amount: String(-numAmount), description: `pending|${methodLabel}|${commission.toFixed(2)}|${withdrawal.id}` });
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({ message: "Balansingiz yetarli emas" });
    }
    throw err;
  }

  res.json({ withdrawal: withdrawal!, message: "Yechish so'rovi yuborildi! Tekshirgandan so'ng amalga oshiriladi." });
}));

router.get("/api/withdrawals", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const withdrawals = await storage.getUserWithdrawalRequests(userId);
  res.json(withdrawals);
}));

router.get("/api/balance-history", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;
  const { data, total } = await storage.getUserBalanceHistoryPaginated(userId, limit, offset);
  res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
}));

export default router;
