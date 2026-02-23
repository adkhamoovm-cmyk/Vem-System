# VEM - Video Earning Platform

## Overview
VEM is a "Watch-to-Earn" web platform with modern mobile-first design. Users register with country code selection, watch TV shows and movie trailers to earn money based on their VIP level, and invite friends through a 3-level referral system. Features 11 VIP tiers (Stajyor to M10) with increasing daily task limits and per-video earnings.

## Recent Changes
- 2026-02-23: Tasks page rewritten: hardcoded YouTube video IDs array, native iframe with anti-cheat params (controls=0, disablekb=1), 30s timer, auto-thumbnail from YouTube
- 2026-02-23: Video system upgraded to react-player with real YouTube trailers matching TMDB posters, light prop for poster preview
- 2026-02-23: VEM Fund module - passive investment/staking with 4 F-Series plans, daily ROI, cron profit distribution
- 2026-02-23: Complete VIP system overhaul with 11 tiers ($0-$55,000), reward based on VIP level
- 2026-02-23: Redesigned dashboard, VIP page, tasks page with professional video player
- 2026-02-23: Trends page with TV show/trailer filters and preview modal
- 2026-02-23: Login page with country codes and "Remember me" functionality
- 2026-02-23: Register page with 6-digit PIN fund password, 18+ agreement, slider captcha
- 2026-02-22: Initial MVP build

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Shadcn UI + Wouter routing
- Backend: Express.js + PostgreSQL (Drizzle ORM)
- Auth: Session-based with scrypt password hashing

## Project Architecture
- `client/src/pages/` - Login, Register, Dashboard, Tasks, Trends, Referral, VIP, Profile, Fund pages
- `client/src/components/app-layout.tsx` - Shared layout with TikTok-style bottom nav (5 tabs, raised center Vazifalar button)
- `server/routes.ts` - API routes with session auth
- `server/storage.ts` - Database storage layer (DatabaseStorage class)
- `server/seed.ts` - Seed data for 11 VIP packages, 9 TV shows/trailers (real YouTube URLs), 4 fund plans
- `shared/schema.ts` - Drizzle schemas (users, vipPackages, videos, taskHistory, referrals, fundPlans, investments)

## Design
- Dark Netflix-style theme: #0a0a0a background, #1a1a1a cards, #2a2a2a borders
- Accent: Warm orange gradient (#FF6B35 to #E8453C)
- TikTok-style bottom nav with raised center button (dark translucent)
- Netflix-style hero poster banner on dashboard with movie posters
- USDT/UZS dual currency display (1 USDT = 12,850 UZS)
- Mobile-first responsive design
- Font: Inter (sans)

## VIP System
- 11 tiers: Stajyor (free, 3 days), M1-M10 (60 days each)
- Task reward determined by VIP level's perVideoReward, NOT by video
- M4-M10 are locked by default
- Stajyor can't withdraw, must upgrade to M1
- Prices in USD, 10% commission on earnings

## API Routes
- POST /api/auth/register - Register with phone, password, fund password (6-digit PIN)
- POST /api/auth/login - Login with phone and password
- GET /api/auth/me - Get current user (requires auth)
- POST /api/auth/logout - Logout
- GET /api/videos - Get all videos (requires auth)
- POST /api/tasks/complete - Complete a video task, reward based on VIP level (requires auth)
- GET /api/vip-packages - Get VIP packages (requires auth)
- POST /api/vip/purchase - Purchase a VIP package (requires auth)
- GET /api/referrals/stats - Get referral statistics (requires auth)
- POST /api/profile/avatar - Upload avatar (requires auth)
- GET /api/fund-plans - Get all fund plans (requires auth)
- GET /api/investments - Get user's investments (requires auth)
- POST /api/fund/invest - Create investment (requires auth)

## VEM Fund System
- 4 plans: F1 (13d, 2.3%), F2 (27d, 2.6%), F3 (45d, 3.0%), F4 (Infinity, 4.0%)
- Investment deducted from main balance
- Daily profit = investedAmount * (dailyRoi / 100), added to balance via cron
- On maturity: status → completed, returnPrincipal=true → principal returned to balance
- F4 is infinite with no principal return

## Running
- `npm run dev` starts the Express + Vite dev server on port 5000
- `npm run db:push` pushes schema to PostgreSQL
