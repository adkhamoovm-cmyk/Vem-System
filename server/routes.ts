import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

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

      const user = await storage.createUser({
        phone,
        password: hashedPassword,
        fundPassword: hashedFundPassword,
        referralCode: newReferralCode,
        referredBy: referredById,
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

      await storage.createTaskHistory({ userId, videoId, reward: String(video.reward) });
      await storage.updateUserBalance(userId, String(video.reward));
      await storage.updateUserDailyTasks(userId, dailyCompleted + 1, today);

      const reward = Number(video.reward);
      if (user.referredBy) {
        const l1Commission = (reward * 0.09).toFixed(2);
        await storage.updateUserBalance(user.referredBy, l1Commission);
        const l1Referrer = await storage.getUser(user.referredBy);
        if (l1Referrer?.referredBy) {
          const l2Commission = (reward * 0.03).toFixed(2);
          await storage.updateUserBalance(l1Referrer.referredBy, l2Commission);
          const l2Referrer = await storage.getUser(l1Referrer.referredBy);
          if (l2Referrer?.referredBy) {
            const l3Commission = (reward * 0.01).toFixed(2);
            await storage.updateUserBalance(l2Referrer.referredBy, l3Commission);
          }
        }
      }

      res.json({ reward: video.reward, message: "Vazifa bajarildi!" });
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

      if (Number(user.balance) < pkg.price) {
        return res.status(400).json({ message: "Balans yetarli emas" });
      }

      await storage.updateUserBalance(userId, String(-pkg.price));
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

  return httpServer;
}
