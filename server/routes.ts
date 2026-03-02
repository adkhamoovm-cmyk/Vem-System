import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import multer from "multer";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import webpush from "web-push";

const vapidPublic = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "";
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails("mailto:admin@vem.uz", vapidPublic, vapidPrivate);
}

async function sendNotification(userId: string, type: string, title: string, message: string) {
  try {
    await storage.createNotification({ userId, type, title, message });
    const subs = await storage.getUserPushSubscriptions(userId);
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title, body: message, url: "/notifications" })
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await storage.deletePushSubscription(userId, sub.endpoint);
        }
      }
    }
  } catch (e) {
    console.error("sendNotification error:", e);
  }
}

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
    adminPinVerified: boolean;
    resetPhone: string;
    resetStep: number;
    resetVerifyType: string;
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
  if (!req.session.adminPinVerified) {
    return res.status(403).json({ message: "PIN_REQUIRED" });
  }
  next();
}

const taskRateLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 3,
  message: { message: "Juda tez so'rov. Biroz kuting." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.session?.userId || "unknown",
  validate: false,
});

const withdrawRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { message: "Juda tez so'rov. 1 daqiqa kuting." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.session?.userId || "unknown",
  validate: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Juda ko'p urinish. 15 daqiqa kuting." },
  standardHeaders: true,
  legacyHeaders: false,
});

const pinRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { message: "Juda ko'p urinish. 5 daqiqa kuting." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.session?.userId || req.ip || "unknown",
  validate: false,
});

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Juda ko'p so'rov. Biroz kuting." },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgStore = connectPgSimple(session);
  app.use(
    session({
      store: new PgStore({
        pool: pool as any,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
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

  app.use("/api/", apiRateLimiter);

  app.get("/api/download-app", (req: Request, res: Response) => {
    const domain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || "vem.app";
    const ua = req.headers["user-agent"] || "";
    res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VEM Ilovani O'rnatish</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#0a0a1a;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:16px}
.card{background:linear-gradient(145deg,#12122a,#1a1a2e);border:1px solid rgba(99,102,241,0.2);border-radius:24px;padding:28px 24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
.logo{width:120px;height:auto;margin:0 auto 16px;filter:drop-shadow(0px 4px 12px rgba(79,107,255,0.4))}
h1{font-size:20px;margin-bottom:4px;background:linear-gradient(135deg,#60a5fa,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700}
.subtitle{color:#94a3b8;font-size:13px;margin-bottom:20px}
.browser-tabs{display:flex;gap:6px;margin-bottom:16px;background:#0f0f23;border-radius:12px;padding:4px}
.tab{flex:1;padding:10px 8px;border-radius:10px;text-align:center;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.3s;color:#64748b;display:flex;align-items:center;justify-content:center;gap:4px}
.tab.active{background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;box-shadow:0 4px 12px rgba(59,130,246,0.3)}
.tab svg{width:16px;height:16px}
.guide{display:none;animation:fadeIn 0.3s ease}
.guide.active{display:block}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.steps{text-align:left;background:rgba(15,15,35,0.6);border:1px solid rgba(99,102,241,0.1);border-radius:16px;padding:16px;margin:12px 0}
.step{display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid rgba(99,102,241,0.08)}.step:last-child{border:0;padding-bottom:0}
.num{background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;box-shadow:0 2px 8px rgba(59,130,246,0.3)}
.step-text{font-size:13px;color:#cbd5e1;line-height:1.6}
.step-text b{color:#e2e8f0}
.step-text code{color:#60a5fa;background:rgba(59,130,246,0.1);padding:2px 6px;border-radius:4px;font-size:12px}
.highlight{display:inline-flex;align-items:center;gap:4px;background:rgba(59,130,246,0.15);color:#93c5fd;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:600;margin:2px 0}
.note{background:rgba(234,179,8,0.08);border:1px solid rgba(234,179,8,0.15);border-radius:12px;padding:12px 14px;margin-top:12px;display:flex;align-items:flex-start;gap:8px}
.note-icon{font-size:16px;flex-shrink:0;margin-top:1px}
.note-text{font-size:12px;color:#fbbf24;line-height:1.5}
.btn{display:block;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;border:none;padding:14px;border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;width:100%;margin-top:16px;transition:all 0.3s;box-shadow:0 4px 16px rgba(59,130,246,0.3)}
.btn:active{transform:scale(0.98)}
.detected{display:inline-flex;align-items:center;gap:6px;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.2);color:#4ade80;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:500;margin-bottom:16px}
.detected svg{width:14px;height:14px}
</style></head><body>
<div class="card">
<img src="/icons/vem-logo.png" alt="VEM" class="logo">
<h1>VEM Ilovani O'rnatish</h1>
<p class="subtitle">Telefoningizga VEM ilovasini o'rnating</p>

<div id="detected" class="detected" style="display:none"></div>

<div class="browser-tabs">
  <div class="tab" id="tab-chrome" onclick="showGuide('chrome')">
    <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4"/></svg>
    Chrome
  </div>
  <div class="tab" id="tab-safari" onclick="showGuide('safari')">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg>
    Safari
  </div>
  <div class="tab" id="tab-samsung" onclick="showGuide('samsung')">
    <svg viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="2" width="14" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="18" r="1"/></svg>
    Samsung
  </div>
</div>

<div id="guide-chrome" class="guide">
  <div class="steps">
    <div class="step"><div class="num">1</div><div class="step-text"><b>Chrome</b> brauzerida saytni oching:<br><code>${domain}</code></div></div>
    <div class="step"><div class="num">2</div><div class="step-text">Yuqori o'ng burchakdagi <span class="highlight">⋮ Uch nuqta</span> menyusini bosing</div></div>
    <div class="step"><div class="num">3</div><div class="step-text"><span class="highlight">📲 Bosh ekranga qo'shish</span> yoki <span class="highlight">Install app</span> ni tanlang</div></div>
    <div class="step"><div class="num">4</div><div class="step-text"><b>"O'rnatish"</b> tugmasini bosib tasdiqlang — tayyor!</div></div>
  </div>
  <div class="note"><span class="note-icon">💡</span><span class="note-text">Agar "Bosh ekranga qo'shish" ko'rinmasa — sahifani bir marta yangilang va qayta urinib ko'ring</span></div>
</div>

<div id="guide-safari" class="guide">
  <div class="steps">
    <div class="step"><div class="num">1</div><div class="step-text"><b>Safari</b> brauzerida saytni oching:<br><code>${domain}</code></div></div>
    <div class="step"><div class="num">2</div><div class="step-text">Pastki paneldagi <span class="highlight">⬆ Ulashish (Share)</span> tugmasini bosing</div></div>
    <div class="step"><div class="num">3</div><div class="step-text">Pastga aylantiring va <span class="highlight">➕ Bosh ekranga qo'shish</span> ni tanlang</div></div>
    <div class="step"><div class="num">4</div><div class="step-text">O'ng yuqoridagi <b>"Qo'shish"</b> tugmasini bosing — tayyor!</div></div>
  </div>
  <div class="note"><span class="note-icon">🍎</span><span class="note-text">Safari — iPhone va iPad uchun yagona PWA o'rnatish usuli. Chrome/Firefox orqali iPhone'ga o'rnatib bo'lmaydi</span></div>
</div>

<div id="guide-samsung" class="guide">
  <div class="steps">
    <div class="step"><div class="num">1</div><div class="step-text"><b>Samsung Internet</b> brauzerida saytni oching:<br><code>${domain}</code></div></div>
    <div class="step"><div class="num">2</div><div class="step-text">Pastki paneldagi <span class="highlight">☰ Menyu (3 chiziq)</span> tugmasini bosing</div></div>
    <div class="step"><div class="num">3</div><div class="step-text"><span class="highlight">➕ Sahifani qo'shish</span> → <span class="highlight">Bosh ekran</span> ni tanlang</div></div>
    <div class="step"><div class="num">4</div><div class="step-text"><b>"Qo'shish"</b> tugmasini bosing — tayyor!</div></div>
  </div>
  <div class="note"><span class="note-icon">📱</span><span class="note-text">Samsung Galaxy telefonlarida Samsung Internet brauzeri oldindan o'rnatilgan bo'ladi</span></div>
</div>

<button class="btn" onclick="history.back() || (location.href='/')">↩ Orqaga qaytish</button>
</div>

<script>
function showGuide(browser) {
  document.querySelectorAll('.guide').forEach(g => g.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('guide-' + browser).classList.add('active');
  document.getElementById('tab-' + browser).classList.add('active');
}
(function() {
  var ua = navigator.userAgent || '';
  var detected = document.getElementById('detected');
  var browser = 'chrome';
  var label = '';
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'safari';
    label = '🍎 Safari aniqlandi';
  } else if (/SamsungBrowser/.test(ua)) {
    browser = 'samsung';
    label = '📱 Samsung Internet aniqlandi';
  } else if (/Chrome/.test(ua)) {
    browser = 'chrome';
    label = '🌐 Chrome aniqlandi';
  }
  if (label) {
    detected.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> ' + label;
    detected.style.display = 'inline-flex';
  }
  showGuide(browser);
})();
</script>
</body></html>`);
  });

  app.post("/api/auth/register", authRateLimiter, async (req: Request, res: Response) => {
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

  app.post("/api/auth/reset-cancel", async (req: Request, res: Response) => {
    req.session.resetStep = undefined;
    req.session.resetPhone = undefined;
    req.session.resetVerifyType = undefined;
    res.json({ success: true });
  });

  app.post("/api/auth/reset-step1", authRateLimiter, async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;
      if (!phone || typeof phone !== "string") {
        return res.status(400).json({ message: "Barcha maydonlarni to'ldiring" });
      }
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(400).json({ message: "Telefon raqami yoki moliya paroli noto'g'ri" });
      }
      if (user.isBanned) {
        return res.status(403).json({ message: "Sizning hisobingiz bloklangan. Texnik yordamga murojaat qiling." });
      }
      req.session.resetPhone = phone;
      req.session.resetStep = 1;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Xatolik yuz berdi" });
    }
  });

  app.post("/api/auth/reset-step2", authRateLimiter, async (req: Request, res: Response) => {
    try {
      if (req.session.resetStep !== 1 || !req.session.resetPhone) {
        return res.status(400).json({ message: "Noto'g'ri ma'lumot" });
      }
      const { fundPassword } = req.body;
      if (!fundPassword || typeof fundPassword !== "string") {
        return res.status(400).json({ message: "Barcha maydonlarni to'ldiring" });
      }
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
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Xatolik yuz berdi" });
    }
  });

  app.post("/api/auth/reset-step3", authRateLimiter, async (req: Request, res: Response) => {
    try {
      if (req.session.resetStep !== 2 || !req.session.resetPhone || !req.session.resetVerifyType) {
        return res.status(400).json({ message: "Noto'g'ri ma'lumot" });
      }
      const { answer } = req.body;
      if (!answer || typeof answer !== "string") {
        return res.status(400).json({ message: "Barcha maydonlarni to'ldiring" });
      }
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
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Xatolik yuz berdi" });
    }
  });

  app.post("/api/auth/reset-password", authRateLimiter, async (req: Request, res: Response) => {
    try {
      if (req.session.resetStep !== 3 || !req.session.resetPhone) {
        return res.status(400).json({ message: "Noto'g'ri ma'lumot" });
      }
      const { newPassword } = req.body;
      if (!newPassword || typeof newPassword !== "string") {
        return res.status(400).json({ message: "Barcha maydonlarni to'ldiring" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak" });
      }
      const user = await storage.getUserByPhone(req.session.resetPhone);
      if (!user) {
        return res.status(400).json({ message: "Noto'g'ri ma'lumot" });
      }
      const hashedNew = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedNew, newPassword);
      req.session.resetStep = undefined;
      req.session.resetPhone = undefined;
      req.session.resetVerifyType = undefined;
      res.json({ message: "Parol muvaffaqiyatli tiklandi! Endi yangi parol bilan kiring." });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Xatolik yuz berdi" });
    }
  });

  app.post("/api/auth/login", authRateLimiter, async (req: Request, res: Response) => {
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

      const uzbOffset = 5 * 60 * 60 * 1000;
      const uzbNow = new Date(Date.now() + uzbOffset);
      const today = uzbNow.toISOString().split("T")[0];
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

  app.post("/api/admin/verify-pin", pinRateLimiter, requireAuth, async (req: Request, res: Response) => {
    try {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/pin-status", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.isAdmin) {
        return res.status(403).json({ message: "Admin huquqi talab qilinadi" });
      }
      res.json({ verified: !!req.session.adminPinVerified });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Xatolik yuz berdi" });
    }
  });

  app.post("/api/admin/change-pin", pinRateLimiter, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { currentPin, newPin } = req.body;
      const dbPin = await storage.getPlatformSetting("admin_pin");
      const adminPin = dbPin || process.env.ADMIN_PIN || "077077";
      if (currentPin !== adminPin) {
        return res.status(400).json({ message: "Joriy PIN kod noto'g'ri" });
      }
      if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
        return res.status(400).json({ message: "Yangi PIN kod 6 ta raqamdan iborat bo'lishi kerak" });
      }
      await storage.upsertPlatformSetting("admin_pin", newPin);
      res.json({ message: "PIN kod muvaffaqiyatli o'zgartirildi" });
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

  app.post("/api/tasks/complete", requireAuth, taskRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { videoId, youtubeVideoId } = req.body;

      const uzbOffset = 5 * 60 * 60 * 1000;
      const uzbNow = new Date(Date.now() + uzbOffset);
      if (uzbNow.getUTCDay() === 0) {
        return res.status(400).json({ message: "Yakshanba kuni dam olish kuni. Vazifalar Dushanba-Shanba kunlari bajariladi." });
      }

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

      if (user.isBanned) {
        return res.status(403).json({ message: "Sizning hisobingiz bloklangan." });
      }

      const today = uzbNow.toISOString().split("T")[0];
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

      const taskVideoId = videoId || `yt_${youtubeVideoId}`;
      const alreadyWatched = await storage.hasUserWatchedVideoToday(userId, taskVideoId, today);
      if (alreadyWatched) {
        return res.status(400).json({ message: "Bu videoni bugun allaqachon ko'rgansiz" });
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

      const rewardStr = perVideoReward.toFixed(2);
      await storage.createTaskHistory({ userId, videoId: taskVideoId, reward: rewardStr });
      await storage.updateUserBalance(userId, rewardStr);
      await storage.updateUserTotalEarnings(userId, rewardStr);
      await storage.updateUserDailyTasks(userId, dailyCompleted + 1, today);
      await storage.addBalanceHistory({ userId, type: "earning", amount: rewardStr, description: `Video ko'rish daromadi (${userPkg?.name || "VIP"})` });
      sendNotification(userId, "task_reward", "Vazifa bajarildi!", `+${rewardStr} USDT qo'shildi`);

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

  app.post("/api/vip/purchase", requireAuth, withdrawRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { packageId } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

      if (user.isBanned) {
        return res.status(403).json({ message: "Sizning hisobingiz bloklangan." });
      }

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
      if (isUpgrade && user.vipPurchasedAt && user.vipPurchasePrice) {
        const originalPrice = Number(user.vipPurchasePrice);
        const earnedSinceVip = await storage.getTaskEarningsSince(userId, new Date(user.vipPurchasedAt));
        if (earnedSinceVip < originalPrice) {
          refundAmount = Math.floor((originalPrice - earnedSinceVip) * 100) / 100;
        }
      }

      const effectiveCost = Math.max(0, Number(pkg.price) - refundAmount);
      if (Number(user.balance) < effectiveCost) {
        return res.status(400).json({ message: "Balans yetarli emas" });
      }

      let baseDate = new Date();
      if (isExtension && user.vipExpiresAt && new Date(user.vipExpiresAt) > baseDate) {
        baseDate = new Date(user.vipExpiresAt);
      }
      const expiresAt = new Date(baseDate);
      let workDaysAdded = 0;
      while (workDaysAdded < pkg.durationDays) {
        expiresAt.setDate(expiresAt.getDate() + 1);
        if (expiresAt.getDay() !== 0) {
          workDaysAdded++;
        }
      }

      if (refundAmount > 0) {
        await storage.addBalanceHistory({ userId, type: "commission", amount: String(refundAmount), description: `VIP qaytim: ${refundAmount.toFixed(2)} USDT (depozitning oqlanmagan qismi)` });
      }

      await storage.updateUserBalance(userId, String(-effectiveCost));
      await storage.updateUserVipLevel(userId, pkg.level, pkg.dailyTasks);
      await storage.setUserVipExpiry(userId, expiresAt);
      await storage.setUserVipPurchaseInfo(userId, new Date(), String(pkg.price));
      await storage.addBalanceHistory({ userId, type: "vip_purchase", amount: String(-effectiveCost), description: `${pkg.name} paketi ${isExtension ? "uzaytirildi" : "sotib olindi"} (${pkg.durationDays} kun)${refundAmount > 0 ? ` | Qaytim: ${refundAmount.toFixed(2)} USDT` : ""}` });
      sendNotification(userId, "system", `${pkg.name} paketi faollashtirildi`, `${pkg.dailyTasks} ta kunlik vazifa, ${pkg.durationDays} kun`);

      if (user.referredBy && !isExtension) {
        const vipPrice = Number(pkg.price);
        const l1Commission = (vipPrice * 0.09).toFixed(2);
        await storage.updateUserBalance(user.referredBy, l1Commission);
        await storage.addReferralCommission(user.referredBy, userId, 1, l1Commission);
        await storage.addBalanceHistory({ userId: user.referredBy, type: "commission", amount: l1Commission, description: `1-daraja referal komissiyasi — ${pkg.name} sotib oldi (${user.phone})` });
        sendNotification(user.referredBy, "referral_bonus", "Referal komissiya", `+${l1Commission} USDT (1-daraja)`);
        const l1Referrer = await storage.getUser(user.referredBy);
        if (l1Referrer?.referredBy) {
          const l2Commission = (vipPrice * 0.03).toFixed(2);
          await storage.updateUserBalance(l1Referrer.referredBy, l2Commission);
          await storage.addReferralCommission(l1Referrer.referredBy, userId, 2, l2Commission);
          await storage.addBalanceHistory({ userId: l1Referrer.referredBy, type: "commission", amount: l2Commission, description: `2-daraja referal komissiyasi — ${pkg.name} sotib oldi` });
          sendNotification(l1Referrer.referredBy, "referral_bonus", "Referal komissiya", `+${l2Commission} USDT (2-daraja)`);
          const l2Referrer = await storage.getUser(l1Referrer.referredBy);
          if (l2Referrer?.referredBy) {
            const l3Commission = (vipPrice * 0.01).toFixed(2);
            await storage.updateUserBalance(l2Referrer.referredBy, l3Commission);
            await storage.addReferralCommission(l2Referrer.referredBy, userId, 3, l3Commission);
            await storage.addBalanceHistory({ userId: l2Referrer.referredBy, type: "commission", amount: l3Commission, description: `3-daraja referal komissiyasi — ${pkg.name} sotib oldi` });
            sendNotification(l2Referrer.referredBy, "referral_bonus", "Referal komissiya", `+${l3Commission} USDT (3-daraja)`);
          }
        }
      }

      const totalCalendarDays = Math.ceil((expiresAt.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
      const refundMsg = refundAmount > 0 ? ` Oldingi VIP dan ${refundAmount.toFixed(2)} USDT qaytarildi.` : "";
      res.json({ message: `${pkg.name} paketi ${isExtension ? "uzaytirildi" : "faollashtirildi"}! ${pkg.durationDays} ish kuni (${totalCalendarDays} kun) ${isExtension ? "qo'shildi" : "davomida amal qiladi"}.${refundMsg}` });
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

  app.post("/api/fund/invest", requireAuth, withdrawRateLimiter, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const { fundPlanId, amount, fundPassword } = req.body;

      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

      if (user.isBanned) {
        return res.status(403).json({ message: "Sizning hisobingiz bloklangan." });
      }

      // Verify fund password (financial PIN)
      if (!fundPassword) {
        return res.status(400).json({ message: "Moliya kodi kiritilishi shart" });
      }
      if (!user.fundPassword) {
        return res.status(400).json({ message: "Moliya kodi sozlanmagan. Profildan avval sozlang." });
      }
      const isPinValid = await comparePasswords(fundPassword, user.fundPassword);
      if (!isPinValid) {
        return res.status(400).json({ message: "Moliya kodi noto'g'ri" });
      }

      // Check max 1 active investment
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
      sendNotification(userId, "system", `${plan.name} fondiga investitsiya`, `${investAmount} USDT investitsiya qilindi`);

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

  app.post("/api/deposit", requireAuth, withdrawRateLimiter, uploadReceipt.single("receipt"), async (req: Request, res: Response) => {
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

  app.get("/api/deposits", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const deposits = await storage.getUserDepositRequests(userId);
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/withdraw", requireAuth, withdrawRateLimiter, async (req: Request, res: Response) => {
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
      if (!user.plainFundPassword) {
        await storage.updateUserFundPassword(user.id, user.fundPassword, fundPassword);
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
      res.json(allUsers.map(u => ({ ...u, password: undefined, fundPassword: undefined, plainPassword: undefined, plainFundPassword: undefined })));
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
      const { password: _, fundPassword: _fp, plainPassword: _pp, plainFundPassword: _pfp, ...safeUser } = user;
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/vip", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { level, dailyLimit } = req.body;
      const numLevel = Number(level);
      const numLimit = Number(dailyLimit);
      if (isNaN(numLevel) || numLevel < -1 || numLevel > 10 || isNaN(numLimit) || numLimit < 0) {
        return res.status(400).json({ message: "Noto'g'ri VIP daraja yoki limit qiymati" });
      }
      await storage.setUserVipLevel(req.params.id as string, numLevel, numLimit);
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
      if (deposit.status !== "pending") return res.status(400).json({ message: "Faqat kutilayotgan depozitlar tasdiqlanishi mumkin" });

      let amountInUSDT = deposit.amount;
      if (deposit.currency === "UZS") {
        amountInUSDT = (Number(deposit.amount) / 12100).toFixed(2);
      }

      await storage.updateDepositStatus(deposit.id, "approved");
      await storage.updateUserBalance(deposit.userId, amountInUSDT);
      await storage.updateUserTotalDeposit(deposit.userId, amountInUSDT);
      await storage.updateDepositHistoryStatus(deposit.userId, deposit.amount, deposit.currency, "approved", amountInUSDT);
      sendNotification(deposit.userId, "deposit_confirmed", "Depozit tasdiqlandi", `+${amountInUSDT} USDT balansga qo'shildi`);
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

      let amountInUSDT = deposit.amount;
      if (deposit.currency === "UZS") {
        amountInUSDT = (Number(deposit.amount) / 12100).toFixed(2);
      }

      await storage.updateDepositStatus(deposit.id, "rejected");
      await storage.updateDepositHistoryStatus(deposit.userId, deposit.amount, deposit.currency, "rejected", amountInUSDT);
      sendNotification(deposit.userId, "system", "Depozit rad etildi", `${deposit.amount} ${deposit.currency} depozit so'rovi rad etildi`);
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
      const withdrawal = await storage.getWithdrawalById(req.params.id as string);
      if (!withdrawal) return res.status(404).json({ message: "So'rov topilmadi" });
      if (withdrawal.status !== "pending") return res.status(400).json({ message: "Faqat kutilayotgan so'rovlar tasdiqlanishi mumkin" });
      await storage.updateWithdrawalStatus(withdrawal.id, "approved");
      await storage.updateWithdrawalHistoryStatus(withdrawal.userId, withdrawal.id, "approved");
      sendNotification(withdrawal.userId, "withdrawal_done", "Pul yechish tasdiqlandi", `${withdrawal.netAmount} USDT muvaffaqiyatli yechildi`);
      res.json({ message: "Yechish tasdiqlandi" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdmin, async (req: Request, res: Response) => {
    try {
      const withdrawal = await storage.getWithdrawalById(req.params.id as string);
      if (!withdrawal) return res.status(404).json({ message: "So'rov topilmadi" });
      if (withdrawal.status !== "pending") return res.status(400).json({ message: "Faqat kutilayotgan so'rovlar rad etilishi mumkin" });

      await storage.updateWithdrawalStatus(withdrawal.id, "rejected");
      await storage.updateUserBalance(withdrawal.userId, withdrawal.amount);
      await storage.updateWithdrawalHistoryStatus(withdrawal.userId, withdrawal.id, "rejected");
      await storage.addBalanceHistory({ userId: withdrawal.userId, type: "withdrawal_cancel", amount: withdrawal.amount, description: `Yechish bekor qilindi — qaytarildi ${withdrawal.amount} USDT` });
      sendNotification(withdrawal.userId, "system", "Pul yechish rad etildi", `${withdrawal.amount} USDT qaytarildi. So'rov rad etildi.`);
      res.json({ message: "Yechish rad etildi va balans qaytarildi" });
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
      sendNotification(request.userId, "system", "Stajyor faollashtirildi!", "3 kunlik sinov davri boshlandi. Kuniga 3 ta video ko'ring!");
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
      sendNotification(request.userId, "system", "Stajyor so'rovi rad etildi", "So'rovingiz rad etildi. Iltimos qayta urinib ko'ring.");
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

  app.get("/api/platform-settings", requireAuth, async (_req: Request, res: Response) => {
    try {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/platform-settings", requireAdmin, async (_req: Request, res: Response) => {
    try {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/platform-settings", requireAdmin, async (req: Request, res: Response) => {
    try {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/broadcasts/unread", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      const unread = await storage.getUnreadBroadcasts(userId);
      res.json(unread);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/broadcasts/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId!;
      await storage.markBroadcastRead(String(req.params.id), userId);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/broadcasts", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const all = await storage.getAllBroadcasts();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/broadcasts", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { title, message } = req.body;
      if (!title || !message) return res.status(400).json({ message: "Sarlavha va xabar majburiy" });
      const b = await storage.createBroadcast({ title, message });

      try {
        const allUsers = await storage.getAllUsers();
        for (const u of allUsers) {
          sendNotification(u.id, "broadcast", title, message);
        }
      } catch (e) {
        console.error("Broadcast notification error:", e);
      }

      res.json(b);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/admin/broadcasts/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteBroadcast(String(req.params.id));
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/push-send", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { title, message, targetUserId } = req.body;
      if (!title || !message) return res.status(400).json({ message: "Sarlavha va xabar majburiy" });

      let sentCount = 0;
      if (targetUserId) {
        sendNotification(targetUserId, "broadcast", title, message);
        sentCount = 1;
      } else {
        const allUsers = await storage.getAllUsers();
        for (const u of allUsers) {
          sendNotification(u.id, "broadcast", title, message);
        }
        sentCount = allUsers.length;
      }
      res.json({ message: `${sentCount} ta foydalanuvchiga yuborildi`, count: sentCount });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/push-stats", requireAdmin, async (_req: Request, res: Response) => {
    try {
      const result = await storage.getPushSubscriptionCount();
      res.json({ subscribedUsers: result });
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

        const plan = await storage.getFundPlan(inv.fundPlanId);
        const planName = inv.planName || plan?.name || "Fund";

        await storage.updateUserBalance(inv.userId, inv.dailyProfit);
        await storage.updateInvestmentLastProfitDate(inv.id, today);
        await storage.addBalanceHistory({ userId: inv.userId, type: "fund_profit", amount: inv.dailyProfit, description: `${planName} fond daromadi +${inv.dailyProfit} USDT` });
        sendNotification(inv.userId, "task_reward", "Fond daromadi", `+${inv.dailyProfit} USDT ${planName} fondidan`);

        if (inv.endDate && new Date(inv.endDate) <= new Date()) {
          await storage.updateInvestmentStatus(inv.id, "completed");
          if (plan?.returnPrincipal) {
            await storage.updateUserBalance(inv.userId, inv.investedAmount);
            await storage.addBalanceHistory({ userId: inv.userId, type: "fund_return", amount: inv.investedAmount, description: `${planName} fond investitsiyasi qaytarildi — ${inv.investedAmount} USDT` });
            sendNotification(inv.userId, "deposit_confirmed", "Fond investitsiyasi qaytarildi", `+${inv.investedAmount} USDT ${planName} fondidan qaytarildi`);
          }
        }
      }
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
      sendNotification(req.session.userId!, "deposit_confirmed", "Promokod qabul qilindi", `+${promo.amount} USDT promokod orqali qo'shildi`);

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

  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const list = await storage.getUserNotifications(userId, 50);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      await storage.markNotificationRead(req.params.id, userId);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      await storage.markAllNotificationsRead(userId);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/push/vapid-key", (_req: Request, res: Response) => {
    res.json({ publicKey: vapidPublic });
  });

  app.post("/api/push/subscribe", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const { endpoint, keys } = req.body;
      if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ message: "Invalid subscription" });
      }
      await storage.savePushSubscription({ userId, endpoint, p256dh: keys.p256dh, auth: keys.auth });
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/push/unsubscribe", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const { endpoint } = req.body;
      if (!endpoint) return res.status(400).json({ message: "Endpoint required" });
      await storage.deletePushSubscription(userId, endpoint);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
