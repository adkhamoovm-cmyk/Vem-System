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
  vipLevel: integer("vip_level").notNull().default(-1),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  dailyTasksCompleted: integer("daily_tasks_completed").notNull().default(0),
  dailyTasksLimit: integer("daily_tasks_limit").notNull().default(0),
  lastTaskDate: text("last_task_date"),
  numericId: text("numeric_id"),
  avatar: text("avatar"),
  isAdmin: boolean("is_admin").notNull().default(false),
  isBanned: boolean("is_banned").notNull().default(false),
  withdrawalBanned: boolean("withdrawal_banned").notNull().default(false),
  lastLoginIp: text("last_login_ip"),
  lastUserAgent: text("last_user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  bankName: text("bank_name"),
  exchangeName: text("exchange_name"),
  cardNumber: text("card_number"),
  walletAddress: text("wallet_address"),
  holderName: text("holder_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const depositRequests = pgTable("deposit_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull(),
  paymentType: text("payment_type").notNull(),
  receiptUrl: text("receipt_url"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  paymentMethodId: text("payment_method_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 12, scale: 2 }).notNull(),
  netAmount: decimal("net_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const depositSettings = pgTable("deposit_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  bankName: text("bank_name"),
  cardNumber: text("card_number"),
  holderName: text("holder_name"),
  walletAddress: text("wallet_address"),
  exchangeName: text("exchange_name"),
  networkType: text("network_type"),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stajyorRequests = pgTable("stajyor_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  message: text("message"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
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

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
  createdAt: true,
});

export const insertDepositRequestSchema = createInsertSchema(depositRequests).omit({
  id: true,
  status: true,
  createdAt: true,
  reviewedAt: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  status: true,
  createdAt: true,
  reviewedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type InsertDepositRequest = z.infer<typeof insertDepositRequestSchema>;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type User = typeof users.$inferSelect;
export type VipPackage = typeof vipPackages.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type TaskHistory = typeof taskHistory.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type FundPlan = typeof fundPlans.$inferSelect;
export type Investment = typeof investments.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type DepositRequest = typeof depositRequests.$inferSelect;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type DepositSetting = typeof depositSettings.$inferSelect;
export type StajyorRequest = typeof stajyorRequests.$inferSelect;
