import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Link } from "wouter";
import { Star, ChevronRight, ArrowUpRight, ArrowDownRight, Users, Sprout, Clock } from "lucide-react";
import { useState } from "react";
import type { User, Video, VipPackage, Investment, BalanceHistory } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

import { HeroSection } from "./dashboard/hero-section";
import { BalanceCard } from "./dashboard/balance-card";
import { TasksWidget, WeeklyEarningsChart } from "./dashboard/tasks-widget";
import { QuickActions } from "./dashboard/quick-actions";
import { VideoGrids } from "./dashboard/video-grids";
import { InstallAppModal } from "./dashboard/install-app-modal";

export default function DashboardPage() {
  const { t, locale } = useI18n();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: videos } = useQuery<Video[]>({ queryKey: ["/api/videos"] });
  const { data: vipPackages } = useQuery<VipPackage[]>({ queryKey: ["/api/vip-packages"] });

  const { data: balanceHistoryRes } = useQuery<{ data: BalanceHistory[]; total: number }>({
    queryKey: ["/api/balance-history", { page: 1, limit: 20 }],
    queryFn: async () => {
      const res = await fetch("/api/balance-history?page=1&limit=20", { credentials: "include" });
      if (res.status === 401) return { data: [], total: 0 };
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
  const balanceHistory = balanceHistoryRes?.data;

  const { data: referralStats } = useQuery<{ level1: { count: number; commission: string }; level2: { count: number; commission: string }; level3: { count: number; commission: string } }>({
    queryKey: ["/api/referrals/stats"],
  });

  const { data: investments } = useQuery<Investment[]>({ queryKey: ["/api/investments"] });

  const [showInstallModal, setShowInstallModal] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-32" />
            <div className="h-3 bg-muted rounded w-20" />
          </div>
        </div>
        <div className="h-28 bg-muted rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
        </div>
        <div className="h-5 bg-muted rounded w-24" />
        <div className="flex gap-3 overflow-hidden">
          <div className="h-40 w-28 bg-muted rounded-xl shrink-0" />
          <div className="h-40 w-28 bg-muted rounded-xl shrink-0" />
          <div className="h-40 w-28 bg-muted rounded-xl shrink-0" />
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-muted rounded w-36" />
                <div className="h-2.5 bg-muted rounded w-20" />
              </div>
              <div className="h-4 bg-muted rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentPkg = vipPackages?.find(p => p.level === user.vipLevel);
  const dailyPotential = currentPkg ? Number(currentPkg.dailyEarning) : 0;

  const vipDaysLeft = user.vipExpiresAt
    ? Math.ceil((new Date(user.vipExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEarned = (balanceHistory || [])
    .filter(h => h.type === "earning" && new Date(h.createdAt).toISOString().slice(0, 10) === todayStr)
    .reduce((sum, h) => sum + Number(h.amount), 0);

  const totalReferrals = referralStats
    ? (referralStats.level1.count + referralStats.level2.count + referralStats.level3.count)
    : 0;
  const totalReferralBonus = referralStats
    ? (Number(referralStats.level1.commission) + Number(referralStats.level2.commission) + Number(referralStats.level3.commission))
    : 0;

  const recentTx = (balanceHistory || []).slice(0, 4);

  const allVideos = videos || [];
  const allTvShows = allVideos.filter(v => v.category === "Tele-shou");
  const allTrailers = allVideos.filter(v => v.category === "Treyler");

  const dayOfYear = (() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  })();

  const dailyRotate = <T,>(arr: T[], count: number): T[] => {
    if (arr.length <= count) return arr;
    const len = arr.length;
    let step = 1;
    for (let s = 3; s < len; s++) {
      let gcd = len, b = s;
      while (b) { const tmp = b; b = gcd % b; gcd = tmp; }
      if (gcd === 1) { step = s; break; }
    }
    const offset = (dayOfYear * step) % len;
    const result: T[] = [];
    for (let i = 0; i < count; i++) {
      result.push(arr[(offset + i) % len]);
    }
    return result;
  };

  const heroVideos = dailyRotate(allVideos, 5);
  const tvShows = dailyRotate(allTvShows, 8);
  const trailers = dailyRotate(allTrailers, 8);

  const weeklyEarnings = (() => {
    const days: { label: string; amount: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US", { weekday: "short" }).slice(0, 2);
      const earned = (balanceHistory || [])
        .filter(h => (h.type === "earning" || h.type === "fund_profit" || h.type === "commission") && new Date(h.createdAt).toISOString().slice(0, 10) === dateStr)
        .reduce((sum, h) => sum + Number(h.amount), 0);
      days.push({ label: dayLabel, amount: earned });
    }
    return days;
  })();

  const weeklyMax = Math.max(...weeklyEarnings.map(d => d.amount), 0.01);
  const weeklyTotal = weeklyEarnings.reduce((s, d) => s + d.amount, 0);

  const activeInvestments = investments || [];
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + Number(inv.investedAmount || 0), 0);
  const totalEarnedFromFund = activeInvestments.reduce((sum, inv) => sum + Number((inv as Record<string, unknown>).totalEarned || 0), 0);
  const totalDailyProfit = activeInvestments.reduce((sum, inv) => sum + Number(inv.dailyProfit || 0), 0);

  const handleInstallClick = () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      window.deferredPrompt.userChoice.then(() => { window.deferredPrompt = null; });
    } else {
      setShowInstallModal(true);
    }
  };

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

  return (
    <>
    <div className="bg-background min-h-screen -mt-0">
        <HeroSection heroVideos={heroVideos} />

        <div className="px-4 mt-4 space-y-4 pb-6">
          <BalanceCard user={user} currentPkg={currentPkg} dailyPotential={dailyPotential} todayEarned={todayEarned} vipDaysLeft={vipDaysLeft} />
          <TasksWidget user={user} />
          <WeeklyEarningsChart weeklyEarnings={weeklyEarnings} weeklyMax={weeklyMax} weeklyTotal={weeklyTotal} />
          <QuickActions onInstallClick={handleInstallClick} />
          <VideoGrids tvShows={tvShows} trailers={trailers} />

          {currentPkg && (
            <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                    <Star className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-foreground text-xs font-bold">{t("dashboard.vipFeatures")}</span>
                </div>
                {vipDaysLeft !== null && vipDaysLeft > 0 && (
                  <span className="text-muted-foreground text-[10px] bg-muted/50 px-2 py-0.5 rounded-lg">{vipDaysLeft} {t("common.day")}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center bg-gradient-to-b from-primary/8 to-primary/3 rounded-xl p-2.5 border border-primary/10">
                  <p className="text-primary font-bold text-base">{currentPkg.dailyTasks}</p>
                  <p className="text-muted-foreground text-[9px]">{t("common.dailyVideo")}</p>
                </div>
                <div className="text-center bg-gradient-to-b from-emerald-500/8 to-emerald-500/3 rounded-xl p-2.5 border border-emerald-500/10">
                  <p className="text-emerald-500 font-bold text-base">${Number(currentPkg.perVideoReward).toFixed(2)}</p>
                  <p className="text-muted-foreground text-[9px]">{t("common.perVideo")}</p>
                </div>
                <div className="text-center bg-gradient-to-b from-blue-500/8 to-blue-500/3 rounded-xl p-2.5 border border-blue-500/10">
                  <p className="text-blue-500 font-bold text-base">${Number(currentPkg.dailyEarning).toFixed(2)}</p>
                  <p className="text-muted-foreground text-[9px]">{t("common.dailyEarning")}</p>
                </div>
              </div>
            </div>
          )}

          <Link href="/referral">
            <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm cursor-pointer hover:border-emerald-500/30 transition-all group" data-testid="referral-mini-widget">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-500/15">
                    <Users className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-foreground font-bold text-sm">{t("dashboard.referralMini")}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-emerald-500/8 rounded-xl p-2.5 text-center border border-emerald-500/10">
                  <p className="text-foreground font-bold text-base">{referralStats?.level1.count || 0}</p>
                  <p className="text-muted-foreground text-[9px] mt-0.5">{t("dashboard.level1")}</p>
                </div>
                <div className="bg-blue-500/8 rounded-xl p-2.5 text-center border border-blue-500/10">
                  <p className="text-foreground font-bold text-base">{referralStats?.level2.count || 0}</p>
                  <p className="text-muted-foreground text-[9px] mt-0.5">{t("dashboard.level2")}</p>
                </div>
                <div className="bg-purple-500/8 rounded-xl p-2.5 text-center border border-purple-500/10">
                  <p className="text-foreground font-bold text-base">{referralStats?.level3.count || 0}</p>
                  <p className="text-muted-foreground text-[9px] mt-0.5">{t("dashboard.level3")}</p>
                </div>
              </div>
              {totalReferralBonus > 0 && (
                <div className="mt-3 flex items-center justify-between bg-emerald-500/8 rounded-xl px-3 py-2 border border-emerald-500/10">
                  <span className="text-muted-foreground text-xs">{t("dashboard.referralBonus")}</span>
                  <span className="text-emerald-500 font-bold text-sm">+{totalReferralBonus.toFixed(2)} USDT</span>
                </div>
              )}
              {totalReferrals === 0 && (
                <p className="text-muted-foreground text-xs text-center mt-2">{t("dashboard.noReferrals")}</p>
              )}
            </div>
          </Link>

          {activeInvestments.length > 0 && (
            <Link href="/fund">
              <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm cursor-pointer hover:border-violet-500/30 transition-all group" data-testid="fund-mini-widget">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-500/15">
                      <Sprout className="w-4.5 h-4.5 text-white" />
                    </div>
                    <span className="text-foreground font-bold text-sm">{t("dashboard.fundWidget")}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <div className="bg-violet-500/8 rounded-xl p-2.5 border border-violet-500/10">
                    <p className="text-muted-foreground text-[9px] mb-1">{t("dashboard.fundTotalInvested")}</p>
                    <p className="text-foreground font-bold text-sm">${totalInvested.toFixed(2)}</p>
                  </div>
                  <div className="bg-emerald-500/8 rounded-xl p-2.5 border border-emerald-500/10">
                    <p className="text-muted-foreground text-[9px] mb-1">{t("dashboard.fundTotalEarned")}</p>
                    <p className="text-emerald-500 font-bold text-sm">+${totalEarnedFromFund.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-500/8 rounded-xl p-2.5 border border-blue-500/10">
                    <p className="text-muted-foreground text-[9px] mb-1">{t("dashboard.fundDaily")}</p>
                    <p className="text-blue-500 font-bold text-sm">+${totalDailyProfit.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeInvestments.map((inv) => (
                    <span key={inv.id} className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-lg font-semibold border border-violet-500/15">
                      {inv.planName} · ${Number(inv.investedAmount).toFixed(0)}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          )}

          <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/15">
                  <Clock className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-foreground font-bold text-sm">{t("dashboard.recentActivity")}</span>
              </div>
              <Link href="/profile?tab=history">
                <span className="text-muted-foreground text-xs flex items-center gap-0.5 hover:text-foreground transition-colors">
                  {t("dashboard.viewAll")} <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
            {recentTx.length === 0 ? (
              <p className="text-muted-foreground text-xs text-center py-6">{t("dashboard.noActivity")}</p>
            ) : (
              <div className="space-y-1.5">
                {recentTx.map((tx) => {
                  const isPositive = Number(tx.amount) >= 0;
                  const dateStr = tx.createdAt
                    ? new Date(tx.createdAt).toLocaleDateString("uz-UZ", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "";
                  return (
                    <Link href="/profile?tab=history" key={tx.id}>
                      <div className="flex items-center gap-3 hover:bg-muted/30 rounded-xl px-2 py-2 transition-colors cursor-pointer" data-testid={`tx-row-${tx.id}`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeColors[tx.type] || "bg-muted text-muted-foreground"}`}>
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

      {showInstallModal && <InstallAppModal onClose={() => setShowInstallModal(false)} />}
    </>
  );
}
