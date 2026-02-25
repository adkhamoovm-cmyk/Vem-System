import { eq, and, sql, desc, gte, sum } from "drizzle-orm";
import { db } from "./db";
import { users, vipPackages, videos, taskHistory, referrals, fundPlans, investments, paymentMethods, depositRequests, withdrawalRequests, depositSettings, stajyorRequests, balanceHistory, promoCodes, promoCodeUsages } from "@shared/schema";
import type { User, InsertUser, VipPackage, Video, TaskHistory, Referral, FundPlan, Investment, PaymentMethod, DepositRequest, WithdrawalRequest, DepositSetting, StajyorRequest, BalanceHistory, PromoCode, PromoCodeUsage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(user: { phone: string; password: string; fundPassword: string; plainPassword?: string; plainFundPassword?: string; referralCode: string; referredBy?: string; numericId?: string; vipLevel?: number; dailyTasksLimit?: number }): Promise<User>;
  updateUserBalance(id: string, amount: string): Promise<void>;
  updateUserDailyTasks(id: string, completed: number, lastDate: string): Promise<void>;
  updateUserVipLevel(id: string, level: number, dailyLimit: number): Promise<void>;
  updateUserAvatar(id: string, avatar: string): Promise<void>;
  updateUserPassword(id: string, hashedPassword: string, plainPassword?: string): Promise<void>;
  updateUserFundPassword(id: string, hashedFundPassword: string, plainFundPassword?: string): Promise<void>;
  getVipPackages(): Promise<VipPackage[]>;
  getVipPackage(id: string): Promise<VipPackage | undefined>;
  getVideos(): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createTaskHistory(entry: { userId: string; videoId: string; reward: string }): Promise<TaskHistory>;
  getUserTasksToday(userId: string, date: string): Promise<number>;
  hasUserWatchedVideoToday(userId: string, videoId: string, date: string): Promise<boolean>;
  getReferralStats(userId: string): Promise<{
    level1: { count: number; commission: string };
    level2: { count: number; commission: string };
    level3: { count: number; commission: string };
  }>;
  createReferral(entry: { referrerId: string; referredId: string; level: number; commission?: string }): Promise<void>;
  getReferredUsers(userId: string): Promise<{ phone: string; vipLevel: number; level: number }[]>;
  getFundPlans(): Promise<FundPlan[]>;
  getFundPlan(id: string): Promise<FundPlan | undefined>;
  createInvestment(data: { userId: string; fundPlanId: string; investedAmount: string; dailyProfit: string; endDate: Date | null; lastProfitDate?: string }): Promise<Investment>;
  getUserInvestments(userId: string): Promise<Investment[]>;
  getActiveInvestments(): Promise<Investment[]>;
  updateInvestmentStatus(id: string, status: string): Promise<void>;
  updateInvestmentLastProfitDate(id: string, date: string): Promise<void>;
  getUserPaymentMethods(userId: string): Promise<PaymentMethod[]>;
  getAllPaymentMethods(): Promise<PaymentMethod[]>;
  createPaymentMethod(data: { userId: string; type: string; bankName?: string; exchangeName?: string; cardNumber?: string; walletAddress?: string; holderName?: string }): Promise<PaymentMethod>;
  createDepositRequest(data: { userId: string; amount: string; currency: string; paymentType: string; receiptUrl?: string }): Promise<DepositRequest>;
  getUserDepositRequests(userId: string): Promise<DepositRequest[]>;
  createWithdrawalRequest(data: { userId: string; paymentMethodId: string; amount: string; commission: string; netAmount: string }): Promise<WithdrawalRequest>;
  getUserWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]>;
  deductUserBalance(id: string, amount: string): Promise<void>;
  getAllUsers(): Promise<User[]>;
  banUser(id: string, isBanned: boolean): Promise<void>;
  setWithdrawalBan(id: string, banned: boolean): Promise<void>;
  setUserBalance(id: string, balance: string): Promise<void>;
  deleteUser(id: string): Promise<void>;
  setUserVipLevel(id: string, level: number, dailyLimit: number): Promise<void>;
  getAllDepositRequests(): Promise<DepositRequest[]>;
  getDepositById(id: string): Promise<DepositRequest | undefined>;
  updateDepositStatus(id: string, status: string): Promise<void>;
  updateUserTotalDeposit(id: string, amount: string): Promise<void>;
  getAllWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  getWithdrawalById(id: string): Promise<WithdrawalRequest | undefined>;
  updateWithdrawalStatus(id: string, status: string): Promise<void>;
  addReferralCommission(referrerId: string, referredId: string, level: number, amount: string): Promise<void>;
  deletePaymentMethod(id: string): Promise<void>;
  getDepositSettings(): Promise<DepositSetting[]>;
  upsertDepositSetting(data: Partial<DepositSetting> & { type: string }): Promise<DepositSetting>;
  deleteDepositSetting(id: string): Promise<void>;
  getReferralTree(userId: string): Promise<Referral[]>;
  getAllReferrals(): Promise<Referral[]>;
  getTopReferrers(limit: number): Promise<{ referrerId: string; count: number; totalCommission: string }[]>;
  getUsersByIp(ip: string): Promise<User[]>;
  updateUserLoginInfo(id: string, ip: string, userAgent: string): Promise<void>;
  getMultiAccountGroups(): Promise<{ ip: string; count: number; users: Pick<User, 'id' | 'phone' | 'numericId' | 'lastLoginIp' | 'lastUserAgent' | 'isBanned' | 'createdAt' | 'vipLevel'>[] }[]>;
  createStajyorRequest(userId: string, message?: string): Promise<StajyorRequest>;
  getUserStajyorRequests(userId: string): Promise<StajyorRequest[]>;
  getAllStajyorRequests(): Promise<StajyorRequest[]>;
  updateStajyorRequestStatus(id: string, status: string): Promise<void>;
  hasUserInvestments(userId: string): Promise<boolean>;
  updateUserTotalEarnings(id: string, amount: string): Promise<void>;
  setUserVipExpiry(id: string, expiresAt: Date | null): Promise<void>;
  setUserVipPurchaseInfo(id: string, purchasedAt: Date, price: string): Promise<void>;
  getTaskEarningsSince(userId: string, sinceDate: Date): Promise<number>;
  setStajyorUsed(id: string): Promise<void>;
  addBalanceHistory(data: { userId: string; type: string; amount: string; description?: string }): Promise<BalanceHistory>;
  getUserBalanceHistory(userId: string): Promise<BalanceHistory[]>;
  updateWithdrawalHistoryStatus(userId: string, withdrawalId: string, newStatus: string): Promise<void>;
  updateDepositHistoryStatus(userId: string, amount: string, currency: string, newStatus: string, amountInUSDT: string): Promise<void>;
  toggleVipPackageLock(id: string, locked: boolean): Promise<void>;
  createPromoCode(data: { code: string; amount: string; isOneTime: boolean; maxUses?: number }): Promise<PromoCode>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  incrementPromoCodeUsage(id: string): Promise<void>;
  deactivatePromoCode(id: string): Promise<void>;
  createPromoCodeUsage(data: { promoCodeId: string; userId: string; amount: string }): Promise<PromoCodeUsage>;
  getUserPromoCodeUsage(userId: string, promoCodeId: string): Promise<PromoCodeUsage | undefined>;
  getPromoCodeUsages(promoCodeId: string): Promise<(PromoCodeUsage & { userPhone?: string })[]>;
  deletePromoCode(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async getUserByReferralCode(code: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, code));
    return user;
  }

  async createUser(data: { phone: string; password: string; fundPassword: string; plainPassword?: string; plainFundPassword?: string; referralCode: string; referredBy?: string; numericId?: string; vipLevel?: number; dailyTasksLimit?: number }): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUserAvatar(id: string, avatar: string): Promise<void> {
    await db.update(users).set({ avatar }).where(eq(users.id, id));
  }

  async updateUserPassword(id: string, hashedPassword: string, plainPassword?: string): Promise<void> {
    const update: any = { password: hashedPassword };
    if (plainPassword) update.plainPassword = plainPassword;
    await db.update(users).set(update).where(eq(users.id, id));
  }

  async updateUserFundPassword(id: string, hashedFundPassword: string, plainFundPassword?: string): Promise<void> {
    const update: any = { fundPassword: hashedFundPassword };
    if (plainFundPassword) update.plainFundPassword = plainFundPassword;
    await db.update(users).set(update).where(eq(users.id, id));
  }

  async updateUserBalance(id: string, amount: string): Promise<void> {
    await db.update(users)
      .set({ balance: sql`${users.balance}::numeric + ${amount}::numeric` })
      .where(eq(users.id, id));
  }

  async updateUserDailyTasks(id: string, completed: number, lastDate: string): Promise<void> {
    await db.update(users)
      .set({ dailyTasksCompleted: completed, lastTaskDate: lastDate })
      .where(eq(users.id, id));
  }

  async updateUserVipLevel(id: string, level: number, dailyLimit: number): Promise<void> {
    await db.update(users)
      .set({ vipLevel: level, dailyTasksLimit: dailyLimit })
      .where(eq(users.id, id));
  }

  async getVipPackages(): Promise<VipPackage[]> {
    return db.select().from(vipPackages);
  }

  async getVipPackage(id: string): Promise<VipPackage | undefined> {
    const [pkg] = await db.select().from(vipPackages).where(eq(vipPackages.id, id));
    return pkg;
  }

  async getVideos(): Promise<Video[]> {
    return db.select().from(videos);
  }

  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async createTaskHistory(entry: { userId: string; videoId: string; reward: string }): Promise<TaskHistory> {
    const [task] = await db.insert(taskHistory).values(entry).returning();
    return task;
  }

  async getUserTasksToday(userId: string, date: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(taskHistory)
      .where(and(
        eq(taskHistory.userId, userId),
        sql`DATE(${taskHistory.completedAt}) = ${date}`
      ));
    return Number(result[0]?.count || 0);
  }

  async hasUserWatchedVideoToday(userId: string, videoId: string, date: string): Promise<boolean> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(taskHistory)
      .where(and(
        eq(taskHistory.userId, userId),
        eq(taskHistory.videoId, videoId),
        sql`DATE(${taskHistory.completedAt}) = ${date}`
      ));
    return Number(result[0]?.count || 0) > 0;
  }

  async getReferralStats(userId: string) {
    const getStats = async (level: number) => {
      const result = await db.select({
        count: sql<number>`count(*)`,
        commission: sql<string>`COALESCE(SUM(${referrals.commission}::numeric), 0)`,
      })
        .from(referrals)
        .where(and(eq(referrals.referrerId, userId), eq(referrals.level, level)));
      return {
        count: Number(result[0]?.count || 0),
        commission: String(result[0]?.commission || "0"),
      };
    };

    return {
      level1: await getStats(1),
      level2: await getStats(2),
      level3: await getStats(3),
    };
  }

  async createReferral(entry: { referrerId: string; referredId: string; level: number; commission?: string }): Promise<void> {
    await db.insert(referrals).values({ ...entry, commission: entry.commission || "0" });
  }

  async addReferralCommission(referrerId: string, referredId: string, level: number, amount: string): Promise<void> {
    await db.update(referrals)
      .set({ commission: sql`${referrals.commission}::numeric + ${amount}::numeric` })
      .where(and(eq(referrals.referrerId, referrerId), eq(referrals.referredId, referredId), eq(referrals.level, level)));
  }

  async getReferredUsers(userId: string): Promise<{ phone: string; vipLevel: number; level: number }[]> {
    const result = await db.select({
      phone: users.phone,
      vipLevel: users.vipLevel,
      level: referrals.level,
    })
      .from(referrals)
      .innerJoin(users, eq(referrals.referredId, users.id))
      .where(eq(referrals.referrerId, userId))
      .orderBy(referrals.level);
    return result;
  }

  async getFundPlans(): Promise<FundPlan[]> {
    return db.select().from(fundPlans);
  }

  async getFundPlan(id: string): Promise<FundPlan | undefined> {
    const [plan] = await db.select().from(fundPlans).where(eq(fundPlans.id, id));
    return plan;
  }

  async createInvestment(data: { userId: string; fundPlanId: string; investedAmount: string; dailyProfit: string; endDate: Date | null; lastProfitDate?: string }): Promise<Investment> {
    const [inv] = await db.insert(investments).values({
      ...data,
      status: "active",
      lastProfitDate: data.lastProfitDate || new Date().toISOString().split("T")[0],
    }).returning();
    return inv;
  }

  async getUserInvestments(userId: string): Promise<Investment[]> {
    return db.select().from(investments).where(eq(investments.userId, userId));
  }

  async getActiveInvestments(): Promise<Investment[]> {
    return db.select().from(investments).where(eq(investments.status, "active"));
  }

  async updateInvestmentStatus(id: string, status: string): Promise<void> {
    await db.update(investments).set({ status }).where(eq(investments.id, id));
  }

  async updateInvestmentLastProfitDate(id: string, date: string): Promise<void> {
    await db.update(investments).set({ lastProfitDate: date }).where(eq(investments.id, id));
  }

  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId));
  }

  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return db.select().from(paymentMethods);
  }

  async createPaymentMethod(data: { userId: string; type: string; bankName?: string; exchangeName?: string; cardNumber?: string; walletAddress?: string; holderName?: string }): Promise<PaymentMethod> {
    const [method] = await db.insert(paymentMethods).values(data).returning();
    return method;
  }

  async createDepositRequest(data: { userId: string; amount: string; currency: string; paymentType: string; receiptUrl?: string }): Promise<DepositRequest> {
    const [deposit] = await db.insert(depositRequests).values(data).returning();
    return deposit;
  }

  async getUserDepositRequests(userId: string): Promise<DepositRequest[]> {
    return db.select().from(depositRequests).where(eq(depositRequests.userId, userId));
  }

  async createWithdrawalRequest(data: { userId: string; paymentMethodId: string; amount: string; commission: string; netAmount: string }): Promise<WithdrawalRequest> {
    const [withdrawal] = await db.insert(withdrawalRequests).values(data).returning();
    return withdrawal;
  }

  async getUserWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]> {
    return db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId));
  }

  async deductUserBalance(id: string, amount: string): Promise<void> {
    await db.update(users)
      .set({ balance: sql`${users.balance}::numeric - ${amount}::numeric` })
      .where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async banUser(id: string, isBanned: boolean): Promise<void> {
    await db.update(users).set({ isBanned }).where(eq(users.id, id));
  }

  async setWithdrawalBan(id: string, banned: boolean): Promise<void> {
    await db.update(users).set({ withdrawalBanned: banned }).where(eq(users.id, id));
  }

  async setUserBalance(id: string, balance: string): Promise<void> {
    await db.update(users).set({ balance }).where(eq(users.id, id));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async setUserVipLevel(id: string, level: number, dailyLimit: number): Promise<void> {
    await db.update(users)
      .set({ vipLevel: level, dailyTasksLimit: dailyLimit })
      .where(eq(users.id, id));
  }

  async getAllDepositRequests(): Promise<DepositRequest[]> {
    return db.select().from(depositRequests);
  }

  async getDepositById(id: string): Promise<DepositRequest | undefined> {
    const [deposit] = await db.select().from(depositRequests).where(eq(depositRequests.id, id));
    return deposit;
  }

  async updateDepositStatus(id: string, status: string): Promise<void> {
    await db.update(depositRequests)
      .set({ status, reviewedAt: new Date() })
      .where(eq(depositRequests.id, id));
  }

  async updateUserTotalDeposit(id: string, amount: string): Promise<void> {
    await db.update(users)
      .set({ totalDeposit: sql`${users.totalDeposit}::numeric + ${amount}::numeric` })
      .where(eq(users.id, id));
  }

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return db.select().from(withdrawalRequests);
  }

  async getWithdrawalById(id: string): Promise<WithdrawalRequest | undefined> {
    const [withdrawal] = await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.id, id));
    return withdrawal;
  }

  async updateWithdrawalStatus(id: string, status: string): Promise<void> {
    await db.update(withdrawalRequests)
      .set({ status, reviewedAt: new Date() })
      .where(eq(withdrawalRequests.id, id));
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
  }

  async getDepositSettings(): Promise<DepositSetting[]> {
    return db.select().from(depositSettings);
  }

  async upsertDepositSetting(data: Partial<DepositSetting> & { type: string }): Promise<DepositSetting> {
    if (data.id) {
      const { id, ...updateData } = data;
      const [setting] = await db.update(depositSettings)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(depositSettings.id, id))
        .returning();
      return setting;
    } else {
      const [setting] = await db.insert(depositSettings).values(data).returning();
      return setting;
    }
  }

  async deleteDepositSetting(id: string): Promise<void> {
    await db.delete(depositSettings).where(eq(depositSettings.id, id));
  }

  async getReferralTree(userId: string): Promise<Referral[]> {
    return db.select().from(referrals).where(eq(referrals.referrerId, userId));
  }

  async getAllReferrals(): Promise<Referral[]> {
    return db.select().from(referrals);
  }

  async getTopReferrers(limit: number): Promise<{ referrerId: string; count: number; totalCommission: string }[]> {
    const result = await db.select({
      referrerId: referrals.referrerId,
      count: sql<number>`count(*)`,
      totalCommission: sql<string>`COALESCE(SUM(${referrals.commission}::numeric), 0)`,
    })
      .from(referrals)
      .where(eq(referrals.level, 1))
      .groupBy(referrals.referrerId)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);
    return result.map(r => ({
      referrerId: r.referrerId,
      count: Number(r.count),
      totalCommission: String(r.totalCommission),
    }));
  }

  async getUsersByIp(ip: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.lastLoginIp, ip));
  }

  async updateUserLoginInfo(id: string, ip: string, userAgent: string): Promise<void> {
    await db.update(users)
      .set({ lastLoginIp: ip, lastUserAgent: userAgent })
      .where(eq(users.id, id));
  }

  async getMultiAccountGroups(): Promise<{ ip: string; count: number; users: Pick<User, 'id' | 'phone' | 'numericId' | 'lastLoginIp' | 'lastUserAgent' | 'isBanned' | 'createdAt' | 'vipLevel'>[] }[]> {
    const ipGroups = await db.select({
      ip: users.lastLoginIp,
      count: sql<number>`count(*)`,
    })
      .from(users)
      .where(sql`${users.lastLoginIp} IS NOT NULL AND ${users.lastLoginIp} != ''`)
      .groupBy(users.lastLoginIp)
      .having(sql`count(*) > 1`);

    const result = [];
    for (const g of ipGroups) {
      const groupUsers = await db.select({
        id: users.id,
        phone: users.phone,
        numericId: users.numericId,
        lastLoginIp: users.lastLoginIp,
        lastUserAgent: users.lastUserAgent,
        isBanned: users.isBanned,
        createdAt: users.createdAt,
        vipLevel: users.vipLevel,
      })
        .from(users)
        .where(eq(users.lastLoginIp, g.ip as string));
      result.push({
        ip: g.ip as string,
        count: Number(g.count),
        users: groupUsers,
      });
    }
    return result;
  }
  async createStajyorRequest(userId: string, message?: string): Promise<StajyorRequest> {
    const [req] = await db.insert(stajyorRequests).values({ userId, message: message || null }).returning();
    return req;
  }

  async getUserStajyorRequests(userId: string): Promise<StajyorRequest[]> {
    return db.select().from(stajyorRequests).where(eq(stajyorRequests.userId, userId)).orderBy(desc(stajyorRequests.createdAt));
  }

  async getAllStajyorRequests(): Promise<StajyorRequest[]> {
    return db.select().from(stajyorRequests).orderBy(desc(stajyorRequests.createdAt));
  }

  async updateStajyorRequestStatus(id: string, status: string): Promise<void> {
    await db.update(stajyorRequests).set({ status, reviewedAt: new Date() }).where(eq(stajyorRequests.id, id));
  }

  async hasUserInvestments(userId: string): Promise<boolean> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(investments).where(eq(investments.userId, userId));
    return Number(result[0]?.count || 0) > 0;
  }

  async updateUserTotalEarnings(id: string, amount: string): Promise<void> {
    await db.update(users)
      .set({ totalEarnings: sql`${users.totalEarnings}::numeric + ${amount}::numeric` })
      .where(eq(users.id, id));
  }

  async setUserVipExpiry(id: string, expiresAt: Date | null): Promise<void> {
    await db.update(users)
      .set({ vipExpiresAt: expiresAt })
      .where(eq(users.id, id));
  }

  async setUserVipPurchaseInfo(id: string, purchasedAt: Date, price: string): Promise<void> {
    await db.update(users)
      .set({ vipPurchasedAt: purchasedAt, vipPurchasePrice: price })
      .where(eq(users.id, id));
  }

  async getTaskEarningsSince(userId: string, sinceDate: Date): Promise<number> {
    const result = await db.select({ total: sum(taskHistory.reward) })
      .from(taskHistory)
      .where(and(
        eq(taskHistory.userId, userId),
        gte(taskHistory.completedAt, sinceDate)
      ));
    return Number(result[0]?.total || 0);
  }

  async setStajyorUsed(id: string): Promise<void> {
    await db.update(users)
      .set({ stajyorUsed: true })
      .where(eq(users.id, id));
  }

  async addBalanceHistory(data: { userId: string; type: string; amount: string; description?: string }): Promise<BalanceHistory> {
    const [entry] = await db.insert(balanceHistory).values(data).returning();
    return entry;
  }

  async getUserBalanceHistory(userId: string): Promise<BalanceHistory[]> {
    return db.select().from(balanceHistory).where(eq(balanceHistory.userId, userId)).orderBy(desc(balanceHistory.createdAt));
  }

  async updateWithdrawalHistoryStatus(userId: string, _withdrawalId: string, newStatus: string): Promise<void> {
    const entries = await db.select().from(balanceHistory)
      .where(and(eq(balanceHistory.userId, userId), eq(balanceHistory.type, "withdrawal")))
      .orderBy(desc(balanceHistory.createdAt))
      .limit(5);
    const pendingEntry = entries.find(e => e.description?.startsWith("pending|"));
    if (pendingEntry) {
      const parts = pendingEntry.description!.split("|");
      parts[0] = newStatus;
      await db.update(balanceHistory).set({ description: parts.join("|") }).where(eq(balanceHistory.id, pendingEntry.id));
    }
  }

  async updateDepositHistoryStatus(userId: string, amount: string, currency: string, newStatus: string, amountInUSDT: string): Promise<void> {
    const entries = await db.select().from(balanceHistory)
      .where(and(eq(balanceHistory.userId, userId), eq(balanceHistory.type, "deposit")))
      .orderBy(desc(balanceHistory.createdAt))
      .limit(10);
    const searchStr = `${amount} ${currency}`;
    const pendingEntry = entries.find(e => e.description?.startsWith("pending|") && e.description?.includes(searchStr));
    if (pendingEntry) {
      const parts = pendingEntry.description!.split("|");
      parts[0] = newStatus;
      await db.update(balanceHistory)
        .set({ description: parts.join("|"), amount: amountInUSDT })
        .where(eq(balanceHistory.id, pendingEntry.id));
    }
  }

  async toggleVipPackageLock(id: string, locked: boolean): Promise<void> {
    await db.update(vipPackages).set({ isLocked: locked }).where(eq(vipPackages.id, id));
  }

  async createPromoCode(data: { code: string; amount: string; isOneTime: boolean; maxUses?: number }): Promise<PromoCode> {
    const [promo] = await db.insert(promoCodes).values(data).returning();
    return promo;
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, code));
    return promo;
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }

  async incrementPromoCodeUsage(id: string): Promise<void> {
    await db.update(promoCodes)
      .set({ currentUses: sql`${promoCodes.currentUses} + 1` })
      .where(eq(promoCodes.id, id));
  }

  async deactivatePromoCode(id: string): Promise<void> {
    await db.update(promoCodes).set({ isActive: false }).where(eq(promoCodes.id, id));
  }

  async createPromoCodeUsage(data: { promoCodeId: string; userId: string; amount: string }): Promise<PromoCodeUsage> {
    const [usage] = await db.insert(promoCodeUsages).values(data).returning();
    return usage;
  }

  async getUserPromoCodeUsage(userId: string, promoCodeId: string): Promise<PromoCodeUsage | undefined> {
    const [usage] = await db.select().from(promoCodeUsages)
      .where(and(eq(promoCodeUsages.userId, userId), eq(promoCodeUsages.promoCodeId, promoCodeId)));
    return usage;
  }

  async getPromoCodeUsages(promoCodeId: string): Promise<(PromoCodeUsage & { userPhone?: string })[]> {
    const usages = await db.select().from(promoCodeUsages).where(eq(promoCodeUsages.promoCodeId, promoCodeId)).orderBy(desc(promoCodeUsages.usedAt));
    const result = [];
    for (const u of usages) {
      const user = await this.getUser(u.userId);
      result.push({ ...u, userPhone: user?.phone });
    }
    return result;
  }

  async deletePromoCode(id: string): Promise<void> {
    await db.delete(promoCodeUsages).where(eq(promoCodeUsages.promoCodeId, id));
    await db.delete(promoCodes).where(eq(promoCodes.id, id));
  }
}

export const storage = new DatabaseStorage();
