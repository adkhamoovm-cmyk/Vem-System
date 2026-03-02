import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Zap, ChevronRight, Coffee, TrendingUp } from "lucide-react";
import type { User } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

interface TasksWidgetProps {
  user: User;
}

export function TasksWidget({ user }: TasksWidgetProps) {
  const { t } = useI18n();
  const tasksProgress = user.dailyTasksLimit > 0
    ? (user.dailyTasksCompleted / user.dailyTasksLimit) * 100
    : 0;

  return (
    <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
      {new Date().getDay() === 0 ? (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500/15 to-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
            <Coffee className="w-5 h-5 text-amber-500" />
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
              <div className="w-8 h-8 bg-gradient-to-br from-primary/15 to-blue-500/10 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground text-sm font-semibold">{t("dashboard.todayTasks")}</span>
            </div>
            <span className="text-primary text-sm font-bold bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/15" data-testid="text-tasks-progress">
              {user.dailyTasksCompleted} / {user.dailyTasksLimit}
            </span>
          </div>
          <div className="relative">
            <Progress
              value={tasksProgress}
              className="h-2.5 bg-muted/50 rounded-full"
              data-testid="progress-tasks"
            />
          </div>
          <div className="flex items-center justify-between mt-2.5">
            <p className="text-muted-foreground text-xs">
              {user.vipLevel < 0
                ? t("common.notEmployee")
                : user.dailyTasksCompleted < user.dailyTasksLimit
                  ? t("dashboard.videosLeft", { count: user.dailyTasksLimit - user.dailyTasksCompleted })
                  : t("dashboard.limitReached")}
            </p>
            <Link href="/tasks">
              <span className="text-white text-xs font-semibold flex items-center gap-0.5 cursor-pointer bg-gradient-to-r from-primary to-blue-600 px-3 py-1.5 rounded-lg shadow-sm shadow-primary/20 active:scale-95 transition-transform" data-testid="link-start-tasks">
                {t("dashboard.start")} <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

interface WeeklyEarningsProps {
  weeklyEarnings: { label: string; amount: number }[];
  weeklyMax: number;
  weeklyTotal: number;
}

export function WeeklyEarningsChart({ weeklyEarnings, weeklyMax, weeklyTotal }: WeeklyEarningsProps) {
  const { t } = useI18n();

  return (
    <div className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm animate-fade-up" style={{ animationDelay: "0.25s", animationFillMode: "both" }} data-testid="weekly-earnings-chart">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/15 to-green-500/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-foreground text-sm font-semibold">{t("dashboard.weeklyEarnings")}</span>
        </div>
        <span className="text-emerald-500 text-sm font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/15">
          +{weeklyTotal.toFixed(2)}
        </span>
      </div>
      <div className="flex items-end gap-1.5 h-24">
        {weeklyEarnings.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col items-center justify-end h-[72px]">
              {day.amount > 0 && (
                <span className="text-[8px] text-emerald-500 font-bold mb-0.5">{day.amount.toFixed(2)}</span>
              )}
              <div
                className={`w-full max-w-[28px] rounded-md transition-all ${
                  i === 6
                    ? "bg-gradient-to-t from-primary to-blue-400"
                    : day.amount > 0
                      ? "bg-emerald-500/60"
                      : "bg-muted/50"
                }`}
                style={{ height: `${Math.max(day.amount > 0 ? 12 : 4, (day.amount / weeklyMax) * 56)}px` }}
              />
            </div>
            <span className={`text-[9px] font-medium ${i === 6 ? "text-primary" : "text-muted-foreground"}`}>{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
