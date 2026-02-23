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
        referralCode: newReferralCode,
        referredBy: referredById,
        numericId,
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
      res.json({ user: { ...user, password: undefined, fundPassword: undefined } });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Xatolik yuz berdi" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { phone, password } = req.body;

      if (!phone || !password) {
        return res.status(400).json({ message: "Telefon va parolni kiriting" });
      }

      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(400).json({ message: "Telefon raqami yoki parol noto'g'ri" });
      }

      const valid = await comparePasswords(password, user.password);
      if (!valid) {
        return res.status(400).json({ message: "Telefon raqami yoki parol noto'g'ri" });
      }

      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined, fundPassword: undefined } });
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

      const today = new Date().toISOString().split("T")[0];
      if (user.lastTaskDate !== today) {
        await storage.updateUserDailyTasks(user.id, 0, today);
        user.dailyTasksCompleted = 0;
        user.lastTaskDate = today;
      }

      res.json({ ...user, password: undefined, fundPassword: undefined });
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
      const { videoId } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

      const today = new Date().toISOString().split("T")[0];
      let dailyCompleted = user.dailyTasksCompleted;
      if (user.lastTaskDate !== today) {
        dailyCompleted = 0;
      }

      if (dailyCompleted >= user.dailyTasksLimit) {
        return res.status(400).json({ message: "Kunlik limit tugadi" });
      }

      const video = await storage.getVideo(videoId);
      if (!video) return res.status(404).json({ message: "Video topilmadi" });

      const vipPkgs = await storage.getVipPackages();
      const userPkg = vipPkgs.find(p => p.level === user.vipLevel);
      const perVideoReward = userPkg ? Number(userPkg.perVideoReward) : 0;

      if (perVideoReward <= 0) {
        return res.status(400).json({ message: "VIP paket sotib oling" });
      }

      const rewardStr = perVideoReward.toFixed(2);
      await storage.createTaskHistory({ userId, videoId, reward: rewardStr });
      await storage.updateUserBalance(userId, rewardStr);
      await storage.updateUserDailyTasks(userId, dailyCompleted + 1, today);

      if (user.referredBy) {
        const l1Commission = (perVideoReward * 0.09).toFixed(2);
        await storage.updateUserBalance(user.referredBy, l1Commission);
        const l1Referrer = await storage.getUser(user.referredBy);
        if (l1Referrer?.referredBy) {
          const l2Commission = (perVideoReward * 0.03).toFixed(2);
          await storage.updateUserBalance(l1Referrer.referredBy, l2Commission);
          const l2Referrer = await storage.getUser(l1Referrer.referredBy);
          if (l2Referrer?.referredBy) {
            const l3Commission = (perVideoReward * 0.01).toFixed(2);
            await storage.updateUserBalance(l2Referrer.referredBy, l3Commission);
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

      if (Number(user.balance) < Number(pkg.price)) {
        return res.status(400).json({ message: "Balans yetarli emas" });
      }

      await storage.updateUserBalance(userId, String(-Number(pkg.price)));
      await storage.updateUserVipLevel(userId, pkg.level, pkg.dailyTasks);

      res.json({ message: `${pkg.name} paketi faollashtirildi!` });
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

      res.json({ investment, message: "Investitsiya muvaffaqiyatli amalga oshirildi!" });
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

        if (inv.endDate && new Date(inv.endDate) <= new Date()) {
          await storage.updateInvestmentStatus(inv.id, "completed");
          const plan = await storage.getFundPlan(inv.fundPlanId);
          if (plan?.returnPrincipal) {
            await storage.updateUserBalance(inv.userId, inv.investedAmount);
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

  return httpServer;
}
