import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import multer from "multer";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import webpush from "web-push";
import { z, ZodSchema } from "zod";

const DAY_RESET_HOUR = 3;
const UZB_TIMEZONE_OFFSET = 5;
export const DAY_OFFSET_MS = (UZB_TIMEZONE_OFFSET - DAY_RESET_HOUR) * 60 * 60 * 1000;

export function getUzbDayNow(): Date {
  return new Date(Date.now() + DAY_OFFSET_MS);
}

export function getUzbToday(): string {
  return getUzbDayNow().toISOString().split("T")[0];
}

export function getUzbRealNow(): Date {
  return new Date(Date.now() + UZB_TIMEZONE_OFFSET * 60 * 60 * 1000);
}

export const DAY_RESET_SQL_INTERVAL = `${DAY_OFFSET_MS / 3600000} hours`;
export const DAY_OFFSET_HOURS = DAY_OFFSET_MS / 3600000;

const vapidPublic = process.env.VAPID_PUBLIC_KEY || "";
const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "";
if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails("mailto:admin@vem.uz", vapidPublic, vapidPrivate);
}

export { webpush };

export const notifTranslations: Record<string, Record<string, { title: string; message: string }>> = {
  uz: {
    task_completed: { title: "Vazifa bajarildi!", message: "+{amount} USDT qo'shildi" },
    vip_activated: { title: "{name} paketi faollashtirildi", message: "{tasks} ta kunlik vazifa, {days} kun" },
    deposit_approved: { title: "Depozit tasdiqlandi", message: "+{amount} USDT balansga qo'shildi" },
    deposit_rejected: { title: "Depozit rad etildi", message: "{amount} {currency} depozit so'rovi rad etildi" },
    withdrawal_approved: { title: "Pul yechish tasdiqlandi", message: "{amount} USDT muvaffaqiyatli yechildi" },
    withdrawal_rejected: { title: "Pul yechish rad etildi", message: "{amount} USDT qaytarildi. So'rov rad etildi." },
    referral_commission: { title: "Referal komissiya", message: "+{amount} USDT ({level}-daraja)" },
    stajyor_approved: { title: "Stajyor faollashtirildi!", message: "3 kunlik sinov davri boshlandi. Kuniga 3 ta video ko'ring!" },
    stajyor_rejected: { title: "Stajyor so'rovi rad etildi", message: "So'rovingiz rad etildi. Iltimos qayta urinib ko'ring." },
    promo_applied: { title: "Promokod qabul qilindi", message: "+{amount} USDT promokod orqali qo'shildi" },
    fund_invested: { title: "{name} fondiga investitsiya", message: "{amount} USDT investitsiya qilindi" },
    fund_profit: { title: "Fond daromadi", message: "+{amount} USDT {name} fondidan" },
    fund_returned: { title: "Fond investitsiyasi qaytarildi", message: "+{amount} USDT {name} fondidan qaytarildi" },
  },
  ru: {
    task_completed: { title: "Задание выполнено!", message: "+{amount} USDT начислено" },
    vip_activated: { title: "Пакет {name} активирован", message: "{tasks} заданий в день, {days} дней" },
    deposit_approved: { title: "Депозит подтверждён", message: "+{amount} USDT зачислено на баланс" },
    deposit_rejected: { title: "Депозит отклонён", message: "Заявка на {amount} {currency} отклонена" },
    withdrawal_approved: { title: "Вывод подтверждён", message: "{amount} USDT успешно выведено" },
    withdrawal_rejected: { title: "Вывод отклонён", message: "{amount} USDT возвращено. Заявка отклонена." },
    referral_commission: { title: "Реферальная комиссия", message: "+{amount} USDT ({level}-уровень)" },
    stajyor_approved: { title: "Стажёр активирован!", message: "3-дневный пробный период начался. Смотрите 3 видео в день!" },
    stajyor_rejected: { title: "Заявка на стажёра отклонена", message: "Ваша заявка отклонена. Попробуйте снова." },
    promo_applied: { title: "Промокод применён", message: "+{amount} USDT начислено по промокоду" },
    fund_invested: { title: "Инвестиция в {name}", message: "{amount} USDT инвестировано" },
    fund_profit: { title: "Доход от фонда", message: "+{amount} USDT от {name}" },
    fund_returned: { title: "Инвестиция возвращена", message: "+{amount} USDT возвращено из {name}" },
  },
  en: {
    task_completed: { title: "Task completed!", message: "+{amount} USDT earned" },
    vip_activated: { title: "{name} package activated", message: "{tasks} daily tasks, {days} days" },
    deposit_approved: { title: "Deposit approved", message: "+{amount} USDT added to balance" },
    deposit_rejected: { title: "Deposit rejected", message: "{amount} {currency} deposit request rejected" },
    withdrawal_approved: { title: "Withdrawal approved", message: "{amount} USDT successfully withdrawn" },
    withdrawal_rejected: { title: "Withdrawal rejected", message: "{amount} USDT returned. Request rejected." },
    referral_commission: { title: "Referral commission", message: "+{amount} USDT (level {level})" },
    stajyor_approved: { title: "Intern activated!", message: "3-day trial period started. Watch 3 videos daily!" },
    stajyor_rejected: { title: "Intern request rejected", message: "Your request was rejected. Please try again." },
    promo_applied: { title: "Promo code applied", message: "+{amount} USDT added via promo code" },
    fund_invested: { title: "Invested in {name}", message: "{amount} USDT invested" },
    fund_profit: { title: "Fund profit", message: "+{amount} USDT from {name}" },
    fund_returned: { title: "Fund investment returned", message: "+{amount} USDT returned from {name}" },
  },
  es: {
    task_completed: { title: "¡Tarea completada!", message: "+{amount} USDT ganado" },
    vip_activated: { title: "Paquete {name} activado", message: "{tasks} tareas diarias, {days} días" },
    deposit_approved: { title: "Depósito aprobado", message: "+{amount} USDT añadido al saldo" },
    deposit_rejected: { title: "Depósito rechazado", message: "Solicitud de depósito de {amount} {currency} rechazada" },
    withdrawal_approved: { title: "Retiro aprobado", message: "{amount} USDT retirado exitosamente" },
    withdrawal_rejected: { title: "Retiro rechazado", message: "{amount} USDT devuelto. Solicitud rechazada." },
    referral_commission: { title: "Comisión de referido", message: "+{amount} USDT (nivel {level})" },
    stajyor_approved: { title: "¡Pasante activado!", message: "Período de prueba de 3 días iniciado. ¡Mira 3 videos al día!" },
    stajyor_rejected: { title: "Solicitud de pasante rechazada", message: "Tu solicitud fue rechazada. Inténtalo de nuevo." },
    promo_applied: { title: "Código promocional aplicado", message: "+{amount} USDT añadido con código promocional" },
    fund_invested: { title: "Invertido en {name}", message: "{amount} USDT invertido" },
    fund_profit: { title: "Ganancia del fondo", message: "+{amount} USDT de {name}" },
    fund_returned: { title: "Inversión del fondo devuelta", message: "+{amount} USDT devuelto de {name}" },
  },
  tr: {
    task_completed: { title: "Görev tamamlandı!", message: "+{amount} USDT kazanıldı" },
    vip_activated: { title: "{name} paketi etkinleştirildi", message: "Günlük {tasks} görev, {days} gün" },
    deposit_approved: { title: "Depozito onaylandı", message: "+{amount} USDT bakiyeye eklendi" },
    deposit_rejected: { title: "Depozito reddedildi", message: "{amount} {currency} depozito talebi reddedildi" },
    withdrawal_approved: { title: "Çekim onaylandı", message: "{amount} USDT başarıyla çekildi" },
    withdrawal_rejected: { title: "Çekim reddedildi", message: "{amount} USDT iade edildi. Talep reddedildi." },
    referral_commission: { title: "Referans komisyonu", message: "+{amount} USDT (seviye {level})" },
    stajyor_approved: { title: "Stajyer etkinleştirildi!", message: "3 günlük deneme süresi başladı. Günde 3 video izleyin!" },
    stajyor_rejected: { title: "Stajyer talebi reddedildi", message: "Talebiniz reddedildi. Lütfen tekrar deneyin." },
    promo_applied: { title: "Promosyon kodu uygulandı", message: "+{amount} USDT promosyon koduyla eklendi" },
    fund_invested: { title: "{name} fonuna yatırım", message: "{amount} USDT yatırıldı" },
    fund_profit: { title: "Fon kazancı", message: "+{amount} USDT {name} fonundan" },
    fund_returned: { title: "Fon yatırımı iade edildi", message: "+{amount} USDT {name} fonundan iade edildi" },
  },
};

