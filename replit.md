# VEM - Video Earning Platform

## Overview
VEM is a "Watch-to-Earn" web platform with modern mobile-first design. Users register with country code selection, watch TV shows and movie trailers to earn money based on their VIP level, and invite friends through a 3-level referral system. Features 11 VIP tiers (Stajyor to M10) with increasing daily task limits and per-video earnings.

## Recent Changes
- 2026-02-23: Dashboard hero banner auto-rotating carousel (5s interval, fade transitions, dot indicators)
- 2026-02-23: Dashboard shows user ID instead of phone number
- 2026-02-23: Help page (/help) with manager contacts, Telegram groups, FAQ - accessible via bottom nav "Yordam" tab
- 2026-02-23: Password change (login + fund password) in profile with expandable sections, backend API /api/profile/change-password and /api/profile/change-fund-password
- 2026-02-23: Bottom nav updated: Referal replaced with Yordam (Help)
- 2026-02-23: VIP expiration system with vipExpiresAt field, same-level extension adds days to existing expiry
- 2026-02-23: Balance history table (balanceHistory) for comprehensive financial tracking - earnings, deposits, withdrawals, VIP purchases, fund investments, commissions, admin adjustments
- 2026-02-23: Financial History (Moliya tarixi) UI on profile with filter buttons (all, earning, deposit, withdrawal, VIP, fund, commission, admin)
- 2026-02-23: Stajyor one-time activation with stajyorUsed flag, admin approval sets 3-day expiry
- 2026-02-23: VIP purchase rules: no downgrade, same-level repurchase extends expiry, auto-sets duration
- 2026-02-23: 3-level referral commission logging to balance history
- 2026-02-23: Admin panel tabs split into "Texnik bo'lim" and "Moliya departament" sections
- 2026-02-23: Payment methods section renamed to "Mening xizmatlarim"
- 2026-02-23: Uzbek bank dropdown list (24 banks) for bank card creation
- 2026-02-23: Fund cron daily profit and principal return logged to balance history
- 2026-02-23: Full admin panel (/admin) with user management, deposit/withdrawal approval, deposit requisites, multi-account detection, top referrers, referral tree, VIP management
- 2026-02-23: Admin features: ban/unban users, withdrawal ban, balance editing, VIP level change, payment method deletion, user account deletion
- 2026-02-23: IP/UserAgent tracking on login/register, banned user login prevention
- 2026-02-23: deposit_settings table for admin-configurable deposit requisites
- 2026-02-23: Profile page with deposit (crypto USDT / local UZS, receipt upload) and withdrawal (bank card/USDT wallet, fund password, $2 min, 10% commission, Mon-Sat 11:00-17:00)
- 2026-02-23: Payment methods: bank card (name, bank, card number) and USDT wallet (TRC20 address, exchange name), immutable after creation
- 2026-02-23: DB tables: payment_methods, deposit_requests, withdrawal_requests with insert schemas
- 2026-02-23: Tasks page rewritten: hardcoded YouTube video IDs array, native iframe with anti-cheat params (controls=0, disablekb=1), 30s timer, auto-thumbnail from YouTube
- 2026-02-23: Video system upgraded to react-player with real YouTube trailers matching TMDB posters, light prop for poster preview
- 2026-02-23: VEM Fund module - passive investment/staking with 4 F-Series plans, daily ROI, cron profit distribution
- 2026-02-23: Complete VIP system overhaul with 11 tiers ($0-$55,000), reward based on VIP level
- 2026-02-23: Redesigned dashboard, VIP page, tasks page with professional video player
- 2026-02-23: Trends page with TV show/trailer filters and preview modal
- 2026-02-24: Expanded video library to 25 entries (13 TV shows + 12 trailers) with popular titles
- 2026-02-24: Auto-scrolling carousels for TV Shows and Trailers on dashboard (pause on touch, resume after 2s)
- 2026-02-24: Redesigned slider captcha on register page with gradient fill, animated arrows, glowing effects
- 2026-02-23: Login page with country codes and "Remember me" functionality
- 2026-02-23: Register page with 6-digit PIN fund password, 18+ agreement, slider captcha
- 2026-02-22: Initial MVP build

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Shadcn UI + Wouter routing
- Backend: Express.js + PostgreSQL (Drizzle ORM)
- Auth: Session-based with scrypt password hashing

## Project Architecture
- `client/src/pages/` - Login, Register, Dashboard, Tasks, Trends, Referral, VIP, Profile, Fund, Admin pages
- `client/src/components/app-layout.tsx` - Shared layout with TikTok-style bottom nav (5 tabs, raised center Vazifalar button)
- `server/routes.ts` - API routes with session auth
- `server/storage.ts` - Database storage layer (DatabaseStorage class)
- `server/seed.ts` - Seed data for 11 VIP packages, 9 TV shows/trailers (real YouTube URLs), 4 fund plans
- `shared/schema.ts` - Drizzle schemas (users, vipPackages, videos, taskHistory, referrals, fundPlans, investments, paymentMethods, depositRequests, withdrawalRequests, depositSettings)

## Design
- Dark Netflix-style theme: #0a0a0a background, #1a1a1a cards, #2a2a2a borders
- Accent: Warm orange gradient (#FF6B35 to #E8453C)
- TikTok-style bottom nav with raised center button (dark translucent)
- Netflix-style hero poster banner on dashboard with movie posters
- USDT/UZS dual currency display (1 USDT = 12,100 UZS)
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
- GET /api/payment-methods - Get user payment methods (requires auth)
- POST /api/payment-methods - Add payment method with fund password (requires auth)
- POST /api/deposit - Create deposit request with receipt upload (requires auth)
- GET /api/deposits - Get user deposit requests (requires auth)
- POST /api/withdraw - Create withdrawal request (requires auth)
- GET /api/withdrawals - Get user withdrawal requests (requires auth)

## VEM Fund System
- 4 plans: F1 (13d, 2.3%), F2 (27d, 2.6%), F3 (45d, 3.0%), F4 (Infinity, 4.0%)
- Investment deducted from main balance
- Daily profit = investedAmount * (dailyRoi / 100), added to balance via cron
- On maturity: status → completed, returnPrincipal=true → principal returned to balance
- F4 is infinite with no principal return

## Running
- `npm run dev` starts the Express + Vite dev server on port 5000
- `npm run db:push` pushes schema to PostgreSQL
