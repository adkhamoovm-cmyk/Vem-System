import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, PlayCircle, Users, Crown, Star, DollarSign, Zap, Film, Tv, ChevronRight, Play, ArrowRightLeft, HelpCircle, GraduationCap, Gem, Flame, Trophy, Rocket, Globe, Mail, Download, X, Share, MoreVertical, PlusSquare, Coffee, AlertTriangle, CalendarDays, CheckCheck, ArrowUpRight, ArrowDownRight, Sprout, RefreshCw, Clock } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import type { User, Video, VipPackage, Investment, BalanceHistory } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";

const UZS_RATE = 12100;


const VipIcon = ({ level, className }: { level: number; className?: string }) => {
  const iconMap: Record<number, any> = {
    0: GraduationCap, 1: Star, 2: Star, 3: Star, 4: Flame,
    5: Gem, 6: Crown, 7: Trophy, 8: Rocket, 9: Zap, 10: Globe,
  };
  const Icon = iconMap[level] || Star;
  return <Icon className={className} />;
};

function AutoScrollCarousel({ children, speed = 0.5 }: { children: React.ReactNode; speed?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const isUserInteracting = useRef(false);
  const resumeTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const animate = () => {
      if (!isUserInteracting.current && el) {
        el.scrollLeft += speed;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0;
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [speed]);

  const handleInteractionStart = () => {
    isUserInteracting.current = true;
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
  };

  const handleInteractionEnd = () => {
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 2000);
  };

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
    >
      {children}
    </div>
  );
}

function formatUZS(usd: number): string {
  const uzs = usd * UZS_RATE;
  return uzs.toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
}

