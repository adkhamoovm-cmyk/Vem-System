import { Router, Request, Response } from "express";
import { storage } from "../storage";
import {
  hashPassword,
  comparePasswords,
  generateReferralCode,
  generateNumericId,
  requireAuth,
  requireAdmin,
  authRateLimiter,
  pinRateLimiter,
  sendNotification,
  validateBody,
  authSchemas,
  adminSchemas,
  asyncHandler,
  getUzbToday,
} from "../lib/helpers";

const router = Router();

router.post("/api/auth/register", authRateLimiter, validateBody(authSchemas.register), asyncHandler(async (req: Request, res: Response) => {
  const { phone, password, fundPassword, referralCode, captchaVerified } = req.body;

  if (!captchaVerified) {
    return res.status(400).json({ message: "Captchani tasdiqlang" });
  }

  const existing = await storage.getUserByPhone(phone);
  if (existing) {
    return res.status(400).json({ message: "Bu telefon raqami allaqachon ro'yxatdan o'tgan" });
  }

  const hashedPassword = await hashPassword(password);
  const hashedFundPassword = await hashPassword(fundPassword);
  const newReferralCode = generateReferralCode();

  let referredById: string | undefined;
  if (referralCode) {
    const referrer = await storage.getUserByReferralCode(referralCode);
    if (referrer) {
      referredById = referrer.id;
    }
  }

  const numericId = generateNumericId();
  const user = await storage.createUser({
    phone,
    password: hashedPassword,
    fundPassword: hashedFundPassword,
    referralCode: newReferralCode,
    referredBy: referredById,
    numericId,
    vipLevel: -1,
    dailyTasksLimit: 0,
  });

  if (referredById) {
    await storage.createReferral({ referrerId: referredById, referredId: user.id, level: 1 });

    const level1Referrer = await storage.getUser(referredById);
    if (level1Referrer?.referredBy) {
      await storage.createReferral({ referrerId: level1Referrer.referredBy, referredId: user.id, level: 2 });

      const level2Referrer = await storage.getUser(level1Referrer.referredBy);
      if (level2Referrer?.referredBy) {
        await storage.createReferral({ referrerId: level2Referrer.referredBy, referredId: user.id, level: 3 });
      }
    }
  }

  req.session.userId = user.id;
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || "";
  const ua = req.headers["user-agent"] || "";
  await storage.updateUserLoginInfo(user.id, ip, ua);
  res.json({ user: { ...user, password: undefined, fundPassword: undefined } });
}));

router.post("/api/auth/reset-cancel", asyncHandler(async (req: Request, res: Response) => {
  req.session.resetStep = undefined;
  req.session.resetPhone = undefined;
  req.session.resetVerifyType = undefined;
  res.json({ success: true });
}));

router.post("/api/auth/reset-step1", authRateLimiter, validateBody(authSchemas.resetStep1), asyncHandler(async (req: Request, res: Response) => {
  const { phone } = req.body;
  const user = await storage.getUserByPhone(phone);
  if (!user) {
    return res.status(400).json({ message: "Telefon raqami yoki moliya paroli noto'g'ri" });
  }
  if (user.isBanned) {
    return res.status(403).json({ message: "ACCOUNT_BANNED" });
  }
  req.session.resetPhone = phone;
  req.session.resetStep = 1;
  res.json({ success: true });
}));