export function formatNotifText(text: string, params: Record<string, string>): string {
  let result = text;
  for (const [k, v] of Object.entries(params)) {
    result = result.replace(`{${k}}`, v);
  }
  return result;
}

const PUSH_WORTHY_KEYS = new Set([
  "deposit_approved", "deposit_rejected",
  "withdrawal_approved", "withdrawal_rejected",
  "stajyor_approved", "stajyor_rejected",
  "fund_returned",
  "referral_commission",
  "fund_profit",
]);

async function sendPushToUser(userId: string, titles: Record<string, string>, messages: Record<string, string>) {
  try {
    const subs = await storage.getUserPushSubscriptions(userId);
    for (const sub of subs) {
      try {
        const lang = sub.locale || "uz";
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: titles[lang] || titles.uz, body: messages[lang] || messages.uz, url: "/notifications" })
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await storage.deletePushSubscription(userId, sub.endpoint);
        }
      }
    }
  } catch (e) {
    console.error("sendPush error:", e);
  }
}

export async function sendNotification(userId: string, type: string, titleKey: string, messageKey: string, params: Record<string, string> = {}) {
  try {
    const locales = ["uz", "ru", "en", "es", "tr"] as const;
    const titles: Record<string, string> = {};
    const messages: Record<string, string> = {};
    for (const lang of locales) {
      titles[lang] = formatNotifText(notifTranslations[lang]?.[titleKey]?.title || notifTranslations.uz[titleKey]?.title || titleKey, params);
      messages[lang] = formatNotifText(notifTranslations[lang]?.[messageKey]?.message || notifTranslations.uz[messageKey]?.message || messageKey, params);
    }

    const storedTitle = JSON.stringify(titles);
    const storedMessage = JSON.stringify(messages);

    await storage.createNotification({ userId, type, title: storedTitle, message: storedMessage });

    if (PUSH_WORTHY_KEYS.has(messageKey)) {
      await sendPushToUser(userId, titles, messages);
    }
  } catch (e) {
    console.error("sendNotification error:", e);
  }
}

