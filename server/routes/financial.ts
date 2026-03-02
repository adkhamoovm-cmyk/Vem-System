import { Router, type Request, type Response } from "express";
import { storage } from "../storage";
import { requireAuth, withdrawRateLimiter, sendNotification, uploadReceipt, comparePasswords, validateBody, financialSchemas } from "../lib/helpers";

const router = Router();

router.get("/api/fund-plans", requireAuth, async (_req: Request, res: Response) => {
  try {
    const plans = await storage.getFundPlans();
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/investments", requireAuth, async (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/fund/invest", requireAuth, withdrawRateLimiter, validateBody(financialSchemas.invest), async (req: Request, res: Response) => {
  try {
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
    const isPinValid = await comparePasswords(fundPassword, user.fundPassword);
    if (!isPinValid) {
      return res.status(400).json({ message: "Moliya kodi noto'g'ri" });
    }

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

    await storage.updateUserBalance(userId, String(-investAmount));
    const today = new Date().toISOString().split("T")[0];
    const investment = await storage.createInvestment({
      userId,
      fundPlanId,
      planName: plan.name,
      investedAmount: investAmount.toFixed(2),
      dailyProfit,
      endDate,
      lastProfitDate: today,
    });
    await storage.addBalanceHistory({ userId, type: "fund_invest", amount: String(-investAmount), description: `${plan.name} fondiga investitsiya` });

    await storage.updateUserBalance(userId, dailyProfit);
    await storage.addBalanceHistory({ userId, type: "fund_profit", amount: dailyProfit, description: `${plan.name} fond daromadi +${dailyProfit} USDT` });
    sendNotification(userId, "system", "fund_invested", "fund_invested", { name: plan.name, amount: String(investAmount) });

    res.json({ 
      investment, 
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/payment-methods", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const methods = await storage.getUserPaymentMethods(userId);
    res.json(methods);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/payment-methods", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const { type, bankName, exchangeName, cardNumber, walletAddress, holderName, fundPassword } = req.body;

    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

    const fundPassValid = await comparePasswords(fundPassword, user.fundPassword);
    if (!fundPassValid) {
      return res.status(400).json({ message: "Moliya paroli noto'g'ri" });
    }
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/deposit", requireAuth, withdrawRateLimiter, uploadReceipt.single("receipt"), async (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/deposits", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const deposits = await storage.getUserDepositRequests(userId);
    res.json(deposits);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/api/withdraw", requireAuth, withdrawRateLimiter, validateBody(financialSchemas.withdraw), async (req: Request, res: Response) => {
  try {
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

    const fundPassOk = await comparePasswords(fundPassword, user.fundPassword);
    if (!fundPassOk) {
      return res.status(400).json({ message: "Moliya paroli noto'g'ri" });
    }
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

    const uzbOffset = 5 * 60 * 60 * 1000;
    const uzbNow = new Date(Date.now() + uzbOffset);
    const uzbDay = uzbNow.getUTCDay();
    const uzbHour = uzbNow.getUTCHours();

    if (uzbDay === 0) {
      return res.status(400).json({ message: "Yakshanba kuni dam olish kuni. Pul yechish faqat Dushanba-Shanba kunlari mumkin." });
    }
    if (uzbHour < withdrawalStartHour || uzbHour >= withdrawalEndHour) {
      return res.status(400).json({ message: `Pul yechish faqat ${withdrawalStartHour}:00 dan ${withdrawalEndHour}:00 gacha mumkin` });
    }
    const todayStr = uzbNow.toISOString().split("T")[0];
    const todayWithdrawals = await storage.getUserWithdrawalRequests(userId);
    const withdrawalsToday = todayWithdrawals.filter(w => {
      if (w.status === "rejected") return false;
      const wUzb = new Date(new Date(w.createdAt).getTime() + uzbOffset);
      const wDate = wUzb.toISOString().split("T")[0];
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

    await storage.deductUserBalance(userId, numAmount.toFixed(2));

    const withdrawal = await storage.createWithdrawalRequest({
      userId,
      paymentMethodId,
      amount: numAmount.toFixed(2),
      commission: commission.toFixed(2),
      netAmount: netAmount.toFixed(2),
    });
    await storage.addBalanceHistory({ userId, type: "withdrawal", amount: String(-numAmount), description: `pending|${methodLabel}|${commission.toFixed(2)}` });

    res.json({ withdrawal, message: "Yechish so'rovi yuborildi! Tekshirgandan so'ng amalga oshiriladi." });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/withdrawals", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const withdrawals = await storage.getUserWithdrawalRequests(userId);
    res.json(withdrawals);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/api/balance-history", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;
    const { data, total } = await storage.getUserBalanceHistoryPaginated(userId, limit, offset);
    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
