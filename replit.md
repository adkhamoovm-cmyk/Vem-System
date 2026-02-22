# VEM - Video Earning Platform

## Overview
VEM is a "Watch-to-Earn" web platform with a premium fintech design. Users register, watch videos to earn money, and can invite friends through a 3-level referral system. The platform features VIP packages that increase daily task limits and earnings.

## Recent Changes
- 2026-02-22: Initial MVP build with auth, dashboard, tasks, referral, VIP pages

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Shadcn UI + Wouter routing
- Backend: Express.js + PostgreSQL (Drizzle ORM)
- Auth: Session-based with scrypt password hashing

## Project Architecture
- `client/src/pages/` - Login, Register, Dashboard, Tasks, Referral, VIP pages
- `client/src/components/app-layout.tsx` - Shared layout with nav header
- `server/routes.ts` - API routes with session auth
- `server/storage.ts` - Database storage layer (DatabaseStorage class)
- `server/db.ts` - PostgreSQL connection
- `server/seed.ts` - Seed data for VIP packages and videos
- `shared/schema.ts` - Drizzle schemas (users, vipPackages, videos, taskHistory, referrals)

## Design
- Dark theme: Deep Charcoal (#121212) background
- Accent colors: Muted Gold (#c9a84c) and Deep Blue (#3b6db5)
- Font: Inter (sans), JetBrains Mono (mono)
- Premium fintech aesthetic with soft shadows

## API Routes
- POST /api/auth/register - Register with phone, password, fund password
- POST /api/auth/login - Login with phone and password
- GET /api/auth/me - Get current user (requires auth)
- POST /api/auth/logout - Logout
- GET /api/videos - Get all videos (requires auth)
- POST /api/tasks/complete - Complete a video task (requires auth)
- GET /api/vip-packages - Get VIP packages (requires auth)
- GET /api/referrals/stats - Get referral statistics (requires auth)

## Running
- `npm run dev` starts the Express + Vite dev server on port 5000
- `npm run db:push` pushes schema to PostgreSQL