router.post("/api/auth/reset-step2", authRateLimiter, validateBody(authSchemas.resetStep2), asyncHandler(async (req: Request, res: Response) => {
  if (req.session.resetStep !== 1 || !req.session.resetPhone) {
    return res.status(400).json({ message: "Noto'g'ri ma'lumot" });
  }
  const { fundPassword } = req.body;
  const user = await storage.getUserByPhone(req.session.resetPhone);
  if (!user || !user.fundPassword) {
    return res.status(400).json({ message: "Telefon raqami yoki moliya paroli noto'g'ri" });
  }
  const valid = await comparePasswords(fundPassword, user.fundPassword);
  if (!valid) {
    return res.status(400).json({ message: "Telefon raqami yoki moliya paroli noto'g'ri" });
  }
  const methods = await storage.getUserPaymentMethods(user.id);
  let verifyType: "card" | "crypto" | "referrer" = "referrer";
  let verifyHint = "";
  if (methods.length > 0) {
    const m = methods[0];
    if (m.type === "bank" && m.cardNumber) {
      verifyType = "card";
      verifyHint = m.cardNumber.slice(0, 4) + " **** **** " + m.cardNumber.slice(-2);
    } else if ((m.type === "crypto_trc20" || m.type === "crypto_bep20") && m.walletAddress) {
      verifyType = "crypto";
      verifyHint = m.walletAddress.slice(0, 4) + "..." + m.walletAddress.slice(-4);
    } else {
      verifyType = "referrer";
    }
  }
  if (verifyType === "referrer") {
    const referrer = user.referredBy ? await storage.getUser(user.referredBy) : null;
    if (referrer) {
      verifyHint = referrer.phone.slice(0, 5) + "***" + referrer.phone.slice(-2);
    }
  }
  req.session.resetStep = 2;
  req.session.resetVerifyType = verifyType;
  res.json({ success: true, verifyType, verifyHint });
}));

router.post("/api/auth/reset-step3", authRateLimiter, validateBody(authSchemas.resetStep3), asyncHandler(async (req: Request, res: Response) => {
  if (req.session.resetStep !== 2 || !req.session.resetPhone || !req.session.resetVerifyType) {
    return res.status(400).json({ message: "Noto'g'ri ma'lumot" });
  }
  const { answer } = req.body;
  const user = await storage.getUserByPhone(req.session.resetPhone);
  if (!user) {
    return res.status(400).json({ message: "Noto'g'ri ma'lumot" });
  }
  const verifyType = req.session.resetVerifyType;
  let verified = false;
  if (verifyType === "card") {
    const methods = await storage.getUserPaymentMethods(user.id);
    const bankMethod = methods.find(m => m.type === "bank" && m.cardNumber);
    if (bankMethod && bankMethod.cardNumber) {
      const last6 = bankMethod.cardNumber.replace(/\s/g, "").slice(-6);
      verified = answer.replace(/\s/g, "") === last6;
    }
  } else if (verifyType === "crypto") {
    const methods = await storage.getUserPaymentMethods(user.id);
    const cryptoMethod = methods.find(m => (m.type === "crypto_trc20" || m.type === "crypto_bep20") && m.walletAddress);
    if (cryptoMethod && cryptoMethod.walletAddress) {
      verified = answer.trim().toLowerCase() === cryptoMethod.walletAddress.trim().toLowerCase();
    }
  } else {
    const referrer = user.referredBy ? await storage.getUser(user.referredBy) : null;
    if (referrer) {
      verified = answer.replace(/\s/g, "") === referrer.phone.replace(/\s/g, "");
    } else {
      const userCreatedDate = user.createdAt ? new Date(user.createdAt).toISOString().split("T")[0] : "";
      verified = answer.trim() === userCreatedDate;
    }
  }
  if (!verified) {
    return res.status(400).json({ message: "Tasdiqlash ma'lumoti noto'g'ri" });
  }
  req.session.resetStep = 3;
  res.json({ success: true });
}));

router.post("/api/auth/reset-password", authRateLimiter, validateBody(authSchemas.resetPassword), asyncHandler(async (req: Request, res: Response) => {
  if (req.session.resetStep !== 3 || !req.session.resetPhone) {
    return res.status(400).json({ message: "Noto'g'ri ma'lumot" });
  }
  const { newPassword } = req.body;
  const user = await storage.getUserByPhone(req.session.resetPhone);
  if (!user) {
    return res.status(400).json({ message: "Noto'g'ri ma'lumot" });
  }
  const hashedNew = await hashPassword(newPassword);
  await storage.updateUserPassword(user.id, hashedNew);
  req.session.resetStep = undefined;
  req.session.resetPhone = undefined;
  req.session.resetVerifyType = undefined;
  res.json({ message: "Parol muvaffaqiyatli tiklandi! Endi yangi parol bilan kiring." });
}));