export async function sendRawNotification(userId: string, type: string, title: string, message: string) {
  try {
    await storage.createNotification({ userId, type, title, message });
    const allLangs = { uz: title, ru: title, en: title, es: title, tr: title };
    await sendPushToUser(userId, allLangs, allLangs);
  } catch (e) {
    console.error("sendNotification error:", e);
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const buf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hashed, "hex"), buf);
}

export function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export function generateNumericId(): string {
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

export const uploadAvatar = multer({
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

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      const raw = firstError.message;
      const msg = (raw === "Invalid input" || raw === "Required") ? "Barcha maydonlarni to'ldiring" : raw;
      return res.status(400).json({ message: msg || "Noto'g'ri ma'lumotlar" });
    }
    req.body = result.data;
    next();
  };
}

export const authSchemas = {
  register: z.object({
    phone: z.string({ required_error: "Telefon raqami kerak" }).min(5, "Telefon raqami kerak").max(20).regex(/^\+?\d+$/, "Telefon raqami faqat raqamlardan iborat bo'lishi kerak"),
    password: z.string({ required_error: "Parol kerak" }).min(6, "Parol kamida 6 ta belgi"),
    fundPassword: z.string({ required_error: "Moliya paroli kerak" }).length(6, "PIN kod 6 ta raqam bo'lishi kerak").regex(/^\d{6}$/, "PIN faqat raqamlardan iborat"),
    referralCode: z.string().optional(),
    captchaVerified: z.boolean().optional(),
  }),
  login: z.object({
    phone: z.string({ required_error: "Telefon raqami kerak" }).min(5, "Telefon raqami kerak"),
    password: z.string({ required_error: "Parol kerak" }).min(1, "Parol kerak"),
  }),
  resetStep1: z.object({
    phone: z.string({ required_error: "Telefon raqami kerak" }).min(5, "Telefon raqami kerak"),
  }),
  resetStep2: z.object({
    fundPassword: z.string({ required_error: "Moliya paroli kerak" }).min(1, "Moliya paroli kerak"),
  }),
  resetStep3: z.object({
    answer: z.string({ required_error: "Javob kerak" }).min(1, "Javob kerak"),
  }),
  resetPassword: z.object({
    newPassword: z.string({ required_error: "Yangi parol kerak" }).min(6, "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  }),
};

export const financialSchemas = {
  invest: z.object({
    fundPlanId: z.string({ required_error: "Tarif tanlang" }).min(1, "Tarif tanlang"),
    amount: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().positive("Summa musbat bo'lishi kerak")),
    fundPassword: z.string({ required_error: "Fond paroli kerak" }).min(1, "Fond paroli kerak"),
  }),
  withdraw: z.object({
    amount: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().positive("Summa musbat bo'lishi kerak")),
    paymentMethodId: z.string({ required_error: "To'lov usulini tanlang" }).min(1, "To'lov usulini tanlang"),
    fundPassword: z.string({ required_error: "Fond paroli kerak" }).min(1, "Fond paroli kerak"),
    currency: z.enum(["USDT", "UZS"]).optional(),
  }),
  createPaymentMethod: z.object({
    type: z.enum(["bank", "usdt"], { required_error: "To'lov turi tanlang" }),
    bankName: z.string().optional(),
    exchangeName: z.string().optional(),
    cardNumber: z.string().optional(),
    walletAddress: z.string().optional(),
    holderName: z.string().optional(),
    exchangeUid: z.string().optional(),
    exchangeEmail: z.string().email("Email formati noto'g'ri").optional().or(z.literal("")),
    fundPassword: z.string({ required_error: "Moliya paroli kerak" }).min(1, "Moliya paroli kerak"),
  }),
  createDeposit: z.object({
    amount: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().positive("Summa musbat bo'lishi kerak")),
    currency: z.enum(["USDT", "UZS"], { required_error: "Valyuta tanlang" }),
    paymentType: z.string({ required_error: "To'lov turi kerak" }).min(1, "To'lov turi kerak"),
  }),
};

