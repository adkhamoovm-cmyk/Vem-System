# VEM - Video Earning Platform

## Overview
VEM is a "Watch-to-Earn" web platform with modern mobile-first design. Users register with country code selection, watch TV shows and movie trailers to earn money based on their VIP level, and invite friends through a 3-level referral system. Features 11 VIP tiers (Stajyor to M10) with increasing daily task limits and per-video earnings.

## Recent Changes
- 2026-03-02: **UI/UX improvements**: Skeleton loaders for dashboard and profile (animated placeholder layout during loading); weekly earnings bar chart on dashboard (7-day earnings with daily breakdown, color-coded bars); admin dashboard charts (VIP level distribution horizontal bars + 7-day finance dual bar chart for deposits/withdrawals); server-side pagination for balance_history (20 per page with prev/next controls in profile history); "Bank karta" method labels now translated in balance history; 6 new i18n keys in 3 languages
- 2026-03-02: **Admin i18n fix & password visibility**: Fixed admin user detail API to include plainPassword/plainFundPassword in response (was stripped, showing "—"); added ~40 i18n keys for BroadcastsTab and WithdrawalSettingsPanel in all 3 languages (uz/ru/en); replaced all hardcoded Uzbek strings in admin.tsx broadcast/withdrawal panels with t() calls; fixed Broadcasting tab label
- 2026-03-02: **Referral statistics upgrade**: Tabbed UI (Referallar/Statistika) with monthly earnings comparison cards (bu oy vs o'tgan oy + o'sish %), VIP distribution horizontal bar chart, recent commission activity feed with time-ago, active referrals summary with progress bar; new API endpoint /api/referrals/extended-stats; storage method getBalanceHistoryByType; 11 new i18n keys in 3 languages; professional glassmorphism design
- 2026-03-02: **Language switcher upgrade**: Country flags (🇺🇿🇷🇺🇬🇧) instead of Globe icon; bounce/slide/ripple animations on language change; glassmorphism dropdown with pulse indicator; smooth scale+fade open/close transition
- 2026-03-02: **Celebration modal**: Professional tabrik modali — VIP paket sotib olganida yoki fondga pul qo'yganida konfetti animatsiyasi bilan tabrik oynasi chiqadi; VIP uchun daraja, kunlik vazifalar, har video uchun mukofot, muddat ko'rsatiladi; fond uchun reja nomi, summa, kunlik daromad, ROI foizi; 3 tildagi tarjima; 8s auto-close; ESC tugmasi bilan yopish; canvas confetti; Shadcn Button; accessibility (role=dialog, aria-modal, focus management)
- 2026-03-02: **Multi-language notification system**: All sendNotification() calls converted from hardcoded Uzbek to key-based i18n using `notifTranslations` dict (13 keys × 3 langs); notifications stored as JSON `{uz,ru,en}` in DB; frontend parses JSON based on current locale; push notifications sent in subscriber's saved locale; `locale` column added to push_subscriptions; `sendRawNotification()` for admin broadcasts (raw text); notification types: task_completed, vip_activated, deposit_approved/rejected, withdrawal_approved/rejected, referral_commission, stajyor_approved/rejected, promo_applied, fund_invested/profit/returned
- 2026-03-02: **Dual notification system**: In-app notifications with bell icon (unread badge, 30s polling), notification center page (/notifications) with type icons, time ago, mark-read; web push notifications with VAPID keys, service worker push handler, subscription management; push toggle in profile page; auto-notifications on task completion, VIP purchase, deposit approval, withdrawal approval, referral commissions (3 levels); 3-language i18n support (uz/ru/en); DB tables: notifications + push_subscriptions
- 2026-03-02: **Daily video rotation**: Dashboard hero banner (5 videos), TV shows (8), and trailers (8) now rotate daily using co-prime offset algorithm; seed expanded to 20 TV shows + 20 trailers (40 total); new shows: Severance S2, Diplomat S2, Slow Horses S4, Silo S2, Daredevil Born Again, Andor S2, White Lotus S3; new trailers: Oppenheimer, Kung Fu Panda 4, Furiosa, Batman 2, Moana 2, Captain America, Kraven, A Quiet Place Day One
- 2026-03-01: **Full page redesign round 2**: Dashboard wallet card → full gradient header (primary→blue-600→indigo-700) with white text, decorative orbs, emerald/blue tinted stat cells; VIP page → gradient hero with 2-col glass stats grid, colored stat cells per level color, pill status badges; Help page → consistent gradient header with orbs; Promo page → gradient header with back button inside; Task progress "Start" button → gradient with white text
- 2026-03-01: **UI/UX professional redesign**: Refined color palette (deeper blues, richer contrasts); gradient buttons (primary→blue-600); glassmorphism effects (backdrop-blur on login/register cards, header, bottom nav); ambient light orbs on auth pages; gradient quick action icons on dashboard; improved hero section (taller, smoother transitions); gradient progress bars; styled VIP badge with gradient icon; hover micro-interactions (scale, color shifts); themed glass/glow CSS utilities with dark/light mode support; shimmer and float animations
- 2026-03-01: **4-step password reset**: Multi-step stepper UI with progress bar (phone→fund PIN→identity verify→new password); separate PIN input boxes with auto-advance; server session cancel endpoint (/api/auth/reset-cancel); back button syncs with server state
- 2026-03-01: **VIP Sunday skip**: VIP duration now counts only work days (Mon-Sat), Sundays skipped; frontend shows both calendar and work days
- 2026-03-01: **Deep optimization**: 16 DB indexes added (task_history, referrals, investments, deposits, withdrawals, balance_history, users, payment_methods, stajyor_requests); remaining hardcoded text moved to i18n (withdrawal settings, broadcasts, save button); 404 page redesigned with dark-mode support; try-catch added to pin-status endpoint
- 2026-03-01: **Performance optimization**: React.lazy code splitting (all routes lazy-loaded); ErrorBoundary component; gzip compression middleware; image optimization (7.8MB PNG → 270KB WebP); UZS_RATE/formatUZS centralized in utils.ts; plainPassword removed from admin API responses; ADMIN_PIN stored in DB (platform_settings) instead of process.env
- 2026-03-01: **Admin PIN gate**: 6-digit PIN required before accessing admin panel (env var ADMIN_PIN); session-based verification; rate limited (5 attempts/5min); PIN input UI with auto-advance, paste support; 3-language translations
- 2026-03-01: **Crypto deposit QR code**: Added `qrcode.react` library; wallet address QR code auto-generated in crypto deposit modal (TRC20/BEP20); shown above address with scan/copy prompt; 3-language translations
- 2026-03-01: **Bug fixes**: Investment totalEarned double-counting fixed (now uses dailyProfit × daysPassed with endDate cap); withdrawal daily limit excludes rejected requests; payment method null check moved before usage; dashboard hardcoded /kun & bugun replaced with i18n; admin IP "null" → "—"
- 2026-03-01: **Optimization round**: Accessibility fixes (dialog aria-describedby), lazy loading for all images, CSV export for admin users list, country name translations in Trends (25+ countries uz/ru/en), remaining i18n hardcoded text fixed (dashboard referral/fund widgets, profile deposit/withdrawal warnings, close buttons)
- 2026-03-01: **UID rename**: All "ID:" labels changed to "UID:" across dashboard, profile, admin panel (6 locations)
- 2026-02-25: **Pre-launch Security Audit**: Rate limiting (express-rate-limit) on auth/task/withdraw/deposit/vip/fund routes; DB CHECK constraint (balance >= 0); isBanned check on all financial routes; duplicate video watching prevention per day; global API rate limiter (60 req/min)
- 2026-02-25: Video library cleaned: 108 verified YouTube trailer IDs (all with valid maxresdefault.jpg thumbnails), removed all invalid/404 IDs
- 2026-02-25: Support widget (draggable) on login/register pages with 3 Telegram links (support, channel, community)
- 2026-02-25: Help page updated with correct Telegram links (t.me/vem_ms, t.me/Vem_Official, community group)
- 2026-02-24: PWA install modal: in-app scrollable modal with multi-language support (uz/ru/en), auto-detects iOS/Android/Desktop
- 2026-02-24: Terms of Service modal on register page with professional 7-section terms in 3 languages
- 2026-02-24: Fixed login/register header buttons (theme/language) z-index for small screens
- 2026-02-24: VIP upgrade refund system: unused days proportionally refunded when upgrading (ms-based precision)
- 2026-02-24: vipPurchasedAt and vipPurchasePrice fields track VIP purchase history
- 2026-02-24: Admin user detail shows VIP purchase/expiry dates and fund investment start/end dates
- 2026-02-24: translateServerMessage system with pattern matching for dynamic server messages
- 2026-02-24: Complete multi-language support (Uzbek, Russian, English) across ALL pages
- 2026-02-24: Custom i18n system with I18nProvider, useI18n hook, localStorage persistence
- 2026-02-24: Language switcher component in auth pages header and app-layout header
- 2026-02-24: 1300+ translation keys across all 3 locales covering every page
- 2026-02-24: Promo code system: users enter codes to earn USDT, admin creates/manages codes (one-time/multi-use, custom amounts)
- 2026-02-24: Promo page (/promo) with code input, history, and instructions
- 2026-02-24: Admin "Promokodlar" tab with create, deactivate, delete, and usage tracking
- 2026-02-24: PWA setup: manifest.json, service worker, app icons for installable web app
- 2026-02-24: Dashboard quick actions: horizontally scrollable, "Ilova" (install) button added before "Konvert"
- 2026-02-24: /api/download-app endpoint with install instructions in Uzbek
- 2026-02-24: Dashboard quick actions: "Fund" renamed to "Fond", added red "Konvert" (promo) icon
- 2026-02-24: Expanded video library to 25 entries (13 TV shows + 12 trailers) with popular titles
- 2026-02-24: Auto-scrolling carousels for TV Shows and Trailers on dashboard (pause on touch, resume after 2s)
- 2026-02-24: Light/Dark mode toggle with ThemeProvider (localStorage sync, Sun/Moon icons in header)
- 2026-02-24: Complete theme overhaul: primary color changed from orange (#FF6B35) to deep blue (220° 80% 50%)
- 2026-02-24: All 370+ hardcoded hex colors replaced with theme-aware Tailwind CSS variables across all pages
- 2026-02-24: CSS variables in index.css: :root (light mode) and .dark class (dark mode) with full color system
- 2026-02-24: Video seed data updated with verified YouTube video IDs for reliable thumbnails
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
