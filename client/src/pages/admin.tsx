import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, ArrowDownCircle, ArrowUpCircle, Settings, Crown,
  Shield, AlertTriangle, Trophy, UserPlus, Activity, Megaphone, Mail, UserX
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { User, PaymentMethod, DepositRequest, WithdrawalRequest, StajyorRequest } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { type Tab, AdminPinGate } from "./admin/shared";
import { AdminDashboard } from "./admin/admin-dashboard";
import { UsersTab } from "./admin/users-tab";
import { DepositsTab } from "./admin/deposits-tab";
import { WithdrawalsTab } from "./admin/withdrawals-tab";
import { SettingsTab } from "./admin/settings-tab";
import { TopReferrersTab } from "./admin/top-referrers-tab";
import { MultiAccountsTab } from "./admin/multi-accounts-tab";
import { StajyorTab } from "./admin/stajyor-tab";
import { VipManageTab } from "./admin/vip-manage-tab";
import { PromoCodesTab } from "./admin/promo-codes-tab";
import { BroadcastsTab } from "./admin/broadcasts-tab";
import { PassiveUsersTab } from "./admin/passive-users-tab";

export default function AdminPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [pinVerified, setPinVerified] = useState(false);

  const { data: pinStatus, isLoading: pinLoading } = useQuery<{ verified: boolean }>({
    queryKey: ["/api/admin/pin-status"],
  });

  useEffect(() => {
    if (pinStatus?.verified) {
      setPinVerified(true);
    }
  }, [pinStatus]);

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: pinVerified,
  });
  const { data: deposits = [], isLoading: depositsLoading } = useQuery<DepositRequest[]>({
    queryKey: ["/api/admin/deposits"],
    enabled: pinVerified,
  });
  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<(WithdrawalRequest & { paymentMethod?: PaymentMethod | null })[]>({
    queryKey: ["/api/admin/withdrawals"],
    enabled: pinVerified,
  });

  const pendingDeposits = deposits.filter(d => d.status === "pending").length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
  const { data: stajyorRequests = [] } = useQuery<StajyorRequest[]>({
    queryKey: ["/api/admin/stajyor-requests"],
    enabled: pinVerified,
  });
  const pendingStajyor = stajyorRequests.filter(r => r.status === "pending").length;

  const techTabs: { id: Tab; label: string; icon: LucideIcon; badge?: number }[] = [
    { id: "dashboard", label: t("admin.dashboard"), icon: Activity },
    { id: "stajyor", label: t("admin.stajyor"), icon: UserPlus, badge: pendingStajyor || undefined },
    { id: "users", label: t("admin.users"), icon: Users, badge: allUsers.length },
    { id: "referrals", label: t("admin.topReferrals"), icon: Trophy },
    { id: "passive", label: t("admin.passiveUsers"), icon: UserX },
    { id: "multi", label: t("admin.multiAccount"), icon: AlertTriangle },
    { id: "settings", label: t("admin.settings"), icon: Settings },
    { id: "vip-manage", label: t("admin.vipManagement"), icon: Crown },
    { id: "promo", label: t("admin.promoCodes"), icon: Mail },
    { id: "broadcasts", label: t("admin.broadcasting"), icon: Megaphone },
  ];
  const financeTabs: { id: Tab; label: string; icon: LucideIcon; badge?: number }[] = [
    { id: "deposits", label: t("admin.deposits"), icon: ArrowDownCircle, badge: pendingDeposits || undefined },
    { id: "withdrawals", label: t("admin.withdrawals"), icon: ArrowUpCircle, badge: pendingWithdrawals || undefined },
  ];

  if (pinLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!pinVerified) {
    return <AdminPinGate onVerified={() => setPinVerified(true)} />;
  }

  if (usersLoading || depositsLoading || withdrawalsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-white/10">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute top-0 right-0 w-60 h-60 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white rounded-full translate-y-1/2" />
        </div>
        <div className="relative max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-base sm:text-lg tracking-tight">{t("admin.title")}</h1>
                <p className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-widest">Control Panel</p>
              </div>
            </div>
            <a href="/dashboard" className="text-white/50 text-[10px] sm:text-xs hover:text-white transition-colors bg-white/5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/10" data-testid="link-back-to-site">
              {t("admin.backToSite")}
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-3 sm:p-4">
        <div className="bg-card rounded-xl border border-border/50 p-2.5 sm:p-3 mb-4 space-y-2.5 sm:space-y-3">
          <div>
            <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-1.5 sm:mb-2 px-1 font-semibold">{t("admin.techSection")}</p>
            <div className="overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide">
              <div className="flex gap-1.5 min-w-max">
                {techTabs.map(tb => (
                  <button key={tb.id} onClick={() => setTab(tb.id)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all ${
                      tab === tb.id
                        ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-sm shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    data-testid={`tab-${tb.id}`}
                  >
                    <tb.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {tb.label}
                    {tb.badge !== undefined && tb.badge > 0 && (
                      <span className={`ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold ${
                        tab === tb.id ? "bg-white/20 text-white" : "bg-red-500/15 text-red-500"
                      }`}>{tb.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 pt-2.5 sm:pt-3">
            <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-1.5 sm:mb-2 px-1 font-semibold">{t("admin.financeSection")}</p>
            <div className="overflow-x-auto -mx-1 px-1 pb-1 scrollbar-hide">
              <div className="flex gap-1.5 min-w-max">
                {financeTabs.map(tb => (
                  <button key={tb.id} onClick={() => setTab(tb.id)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all ${
                      tab === tb.id
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                    data-testid={`tab-${tb.id}`}
                  >
                    <tb.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {tb.label}
                    {tb.badge !== undefined && tb.badge > 0 && (
                      <span className={`ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold ${
                        tab === tb.id ? "bg-white/20 text-white" : "bg-red-500/15 text-red-500"
                      }`}>{tb.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {tab === "dashboard" && <AdminDashboard users={allUsers} deposits={deposits} withdrawals={withdrawals} />}
        {tab === "stajyor" && <StajyorTab users={allUsers} />}
        {tab === "users" && <UsersTab users={allUsers} />}
        {tab === "deposits" && <DepositsTab deposits={deposits} users={allUsers} />}
        {tab === "withdrawals" && <WithdrawalsTab withdrawals={withdrawals} users={allUsers} />}
        {tab === "referrals" && <TopReferrersTab />}
        {tab === "passive" && <PassiveUsersTab />}
        {tab === "multi" && <MultiAccountsTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "vip-manage" && <VipManageTab />}
        {tab === "promo" && <PromoCodesTab />}
        {tab === "broadcasts" && <BroadcastsTab />}
      </div>
    </div>
  );
}