export const adminSchemas = {
  banUser: z.object({
    isBanned: z.boolean({ required_error: "Ban holati kerak" }),
  }),
  withdrawalBan: z.object({
    banned: z.boolean({ required_error: "Ban holati kerak" }),
  }),
  setBalance: z.object({
    amount: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().gt(0, "Miqdor 0 dan katta bo'lishi kerak")),
    mode: z.enum(["add", "subtract"], { required_error: "Rejim kerak (add yoki subtract)" }),
  }),
  setVip: z.object({
    level: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().int().min(-1).max(10)),
    dailyLimit: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().int().min(0)),
  }),
  setPassword: z.object({
    password: z.string().min(6, "Parol kamida 6 ta belgi").optional(),
    fundPassword: z.string().length(6, "PIN kod 6 ta raqam bo'lishi kerak").regex(/^\d{6}$/, "PIN faqat raqamlardan iborat").optional(),
  }),
  toggleLock: z.object({
    locked: z.boolean({ required_error: "Qulflash holati kerak" }),
  }),
  platformSettings: z.object({
    withdrawalCommissionPercent: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().min(0).max(100)),
    minWithdrawalUsdt: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().min(0)),
    minWithdrawalBank: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().min(0)),
    withdrawalStartHour: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().int().min(0).max(23)),
    withdrawalEndHour: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().int().min(0).max(23)),
    maxDailyWithdrawals: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().int().min(1)),
    withdrawalEnabled: z.boolean({ required_error: "Yechib olish holati kerak" }),
  }),
  createBroadcast: z.object({
    title: z.string({ required_error: "Sarlavha majburiy" }).min(1, "Sarlavha majburiy"),
    message: z.string({ required_error: "Xabar majburiy" }).min(1, "Xabar majburiy"),
    type: z.string().optional(),
  }),
  createPromoCode: z.object({
    code: z.string({ required_error: "Kod kerak" }).min(1, "Kod kerak"),
    amount: z.union([z.string(), z.number()]).transform(v => Number(v)).pipe(z.number().positive("Miqdor 0 dan katta bo'lishi kerak")),
    isOneTime: z.boolean({ required_error: "Bir martalik holati kerak" }),
    maxUses: z.number().int().positive().optional().nullable(),
  }),
  pushSend: z.object({
    title: z.string({ required_error: "Sarlavha majburiy" }).min(1, "Sarlavha majburiy"),
    message: z.string({ required_error: "Xabar majburiy" }).min(1, "Xabar majburiy"),
    targetUserId: z.string().optional(),
  }),
  depositSetting: z.object({
    id: z.string().optional(),
    type: z.string({ required_error: "Tur kerak" }).min(1, "Tur kerak"),
    bankName: z.string().optional().nullable(),
    cardNumber: z.string().optional().nullable(),
    holderName: z.string().optional().nullable(),
    walletAddress: z.string().optional().nullable(),
    exchangeName: z.string().optional().nullable(),
    networkType: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
  verifyPin: z.object({
    pin: z.string({ required_error: "PIN kerak" }).min(1, "PIN kerak"),
  }),
  changePin: z.object({
    currentPin: z.string({ required_error: "Joriy PIN kerak" }).min(1, "Joriy PIN kerak"),
    newPin: z.string({ required_error: "Yangi PIN kerak" }).length(6, "Yangi PIN 6 ta raqam").regex(/^\d{6}$/, "Faqat raqamlar"),
  }),
};

export const userSchemas = {
  completeTask: z.object({
    videoId: z.string().optional(),
    youtubeVideoId: z.string().optional(),
  }),
  purchaseVip: z.object({
    packageId: z.string({ required_error: "Paket tanlang" }).min(1, "Paket tanlang"),
  }),
  changePassword: z.object({
    currentPassword: z.string({ required_error: "Joriy parol kerak" }).min(1, "Joriy parol kerak"),
    newPassword: z.string({ required_error: "Yangi parol kerak" }).min(6, "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  }),
  changeFundPassword: z.object({
    currentFundPassword: z.string({ required_error: "Joriy moliya paroli kerak" }).min(1, "Joriy moliya paroli kerak"),
    newFundPassword: z.string({ required_error: "Yangi moliya paroli kerak" }).length(6, "Yangi moliya paroli 6 xonali raqam bo'lishi kerak").regex(/^\d{6}$/, "Faqat raqamlar kiritilishi kerak"),
  }),
  terminateSession: z.object({
    sid: z.string({ required_error: "Session ID kerak" }).min(1, "Session ID kerak"),
  }),
  usePromo: z.object({
    code: z.string({ required_error: "Promokod kiriting" }).min(1, "Promokod kiriting"),
  }),
  stajyorRequest: z.object({
    message: z.string().optional(),
  }),
};

export { z };

interface PinAttemptRecord {
  count: number;
  lockedUntil: number | null;
  lockCount: number;
}

const fundPinAttempts = new Map<string, PinAttemptRecord>();
const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCK_1 = 30 * 60 * 1000;
const PIN_LOCK_2 = 60 * 60 * 1000;

export function checkFundPinLock(userId: string): { locked: boolean; minutesLeft: number } {
  const record = fundPinAttempts.get(userId);
  if (!record?.lockedUntil) return { locked: false, minutesLeft: 0 };
  const now = Date.now();
  if (now < record.lockedUntil) {
    return { locked: true, minutesLeft: Math.ceil((record.lockedUntil - now) / 60000) };
  }
  record.lockedUntil = null;
  record.count = 0;
  return { locked: false, minutesLeft: 0 };
}

export function recordFundPinFailure(userId: string): { attemptsLeft: number; locked: boolean; minutesLeft: number } {
  const record = fundPinAttempts.get(userId) || { count: 0, lockedUntil: null, lockCount: 0 };
  record.count++;
  if (record.count >= PIN_MAX_ATTEMPTS) {
    const lockMs = record.lockCount === 0 ? PIN_LOCK_1 : PIN_LOCK_2;
    record.lockedUntil = Date.now() + lockMs;
    record.lockCount++;
    record.count = 0;
    fundPinAttempts.set(userId, record);
    return { attemptsLeft: 0, locked: true, minutesLeft: Math.ceil(lockMs / 60000) };
  }
  fundPinAttempts.set(userId, record);
  return { attemptsLeft: PIN_MAX_ATTEMPTS - record.count, locked: false, minutesLeft: 0 };
}

export function resetFundPinAttempts(userId: string): void {
  fundPinAttempts.delete(userId);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Avtorizatsiya talab qilinadi" });
  }
  const user = await storage.getUser(req.session.userId);
  if (user?.isBanned) {
    return new Promise<void>((resolve) => {
      req.session.destroy(() => {
        res.status(403).json({ message: "ACCOUNT_BANNED" });
        resolve();
      });
    });
  }
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
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

export const taskRateLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 3,
  message: { message: "Juda tez so'rov. Biroz kuting." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.session?.userId || "unknown",
  validate: false,
});

export const withdrawRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { message: "Juda tez so'rov. 1 daqiqa kuting." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.session?.userId || "unknown",
  validate: false,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Juda ko'p urinish. 15 daqiqa kuting." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const pinRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { message: "Juda ko'p urinish. 5 daqiqa kuting." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.session?.userId || req.ip || "unknown",
  validate: false,
});

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: "Juda ko'p so'rov. Biroz kuting." },
  standardHeaders: true,
  legacyHeaders: false,
});

const receiptsDir = path.join(process.cwd(), "uploads", "receipts");
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}

const receiptStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, receiptsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${randomBytes(4).toString("hex")}${ext}`);
  },
});

export const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  },
});
