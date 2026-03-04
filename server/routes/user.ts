import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { pool } from "../db";
import { db } from "../db";
import { users, taskHistory, balanceHistory, referrals } from "@shared/schema";
import { eq, and, desc, sql as dsql } from "drizzle-orm";
import { requireAuth, taskRateLimiter, withdrawRateLimiter, sendNotification, hashPassword, comparePasswords, uploadAvatar, asyncHandler, validateBody, userSchemas, checkFundPinLock, recordFundPinFailure, resetFundPinAttempts, getUzbDayNow, getUzbToday, getUzbRealNow, DAY_RESET_SQL_INTERVAL } from "../lib/helpers";

const router = Router();

router.get("/api/videos", requireAuth, asyncHandler(async (_req: Request, res: Response) => {
  const videoList = await storage.getVideos();
  res.json(videoList);
}));

router.post("/api/tasks/complete", requireAuth, taskRateLimiter, validateBody(userSchemas.completeTask), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const { videoId, youtubeVideoId } = req.body;

  const uzbRealNow = getUzbRealNow();
  if (uzbRealNow.getUTCDay() === 0) {
    return res.status(400).json({ message: "Yakshanba kuni dam olish kuni. Vazifalar Dushanba-Shanba kunlari bajariladi." });
  }

  const user = await storage.getUser(userId);
  if (!user) return res.status(401).json({ message: "Foydalanuvchi topilmadi" });

  if (user.isBanned) {
    return res.status(403).json({ message: "Sizning hisobingiz bloklangan." });
  }

  if (!videoId && !youtubeVideoId) {
    return res.status(400).json({ message: "Video ID kerak" });
  }

  if (videoId) {
    const video = await storage.getVideo(videoId);
    if (!video) return res.status(404).json({ message: "Video topilmadi" });
  }

  const taskVideoId = videoId || `yt_${youtubeVideoId}`;
  const today = getUzbToday();

  if (user.vipLevel < 0) {
    return res.status(400).json({ message: "Avval VIP paket sotib oling" });
  }

  if (user.vipExpiresAt && new Date(user.vipExpiresAt) < uzbRealNow) {
    return res.status(400).json({ message: "VIP paketingiz muddati tugagan. Yangi paket sotib oling." });
  }

  const vipPkgs = await storage.getVipPackages();
  const userPkg = vipPkgs.find(p => p.level === user.vipLevel);
  const perVideoReward = userPkg ? Number(userPkg.perVideoReward) : 0;

  if (perVideoReward <= 0) {
    return res.status(400).json({ message: "VIP paket sotib oling" });
  }

  const rewardStr = perVideoReward.toFixed(2);
  await db.transaction(async (tx) => {
    const [lockedUser] = await tx.select({ dailyTasksCompleted: users.dailyTasksCompleted, dailyTasksLimit: users.dailyTasksLimit, lastTaskDate: users.lastTaskDate }).from(users).where(eq(users.id, userId)).for("update");
    if (!lockedUser) throw new Error("USER_NOT_FOUND");

    let dailyCompleted = lockedUser.dailyTasksCompleted;
    if (lockedUser.lastTaskDate !== today) {
      dailyCompleted = 0;
    }

    if (dailyCompleted >= lockedUser.dailyTasksLimit) {
      throw new Error("DAILY_LIMIT");
    }

    const [existing] = await tx.select().from(taskHistory).where(
      and(eq(taskHistory.userId, userId), eq(taskHistory.videoId, taskVideoId), dsql`DATE(${taskHistory.completedAt} + INTERVAL '${dsql.raw(DAY_RESET_SQL_INTERVAL)}') = ${today}`)
    ).limit(1);
    if (existing) {
      throw new Error("ALREADY_WATCHED");
    }
    await tx.insert(taskHistory).values({ userId, videoId: taskVideoId, reward: rewardStr });
    await tx.update(users).set({
      balance: dsql`${users.balance}::numeric + ${rewardStr}::numeric`,
      totalEarnings: dsql`${users.totalEarnings}::numeric + ${rewardStr}::numeric`,
      dailyTasksCompleted: dailyCompleted + 1,
      lastTaskDate: today,
    }).where(eq(users.id, userId));
    await tx.insert(balanceHistory).values({ userId, type: "earning", amount: rewardStr, description: `Video ko'rish daromadi (${userPkg?.name || "VIP"})` });
  }).catch((err) => {
    if (err.message === "ALREADY_WATCHED") {
      return res.status(400).json({ message: "Bu videoni bugun allaqachon ko'rgansiz" });
    }
    if (err.message === "DAILY_LIMIT") {
      return res.status(400).json({ message: "Kunlik limit tugadi" });
    }
    throw err;
  });

  if (res.headersSent) return;
  res.json({ reward: rewardStr, message: "Vazifa bajarildi!" });
}));

