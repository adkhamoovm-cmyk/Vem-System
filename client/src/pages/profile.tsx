import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  User as UserIcon, Crown, Copy, LogOut, ChevronRight,
  Wallet, ListChecks, Users, Camera, Shield, Lock,
  CreditCard, Headphones,
  ArrowDownCircle, ArrowUpCircle, Globe,
  History, TrendingUp, Landmark,
  GraduationCap, Star, Gem, Flame, Trophy, Rocket, Zap, BellRing,
  Monitor, CalendarClock
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Button } from "@/components/ui/button";
import type { User, PaymentMethod, DepositRequest, WithdrawalRequest, BalanceHistory } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";
import { formatUZS } from "@/lib/utils";

import { SessionsModal } from "./profile/sessions-modal";
import { DepositModal } from "./profile/deposit-modal";
import { AddPaymentMethodModal } from "./profile/add-payment-method-modal";
import { WithdrawModal } from "./profile/withdraw-modal";
import { SecretInfoModal, FinanceServiceModal, ChangePasswordModal, ChangeFundPasswordModal } from "./profile/info-modals";
import { FinancialHistoryModal } from "./profile/financial-history-modal";

export default function ProfilePage() {
  const { toast } = useToast();
  const { t, locale, translateServerMessage } = useI18n();
  const [location, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSecretInfo, setShowSecretInfo] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showAddBankCard, setShowAddBankCard] = useState(false);
  const [showAddUsdtWallet, setShowAddUsdtWallet] = useState(false);
  const [showFinanceHistory, setShowFinanceHistory] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("tab") === "history";
    }
    return false;
  });
  const [showFinanceService, setShowFinanceService] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showChangeFundPwd, setShowChangeFundPwd] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const { isSupported: pushSupported, isSubscribed: pushSubscribed, isLoading: pushLoading, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: referralStats } = useQuery<{
    level1: { count: number; commission: string };
    level2: { count: number; commission: string };
    level3: { count: number; commission: string };
  }>({
    queryKey: ["/api/referrals/stats"],
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: deposits = [] } = useQuery<DepositRequest[]>({
    queryKey: ["/api/deposits"],
  });

  const { data: withdrawals = [] } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawals"],
  });

  const { data: platformSettingsMain } = useQuery<{ withdrawalEnabled: boolean }>({
    queryKey: ["/api/platform-settings"],
  });
  const isWithdrawalGloballyEnabled = platformSettingsMain?.withdrawalEnabled !== false;

  const [historyPage, setHistoryPage] = useState(1);
  const { data: balHistoryRes } = useQuery<{ data: BalanceHistory[]; total: number; totalPages: number }>({
    queryKey: ["/api/balance-history", { page: historyPage, limit: 20 }],
    queryFn: async () => {
      const res = await fetch(`/api/balance-history?page=${historyPage}&limit=20`, { credentials: "include" });
      if (res.status === 401) return { data: [], total: 0, totalPages: 1 };
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });
  const balHistory = balHistoryRes?.data || [];
  const historyTotalPages = balHistoryRes?.totalPages || 1;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/login";
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error(t("profile.imageUploadFailed"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: t("common.success") });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  const handleAvatarClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
  };

  const copyId = () => {
    if (user?.numericId) {
      navigator.clipboard.writeText(user.numericId);
      toast({ title: t("common.success") });
    }
  };

  const vipIconMap: Record<number, LucideIcon> = {
    0: GraduationCap, 1: Star, 2: Star, 3: Star, 4: Flame,
    5: Gem, 6: Crown, 7: Trophy, 8: Rocket, 9: Zap, 10: Globe,
  };

  const vipBadgeStyles: Record<number, string> = {
    0: "bg-gray-500/25 text-gray-100",
    1: "bg-amber-500/25 text-amber-100",
    2: "bg-sky-500/25 text-sky-100",
    3: "bg-violet-500/25 text-violet-100",
    4: "bg-orange-500/25 text-orange-100",
    5: "bg-cyan-500/25 text-cyan-100",
    6: "bg-yellow-500/25 text-yellow-100",
    7: "bg-rose-500/25 text-rose-100",
    8: "bg-indigo-500/25 text-indigo-100",
    9: "bg-fuchsia-500/25 text-fuchsia-100",
    10: "bg-emerald-500/25 text-emerald-100",
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-20 h-20 rounded-full bg-muted" />
          <div className="h-5 bg-muted rounded w-32" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
        <div className="h-24 bg-muted rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-14 bg-muted rounded-xl" />
          <div className="h-14 bg-muted rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-muted rounded w-28" />
                <div className="h-2.5 bg-muted rounded w-20" />
              </div>
              <div className="w-5 h-5 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!user) return null;

  const totalReferrals = (referralStats?.level1?.count || 0) + (referralStats?.level2?.count || 0) + (referralStats?.level3?.count || 0);
  const displayName = `vem_${user.phone.replace(/[^0-9]/g, "").slice(-10)}`;
  const balance = Number(user.balance);
  const bankCard = paymentMethods.find(m => m.type === "bank");
  const usdtWallet = paymentMethods.find(m => m.type === "usdt");

  return (
    <div className="p-4 space-y-4 pb-24">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-5 pt-6 animate-fade-up" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="relative" onClick={handleAvatarClick} data-testid="button-avatar-upload">
              <div className="w-[76px] h-[76px] rounded-full border-[3px] border-white/30 overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center cursor-pointer shadow-lg shadow-black/20">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" data-testid="img-avatar" />
                ) : (
                  <UserIcon className="w-9 h-9 text-white/70" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center border-2 border-primary shadow-md">
                <Camera className="w-3.5 h-3.5 text-primary" />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="input-avatar-file" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-lg drop-shadow-sm" data-testid="text-profile-name">{displayName}</h2>
              <div className="flex items-center gap-2 mt-1">
                {(() => {
                  const VipLevelIcon = vipIconMap[user.vipLevel] || Star;
                  const badgeStyle = vipBadgeStyles[user.vipLevel] || "bg-white/20 text-white";
                  return (
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1 shadow-sm border border-white/10 ${badgeStyle}`}>
                      {user.vipLevel >= 0 && <VipLevelIcon className="w-3 h-3" />}
                      {user.vipLevel < 0 ? t("profile.notEmployee") : getVipName(user.vipLevel, locale)}
                    </span>
                  );
                })()}
              </div>
              <button onClick={copyId} className="flex items-center gap-1.5 mt-1.5 group" data-testid="button-copy-id">
                <span className="text-white/60 text-xs">UID: {user.numericId || "—"}</span>
                <Copy className="w-3 h-3 text-white/40 group-hover:text-white/80 transition-colors" />
              </button>
            </div>
            {user.vipLevel > 0 && user.vipExpiresAt && (() => {
              const expiresAt = new Date(user.vipExpiresAt);
              const now = new Date();
              const daysLeft = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
              const isExpired = daysLeft <= 0;
              const isWarning = daysLeft > 0 && daysLeft <= 7;
              const dd = String(expiresAt.getDate()).padStart(2, "0");
              const mm = String(expiresAt.getMonth() + 1).padStart(2, "0");
              const yyyy = expiresAt.getFullYear();
              return (
                <div className="flex flex-col items-center gap-1" data-testid="vip-expiry-info">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isExpired ? "bg-red-500/20" : isWarning ? "bg-amber-500/20" : "bg-white/10"} backdrop-blur-sm`}>
                    <CalendarClock className={`w-5 h-5 ${isExpired ? "text-red-300" : isWarning ? "text-amber-300" : "text-white/80"}`} />
                  </div>
                  <span className={`text-[9px] font-semibold ${isExpired ? "text-red-300" : isWarning ? "text-amber-300" : "text-white/70"}`}>
                    {dd}.{mm}.{yyyy}
                  </span>
                  <span className={`text-[8px] font-medium ${isExpired ? "text-red-400" : isWarning ? "text-amber-400" : "text-white/50"}`}>
                    {isExpired ? t("dashboard.vipExpired") : t("dashboard.vipExpiresIn", { days: daysLeft })}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-emerald-500/5 dark:from-primary/10 dark:to-emerald-500/10" />
          <div className="relative p-5">
            <div className="text-center mb-4">
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-medium">{t("profile.totalBalance")}</p>
              <div className="flex items-baseline justify-center gap-1.5 mt-2">
                <span className="text-foreground font-bold text-3xl tracking-tight" data-testid="text-balance">{balance.toFixed(2)}</span>
                <span className="text-emerald-500 dark:text-emerald-400 text-sm font-semibold">USDT</span>
              </div>
              <p className="text-muted-foreground text-xs mt-0.5">{formatUZS(balance)} UZS</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Button
                onClick={() => setShowDeposit(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-12 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform"
                data-testid="button-deposit"
              >
                <ArrowDownCircle className="w-4 h-4 mr-1.5" />
                {t("common.deposit")}
              </Button>
              <Button
                onClick={() => {
                  if (!isWithdrawalGloballyEnabled) {
                    toast({
                      title: t("profile.withdrawUnavailableTitle"),
                      description: t("profile.withdrawUnavailableDesc"),
                      variant: "destructive",
                    });
                    return;
                  }
                  setShowWithdraw(true);
                }}
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-12 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                data-testid="button-withdraw"
              >
                <ArrowUpCircle className="w-4 h-4 mr-1.5" />
                {t("common.withdrawal")}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 animate-fade-up" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
          <div className="bg-card rounded-2xl p-3.5 border border-border text-center relative overflow-hidden group card-hover">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-2">
                <ArrowDownCircle className="w-4 h-4 text-primary" />
              </div>
              <p className="text-primary font-bold text-sm" data-testid="text-balance-deposit">{Number(user.totalDeposit || 0).toFixed(2)}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5 leading-tight">{t("profile.depositedUsdt")}</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-3.5 border border-border text-center relative overflow-hidden group card-hover">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-emerald-500 dark:text-emerald-400 font-bold text-sm" data-testid="text-balance-earnings">{Number(user.totalEarnings || 0).toFixed(2)}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5 leading-tight">{t("profile.earningsUsdt")}</p>
            </div>
          </div>
          <div className="bg-card rounded-2xl p-3.5 border border-border text-center relative overflow-hidden group card-hover">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-violet-500" />
              </div>
              <p className="text-foreground font-bold text-sm">{totalReferrals}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5 leading-tight">{t("profile.referrals")}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 animate-fade-up" style={{ animationDelay: "0.25s", animationFillMode: "both" }}>
          <h3 className="text-foreground font-bold text-sm px-1">{t("profile.myServices")}</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <button onClick={() => setShowFinanceService(true)} className="flex items-center justify-between px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors group" data-testid="menu-finance-service">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                  <Landmark className="w-4.5 h-4.5 text-blue-500" />
                </div>
                <div>
                  <span className="text-foreground text-sm font-medium">{t("profile.financeService")}</span>
                  <p className="text-muted-foreground text-[10px]">{bankCard ? t("profile.cardLinked") : t("profile.cardNotLinked")} · {usdtWallet ? t("profile.walletLinked") : t("profile.walletNotLinked")}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>

            <button onClick={() => setShowFinanceHistory(true)} className="flex items-center justify-between px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors group" data-testid="menu-finance-history">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 flex items-center justify-center">
                  <History className="w-4.5 h-4.5 text-violet-500" />
                </div>
                <div>
                  <span className="text-foreground text-sm font-medium">{t("profile.financialHistory")}</span>
                  <p className="text-muted-foreground text-[10px]">{balHistory.length} {t("profile.operations")}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>

            <button onClick={() => navigate("/tasks")} className="flex items-center justify-between px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors group" data-testid="menu-my-tasks">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 flex items-center justify-center">
                  <ListChecks className="w-4.5 h-4.5 text-cyan-500" />
                </div>
                <span className="text-foreground text-sm font-medium">{t("profile.myTasks")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
            <button onClick={() => navigate("/referral")} className="flex items-center justify-between px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors group" data-testid="menu-my-referrals">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 flex items-center justify-center">
                  <Users className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div>
                  <span className="text-foreground text-sm font-medium">{t("profile.myReferrals")}</span>
                  <span className="ml-2 text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-medium">{totalReferrals}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
            <button onClick={() => navigate("/vip")} className="flex items-center justify-between px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors group" data-testid="menu-my-vip">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 flex items-center justify-center">
                  <Crown className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <span className="text-foreground text-sm font-medium">{t("profile.myVipSubs")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        <div className="space-y-2 animate-fade-up" style={{ animationDelay: "0.35s", animationFillMode: "both" }}>
          <h3 className="text-foreground font-bold text-sm px-1">{t("profile.secretInfo")}</h3>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <button onClick={() => setShowSecretInfo(true)} className="flex items-center justify-between px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors group" data-testid="menu-secret-info">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/10 flex items-center justify-center">
                  <Lock className="w-4.5 h-4.5 text-gray-500" />
                </div>
                <span className="text-foreground text-sm font-medium">{t("profile.secretInfo")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>

            <button onClick={() => setShowChangePassword(true)} className="flex items-center justify-between px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors group" data-testid="menu-change-password">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center">
                  <Lock className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <span className="text-foreground text-sm font-medium">{t("profile.changeLoginPassword")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>

            <button onClick={() => setShowChangeFundPwd(true)} className="flex items-center justify-between px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors group" data-testid="menu-change-fund-password">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center">
                  <Shield className="w-4.5 h-4.5 text-violet-500" />
                </div>
                <span className="text-foreground text-sm font-medium">{t("profile.changeFundPasswordMenu")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        <div className="space-y-2 animate-fade-up" style={{ animationDelay: "0.45s", animationFillMode: "both" }}>
          <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
            <button onClick={() => setShowSessions(true)} className="flex items-center justify-between px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors group" data-testid="menu-sessions">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 flex items-center justify-center">
                  <Monitor className="w-4.5 h-4.5 text-cyan-500" />
                </div>
                <div>
                  <span className="text-foreground text-sm font-medium block">{t("profile.sessions")}</span>
                  <span className="text-muted-foreground text-[11px]">{t("profile.sessionsDesc")}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
            <button onClick={() => navigate("/help")} className="flex items-center justify-between px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors group" data-testid="menu-support">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                  <Headphones className="w-4.5 h-4.5 text-blue-500" />
                </div>
                <span className="text-foreground text-sm font-medium">{t("profile.customerSupport")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
            {user.isAdmin && (
              <button onClick={() => navigate("/admin")} className="flex items-center justify-between px-4 py-3.5 w-full text-left hover:bg-muted/50 transition-colors group" data-testid="menu-admin">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center">
                    <Shield className="w-4.5 h-4.5 text-red-500" />
                  </div>
                  <span className="text-red-500 text-sm font-semibold">{t("admin.title")}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-all" />
              </button>
            )}
          </div>
        </div>

        {pushSupported && (
          <div className="bg-card/60 backdrop-blur-md rounded-2xl border border-border p-4 mb-4" data-testid="section-push-notifications">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <BellRing className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("notifications.push.enable")}</p>
                  <p className="text-xs text-muted-foreground">{t("notifications.push.prompt")}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (pushSubscribed) {
                    await pushUnsubscribe();
                  } else {
                    const ok = await pushSubscribe();
                    if (!ok) {
                      toast({ title: t("common.error"), description: "Push notification permission denied", variant: "destructive" });
                    }
                  }
                }}
                disabled={pushLoading}
                className={`relative w-12 h-7 rounded-full transition-all duration-200 ${pushSubscribed ? "bg-primary" : "bg-muted"}`}
                data-testid="toggle-push-notifications"
              >
                <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200 ${pushSubscribed ? "left-5.5" : "left-0.5"}`} />
              </button>
            </div>
          </div>
        )}

        <Button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          variant="outline"
          className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl h-12 font-semibold gap-2 transition-all active:scale-[0.98]"
          data-testid="button-profile-logout"
        >
          <LogOut className="w-4 h-4" />
          {logoutMutation.isPending ? t("profile.loggingOut") : t("profile.logout")}
        </Button>

        <SecretInfoModal open={showSecretInfo} onClose={setShowSecretInfo} user={user} balance={balance} />

        <FinanceServiceModal
          open={showFinanceService}
          onClose={setShowFinanceService}
          bankCard={bankCard}
          usdtWallet={usdtWallet}
          onAddBankCard={() => { setShowFinanceService(false); setShowAddBankCard(true); }}
          onAddUsdtWallet={() => { setShowFinanceService(false); setShowAddUsdtWallet(true); }}
        />

        <ChangePasswordModal open={showChangePassword} onClose={setShowChangePassword} />
        <ChangeFundPasswordModal open={showChangeFundPwd} onClose={setShowChangeFundPwd} />

        <FinancialHistoryModal
          open={showFinanceHistory}
          onClose={setShowFinanceHistory}
          balHistory={balHistory}
          historyTotalPages={historyTotalPages}
          historyPage={historyPage}
          setHistoryPage={setHistoryPage}
        />

        <SessionsModal open={showSessions} onClose={() => setShowSessions(false)} />

        {user && <DepositModal open={showDeposit} onClose={() => setShowDeposit(false)} user={user} />}
        {user && <WithdrawModal open={showWithdraw} onClose={() => setShowWithdraw(false)} user={user} paymentMethods={paymentMethods} />}
        <AddPaymentMethodModal open={showAddBankCard} onClose={() => setShowAddBankCard(false)} type="bank" />
        <AddPaymentMethodModal open={showAddUsdtWallet} onClose={() => setShowAddUsdtWallet(false)} type="usdt" />
      </div>
  );
}
