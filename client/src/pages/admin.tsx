import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, ArrowDownCircle, ArrowUpCircle, Settings, Crown,
  Shield, AlertTriangle, Trophy, UserPlus, Activity, Megaphone, Mail, UserX,
  ChevronLeft, Menu, X, LayoutDashboard
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    { id: "dashboard", label: t("admin.dashboard"), icon: LayoutDashboard },
    { id: "stajyor", label: t("admin.stajyor"), icon: UserPlus, badge: pendingStajyor || undefined },
    { id: "users", label: t("admin.users"), icon: Users, badge: allUsers.length || undefined },
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

  const allTabs = [...techTabs, ...financeTabs];
  const activeTab = allTabs.find(tb => tb.id === tab);

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

  const handleTabClick = (id: Tab) => {
    setTab(id);
    setSidebarOpen(false);
  };

  const SidebarItem = ({ tb }: { tb: typeof techTabs[0] }) => (
    <button
      onClick={() => handleTabClick(tb.id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
        tab === tb.id
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
      data-testid={`tab-${tb.id}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
        tab === tb.id ? "bg-primary/15" : "bg-muted/30 group-hover:bg-muted/50"
      }`}>
        <tb.icon className={`w-4 h-4 ${tab === tb.id ? "text-primary" : ""}`} />
      </div>
      <span className="flex-1 text-left truncate">{tb.label}</span>
      {tb.badge !== undefined && tb.badge > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
          tab === tb.id ? "bg-primary/20 text-primary" : "bg-red-500/10 text-red-500"
        }`}>{tb.badge > 999 ? "999+" : tb.badge}</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-border/50 bg-card/50 h-screen sticky top-0">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-foreground font-bold text-[15px] tracking-tight">{t("admin.title")}</h1>
              <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Control Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-2 px-3 font-semibold">{t("admin.techSection")}</p>
          {techTabs.map(tb => <SidebarItem key={tb.id} tb={tb} />)}

          <div className="my-3 border-t border-border/50" />

          <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-2 px-3 font-semibold">{t("admin.financeSection")}</p>
          {financeTabs.map(tb => <SidebarItem key={tb.id} tb={tb} />)}
        </nav>

        <div className="p-3 border-t border-border/50">
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all text-[13px] font-medium"
            data-testid="link-back-to-site"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("admin.backToSite")}
          </a>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[280px] bg-card border-r border-border/50 flex flex-col animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-foreground font-bold text-[15px]">{t("admin.title")}</h1>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest">Control Panel</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center" data-testid="button-close-sidebar">
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-2 px-3 font-semibold">{t("admin.techSection")}</p>
              {techTabs.map(tb => <SidebarItem key={tb.id} tb={tb} />)}

              <div className="my-3 border-t border-border/50" />

              <p className="text-muted-foreground text-[9px] uppercase tracking-widest mb-2 px-3 font-semibold">{t("admin.financeSection")}</p>
              {financeTabs.map(tb => <SidebarItem key={tb.id} tb={tb} />)}
            </nav>

            <div className="p-3 border-t border-border/50">
              <a href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all text-[13px] font-medium" data-testid="link-back-to-site-mobile">
                <ChevronLeft className="w-4 h-4" />
                {t("admin.backToSite")}
              </a>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 overflow-hidden">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              data-testid="button-open-sidebar"
            >
              <Menu className="w-4.5 h-4.5" />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              {activeTab && (
                <>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <activeTab.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-foreground font-semibold text-sm truncate">{activeTab.label}</h2>
                    <p className="text-muted-foreground text-[10px]">{allUsers.length} {t("admin.users").toLowerCase()}</p>
                  </div>
                </>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              {pendingDeposits > 0 && (
                <button onClick={() => setTab("deposits")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-[11px] font-medium hover:bg-emerald-500/20 transition-colors" data-testid="badge-pending-deposits">
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  {pendingDeposits}
                </button>
              )}
              {pendingWithdrawals > 0 && (
                <button onClick={() => setTab("withdrawals")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 text-[11px] font-medium hover:bg-orange-500/20 transition-colors" data-testid="badge-pending-withdrawals">
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                  {pendingWithdrawals}
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-4 lg:p-6 overflow-x-auto">
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
        </main>
      </div>
    </div>
  );
}
