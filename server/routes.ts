import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import multer from "multer";
import path from "path";
import fs from "fs";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hashed, "hex"), buf);
}

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

function generateNumericId(): string {
  const digits = [];
  for (let i = 0; i < 18; i++) {
    digits.push(Math.floor(Math.random() * 10));
  }
  return digits.join("");
}

const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Avtorizatsiya talab qilinadi" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Avtorizatsiya talab qilinadi" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Admin huquqi talab qilinadi" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "vem-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.get("/api/download-app", (_req: Request, res: Response) => {
    const domain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || "vem.app";
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VEM Ilovani O'rnatish</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif;background:#0a0a0a;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:20px;padding:32px;max-width:400px;text-align:center}
.icon{width:80px;height:80px;margin:0 auto 20px;border-radius:20px;background:#2563eb;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:bold;color:#fff}
h1{font-size:22px;margin-bottom:8px}p{color:#999;font-size:14px;line-height:1.6;margin-bottom:16px}
.steps{text-align:left;background:#111;border-radius:12px;padding:16px;margin:16px 0}
.step{display:flex;align-items:flex-start;gap:12px;padding:8px 0;border-bottom:1px solid #222}.step:last-child{border:0}
.num{background:#2563eb;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;flex-shrink:0}
.step-text{font-size:13px;color:#ccc;line-height:1.5}
.btn{display:block;background:#2563eb;color:#fff;border:none;padding:14px;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;width:100%;margin-top:16px}
</style></head><body>
<div class="card">
<div class="icon">V</div>
<h1>VEM Ilovani O'rnatish</h1>
<p>Telefoningizga VEM ilovasini o'rnating - bosh ekranda ikonka paydo bo'ladi</p>
<div class="steps">
<div class="step"><div class="num">1</div><div class="step-text"><b>Chrome</b> brauzerida saytni oching:<br><code style="color:#60a5fa">${domain}</code></div></div>
<div class="step"><div class="num">2</div><div class="step-text">Brauzer menyusini oching (<b>⋮</b> 3 nuqta)</div></div>
<div class="step"><div class="num">3</div><div class="step-text"><b>"Bosh ekranga qo'shish"</b> yoki <b>"Install app"</b> tugmasini bosing</div></div>
<div class="step"><div class="num">4</div><div class="step-text"><b>"O'rnatish"</b> ni tasdiqlang - tayyor!</div></div>
</div>
<button class="btn" onclick="history.back() || (location.href='/')">Orqaga qaytish</button>
</div></body></html>`);
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { phone, password, fundPassword, referralCode, captcha } = req.body;

      if (!phone || !password || !fundPassword) {
        return res.status(400).json({ message: "Barcha maydonlarni to'ldiring" });
      }

      if (!captcha) {
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
        plainPassword: password,
        plainFundPassword: fundPassword,
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
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Xatolik yuz berdi" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { phone, password, rememberMe } = req.body;

      if (!phone || !password) {
        return res.status(400).json({ message: "Telefon va parolni kiriting" });
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(400).json({ message: "Telefon raqami yoki parol noto'g'ri" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Sizning hisobingiz bloklangan. Texnik yordamga murojaat qiling." });
      }

      const valid = await comparePasswords(password, user.password);
      if (!valid) {
        return res.status(400).json({ message: "Telefon raqami yoki parol noto'g'ri" });
      }

      if (rememberMe) {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
      }

      if (!user.plainPassword) {
        await storage.updateUserPassword(user.id, user.password, password);
      }

      req.session.userId = user.id;
      const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || "";
      const ua = req.headers["user-agent"] || "";
      await storage.updateUserLoginInfo(user.id, ip, ua);
      res.json({ user: { ...user, password: undefined, fundPassword: undefined, plainPassword: undefined, plainFundPassword: undefined } });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Xatolik yuz berdi" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "Foydalanuvchi topilmadi" });
      }

      const now = new Date();
      const taskDay = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      const today = taskDay.toISOString().split("T")[0];
      if (user.lastTaskDate !== today) {
        await storage.updateUserDailyTasks(user.id, 0, today);
        user.dailyTasksCompleted = 0;
        user.lastTaskDate = today;
      }

      res.json({ ...user, password: undefined, fundPassword: undefined, plainPassword: undefined, plainFundPassword: undefined });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Xatolik yuz berdi" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Chiqish muvaffaqiyatli" });
    });
  });

  app.get("/api/videos", requireAuth, async (_req: Request, res: Response) => {
    try {
      const videoList = await storage.getVideos();
      res.json(videoList);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tasks/complete", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { videoId, youtubeVideoId } = req.body;

      const nowTask = new Date();
      if (nowTask.getDay() === 0) {
        return res.status(400).json({ message: "Yakshanba kuni dam olish kuni. Vazifalar Dushanba-Shanba kunlari bajariladi." });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

      const now = new Date();
      const taskDay = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      const today = taskDay.toISOString().split("T")[0];
      let dailyCompleted = user.dailyTasksCompleted;
      if (user.lastTaskDate !== today) {
        dailyCompleted = 0;
        await storage.updateUserDailyTasks(userId, 0, today);
      }

      if (dailyCompleted >= user.dailyTasksLimit) {
        return res.status(400).json({ message: "Kunlik limit tugadi" });
      }

      if (!videoId && !youtubeVideoId) {
        return res.status(400).json({ message: "Video ID kerak" });
      }

      if (videoId) {
        const video = await storage.getVideo(videoId);
        if (!video) return res.status(404).json({ message: "Video topilmadi" });
      }

      if (user.vipLevel < 0) {
        return res.status(400).json({ message: "Avval VIP paket sotib oling" });
      }

      if (user.vipExpiresAt && new Date(user.vipExpiresAt) < new Date()) {
        return res.status(400).json({ message: "VIP paketingiz muddati tugagan. Yangi paket sotib oling." });
      }

      const vipPkgs = await storage.getVipPackages();
      const userPkg = vipPkgs.find(p => p.level === user.vipLevel);
      const perVideoReward = userPkg ? Number(userPkg.perVideoReward) : 0;

      if (perVideoReward <= 0) {
        return res.status(400).json({ message: "VIP paket sotib oling" });
      }

      const taskVideoId = videoId || `yt_${youtubeVideoId}`;
      const rewardStr = perVideoReward.toFixed(2);
      await storage.createTaskHistory({ userId, videoId: taskVideoId, reward: rewardStr });
      await storage.updateUserBalance(userId, rewardStr);
      await storage.updateUserTotalEarnings(userId, rewardStr);
      await storage.updateUserDailyTasks(userId, dailyCompleted + 1, today);
      await storage.addBalanceHistory({ userId, type: "earning", amount: rewardStr, description: `Video ko'rish daromadi (${userPkg?.name || "VIP"})` });

      if (user.referredBy && user.vipLevel > 0) {
        const l1Commission = (perVideoReward * 0.09).toFixed(2);
        await storage.updateUserBalance(user.referredBy, l1Commission);
        await storage.addBalanceHistory({ userId: user.referredBy, type: "commission", amount: l1Commission, description: `1-daraja referal komissiyasi (${user.phone})` });
        const l1Referrer = await storage.getUser(user.referredBy);
        if (l1Referrer?.referredBy) {
          const l2Commission = (perVideoReward * 0.03).toFixed(2);
          await storage.updateUserBalance(l1Referrer.referredBy, l2Commission);
          await storage.addBalanceHistory({ userId: l1Referrer.referredBy, type: "commission", amount: l2Commission, description: `2-daraja referal komissiyasi` });
          const l2Referrer = await storage.getUser(l1Referrer.referredBy);
          if (l2Referrer?.referredBy) {
            const l3Commission = (perVideoReward * 0.01).toFixed(2);
            await storage.updateUserBalance(l2Referrer.referredBy, l3Commission);
            await storage.addBalanceHistory({ userId: l2Referrer.referredBy, type: "commission", amount: l3Commission, description: `3-daraja referal komissiyasi` });
          }
        }
      }

      res.json({ reward: rewardStr, message: "Vazifa bajarildi!" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/vip-packages", requireAuth, async (_req: Request, res: Response) => {
    try {
      const packages = await storage.getVipPackages();
      res.json(packages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/vip/purchase", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { packageId } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

      const pkg = await storage.getVipPackage(packageId);
      if (!pkg) return res.status(404).json({ message: "Paket topilmadi" });

      if (pkg.isLocked) {
        return res.status(400).json({ message: "Bu daraja hozircha yopiq. Admin bilan bog'laning." });
      }

      if (pkg.level === 0) {
        return res.status(400).json({ message: "Stajyor paketini admin orqali so'rang" });
      }

      if (user.vipLevel > 0 && pkg.level < user.vipLevel) {
        return res.status(400).json({ message: "Pastroq darajaga tushish mumkin emas" });
      }

      const isExtension = user.vipLevel === pkg.level;
      const isUpgrade = user.vipLevel > 0 && pkg.level > user.vipLevel;

      let refundAmount = 0;
      let refundRemainingDays = 0;
      if (isUpgrade && user.vipPurchasedAt && user.vipExpiresAt && user.vipPurchasePrice) {
        const purchaseDate = new Date(user.vipPurchasedAt);
        const expiryDate = new Date(user.vipExpiresAt);
        const now = new Date();
        const totalMs = expiryDate.getTime() - purchaseDate.getTime();
        const remainingMs = Math.max(0, expiryDate.getTime() - now.getTime());
        if (totalMs > 0 && remainingMs > 0) {
          const originalPrice = Number(user.vipPurchasePrice);
          refundAmount = Math.floor((originalPrice * remainingMs / totalMs) * 100) / 100;
          refundRemainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
        }
      }

      const effectiveCost = Number(pkg.price) - refundAmount;
      if (Number(user.balance) < effectiveCost) {
        return res.status(400).json({ message: "Balans yetarli emas" });
      }

      let baseDate = new Date();
      if (isExtension && user.vipExpiresAt && new Date(user.vipExpiresAt) > baseDate) {
        baseDate = new Date(user.vipExpiresAt);
      }
      const expiresAt = new Date(baseDate);
      expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);

      if (refundAmount > 0) {
        await storage.addBalanceHistory({ userId, type: "vip_purchase", amount: String(refundAmount), description: `Oldingi VIP qaytim: ${refundAmount.toFixed(2)} USDT (${refundRemainingDays} kun qolgan edi)` });
      }

      await storage.updateUserBalance(userId, String(-effectiveCost));
      await storage.updateUserVipLevel(userId, pkg.level, pkg.dailyTasks);
      await storage.setUserVipExpiry(userId, expiresAt);
      await storage.setUserVipPurchaseInfo(userId, new Date(), String(pkg.price));
      await storage.addBalanceHistory({ userId, type: "vip_purchase", amount: String(-Number(pkg.price)), description: `${pkg.name} paketi ${isExtension ? "uzaytirildi" : "sotib olindi"} (${pkg.durationDays} kun)${refundAmount > 0 ? ` | Qaytim: ${refundAmount.toFixed(2)} USDT` : ""}` });

      const refundMsg = refundAmount > 0 ? ` Oldingi VIP dan ${refundAmount.toFixed(2)} USDT qaytarildi.` : "";
      res.json({ message: `${pkg.name} paketi ${isExtension ? "uzaytirildi" : "faollashtirildi"}! ${pkg.durationDays} kun ${isExtension ? "qo'shildi" : "davomida amal qiladi"}.${refundMsg}` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/referrals/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getReferralStats(req.session.userId!);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/referrals/users", requireAuth, async (req: Request, res: Response) => {
    try {
      const referred = await storage.getReferredUsers(req.session.userId!);
      res.json(referred);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/profile/change-password", requireAuth, async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || typeof currentPassword !== "string" || !newPassword || typeof newPassword !== "string") {
        return res.status(400).json({ message: "Joriy va yangi parol kiritilishi shart" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak" });
      }
      if (currentPassword === newPassword) {
        return res.status(400).json({ message: "Yangi parol joriy paroldan farqli bo'lishi kerak" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      if (!user.password) return res.status(400).json({ message: "Parol sozlanmagan" });
      const isValid = await comparePasswords(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Joriy parol noto'g'ri" });
      }
      const hashedNew = await hashPassword(newPassword);
      await storage.updateUserPassword(req.session.userId!, hashedNew, newPassword);
      res.json({ message: "Parol muvaffaqiyatli o'zgartirildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/profile/change-fund-password", requireAuth, async (req: Request, res: Response) => {
    try {
      const { currentFundPassword, newFundPassword } = req.body;
      if (!currentFundPassword || typeof currentFundPassword !== "string" || !newFundPassword || typeof newFundPassword !== "string") {
        return res.status(400).json({ message: "Joriy va yangi moliya parolini kiritilishi shart" });
      }
      if (!/^\d{6}$/.test(newFundPassword)) {
        return res.status(400).json({ message: "Yangi moliya paroli 6 xonali raqam bo'lishi kerak" });
      }
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
      if (!user.fundPassword) return res.status(400).json({ message: "Moliya paroli sozlanmagan" });
      const isValid = await comparePasswords(currentFundPassword, user.fundPassword);
      if (!isValid) {
        return res.status(400).json({ message: "Joriy moliya paroli noto'g'ri" });
      }
      const hashedNew = await hashPassword(newFundPassword);
      await storage.updateUserFundPassword(req.session.userId!, hashedNew, newFundPassword);
      res.json({ message: "Moliya paroli muvaffaqiyatli o'zgartirildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/profile/avatar", requireAuth, uploadAvatar.single("avatar"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Rasm yuklanmadi" });
      }
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await storage.updateUserAvatar(req.session.userId!, avatarUrl);
      res.json({ avatar: avatarUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.use("/uploads", (await import("express")).default.static(uploadsDir.replace("/avatars", "")));

  app.get("/api/fund-plans", requireAuth, async (_req: Request, res: Response) => {
    try {
      const plans = await storage.getFundPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/investments", requireAuth, async (req: Request, res: Response) => {
    try {
      const userInvestments = await storage.getUserInvestments(req.session.userId!);
      res.json(userInvestments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/fund/invest", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { fundPlanId, amount } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

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
      const investment = await storage.createInvestment({
        userId,
        fundPlanId,
        investedAmount: investAmount.toFixed(2),
        dailyProfit,
        endDate,
      });
      await storage.addBalanceHistory({ userId, type: "fund_invest", amount: String(-investAmount), description: `${plan.name} fondiga investitsiya` });

      res.json({ investment, message: "Investitsiya muvaffaqiyatli amalga oshirildi!" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payment-methods", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const methods = await storage.getUserPaymentMethods(userId);
      res.json(methods);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/payment-methods", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { type, bankName, exchangeName, cardNumber, walletAddress, holderName, fundPassword } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

      const fundPassValid = await comparePasswords(fundPassword, user.fundPassword);
      if (!fundPassValid) {
        return res.status(400).json({ message: "Moliya paroli noto'g'ri" });
      }
      if (!user.plainFundPassword) {
        await storage.updateUserFundPassword(user.id, user.fundPassword, fundPassword);
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

  const receiptsDir = path.join(process.cwd(), "uploads", "receipts");
  if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true });
  }

  const receiptStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, receiptsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || ".jpg";
      cb(null, `receipt-${Date.now()}-${randomBytes(4).toString("hex")}${ext}`);
    },
  });

  const uploadReceipt = multer({
    storage: receiptStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  app.post("/api/deposit", requireAuth, uploadReceipt.single("receipt"), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { amount, currency, paymentType } = req.body;

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
      if (currency === "UZS" && numAmount < minUsd * 12850) {
        return res.status(400).json({ message: `Minimal miqdor: ${(minUsd * 12850).toLocaleString()} UZS` });
      }

      const receiptUrl = req.file ? `/uploads/receipts/${req.file.filename}` : undefined;

      const deposit = await storage.createDepositRequest({
        userId,
        amount: numAmount.toFixed(2),
        currency,
        paymentType,
        receiptUrl,
      });

      res.json({ deposit, message: "So'rov yuborildi! Admin tekshirgandan so'ng balansingizga qo'shiladi." });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposits", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const deposits = await storage.getUserDepositRequests(userId);
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/withdraw", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { paymentMethodId, amount, fundPassword } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

      if (user.withdrawalBanned) {
        return res.status(403).json({ message: "Sizning pul yechish huquqingiz cheklangan. Texnik yordamga murojaat qiling." });
      }

      if (user.vipLevel === 0) {
        const hasInvestments = await storage.hasUserInvestments(userId);
        if (!hasInvestments) {
          return res.status(400).json({ message: "Pul yechish uchun kamida bitta Fundga pul qo'yishingiz yoki M1 paketini xarid qilishingiz kerak" });
        }
      }

      if (user.vipLevel < 0) {
        return res.status(400).json({ message: "Pul yechish uchun avval Stajyor lavozimini yoqtiring yoki VIP paket sotib oling" });
      }

      const fundPassOk = await comparePasswords(fundPassword, user.fundPassword);
      if (!fundPassOk) {
        return res.status(400).json({ message: "Moliya paroli noto'g'ri" });
      }
      if (!user.plainFundPassword) {
        await storage.updateUserFundPassword(user.id, user.fundPassword, fundPassword);
      }

      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();

      if (day === 0) {
        return res.status(400).json({ message: "Yakshanba kuni dam olish kuni. Pul yechish faqat Dushanba-Shanba kunlari mumkin." });
      }
      if (hour < 11 || hour >= 17) {
        return res.status(400).json({ message: "Pul yechish faqat 11:00 dan 17:00 gacha mumkin" });
      }

      const uzbOffset = 5 * 60 * 60 * 1000;
      const uzbNow = new Date(now.getTime() + uzbOffset);
      const todayStr = uzbNow.toISOString().split("T")[0];
      const todayWithdrawals = await storage.getUserWithdrawalRequests(userId);
      const withdrawalsToday = todayWithdrawals.filter(w => {
        const wUzb = new Date(new Date(w.createdAt).getTime() + uzbOffset);
        const wDate = wUzb.toISOString().split("T")[0];
        return wDate === todayStr;
      });
      if (withdrawalsToday.length >= 1) {
        return res.status(400).json({ message: "Kuniga faqat 1 marta pul yechish mumkin. Ertaga qayta urinib ko'ring." });
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount) || numAmount < 2) {
        return res.status(400).json({ message: "Minimal yechish miqdori: 2 USDT" });
      }

      const balance = Number(user.balance);
      if (balance < numAmount) {
        return res.status(400).json({ message: "Balansingiz yetarli emas" });
      }

      const methods = await storage.getUserPaymentMethods(userId);
      const method = methods.find(m => m.id === paymentMethodId);
      if (!method) {
        return res.status(400).json({ message: "To'lov usuli topilmadi" });
      }

      const commission = numAmount * 0.10;
      const netAmount = numAmount - commission;

      await storage.deductUserBalance(userId, numAmount.toFixed(2));

      const withdrawal = await storage.createWithdrawalRequest({
        userId,
        paymentMethodId,
        amount: numAmount.toFixed(2),
        commission: commission.toFixed(2),
        netAmount: netAmount.toFixed(2),
      });
      await storage.addBalanceHistory({ userId, type: "withdrawal", amount: String(-numAmount), description: `Pul yechish so'rovi (komissiya: ${commission.toFixed(2)})` });

      res.json({ withdrawal, message: "Yechish so'rovi yuborildi! Tekshirgandan so'ng amalga oshiriladi." });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/withdrawals", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const withdrawals = await storage.getUserWithdrawalRequests(userId);
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/balance-history", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const history = await storage.getUserBalanceHistory(userId);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== ADMIN ROUTES =====

  app.get("/api/admin/users", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers.map(u => ({ ...u, password: undefined, fundPassword: undefined })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
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
      res.json({
        user,
        invitedBy,
        paymentMethods: methods,
        deposits,
        withdrawals,
        investments,
        referralStats,
        referralTree: enrichedReferralTree,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/ban", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { isBanned } = req.body;
      await storage.banUser(req.params.id as string, isBanned);
      res.json({ message: isBanned ? "Foydalanuvchi bloklandi" : "Foydalanuvchi blokdan chiqarildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/withdrawal-ban", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { banned } = req.body;
      await storage.setWithdrawalBan(req.params.id as string, banned);
      res.json({ message: banned ? "Pul yechish taqiqlandi" : "Pul yechish ruxsat berildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/balance", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { balance } = req.body;
      const targetUser = await storage.getUser(req.params.id as string);
      const oldBalance = targetUser ? Number(targetUser.balance) : 0;
      const diff = Number(balance) - oldBalance;
      await storage.setUserBalance(req.params.id as string, String(balance));
      await storage.addBalanceHistory({ userId: req.params.id as string, type: "admin_adjust", amount: String(diff), description: `Texnik bo'lim tomonidan balans o'zgartirildi` });
      res.json({ message: "Balans yangilandi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/vip", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { level, dailyLimit } = req.body;
      await storage.setUserVipLevel(req.params.id as string, level, dailyLimit);
      res.json({ message: "VIP daraja yangilandi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteUser(req.params.id as string);
      res.json({ message: "Foydalanuvchi o'chirildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/password", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { password, fundPassword } = req.body;
      if (password) {
        const hashed = await hashPassword(password);
        await storage.updateUserPassword(req.params.id as string, hashed, password);
      }
      if (fundPassword) {
        const hashed = await hashPassword(fundPassword);
        await storage.updateUserFundPassword(req.params.id as string, hashed, fundPassword);
      }
      res.json({ message: "Parol yangilandi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/vip-packages/:id/toggle-lock", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { locked } = req.body;
      await storage.toggleVipPackageLock(req.params.id as string, locked);
      res.json({ message: locked ? "Daraja yopildi" : "Daraja ochildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/payment-methods/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deletePaymentMethod(req.params.id as string);
      res.json({ message: "To'lov usuli o'chirildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/deposits", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const deposits = await storage.getAllDepositRequests();
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/approve", requireAdmin, async (req: Request, res: Response) => {
    try {
      const deposit = await storage.getDepositById(req.params.id as string);
      if (!deposit) return res.status(404).json({ message: "Depozit topilmadi" });
      if (deposit.status === "approved") return res.status(400).json({ message: "Depozit allaqachon tasdiqlangan" });

      let amountInUSDT = deposit.amount;
      if (deposit.currency === "UZS") {
        amountInUSDT = (Number(deposit.amount) / 12850).toFixed(2);
      }

      await storage.updateDepositStatus(deposit.id, "approved");
      await storage.updateUserBalance(deposit.userId, amountInUSDT);
      await storage.updateUserTotalDeposit(deposit.userId, amountInUSDT);
      await storage.addBalanceHistory({ userId: deposit.userId, type: "deposit", amount: amountInUSDT, description: `Depozit tasdiqlandi (${deposit.currency})` });
      res.json({ message: "Depozit tasdiqlandi va balansga qo'shildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/reject", requireAdmin, async (req: Request, res: Response) => {
    try {
      const deposit = await storage.getDepositById(req.params.id as string);
      if (!deposit) return res.status(404).json({ message: "Depozit topilmadi" });
      if (deposit.status !== "pending") return res.status(400).json({ message: "Faqat kutilayotgan depozitlar rad etilishi mumkin" });

      await storage.updateDepositStatus(deposit.id, "rejected");
      res.json({ message: "Depozit rad etildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/withdrawals", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const withdrawals = await storage.getAllWithdrawalRequests();
      const methods = await storage.getAllPaymentMethods();
      const methodMap: Record<string, any> = {};
      for (const m of methods) { methodMap[m.id] = m; }
      const enriched = withdrawals.map(w => ({
        ...w,
        paymentMethod: methodMap[w.paymentMethodId] || null,
      }));
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/approve", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.updateWithdrawalStatus(req.params.id as string, "approved");
      res.json({ message: "Yechish tasdiqlandi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.updateWithdrawalStatus(req.params.id as string, "rejected");
      res.json({ message: "Yechish rad etildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/deposit-settings", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getDepositSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposit-settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const setting = await storage.upsertDepositSetting(req.body);
      res.json({ setting, message: "Rekvizit saqlandi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/deposit-settings/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteDepositSetting(req.params.id as string);
      res.json({ message: "Rekvizit o'chirildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/top-referrers", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const top = await storage.getTopReferrers(10);
      const enriched = await Promise.all(
        top.map(async (r: any) => {
          const user = await storage.getUser(r.referrerId);
          return { ...r, phone: user?.phone, numericId: user?.numericId, vipLevel: user?.vipLevel };
        })
      );
      res.json(enriched);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/multi-accounts", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const groups = await storage.getMultiAccountGroups();
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/referral-tree/:userId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const tree = await storage.getReferralTree(req.params.userId as string);
      res.json(tree);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/stajyor/request", requireAuth, async (req: Request, res: Response) => {
    try {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/stajyor/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getUserStajyorRequests(req.session.userId!);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/stajyor-requests", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const requests = await storage.getAllStajyorRequests();
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/stajyor-requests/:id/approve", requireAdmin, async (req: Request, res: Response) => {
    try {
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
      res.json({ message: "Stajyor lavozimi faollashtirildi! (3 kun)" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/stajyor-requests/:id/reject", requireAdmin, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getAllStajyorRequests();
      const request = requests.find(r => r.id === req.params.id);
      if (!request) return res.status(404).json({ message: "So'rov topilmadi" });
      if (request.status !== "pending") return res.status(400).json({ message: "Bu so'rov allaqachon ko'rib chiqilgan" });

      await storage.updateStajyorRequestStatus(request.id, "rejected");
      res.json({ message: "So'rov rad etildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposit-settings/active", requireAuth, async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getDepositSettings();
      res.json(settings.filter((s: any) => s.isActive));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  async function processDailyProfits() {
    try {
      const activeInvestments = await storage.getActiveInvestments();
      const today = new Date().toISOString().split("T")[0];

      for (const inv of activeInvestments) {
        if (inv.lastProfitDate === today) continue;

        await storage.updateUserBalance(inv.userId, inv.dailyProfit);
        await storage.updateInvestmentLastProfitDate(inv.id, today);
        await storage.addBalanceHistory({ userId: inv.userId, type: "earning", amount: inv.dailyProfit, description: `Fond kunlik daromadi` });

        if (inv.endDate && new Date(inv.endDate) <= new Date()) {
          await storage.updateInvestmentStatus(inv.id, "completed");
          const plan = await storage.getFundPlan(inv.fundPlanId);
          if (plan?.returnPrincipal) {
            await storage.updateUserBalance(inv.userId, inv.investedAmount);
            await storage.addBalanceHistory({ userId: inv.userId, type: "deposit", amount: inv.investedAmount, description: `${plan.name} fond investitsiyasi qaytarildi` });
          }
        }
      }
      console.log(`[Cron] Daily profits processed for ${activeInvestments.length} investments`);
    } catch (error) {
      console.error("[Cron] Error processing daily profits:", error);
    }
  }

  setInterval(processDailyProfits, 24 * 60 * 60 * 1000);
  setTimeout(processDailyProfits, 5000);

  app.post("/api/promo/use", requireAuth, async (req: Request, res: Response) => {
    try {
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

      if (promo.isOneTime) {
        await storage.deactivatePromoCode(promo.id);
      } else if (promo.maxUses && promo.currentUses + 1 >= promo.maxUses) {
        await storage.deactivatePromoCode(promo.id);
      }

      res.json({ message: `${promo.amount} USDT hisobingizga qo'shildi!`, amount: promo.amount });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/promo/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const allPromos = await storage.getAllPromoCodes();
      const userUsages = [];
      for (const promo of allPromos) {
        const usage = await storage.getUserPromoCodeUsage(req.session.userId!, promo.id);
        if (usage) userUsages.push({ ...usage, code: promo.code });
      }
      res.json(userUsages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/promo-codes", requireAdmin, async (req: Request, res: Response) => {
    try {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/promo-codes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const promos = await storage.getAllPromoCodes();
      res.json(promos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/promo-codes/:id/usages", requireAdmin, async (req: Request, res: Response) => {
    try {
      const usages = await storage.getPromoCodeUsages(req.params.id as string);
      res.json(usages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/promo-codes/:id/deactivate", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deactivatePromoCode(req.params.id as string);
      res.json({ message: "Promokod o'chirildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/promo-codes/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deletePromoCode(req.params.id as string);
      res.json({ message: "Promokod o'chirildi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