router.get("/api/vip-packages", requireAuth, asyncHandler(async (_req: Request, res: Response) => {
  const packages = await storage.getVipPackages();
  res.json(packages);
}));

router.post("/api/vip/purchase", requireAuth, withdrawRateLimiter, validateBody(userSchemas.purchaseVip), asyncHandler(async (req: Request, res: Response) => {
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

  const fullPrice = Number(pkg.price);
  if (Number(user.balance) + refundAmount < fullPrice) {
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

  const notificationsToSend: Array<{ userId: string; type: string; titleKey: string; msgKey: string; params: Record<string, string> }> = [];

  try {
  await db.transaction(async (tx) => {
    const [lockedUser] = await tx.select({ balance: users.balance }).from(users).where(eq(users.id, userId)).for("update");
    if (!lockedUser || Number(lockedUser.balance) + refundAmount < fullPrice) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    if (refundAmount > 0) {
      await tx.update(users).set({ balance: dsql`${users.balance}::numeric + ${String(refundAmount)}::numeric` }).where(eq(users.id, userId));
      await tx.insert(balanceHistory).values({ userId, type: "refund", amount: String(refundAmount), description: `VIP qaytim: ${refundAmount.toFixed(2)} USDT (oqlanmagan qism qaytarildi)` });
    }

    await tx.update(users).set({ balance: dsql`${users.balance}::numeric + ${String(-fullPrice)}::numeric` }).where(eq(users.id, userId));
    await tx.update(users).set({ vipLevel: pkg.level, dailyTasksLimit: pkg.dailyTasks }).where(eq(users.id, userId));
    await tx.update(users).set({ vipExpiresAt: expiresAt }).where(eq(users.id, userId));
    await tx.update(users).set({ vipPurchasedAt: new Date(), vipPurchasePrice: String(pkg.price) }).where(eq(users.id, userId));
    await tx.insert(balanceHistory).values({ userId, type: "vip_purchase", amount: String(-fullPrice), description: `${pkg.name} paketi ${isExtension ? "uzaytirildi" : "sotib olindi"} (${pkg.durationDays} kun)` });

    notificationsToSend.push({ userId, type: "system", titleKey: "vip_activated", msgKey: "vip_activated", params: { name: pkg.name, tasks: String(pkg.dailyTasks), days: String(pkg.durationDays) } });

    if (user.referredBy) {
      const vipPrice = Number(pkg.price);
      const commissionMultiplier = isExtension ? 0.5 : 1;
      const commSuffix = isExtension ? " (qayta xarid 50%)" : "";
      const l1Commission = (vipPrice * 0.09 * commissionMultiplier).toFixed(2);
      await tx.update(users).set({ balance: dsql`${users.balance}::numeric + ${l1Commission}::numeric` }).where(eq(users.id, user.referredBy));
      await tx.update(referrals).set({ commission: dsql`${referrals.commission}::numeric + ${l1Commission}::numeric` }).where(and(eq(referrals.referrerId, user.referredBy), eq(referrals.referredId, userId), eq(referrals.level, 1)));
      await tx.insert(balanceHistory).values({ userId: user.referredBy, type: "commission", amount: l1Commission, description: `1-daraja referal komissiyasi — ${pkg.name} sotib oldi (${user.phone})${commSuffix}` });
      notificationsToSend.push({ userId: user.referredBy, type: "referral_bonus", titleKey: "referral_commission", msgKey: "referral_commission", params: { amount: l1Commission, level: "1" } });

      const [l1Referrer] = await tx.select().from(users).where(eq(users.id, user.referredBy));
      if (l1Referrer?.referredBy) {
        const l2Commission = (vipPrice * 0.03 * commissionMultiplier).toFixed(2);
        await tx.update(users).set({ balance: dsql`${users.balance}::numeric + ${l2Commission}::numeric` }).where(eq(users.id, l1Referrer.referredBy));
        await tx.update(referrals).set({ commission: dsql`${referrals.commission}::numeric + ${l2Commission}::numeric` }).where(and(eq(referrals.referrerId, l1Referrer.referredBy), eq(referrals.referredId, userId), eq(referrals.level, 2)));
        await tx.insert(balanceHistory).values({ userId: l1Referrer.referredBy, type: "commission", amount: l2Commission, description: `2-daraja referal komissiyasi — ${pkg.name} sotib oldi${commSuffix}` });
        notificationsToSend.push({ userId: l1Referrer.referredBy, type: "referral_bonus", titleKey: "referral_commission", msgKey: "referral_commission", params: { amount: l2Commission, level: "2" } });

        const [l2Referrer] = await tx.select().from(users).where(eq(users.id, l1Referrer.referredBy));
        if (l2Referrer?.referredBy) {
          const l3Commission = (vipPrice * 0.01 * commissionMultiplier).toFixed(2);
          await tx.update(users).set({ balance: dsql`${users.balance}::numeric + ${l3Commission}::numeric` }).where(eq(users.id, l2Referrer.referredBy));
          await tx.update(referrals).set({ commission: dsql`${referrals.commission}::numeric + ${l3Commission}::numeric` }).where(and(eq(referrals.referrerId, l2Referrer.referredBy), eq(referrals.referredId, userId), eq(referrals.level, 3)));
          await tx.insert(balanceHistory).values({ userId: l2Referrer.referredBy, type: "commission", amount: l3Commission, description: `3-daraja referal komissiyasi — ${pkg.name} sotib oldi${commSuffix}` });
          notificationsToSend.push({ userId: l2Referrer.referredBy, type: "referral_bonus", titleKey: "referral_commission", msgKey: "referral_commission", params: { amount: l3Commission, level: "3" } });
        }
      }
    }
  });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "INSUFFICIENT_BALANCE") {
      return res.status(400).json({ message: "Balans yetarli emas" });
    }
    throw err;
  }

  for (const n of notificationsToSend) {
    sendNotification(n.userId, n.type, n.titleKey, n.msgKey, n.params);
  }

  const totalCalendarDays = Math.ceil((expiresAt.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
  const refundMsg = refundAmount > 0 ? ` Oqlanmagan ${refundAmount.toFixed(2)} USDT balansga qaytarildi.` : "";
  res.json({ 
    message: `${pkg.name} paketi ${isExtension ? "uzaytirildi" : "faollashtirildi"}! ${pkg.durationDays} ish kuni (${totalCalendarDays} kun) ${isExtension ? "qo'shildi" : "davomida amal qiladi"}.${refundMsg}`,
    celebration: {
      type: isExtension ? "vip_extended" : "vip_activated",
      packageName: pkg.name,
      level: pkg.level,
      dailyTasks: pkg.dailyTasks,
      durationDays: pkg.durationDays,
      perVideoReward: pkg.perVideoReward,
      refundAmount: refundAmount > 0 ? refundAmount.toFixed(2) : null,
    }
  });
}));

router.get("/api/referrals/stats", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const stats = await storage.getReferralStats(req.session.userId!);
  res.json(stats);
}));

