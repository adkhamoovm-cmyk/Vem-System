import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, TrendingUp, Users, Briefcase, Gift, Shield, Calendar, DollarSign, BarChart3 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ReportData {
  today: number;
  yesterday: number;
  weekly: number;
  total: number;
  categories: {
    task: number;
    referral: number;
    fund: number;
    promo: number;
    admin: number;
  };
  days: { date: string; amount: number }[];
}

type Period = "1" | "7" | "30" | "all";

export default function ReportsPage() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState<Period>("30");

  const { data: report, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/reports/earnings", period],
    queryFn: async () => {
      const res = await fetch(`/api/reports/earnings?period=${period}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const periods: { key: Period; label: string }[] = [
    { key: "1", label: t("reports.periodToday") },
    { key: "7", label: t("reports.periodWeek") },
    { key: "30", label: t("reports.period30") },
    { key: "all", label: t("reports.periodAll") },
  ];

  const maxDay = Math.max(...(report?.days || []).map(d => d.amount), 0.01);

  const totalLabel = period === "1" ? t("reports.todayTotal")
    : period === "7" ? t("reports.weeklyTotal")
    : period === "30" ? t("reports.monthlyTotal")
    : t("reports.allTimeTotal");

  const categoryItems = [
    { key: "task" as const, label: t("reports.taskEarnings"), icon: TrendingUp, color: "from-emerald-500 to-green-600", textColor: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { key: "referral" as const, label: t("reports.referralEarnings"), icon: Users, color: "from-blue-500 to-cyan-600", textColor: "text-blue-500", bgColor: "bg-blue-500/10" },
    { key: "fund" as const, label: t("reports.fundEarnings"), icon: Briefcase, color: "from-violet-500 to-purple-600", textColor: "text-violet-500", bgColor: "bg-violet-500/10" },
    { key: "promo" as const, label: t("reports.promoEarnings"), icon: Gift, color: "from-amber-500 to-orange-600", textColor: "text-amber-500", bgColor: "bg-amber-500/10" },
    { key: "admin" as const, label: t("reports.adminEarnings"), icon: Shield, color: "from-rose-500 to-red-600", textColor: "text-rose-500", bgColor: "bg-rose-500/10" },
  ];

  return (
    <div className="bg-background min-h-screen">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/dashboard")} className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center" data-testid="button-back">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-foreground font-bold text-lg">{t("reports.title")}</h1>
            <p className="text-muted-foreground text-xs">{t("reports.subtitle")}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-sm">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="flex gap-2 bg-muted/30 rounded-xl p-1">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                period === p.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`period-${p.key}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-muted rounded-2xl" />
            <div className="grid grid-cols-3 gap-3">
              <div className="h-20 bg-muted rounded-xl" />
              <div className="h-20 bg-muted rounded-xl" />
              <div className="h-20 bg-muted rounded-xl" />
            </div>
            {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}
          </div>
        ) : report ? (
          <>
            <div className="bg-gradient-to-br from-primary/10 via-blue-500/5 to-violet-500/10 rounded-2xl p-5 border border-primary/20">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground text-xs font-medium">
                  {totalLabel}
                </span>
              </div>
              <p className="text-foreground text-3xl font-bold">${report.total.toFixed(2)}</p>
              <p className="text-primary text-xs mt-1 font-medium">USDT</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
                <p className="text-muted-foreground text-[10px] mb-1">{t("reports.today")}</p>
                <p className="text-emerald-500 font-bold text-lg">${report.today.toFixed(2)}</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
                <p className="text-muted-foreground text-[10px] mb-1">{t("reports.yesterday")}</p>
                <p className="text-blue-500 font-bold text-lg">${report.yesterday.toFixed(2)}</p>
              </div>
              <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
                <p className="text-muted-foreground text-[10px] mb-1">{t("reports.week")}</p>
                <p className="text-violet-500 font-bold text-lg">${report.weekly.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-foreground text-xs font-bold">{t("reports.dailyChart")}</span>
              </div>
              <div className="flex items-end gap-[3px] h-24">
                {report.days.map((day, i) => {
                  const height = maxDay > 0 ? Math.max((day.amount / maxDay) * 100, 2) : 2;
                  const isToday = i === report.days.length - 1;
                  return (
                    <div key={day.date} className="flex-1 flex flex-col items-center gap-1" title={`${day.date}: $${day.amount.toFixed(2)}`}>
                      <div
                        className={`w-full rounded-t-sm transition-all ${isToday ? "bg-primary" : "bg-primary/30"}`}
                        style={{ height: `${height}%`, minHeight: "2px" }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {report.days.length > 0 && (
                  <>
                    <span className="text-muted-foreground text-[8px]">{report.days[0].date.slice(5)}</span>
                    <span className="text-muted-foreground text-[8px]">{report.days[report.days.length - 1].date.slice(5)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/30">
                <span className="text-foreground text-xs font-bold">{t("reports.earningTypes")}</span>
              </div>
              <div className="divide-y divide-border/30">
                {categoryItems.map(item => {
                  const amount = report.categories[item.key];
                  const pct = report.total > 0 ? ((amount / report.total) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={item.key} className="flex items-center gap-3 px-4 py-3" data-testid={`category-${item.key}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${item.color} shadow-sm`}>
                        <item.icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-xs font-semibold">{item.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(Number(pct), 100)}%`, backgroundColor: item.key === "task" ? "#10b981" : item.key === "referral" ? "#3b82f6" : item.key === "fund" ? "#8b5cf6" : item.key === "promo" ? "#f59e0b" : "#ef4444" }}
                            />
                          </div>
                          <span className="text-muted-foreground text-[10px] font-medium w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${item.textColor}`}>
                        ${amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
                <span className="text-foreground text-xs font-bold">{t("reports.totalLabel")}</span>
                <span className="text-primary text-base font-bold">${report.total.toFixed(2)} USDT</span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}