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
  vipLevel: integer("vip_level").notNull().default(0),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  dailyTasksCompleted: integer("daily_tasks_completed").notNull().default(0),
  dailyTasksLimit: integer("daily_tasks_limit").notNull().default(3),
  lastTaskDate: text("last_task_date"),
});

export const vipPackages = pgTable("vip_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  dailyTasks: integer("daily_tasks").notNull(),
  dailyEarning: decimal("daily_earning", { precision: 10, scale: 2 }).notNull(),
  level: integer("level").notNull(),
  description: text("description"),
});

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  thumbnail: text("thumbnail").notNull(),
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
  fundPassword: z.string().min(4, "Moliyaviy parolni kiriting"),
  captcha: z.boolean().refine(val => val === true, "Captchani tasdiqlang"),
  referralCode: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type VipPackage = typeof vipPackages.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type TaskHistory = typeof taskHistory.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