router.get("/api/referrals/users", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const referred = await storage.getReferredUsers(req.session.userId!);
  res.json(referred);
}));

router.get("/api/referrals/extended-stats", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const referred = await storage.getReferredUsers(userId);

  const vipDistribution: Record<number, number> = {};
  for (const u of referred) {
    vipDistribution[u.vipLevel] = (vipDistribution[u.vipLevel] || 0) + 1;
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const commissionHistory = await storage.getBalanceHistoryByType(userId, "commission");

  let thisMonthEarnings = 0;
  let lastMonthEarnings = 0;
  const recentActivity: { amount: string; description: string; date: string }[] = [];

  for (const h of commissionHistory) {
    const d = new Date(h.createdAt);
    if (d >= thisMonthStart) thisMonthEarnings += Number(h.amount);
    else if (d >= lastMonthStart && d < thisMonthStart) lastMonthEarnings += Number(h.amount);
    if (recentActivity.length < 10) {
      recentActivity.push({ amount: h.amount, description: h.description || "", date: h.createdAt.toISOString() });
    }
  }

  const activeReferrals = referred.filter(u => u.vipLevel > 0).length;

  res.json({
    vipDistribution,
    thisMonthEarnings: thisMonthEarnings.toFixed(2),
    lastMonthEarnings: lastMonthEarnings.toFixed(2),
    recentActivity,
    activeReferrals,
    totalReferrals: referred.length,
  });
}));