router.post("/api/auth/login", authRateLimiter, validateBody(authSchemas.login), asyncHandler(async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  const rememberMe = req.body.rememberMe;

  const user = await storage.getUserByPhone(phone);
  if (!user) {
    return res.status(400).json({ message: "Telefon raqami yoki parol noto'g'ri" });
  }

  if (user.isBanned) {
    return res.status(403).json({ message: "ACCOUNT_BANNED" });
  }

  const valid = await comparePasswords(password, user.password);
  if (!valid) {
    return res.status(400).json({ message: "Telefon raqami yoki parol noto'g'ri" });
  }

  if (rememberMe) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  }

  req.session.userId = user.id;
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || "";
  const ua = req.headers["user-agent"] || "";
  (req.session as any).ip = ip;
  (req.session as any).userAgent = ua;
  await storage.updateUserLoginInfo(user.id, ip, ua);
  await storage.logSession({ userId: user.id, action: "login", ip, userAgent: ua });
  res.json({ user: { ...user, password: undefined, fundPassword: undefined } });
}));

router.get("/api/auth/me", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = await storage.getUser(req.session.userId!);
  if (!user) {
    return res.status(401).json({ message: "Foydalanuvchi topilmadi" });
  }

  const today = getUzbToday();
  if (user.lastTaskDate !== today) {
    await storage.updateUserDailyTasks(user.id, 0, today);
    user.dailyTasksCompleted = 0;
    user.lastTaskDate = today;
  }

  res.json({ ...user, password: undefined, fundPassword: undefined });
}));

router.post("/api/admin/verify-pin", pinRateLimiter, requireAuth, validateBody(adminSchemas.verifyPin), asyncHandler(async (req: Request, res: Response) => {
  const user = await storage.getUser(req.session.userId!);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin huquqi talab qilinadi" });
  }
  const { pin } = req.body;
  const dbPin = await storage.getPlatformSetting("admin_pin");
  const adminPin = dbPin || process.env.ADMIN_PIN;
  if (!adminPin) {
    return res.status(500).json({ message: "Admin PIN sozlanmagan" });
  }
  if (pin !== adminPin) {
    return res.status(400).json({ message: "PIN kod noto'g'ri" });
  }
  req.session.adminPinVerified = true;
  res.json({ message: "PIN tasdiqlandi" });
}));

router.get("/api/admin/pin-status", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = await storage.getUser(req.session.userId!);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin huquqi talab qilinadi" });
  }
  res.json({ verified: !!req.session.adminPinVerified });
}));

router.post("/api/admin/change-pin", pinRateLimiter, requireAdmin, validateBody(adminSchemas.changePin), asyncHandler(async (req: Request, res: Response) => {
  const { currentPin, newPin } = req.body;
  const dbPin = await storage.getPlatformSetting("admin_pin");
  const adminPin = dbPin || process.env.ADMIN_PIN;
  if (!adminPin) {
    return res.status(500).json({ message: "Admin PIN sozlanmagan" });
  }
  if (currentPin !== adminPin) {
    return res.status(400).json({ message: "Joriy PIN kod noto'g'ri" });
  }
  await storage.upsertPlatformSetting("admin_pin", newPin);
  res.json({ message: "PIN kod muvaffaqiyatli o'zgartirildi" });
}));

router.post("/api/auth/logout", asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId;
  if (userId) {
    try {
      const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || "";
      const ua = req.headers["user-agent"] || "";
      await storage.logSession({ userId, action: "logout", ip, userAgent: ua });
    } catch (_) {}
  }
  req.session.destroy(() => {
    res.json({ message: "Chiqish muvaffaqiyatli" });
  });
}));

export default router;
