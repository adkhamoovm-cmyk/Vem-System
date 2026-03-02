import type { Express } from "express";
import { type Server } from "http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import path from "path";
import express from "express";
import { randomBytes } from "crypto";

import { apiRateLimiter } from "./lib/helpers";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/user";
import financialRoutes from "./routes/financial";
import adminRoutes, { setupDailyProfits } from "./routes/admin";
import systemRoutes from "./routes/system";

const isProduction = process.env.NODE_ENV === "production";

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }
  const generated = randomBytes(32).toString("hex");
  console.warn("[security] SESSION_SECRET not set — using randomly generated secret. Sessions will not persist across restarts.");
  return generated;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const PgStore = connectPgSimple(session);

  if (isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(
    session({
      store: new PgStore({
        pool: pool as any,
        tableName: "user_sessions",
        createTableIfMissing: true,
      }),
      secret: getSessionSecret(),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use("/api/", apiRateLimiter);

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use(authRoutes);
  app.use(userRoutes);
  app.use(financialRoutes);
  app.use(adminRoutes);
  app.use(systemRoutes);

  setupDailyProfits();

  return httpServer;
}
