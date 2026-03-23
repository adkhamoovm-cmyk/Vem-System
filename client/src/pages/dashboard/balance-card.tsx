import { useState } from "react";
import { Link } from "wouter";
import { TrendingUp, ArrowRightLeft, CheckCheck, AlertTriangle, GraduationCap, Star, Flame, Gem, Crown, Trophy, Rocket, Zap, Globe, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { User, VipPackage } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";
import { UZS_RATE, formatUZS } from "@/lib/utils";

const vipIconMap: Record<number, LucideIcon> = {
  0: GraduationCap, 1: Star, 2: Star, 3: Star, 4: Flame,
  5: Gem, 6: Crown, 7: Trophy, 8: Rocket, 9: Zap, 10: Globe,
};

function VipIcon({ level, className }: { level: number; className?: string }) {
  const Icon = vipIconMap[level] || Star;
  return <Icon className={className} />;
}

interface BalanceCardProps {
  user: User;
  currentPkg: VipPackage | undefined;
  dailyPotential: number;
  todayEarned: number;
  vipDaysLeft: number | null;
}

export function BalanceCard({ user, currentPkg, dailyPotential, todayEarned, vipDaysLeft }: BalanceCardProps) {
  const { t, locale } = useI18n();
  const balance = Number(user.balance);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/balance-history"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] }),
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/stats"] }),
    ]);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <>
      {vipDaysLeft !== null && user.vipLevel > 0 && vipDaysLeft <= 15 && (
        <div className={`rounded-2xl p-3.5 flex items-center gap-3 ${
          vipDaysLeft <= 0
            ? "bg-red-500/8 border border-red-500/20"
            : vipDaysLeft <= 5
            ? "bg-red-500/8 border border-red-500/20"
            : "bg-amber-500/8 border border-amber-500/20"
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            vipDaysLeft <= 5 ? "bg-red-500/15" : "bg-amber-500/15"
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
            <button className={`text-xs font-bold px-3.5 py-2 rounded-xl shrink-0 transition-all active:scale-95 ${
              vipDaysLeft <= 5
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                : "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
            }`} data-testid="button-renew-vip">
              {t("dashboard.renewVip")}
            </button>
          </Link>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden shadow-lg animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
        <div className="bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-4 pb-3 relative">
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <VipIcon level={user.vipLevel} className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white/60 text-[10px] uppercase tracking-widest font-medium">
                  {user.vipLevel < 0 ? t("common.notEmployee") : getVipName(user.vipLevel, locale)}
                </span>
                <p className="text-white/80 text-xs font-medium">UID: {user.numericId || "—"}</p>
              </div>
            </div>
            <Link href="/vip">
              <span className="bg-white/15 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-lg font-semibold cursor-pointer border border-white/10 active:scale-95 transition-transform" data-testid="link-upgrade-vip">
                {t("dashboard.upgrade")}
              </span>
            </Link>
          </div>
          <div className="relative mt-4 mb-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/40 text-[10px] uppercase tracking-widest flex items-center gap-1">
                <ArrowRightLeft className="w-3 h-3" />
                {t("dashboard.exchange")}
              </span>
              <span className="text-white/30 text-[9px]">{t("dashboard.rate", { rate: UZS_RATE.toLocaleString() })}</span>
            </div>
            <div className="flex items-end justify-between" data-testid="text-balance">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-3xl tracking-tight">{balance.toFixed(2)} <span className="text-emerald-300 text-sm font-semibold">USDT</span></p>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 active:scale-90 transition-all mt-0.5"
                    data-testid="button-refresh-balance"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-white/50 text-sm mt-0.5">{formatUZS(balance)} <span className="text-xs">UZS</span></p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-1 text-emerald-300 text-xs justify-end">
                  <TrendingUp className="w-3 h-3" />
                  <span>+{dailyPotential.toFixed(2)}/{t("common.day")}</span>
                </div>
                {todayEarned > 0 && (
                  <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-0.5 justify-end border border-white/10">
                    <CheckCheck className="w-3 h-3 text-emerald-300" />
                    <span className="text-emerald-300 text-[10px] font-semibold">+{todayEarned.toFixed(2)} {t("common.today")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border-t border-border/30 p-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-500/5 dark:bg-emerald-500/8 rounded-xl p-3 border border-emerald-500/10">
              <span className="text-muted-foreground text-[9px] uppercase tracking-widest">{t("dashboard.earnings")}</span>
              <p className="text-foreground font-bold text-sm mt-1" data-testid="text-total-earnings">{Number(user.totalEarnings).toFixed(2)} USDT</p>
              <p className="text-muted-foreground text-[10px]">{formatUZS(Number(user.totalEarnings))} UZS</p>
            </div>
            <div className="bg-blue-500/5 dark:bg-blue-500/8 rounded-xl p-3 border border-blue-500/10">
              <span className="text-muted-foreground text-[9px] uppercase tracking-widest">{t("common.deposit")}</span>
              <p className="text-foreground font-bold text-sm mt-1" data-testid="text-total-deposit">{Number(user.totalDeposit).toFixed(2)} USDT</p>
              <p className="text-muted-foreground text-[10px]">{formatUZS(Number(user.totalDeposit))} UZS</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