router.post("/api/profile/change-password", requireAuth, validateBody(userSchemas.changePassword), asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
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
  await storage.updateUserPassword(req.session.userId!, hashedNew);
  res.json({ message: "Parol muvaffaqiyatli o'zgartirildi" });
}));

router.post("/api/profile/change-fund-password", requireAuth, validateBody(userSchemas.changeFundPassword), asyncHandler(async (req: Request, res: Response) => {
  const { currentFundPassword, newFundPassword } = req.body;
  const user = await storage.getUser(req.session.userId!);
  if (!user) return res.status(404).json({ message: "Foydalanuvchi topilmadi" });
  if (!user.fundPassword) return res.status(400).json({ message: "Moliya paroli sozlanmagan" });
  const cfpLock = checkFundPinLock(user.id);
  if (cfpLock.locked) {
    return res.status(429).json({ message: `Moliya kodi blokland. ${cfpLock.minutesLeft} daqiqadan so'ng urinib ko'ring.` });
  }
  const isValid = await comparePasswords(currentFundPassword, user.fundPassword);
  if (!isValid) {
    const fail = recordFundPinFailure(user.id);
    if (fail.locked) return res.status(429).json({ message: `5 marta noto'g'ri PIN. ${fail.minutesLeft} daqiqa blokland.` });
    return res.status(400).json({ message: `Joriy moliya paroli noto'g'ri. ${fail.attemptsLeft} ta urinish qoldi.` });
  }
  resetFundPinAttempts(user.id);
  const hashedNew = await hashPassword(newFundPassword);
  await storage.updateUserFundPassword(req.session.userId!, hashedNew);
  res.json({ message: "Moliya paroli muvaffaqiyatli o'zgartirildi" });
}));

router.post("/api/profile/avatar", requireAuth, uploadAvatar.single("avatar"), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: "Rasm yuklanmadi" });
  }
  const avatarUrl = `/uploads/avatars/${req.file.filename}`;
  await storage.updateUserAvatar(req.session.userId!, avatarUrl);
  res.json({ avatar: avatarUrl });
}));

router.get("/api/my-sessions", requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const logs = await storage.getUserSessionLogs(userId, 50);

  const activeSessions: Array<{ sid: string; ip: string; userAgent: string; lastActive: string; isCurrent: boolean }> = [];
  const rows = await pool.query(
    `SELECT sid, sess, expire FROM user_sessions WHERE (sess->>'userId') = $1 AND expire > NOW()`,
    [userId]
  );
  for (const row of rows.rows) {
    const sess = typeof row.sess === "string" ? JSON.parse(row.sess) : row.sess;
    activeSessions.push({
      sid: row.sid,
      ip: sess.ip || "",
      userAgent: sess.userAgent || "",
      lastActive: row.expire,
      isCurrent: row.sid === req.sessionID,
    });
  }

  res.json({ logs, activeSessions });
}));

router.post("/api/my-sessions/terminate", requireAuth, validateBody(userSchemas.terminateSession), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.session.userId!;
  const { sid } = req.body;
  if (sid === req.sessionID) return res.status(400).json({ message: "Joriy sessiyani o'chirish mumkin emas" });
  const check = await pool.query(
    `SELECT sid FROM user_sessions WHERE sid = $1 AND (sess->>'userId') = $2`,
    [sid, userId]
  );
  if (check.rows.length === 0) return res.status(404).json({ message: "Sessiya topilmadi" });
  await pool.query(`DELETE FROM user_sessions WHERE sid = $1`, [sid]);
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || "";
  const ua = req.headers["user-agent"] || "";
  try { await storage.logSession({ userId, action: "force_logout", ip, userAgent: ua }); } catch (_) {}
  res.json({ message: "Sessiya tugatildi" });
}));

export default router;
