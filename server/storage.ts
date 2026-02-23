import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";
import { users, vipPackages, videos, taskHistory, referrals } from "@shared/schema";
import type { User, InsertUser, VipPackage, Video, TaskHistory, Referral } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  getUserByReferralCode(code: string): Promise<User | undefined>;
  createUser(user: { phone: string; password: string; fundPassword: string; referralCode: string; referredBy?: string; numericId?: string }): Promise<User>;
  updateUserBalance(id: string, amount: string): Promise<void>;
  updateUserDailyTasks(id: string, completed: number, lastDate: string): Promise<void>;
  updateUserVipLevel(id: string, level: number, dailyLimit: number): Promise<void>;
  updateUserAvatar(id: string, avatar: string): Promise<void>;
  getVipPackages(): Promise<VipPackage[]>;
  getVipPackage(id: string): Promise<VipPackage | undefined>;
  getVideos(): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createTaskHistory(entry: { userId: string; videoId: string; reward: string }): Promise<TaskHistory>;
  getUserTasksToday(userId: string, date: string): Promise<number>;
  getReferralStats(userId: string): Promise<{
    level1: { count: number; commission: string };
    level2: { count: number; commission: string };
    level3: { count: number; commission: string };
  }>;
  createReferral(entry: { referrerId: string; referredId: string; level: number; commission?: string }): Promise<void>;
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

  async createUser(data: { phone: string; password: string; fundPassword: string; referralCode: string; referredBy?: string; numericId?: string }): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUserAvatar(id: string, avatar: string): Promise<void> {
    await db.update(users).set({ avatar }).where(eq(users.id, id));
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
}

export const storage = new DatabaseStorage();