export default function DashboardPage() {
  const { t, locale } = useI18n();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: videos } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: vipPackages } = useQuery<VipPackage[]>({
    queryKey: ["/api/vip-packages"],
  });

  const { data: balanceHistory } = useQuery<BalanceHistory[]>({
    queryKey: ["/api/balance-history"],
  });

  const { data: referralStats } = useQuery<{ level1: { count: number; commission: string }; level2: { count: number; commission: string }; level3: { count: number; commission: string } }>({
    queryKey: ["/api/referrals/stats"],
  });

  const { data: investments } = useQuery<Investment[]>({
    queryKey: ["/api/investments"],
  });

  const [showInstallModal, setShowInstallModal] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  if (!user) return null;

  const tasksProgress = user.dailyTasksLimit > 0
    ? (user.dailyTasksCompleted / user.dailyTasksLimit) * 100
    : 0;

  const currentPkg = vipPackages?.find(p => p.level === user.vipLevel);
  const perVideo = currentPkg ? Number(currentPkg.perVideoReward) : 0;
  const dailyPotential = currentPkg ? Number(currentPkg.dailyEarning) : 0;
  const balance = Number(user.balance);

  // VIP expiry
  const vipDaysLeft = user.vipExpiresAt
    ? Math.ceil((new Date(user.vipExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Today's earnings
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEarned = (balanceHistory || [])
    .filter(h => h.type === "earning" && h.createdAt?.toString().slice(0, 10) === todayStr)
    .reduce((sum, h) => sum + Number(h.amount), 0);

  // Referral totals
  const totalReferrals = referralStats
    ? (referralStats.level1.count + referralStats.level2.count + referralStats.level3.count)
    : 0;
  const totalReferralBonus = referralStats
    ? (Number(referralStats.level1.commission) + Number(referralStats.level2.commission) + Number(referralStats.level3.commission))
    : 0;

  // Recent transactions (last 4)
  const recentTx = (balanceHistory || []).slice(0, 4);

  // Fund investments
  const activeInvestments = (investments || []);
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + Number((inv as any).investedAmount || 0), 0);
  const totalEarnedFromFund = activeInvestments.reduce((sum, inv) => sum + Number((inv as any).totalEarned || 0), 0);
  const totalDailyProfit = activeInvestments.reduce((sum, inv) => sum + Number((inv as any).dailyProfit || 0), 0);

  const tvShows = videos?.filter(v => v.category === "Tele-shou") || [];
  const trailers = videos?.filter(v => v.category === "Treyler") || [];
  const allVideos = videos || [];

  const [heroIndex, setHeroIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (allVideos.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setHeroIndex((prev) => (prev + 1) % allVideos.length);
      setIsTransitioning(false);
    }, 500);
  }, [allVideos.length]);

  useEffect(() => {
    if (allVideos.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [allVideos.length, nextSlide]);

  const heroVideo = allVideos[heroIndex];

  const quickActions = [
    { title: t("dashboard.quickTasks"), href: "/tasks", icon: PlayCircle, color: "#3B82F6", bg: "#3B82F6" },
    { title: t("dashboard.quickFund"), href: "/fund", icon: Wallet, color: "#6B7280", bg: "#6B7280" },
    { title: t("dashboard.quickInvite"), href: "/referral", icon: Users, color: "#4ADE80", bg: "#4ADE80" },
    { title: t("dashboard.quickVip"), href: "/vip", icon: Crown, color: "#A855F7", bg: "#A855F7" },
    { title: t("dashboard.quickHelp"), href: "/help", icon: HelpCircle, color: "#3B82F6", bg: "#3B82F6" },
    { title: t("dashboard.quickApp"), href: "#install-app", icon: Download, color: "#10B981", bg: "#10B981" },
    { title: t("dashboard.quickPromo"), href: "/promo", icon: Mail, color: "#EF4444", bg: "#EF4444" },
  ];

  return (
    <>
    <div className="bg-background min-h-screen -mt-0">
        {heroVideo && (
          <div className="relative w-full h-[280px] overflow-hidden">
            <img
              src={heroVideo.thumbnail}
              alt={heroVideo.title}
              className={`w-full h-full object-cover transition-all duration-500 ${isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"}`}
              data-testid="hero-poster"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent" />
            <div className={`absolute bottom-6 left-4 right-4 z-10 transition-all duration-500 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded">{heroVideo.category}</span>
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  <span className="text-white/90 text-xs">{heroVideo.rating}</span>
                </div>
              </div>
              <h2 className="text-white font-bold text-xl leading-tight mb-2">{heroVideo.title}</h2>
              <p className="text-white/60 text-xs mb-3">{heroVideo.actors}</p>
              <div className="flex gap-2">
                <Link href="/tasks">
                  <button className="flex items-center gap-1.5 bg-white text-black font-bold text-xs px-5 py-2.5 rounded-md cursor-pointer" data-testid="button-hero-play">
                    <Play className="w-4 h-4 fill-black" />
                    {t("dashboard.watch")}
                  </button>
                </Link>
                <Link href="/trends">
                  <button className="flex items-center gap-1.5 bg-white/20 text-white font-medium text-xs px-4 py-2.5 rounded-md backdrop-blur-sm cursor-pointer" data-testid="button-hero-info">
                    {t("dashboard.details")}
                  </button>
                </Link>
              </div>
            </div>
            {allVideos.length > 1 && (
              <div className="absolute bottom-2 right-4 z-10 flex gap-1">
                {allVideos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setIsTransitioning(true); setTimeout(() => { setHeroIndex(i); setIsTransitioning(false); }, 300); }}
                    className={`h-1 rounded-full transition-all duration-300 ${i === heroIndex ? "w-5 bg-primary" : "w-1.5 bg-foreground/30"}`}
                    data-testid={`hero-dot-${i}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-4 -mt-1 space-y-5 pb-6">

          {/* 1. VIP Expiry Warning */}
          {vipDaysLeft !== null && user.vipLevel > 0 && vipDaysLeft <= 15 && (
            <div className={`rounded-2xl p-3.5 border flex items-center gap-3 ${
              vipDaysLeft <= 0
                ? "bg-red-500/10 border-red-500/30"
                : vipDaysLeft <= 5
                ? "bg-red-500/10 border-red-500/30"
                : "bg-amber-500/10 border-amber-500/30"
            }`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                vipDaysLeft <= 5 ? "bg-red-500/20" : "bg-amber-500/20"
              }`}>
                <AlertTriangle className={`w-5 h-5 ${vipDaysLeft <= 5 ? "text-red-500" : "text-amber-500"}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold ${vipDaysLeft <= 5 ? "text-red-500" : "text-amber-500"}`}>
                  {vipDaysLeft <= 0 ? t("dashboard.vipExpired") : t("dashboard.vipExpiresSoon")}
                </p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {vipDaysLeft > 0
                    ? t("dashboard.vipExpiresIn", { days: String(vipDaysLeft) })
                    : getVipName(user.vipLevel, locale)}
                </p>
              </div>
              <Link href="/vip">
                <button className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
                  vipDaysLeft <= 5
                    ? "bg-red-500 text-white"
                    : "bg-amber-500 text-white"
                }`} data-testid="button-renew-vip">
                  {t("dashboard.renewVip")}
                </button>
              </Link>
            </div>
          )}

          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <span className="text-muted-foreground text-[9px] uppercase tracking-wider flex items-center gap-1">
                    {user.vipLevel >= 0 && <VipIcon level={user.vipLevel} className="w-3 h-3 text-primary" />}
                    {user.vipLevel < 0 ? t("common.notEmployee") : getVipName(user.vipLevel, locale)}
                  </span>
                  <p className="text-foreground text-xs font-medium">UID: {user.numericId || "—"}</p>
                </div>
              </div>
              <Link href="/vip">
                <span className="bg-primary/20 text-primary text-[10px] px-3 py-1 rounded-full font-semibold cursor-pointer" data-testid="link-upgrade-vip">
                  {t("dashboard.upgrade")}
                </span>
              </Link>
            </div>

            <div className="bg-card rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" />
                  {t("dashboard.exchange")}
                </span>
                <span className="text-muted-foreground text-[9px]">{t("dashboard.rate", { rate: UZS_RATE.toLocaleString() })}</span>
              </div>
              <div className="flex items-end justify-between" data-testid="text-balance">
                <div>
                  <p className="text-foreground font-bold text-2xl tracking-tight">{balance.toFixed(2)} <span className="text-emerald-500 dark:text-emerald-400 text-sm font-semibold">USDT</span></p>
                  <p className="text-muted-foreground text-sm mt-0.5">{formatUZS(balance)} <span className="text-xs">UZS</span></p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400 text-xs justify-end">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{dailyPotential.toFixed(2)}/kun</span>
                  </div>
                  {todayEarned > 0 && (
                    <div className="flex items-center gap-1 bg-emerald-500/10 rounded-full px-2 py-0.5 justify-end">
                      <CheckCheck className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500 dark:text-emerald-400 text-[10px] font-semibold">+{todayEarned.toFixed(2)} bugun</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-card rounded-xl p-3">
                <span className="text-muted-foreground text-[9px] uppercase tracking-wider">{t("dashboard.earnings")}</span>
                <p className="text-foreground font-bold text-sm mt-1" data-testid="text-total-earnings">{Number(user.totalEarnings).toFixed(2)} USDT</p>
                <p className="text-muted-foreground text-[10px]">{formatUZS(Number(user.totalEarnings))} UZS</p>
              </div>
              <div className="bg-card rounded-xl p-3">
                <span className="text-muted-foreground text-[9px] uppercase tracking-wider">{t("common.deposit")}</span>
                <p className="text-foreground font-bold text-sm mt-1" data-testid="text-total-deposit">{Number(user.totalDeposit).toFixed(2)} USDT</p>
                <p className="text-muted-foreground text-[10px]">{formatUZS(Number(user.totalDeposit))} UZS</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-2xl p-4 border border-border">
            {new Date().getDay() === 0 ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Coffee className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-semibold">{t("tasks.sunday")}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{t("tasks.sundayNote")}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-foreground text-sm font-semibold">{t("dashboard.todayTasks")}</span>
                  </div>
                  <span className="text-primary text-sm font-bold" data-testid="text-tasks-progress">
                    {user.dailyTasksCompleted} / {user.dailyTasksLimit}
                  </span>
                </div>
                <Progress
                  value={tasksProgress}
                  className="h-2 bg-muted rounded-full"
                  data-testid="progress-tasks"
                />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-muted-foreground text-xs">
                    {user.vipLevel < 0
                      ? t("common.notEmployee")
                      : user.dailyTasksCompleted < user.dailyTasksLimit
                        ? t("dashboard.videosLeft", { count: user.dailyTasksLimit - user.dailyTasksCompleted })
                        : t("dashboard.limitReached")}
                  </p>
                  <Link href="/tasks">
                    <span className="text-primary text-xs font-semibold flex items-center gap-0.5 cursor-pointer" data-testid="link-start-tasks">
                      {t("dashboard.start")} <ChevronRight className="w-3 h-3" />
                    </span>
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            {quickActions.map((item) => (
              item.href === "#install-app" ? (
                <button key={item.href} onClick={() => {
                  if (window.deferredPrompt) {
                    window.deferredPrompt.prompt();
                    window.deferredPrompt.userChoice.then(() => { window.deferredPrompt = null; });
                  } else {
                    setShowInstallModal(true);
                  }
                }} className="flex flex-col items-center gap-1.5 shrink-0" data-testid={`quick-${item.title.toLowerCase()}`}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: item.bg + "20" }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="text-muted-foreground text-[10px] font-medium text-center leading-tight">{item.title}</span>
                </button>
              ) : (
                <Link key={item.href} href={item.href}>
                  <div className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0" data-testid={`quick-${item.title.toLowerCase()}`}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: item.bg + "20" }}>
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <span className="text-muted-foreground text-[10px] font-medium text-center leading-tight">{item.title}</span>
                  </div>
                </Link>
              )
            ))}
          </div>

          {tvShows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-foreground font-bold text-sm flex items-center gap-2">
                  <Tv className="w-4 h-4 text-primary" />
                  {t("dashboard.tvShows")}
                </h3>
                <Link href="/trends" className="text-muted-foreground text-xs">
                  {t("dashboard.viewAll")} <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
              <AutoScrollCarousel speed={0.4}>
                {tvShows.map((video) => (
                  <Link key={video.id} href="/tasks">
                    <div className="relative w-32 shrink-0 cursor-pointer group" data-testid={`tv-show-${video.id}`}>
                      <div className="w-32 h-48 rounded-lg overflow-hidden bg-card shadow-lg">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-lg" />
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                          TOP
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h4 className="text-white font-bold text-[11px] leading-tight line-clamp-2">{video.title}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                          <span className="text-white/70 text-[9px]">{video.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </AutoScrollCarousel>
            </div>
          )}

          {trailers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-foreground font-bold text-sm flex items-center gap-2">
                  <Film className="w-4 h-4 text-primary" />
                  {t("dashboard.trailers")}
                </h3>
                <Link href="/trends" className="text-muted-foreground text-xs">
                  {t("dashboard.viewAll")} <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
              <AutoScrollCarousel speed={0.3}>
                {trailers.map((video) => (
                  <Link key={video.id} href="/tasks">
                    <div className="relative w-56 shrink-0 cursor-pointer group" data-testid={`trailer-${video.id}`}>
                      <div className="w-56 h-32 rounded-lg overflow-hidden bg-card shadow-lg">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-lg" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <div className="bg-black/60 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h4 className="text-white font-bold text-xs leading-tight">{video.title}</h4>
                        <p className="text-white/50 text-[9px] mt-0.5">{video.actors?.split(",")[0]}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </AutoScrollCarousel>
            </div>
          )}

          {currentPkg && (
            <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-foreground/80 text-xs font-bold">{t("dashboard.vipFeatures")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-primary font-bold text-sm">{currentPkg.dailyTasks}</p>
                  <p className="text-muted-foreground text-[9px]">{t("common.dailyVideo")}</p>
                </div>
                <div className="text-center">
                  <p className="text-primary font-bold text-sm">${Number(currentPkg.perVideoReward).toFixed(2)}</p>
                  <p className="text-muted-foreground text-[9px]">{t("common.perVideo")}</p>
                </div>
                <div className="text-center">
                  <p className="text-primary font-bold text-sm">${Number(currentPkg.dailyEarning).toFixed(2)}</p>
                  <p className="text-muted-foreground text-[9px]">{t("common.dailyEarning")}</p>
                </div>
              </div>
            </div>
          )}

          {/* 3. Referral Mini-Widget */}
          <Link href="/referral">
            <div className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:border-primary/40 transition-colors" data-testid="referral-mini-widget">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-500/15 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-foreground font-bold text-sm">{t("dashboard.referralMini")}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-500/8 rounded-xl p-2.5 text-center border border-emerald-500/15">
                  <p className="text-foreground font-bold text-base">{referralStats?.level1.count || 0}</p>
                  <p className="text-muted-foreground text-[9px] mt-0.5">{t("dashboard.level1")}</p>
                </div>
                <div className="bg-blue-500/8 rounded-xl p-2.5 text-center border border-blue-500/15">
                  <p className="text-foreground font-bold text-base">{referralStats?.level2.count || 0}</p>
                  <p className="text-muted-foreground text-[9px] mt-0.5">{t("dashboard.level2")}</p>
                </div>
                <div className="bg-purple-500/8 rounded-xl p-2.5 text-center border border-purple-500/15">
                  <p className="text-foreground font-bold text-base">{referralStats?.level3.count || 0}</p>
                  <p className="text-muted-foreground text-[9px] mt-0.5">{t("dashboard.level3")}</p>
                </div>
              </div>
              {totalReferralBonus > 0 && (
                <div className="mt-3 flex items-center justify-between bg-emerald-500/8 rounded-xl px-3 py-2 border border-emerald-500/15">
                  <span className="text-muted-foreground text-xs">{t("dashboard.referralBonus")}</span>
                  <span className="text-emerald-500 font-bold text-sm">+{totalReferralBonus.toFixed(2)} USDT</span>
                </div>
              )}
              {totalReferrals === 0 && (
                <p className="text-muted-foreground text-xs text-center mt-2">{t("dashboard.noReferrals")}</p>
              )}
            </div>
          </Link>

          {/* 4. VEM Fund Widget */}
          {activeInvestments.length > 0 && (
            <Link href="/fund">
              <div className="bg-card rounded-2xl p-4 border border-border cursor-pointer hover:border-primary/40 transition-colors" data-testid="fund-mini-widget">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-500/15 rounded-lg flex items-center justify-center">
                      <Sprout className="w-4 h-4 text-violet-500" />
                    </div>
                    <span className="text-foreground font-bold text-sm">{t("dashboard.fundWidget")}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="bg-violet-500/8 rounded-xl p-2.5 border border-violet-500/15">
                    <p className="text-muted-foreground text-[9px] mb-1">{t("dashboard.fundTotalInvested")}</p>
                    <p className="text-foreground font-bold text-sm">${totalInvested.toFixed(2)}</p>
                  </div>
                  <div className="bg-emerald-500/8 rounded-xl p-2.5 border border-emerald-500/15">
                    <p className="text-muted-foreground text-[9px] mb-1">{t("dashboard.fundTotalEarned")}</p>
                    <p className="text-emerald-500 font-bold text-sm">+${totalEarnedFromFund.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-500/8 rounded-xl p-2.5 border border-blue-500/15">
                    <p className="text-muted-foreground text-[9px] mb-1">{t("dashboard.fundDaily")}</p>
                    <p className="text-blue-500 font-bold text-sm">+${totalDailyProfit.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeInvestments.map((inv) => (
                    <span key={(inv as any).id} className="text-[10px] bg-violet-500/10 text-violet-500 px-2 py-0.5 rounded-full font-semibold border border-violet-500/20">
                      {(inv as any).planName} · ${Number((inv as any).investedAmount).toFixed(0)}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          )}

          {/* 5. Recent Transactions */}
          <div className="bg-card rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/15 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-foreground font-bold text-sm">{t("dashboard.recentActivity")}</span>
              </div>
              <Link href="/profile?tab=history">
                <span className="text-muted-foreground text-xs flex items-center gap-0.5">
                  {t("dashboard.viewAll")} <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            {recentTx.length === 0 ? (
              <p className="text-muted-foreground text-xs text-center py-4">{t("dashboard.noActivity")}</p>
            ) : (
              <div className="space-y-2">
                {recentTx.map((tx) => {
                  const isPositive = Number(tx.amount) >= 0;
                  const typeLabels: Record<string, string> = {
                    earning: t("dashboard.txEarning"),
                    deposit: t("dashboard.txDeposit"),
                    withdrawal: t("dashboard.txWithdrawal"),
                    vip_purchase: t("dashboard.txVipPurchase"),
                    fund_invest: t("dashboard.txFundInvest"),
                    fund_profit: t("dashboard.txFundProfit"),
                    commission: t("dashboard.txCommission"),
                  };
                  const typeColors: Record<string, string> = {
                    earning: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    deposit: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                    withdrawal: "bg-red-500/10 text-red-500",
                    vip_purchase: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                    fund_invest: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    fund_profit: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    commission: "bg-gray-500/10 text-gray-500",
                  };
                  const dateStr = tx.createdAt
                    ? new Date(tx.createdAt).toLocaleDateString("uz-UZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "";
                  return (
                    <Link href="/profile?tab=history" key={tx.id}>
                      <div className="flex items-center gap-3 hover:bg-muted/50 rounded-xl px-1 py-0.5 transition-colors cursor-pointer" data-testid={`tx-row-${tx.id}`}>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${typeColors[tx.type] || "bg-muted text-muted-foreground"}`}>
                          {isPositive
                            ? <ArrowUpRight className="w-4 h-4" />
                            : <ArrowDownRight className="w-4 h-4" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-xs font-semibold">{typeLabels[tx.type] || tx.type}</p>
                          <p className="text-muted-foreground text-[10px] truncate">{dateStr}</p>
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                          {isPositive ? "+" : ""}{Number(tx.amount).toFixed(2)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {showInstallModal && (() => {
        const installText: Record<string, {
          title: string; subtitle: string; close: string;
          ios: string[]; android: string[]; desktop: string[];
        }> = {
          uz: {
            title: "VEM ilovasini o'rnatish",
            subtitle: "Telefoningizga o'rnatib, tez kirish imkoniyatiga ega bo'ling",
            close: "Yopish",
            ios: [
              "Safari brauzerini oching va VEM saytiga kiring",
              "Pastki panelda «Ulashish» (Share) tugmasini bosing",
              "«Bosh ekranga qo'shish» (Add to Home Screen) ni tanlang",
              "«Qo'shish» (Add) tugmasini bosing — VEM bosh ekranda paydo bo'ladi"
            ],
            android: [
              "Chrome brauzerini oching va VEM saytiga kiring",
              "Yuqori o'ng burchakdagi ⋮ menyuni bosing",
              "«Bosh ekranga qo'shish» yoki «Ilovani o'rnatish» ni tanlang",
              "«O'rnatish» tugmasini bosing — VEM bosh ekranda paydo bo'ladi"
            ],
            desktop: [
              "Brauzer manzil satrida o'rnatish ikonkasini bosing",
              "«O'rnatish» tugmasini bosing — VEM kompyuteringizda paydo bo'ladi"
            ]
          },
          ru: {
            title: "Установить приложение VEM",
            subtitle: "Установите на телефон для быстрого доступа",
            close: "Закрыть",
            ios: [
              "Откройте браузер Safari и зайдите на сайт VEM",
              "Нажмите кнопку «Поделиться» (Share) внизу экрана",
              "Выберите «На экран Домой» (Add to Home Screen)",
              "Нажмите «Добавить» (Add) — VEM появится на главном экране"
            ],
            android: [
              "Откройте браузер Chrome и зайдите на сайт VEM",
              "Нажмите меню ⋮ в правом верхнем углу",
              "Выберите «Добавить на главный экран» или «Установить приложение»",
              "Нажмите «Установить» — VEM появится на главном экране"
            ],
            desktop: [
              "Нажмите на иконку установки в адресной строке браузера",
              "Нажмите «Установить» — VEM появится на вашем компьютере"
            ]
          },
          en: {
            title: "Install VEM App",
            subtitle: "Install on your phone for quick access",
            close: "Close",
            ios: [
              "Open Safari browser and go to the VEM website",
              "Tap the Share button at the bottom of the screen",
              "Select \"Add to Home Screen\"",
              "Tap \"Add\" — VEM will appear on your home screen"
            ],
            android: [
              "Open Chrome browser and go to the VEM website",
              "Tap the ⋮ menu in the top right corner",
              "Select \"Add to Home screen\" or \"Install app\"",
              "Tap \"Install\" — VEM will appear on your home screen"
            ],
            desktop: [
              "Click the install icon in the browser address bar",
              "Click \"Install\" — VEM will appear on your computer"
            ]
          }
        };
        const txt = installText[locale] || installText.en;
        const steps = isIOS ? txt.ios : isAndroid ? txt.android : txt.desktop;

        return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" data-testid="install-modal">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInstallModal(false)} />
          <div className="relative bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between p-4 pb-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{txt.title}</h3>
                  <p className="text-muted-foreground text-xs">{txt.subtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
                data-testid="button-close-install"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 pt-2 flex-1">
              <div className="space-y-2.5">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0">{i + 1}</div>
                    <p className="text-[13px] text-foreground/80 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 pt-2 shrink-0">
              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full bg-primary text-white font-semibold h-11 rounded-xl text-sm"
                data-testid="button-close-install-bottom"
              >
                {txt.close}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </>
  );
}
