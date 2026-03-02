import {
  Users, ArrowDownCircle, ArrowUpCircle, DollarSign, Activity, Crown, Shield, TrendingUp
} from "lucide-react";
import type { User, DepositRequest, WithdrawalRequest } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";

export function AdminDashboard({ users: allUsers, deposits, withdrawals }: { users: User[]; deposits: DepositRequest[]; withdrawals: WithdrawalRequest[] }) {
  const { t, locale } = useI18n();
  const totalBalance = allUsers.reduce((s, u) => s + Number(u.balance), 0);
  const totalDeposits = deposits.filter(d => d.status === "approved").reduce((s, d) => s + Number(d.amount), 0);
  const totalWithdrawals = withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + Number(w.amount), 0);
  const pendingDeposits = deposits.filter(d => d.status === "pending").length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
  const bannedUsers = allUsers.filter(u => u.isBanned).length;
  const activeUsers = allUsers.filter(u => !u.isBanned).length;

  const stats = [
    { label: t("admin.totalUsers"), value: allUsers.length, icon: Users, color: "#3B82F6" },
    { label: t("admin.activeBlocked"), value: `${activeUsers} / ${bannedUsers}`, icon: Shield, color: "hsl(var(--emerald-500, 142 71% 45%))" },
    { label: t("admin.totalBalance"), value: `${totalBalance.toFixed(2)} USDT`, icon: DollarSign, color: "hsl(var(--primary))" },
    { label: t("admin.totalDeposits"), value: `${totalDeposits.toFixed(2)} USDT`, icon: ArrowDownCircle, color: "hsl(var(--emerald-500, 142 71% 45%))" },
    { label: t("admin.totalWithdrawals"), value: `${totalWithdrawals.toFixed(2)} USDT`, icon: ArrowUpCircle, color: "hsl(var(--primary))" },
    { label: t("admin.pendingDeposits"), value: pendingDeposits, icon: Activity, color: "#FFB300" },
    { label: t("admin.pendingWithdrawals"), value: pendingWithdrawals, icon: Activity, color: "#FFB300" },
    { label: t("admin.vipUsers"), value: allUsers.filter(u => u.vipLevel > 0).length, icon: Crown, color: "#FFB300" },
  ];

  const vipDistribution = (() => {
    const levels: Record<number, number> = {};
    allUsers.forEach(u => { levels[u.vipLevel] = (levels[u.vipLevel] || 0) + 1; });
    return Object.entries(levels)
      .map(([level, count]) => ({ level: Number(level), count, name: getVipName(Number(level), locale) }))
      .sort((a, b) => a.level - b.level);
  })();
  const vipMax = Math.max(...vipDistribution.map(v => v.count), 1);

  const last7DaysFinance = (() => {
    const days: { label: string; deposits: number; withdrawals: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString(locale === "uz" ? "uz-UZ" : locale === "ru" ? "ru-RU" : "en-US", { day: "2-digit", month: "2-digit" });
      const dayDeposits = deposits.filter(dep => dep.status === "approved" && new Date(dep.createdAt).toISOString().slice(0, 10) === dateStr).reduce((s, dep) => s + Number(dep.amount), 0);
      const dayWithdrawals = withdrawals.filter(w => w.status === "approved" && new Date(w.createdAt).toISOString().slice(0, 10) === dateStr).reduce((s, w) => s + Number(w.amount), 0);
      days.push({ label: dayLabel, deposits: dayDeposits, withdrawals: dayWithdrawals });
    }
    return days;
  })();
  const financeMax = Math.max(...last7DaysFinance.map(d => Math.max(d.deposits, d.withdrawals)), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-card rounded-xl p-4 border border-border/50 hover:border-border transition-colors" data-testid={`stat-${i}`}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-foreground font-bold text-xl tracking-tight">{s.value}</p>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border/50" data-testid="chart-vip-distribution">
          <h3 className="text-foreground text-sm font-semibold mb-3 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            {t("admin.vipDistribution")}
          </h3>
          <div className="space-y-2">
            {vipDistribution.map(v => (
              <div key={v.level} className="flex items-center gap-2">
                <span className="text-muted-foreground text-[10px] w-14 shrink-0 truncate">{v.name}</span>
                <div className="flex-1 h-5 bg-muted/30 rounded-md overflow-hidden">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-amber-500/70 to-amber-400/50 flex items-center justify-end px-1.5 transition-all"
                    style={{ width: `${Math.max((v.count / vipMax) * 100, 8)}%` }}
                  >
                    <span className="text-[9px] font-bold text-foreground">{v.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-4 border border-border/50" data-testid="chart-finance-7days">
          <h3 className="text-foreground text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            {t("admin.financeLast7Days")}
          </h3>
          <div className="flex items-end gap-1 h-28">
            {last7DaysFinance.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end justify-center gap-[2px] h-[80px]">
                  <div
                    className="w-[38%] rounded-t-sm bg-emerald-500/60"
                    style={{ height: `${Math.max(day.deposits > 0 ? 6 : 2, (day.deposits / financeMax) * 72)}px` }}
                    title={`${t("admin.totalDeposits")}: ${day.deposits.toFixed(2)}`}
                  />
                  <div
                    className="w-[38%] rounded-t-sm bg-primary/60"
                    style={{ height: `${Math.max(day.withdrawals > 0 ? 6 : 2, (day.withdrawals / financeMax) * 72)}px` }}
                    title={`${t("admin.totalWithdrawals")}: ${day.withdrawals.toFixed(2)}`}
                  />
                </div>
                <span className="text-[8px] text-muted-foreground">{day.label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" />
              <span className="text-[9px] text-muted-foreground">{t("admin.totalDeposits")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-primary/60" />
              <span className="text-[9px] text-muted-foreground">{t("admin.totalWithdrawals")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
