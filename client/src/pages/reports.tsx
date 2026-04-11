import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, TrendingUp, Users, Briefcase, Gift, Shield,
  Calendar, DollarSign, BarChart3, ArrowUpRight, ArrowDownRight,
  Minus, Activity, PieChart, Clock
} from "lucide-react";
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

function MiniDonut({ categories, total }: { categories: ReportData["categories"]; total: number }) {
  const items = [
    { key: "task", color: "#10b981", value: categories.task },
    { key: "referral", color: "#3b82f6", value: categories.referral },
    { key: "fund", color: "#8b5cf6", value: categories.fund },
    { key: "promo", color: "#f59e0b", value: categories.promo },
    { key: "admin", color: "#ef4444", value: categories.admin },
  ].filter(i => i.value > 0);

  if (items.length === 0) {
    return (
      <svg viewBox="0 0 36 36" className="w-20 h-20">
        <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="3.5" />
      </svg>
    );
  }

  let cumulative = 0;
  const segments = items.map(item => {
    const pct = total > 0 ? (item.value / total) * 100 : 0;
    const dashArray = `${pct * 0.88} ${88 - pct * 0.88}`;
    const dashOffset = 88 - cumulative * 0.88 + 22;
    cumulative += pct;
    return { ...item, dashArray, dashOffset, pct };
  });

  return (
    <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--muted)/0.3)" strokeWidth="3.5" />
      {segments.map((seg) => (
        <circle
          key={seg.key}
          cx="18" cy="18" r="14"
          fill="none"
          stroke={seg.color}
          strokeWidth="3.5"
          strokeDasharray={seg.dashArray}
          strokeDashoffset={seg.dashOffset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      ))}
    </svg>
  );
}

function GrowthIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) {
    return (
      <div className="flex items-center gap-0.5 text-muted-foreground">
        <Minus className="w-3 h-3" />
        <span className="text-[10px] font-medium">0%</span>
      </div>
    );
  }
  if (previous === 0) {
    return (
      <div className="flex items-center gap-0.5 text-emerald-500">
        <ArrowUpRight className="w-3 h-3" />
        <span className="text-[10px] font-bold">+100%</span>
      </div>
    );
  }
  const pctChange = ((current - previous) / previous) * 100;
  const isUp = pctChange >= 0;
  return (
    <div className={`flex items-center gap-0.5 ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
      {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      <span className="text-[10px] font-bold">{isUp ? "+" : ""}{pctChange.toFixed(1)}%</span>
    </div>
  );
}

export default function ReportsPage() {
  const { t } = useI18n();
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState<Period>("30");
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  const { data: report, isLoading, isError } = useQuery<ReportData>({
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

  const maxDay = useMemo(() => Math.max(...(report?.days || []).map(d => d.amount), 0.01), [report?.days]);

  const totalLabel = period === "1" ? t("reports.todayTotal")
    : period === "7" ? t("reports.weeklyTotal")
    : period === "30" ? t("reports.monthlyTotal")
    : t("reports.allTimeTotal");

  const categoryItems = [
    { key: "task" as const, label: t("reports.taskEarnings"), icon: TrendingUp, gradient: "from-emerald-500 to-green-600", textColor: "text-emerald-500", dotColor: "#10b981" },
    { key: "referral" as const, label: t("reports.referralEarnings"), icon: Users, gradient: "from-blue-500 to-cyan-600", textColor: "text-blue-500", dotColor: "#3b82f6" },
    { key: "fund" as const, label: t("reports.fundEarnings"), icon: Briefcase, gradient: "from-violet-500 to-purple-600", textColor: "text-violet-500", dotColor: "#8b5cf6" },
    { key: "promo" as const, label: t("reports.promoEarnings"), icon: Gift, gradient: "from-amber-500 to-orange-600", textColor: "text-amber-500", dotColor: "#f59e0b" },
    { key: "admin" as const, label: t("reports.adminEarnings"), icon: Shield, gradient: "from-rose-500 to-red-600", textColor: "text-rose-500", dotColor: "#ef4444" },
  ];

  const activeCats = useMemo(() => {
    if (!report) return [];
    return categoryItems.filter(c => report.categories[c.key] > 0);
  }, [report]);

  return (
    <div className="bg-background min-h-screen pb-8">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate("/dashboard")} className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center active:scale-95 transition-transform" data-testid="button-back">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-foreground font-bold text-lg tracking-tight">{t("reports.title")}</h1>
            <p className="text-muted-foreground text-[11px]">{t("reports.subtitle")}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        <div className="flex gap-1.5 bg-muted/30 rounded-2xl p-1 border border-border/30">
          {periods.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-300 ${
                period === p.key
                  ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/25 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
              data-testid={`period-${p.key}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-40 bg-muted/50 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-3 gap-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-muted/50 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />)}
            </div>
            <div className="h-44 bg-muted/50 rounded-2xl animate-pulse" style={{ animationDelay: "300ms" }} />
            <div className="h-72 bg-muted/50 rounded-2xl animate-pulse" style={{ animationDelay: "400ms" }} />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-rose-500" />
            </div>
            <p className="text-foreground font-semibold text-sm mb-1">{t("reports.title")}</p>
            <p className="text-muted-foreground text-xs">Ma'lumotlarni yuklashda xatolik yuz berdi</p>
          </div>
        ) : report ? (
          <>
            <div className="relative overflow-hidden rounded-2xl border border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-blue-500/4 to-violet-500/8" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500/5 rounded-full translate-y-6 -translate-x-6 blur-2xl" />
              <div className="relative p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
                        <DollarSign className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground text-[11px] font-medium">{totalLabel}</span>
                    </div>
                    <p className="text-foreground text-[32px] font-extrabold tracking-tight leading-none">${report.total.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-primary/80 text-[10px] font-semibold bg-primary/8 px-2 py-0.5 rounded-md">USDT</span>
                      <GrowthIndicator current={report.today} previous={report.yesterday} />
                    </div>
                  </div>
                  <MiniDonut categories={report.categories} total={report.total} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: t("reports.today"), value: report.today, color: "emerald", icon: ArrowUpRight },
                { label: t("reports.yesterday"), value: report.yesterday, color: "blue", icon: Clock },
                { label: t("reports.week"), value: report.weekly, color: "violet", icon: Calendar },
              ].map((item, idx) => (
                <div key={idx} className="relative overflow-hidden bg-card rounded-2xl p-3 border border-border/40 group hover:border-border transition-colors">
                  <div className={`absolute top-0 right-0 w-12 h-12 bg-${item.color}-500/5 rounded-full -translate-y-4 translate-x-4`} />
                  <div className="relative">
                    <div className="flex items-center gap-1 mb-2">
                      <item.icon className={`w-3 h-3 text-${item.color}-500/60`} />
                      <p className="text-muted-foreground text-[9px] font-medium uppercase tracking-wider">{item.label}</p>
                    </div>
                    <p className={`text-${item.color}-500 font-bold text-base tracking-tight`}>${item.value.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-2xl border border-border/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-foreground text-xs font-bold">{t("reports.dailyChart")}</span>
                </div>
                {hoveredBar !== null && report.days[hoveredBar] && (
                  <div className="bg-primary/10 rounded-lg px-2 py-0.5 animate-in fade-in">
                    <span className="text-primary text-[10px] font-bold">${report.days[hoveredBar].amount.toFixed(2)}</span>
                  </div>
                )}
              </div>
              <div className="px-4 py-4">
                <div className="flex items-end gap-[3px] h-28">
                  {report.days.map((day, i) => {
                    const height = maxDay > 0 ? Math.max((day.amount / maxDay) * 100, 3) : 3;
                    const isToday = i === report.days.length - 1;
                    const isHovered = hoveredBar === i;
                    const hasValue = day.amount > 0;
                    return (
                      <div
                        key={day.date}
                        className="flex-1 flex flex-col items-center cursor-pointer group"
                        onMouseEnter={() => setHoveredBar(i)}
                        onMouseLeave={() => setHoveredBar(null)}
                        onTouchStart={() => setHoveredBar(i)}
                        onTouchEnd={() => setTimeout(() => setHoveredBar(null), 1500)}
                        data-testid={`chart-bar-${i}`}
                      >
                        <div className="w-full flex items-end h-28">
                          <div
                            className={`w-full rounded-t-[3px] transition-all duration-300 ${
                              isHovered
                                ? "bg-primary shadow-lg shadow-primary/30"
                                : isToday
                                  ? "bg-gradient-to-t from-primary to-primary/80"
                                  : hasValue
                                    ? "bg-primary/25 group-hover:bg-primary/45"
                                    : "bg-muted/40"
                            }`}
                            style={{ height: `${height}%`, minHeight: "3px" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 px-0.5">
                  {report.days.length > 0 && (
                    <>
                      <span className="text-muted-foreground text-[9px] font-medium">{report.days[0].date.slice(5)}</span>
                      {report.days.length > 7 && (
                        <span className="text-muted-foreground text-[9px] font-medium">{report.days[Math.floor(report.days.length / 2)].date.slice(5)}</span>
                      )}
                      <span className="text-muted-foreground text-[9px] font-medium">{report.days[report.days.length - 1].date.slice(5)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border/40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <PieChart className="w-3.5 h-3.5 text-violet-500" />
                  </div>
                  <span className="text-foreground text-xs font-bold">{t("reports.earningTypes")}</span>
                </div>
                <span className="text-muted-foreground text-[10px] font-medium">{activeCats.length}/{categoryItems.length}</span>
              </div>

              <div className="divide-y divide-border/20">
                {categoryItems.map((item, idx) => {
                  const amount = report.categories[item.key];
                  const pct = report.total > 0 ? ((amount / report.total) * 100) : 0;
                  const isActive = amount > 0;
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center gap-3 px-4 py-3.5 transition-all duration-300 ${isActive ? "" : "opacity-40"}`}
                      data-testid={`category-${item.key}`}
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${item.gradient} shadow-sm ${isActive ? "shadow-md" : "grayscale"}`}>
                        <item.icon className="w-[18px] h-[18px] text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-foreground text-[11px] font-semibold">{item.label}</p>
                          <span className={`text-sm font-bold tabular-nums ${isActive ? item.textColor : "text-muted-foreground"}`}>
                            ${amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-[5px] bg-muted/60 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                backgroundColor: isActive ? item.dotColor : "transparent",
                              }}
                            />
                          </div>
                          <span className="text-muted-foreground text-[9px] font-semibold tabular-nums w-9 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-4 py-3.5 border-t border-border/40 bg-gradient-to-r from-muted/20 to-muted/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-foreground text-xs font-bold">{t("reports.totalLabel")}</span>
                </div>
                <span className="text-primary text-base font-extrabold tabular-nums tracking-tight">${report.total.toFixed(2)} <span className="text-[10px] font-semibold text-primary/70">USDT</span></span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}