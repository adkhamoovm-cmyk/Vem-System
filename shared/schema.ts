import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phone: text("phone").notNull().unique(),
  password: text("password").notNull(),
  fundPassword: text("fund_password").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).notNull().default("0"),
  totalDeposit: decimal("total_deposit", { precision: 12, scale: 2 }).notNull().default("0"),
  vipLevel: integer("vip_level").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  dailyTasksCompleted: integer("daily_tasks_completed").notNull().default(0),
  dailyTasksLimit: integer("daily_tasks_limit").notNull().default(3),
  lastTaskDate: text("last_task_date"),
  numericId: text("numeric_id"),
  avatar: text("avatar"),
});

export const vipPackages = pgTable("vip_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull().default("0"),
  dailyTasks: integer("daily_tasks").notNull(),
  perVideoReward: decimal("per_video_reward", { precision: 10, scale: 2 }).notNull().default("0"),
  dailyEarning: decimal("daily_earning", { precision: 10, scale: 2 }).notNull(),
  level: integer("level").notNull(),
  durationDays: integer("duration_days").notNull().default(60),
  isLocked: boolean("is_locked").notNull().default(false),
  emoji: text("emoji").default(""),
  description: text("description"),
});

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  thumbnail: text("thumbnail").notNull(),
  videoUrl: text("video_url"),
  actors: text("actors"),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("5.0"),
  releaseDate: text("release_date"),
  country: text("country"),
  duration: integer("duration").notNull(),
  reward: decimal("reward", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
});

export const taskHistory = pgTable("task_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  videoId: text("video_id").notNull(),
  reward: decimal("reward", { precision: 10, scale: 2 }).notNull(),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: text("referrer_id").notNull(),
  referredId: text("referred_id").notNull(),
  level: integer("level").notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).notNull().default("0"),
});

export const fundPlans = pgTable("fund_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  lockDays: integer("lock_days"),
  dailyRoi: decimal("daily_roi", { precision: 5, scale: 2 }).notNull(),
  minDeposit: decimal("min_deposit", { precision: 12, scale: 2 }).notNull(),
  maxDeposit: decimal("max_deposit", { precision: 12, scale: 2 }),
  returnPrincipal: boolean("return_principal").notNull().default(true),
});

export const investments = pgTable("investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  fundPlanId: text("fund_plan_id").notNull(),
  investedAmount: decimal("invested_amount", { precision: 12, scale: 2 }).notNull(),
  dailyProfit: decimal("daily_profit", { precision: 12, scale: 2 }).notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  status: text("status").notNull().default("active"),
  lastProfitDate: text("last_profit_date"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  phone: true,
  password: true,
  fundPassword: true,
});

export const loginSchema = z.object({
  phone: z.string().min(9, "Telefon raqamini kiriting"),
  password: z.string().min(4, "Parolni kiriting"),
});

export const registerSchema = z.object({
  phone: z.string().min(9, "Telefon raqamini kiriting"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  fundPassword: z.string().length(6, "Pul yechish paroli 6 ta raqamdan iborat bo'lishi kerak").regex(/^\d{6}$/, "Faqat raqamlar kiritilishi kerak"),
  captcha: z.boolean().refine(val => val === true, "Captchani tasdiqlang"),
  ageConfirm: z.boolean().refine(val => val === true, "Shartlarni qabul qiling"),
  referralCode: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type VipPackage = typeof vipPackages.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type TaskHistory = typeof taskHistory.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type FundPlan = typeof fundPlans.$inferSelect;
export type Investment = typeof investments.$inferSelect;
