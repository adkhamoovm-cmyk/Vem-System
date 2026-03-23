import { useEffect, useState, useCallback, useRef } from "react";
import { Crown, TrendingUp, Star, Zap, X, ArrowDownLeft, Timer, BarChart3, Coins, Award, CheckCircle2, Layers } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface CelebrationData {
  type: "vip_activated" | "vip_extended" | "fund_invested";
  packageName?: string;
  level?: number;
  dailyTasks?: number;
  durationDays?: number;
  perVideoReward?: string;
  refundAmount?: string | null;
  planName?: string;
  amount?: number;
  dailyProfit?: string;
  dailyRoi?: string;
}

interface CelebrationModalProps {
  data: CelebrationData | null;
  onClose: () => void;
}

export default function CelebrationModal({ data, onClose }: CelebrationModalProps) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setShowItems(false);
    setShowContent(false);
    setTimeout(() => {
      setShow(false);
      document.body.style.overflow = "";
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (data) {
      setShow(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => setShowContent(true), 50);
      setTimeout(() => setShowItems(true), 400);

      const timer = setTimeout(() => handleClose(), 10000);
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") handleClose();
      };
      window.addEventListener("keydown", handleEsc);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = "";
      };
    }
  }, [data, handleClose]);

  useEffect(() => {
    if (showContent && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [showContent]);

  if (!data || !show) return null;

  const isVip = data.type === "vip_activated" || data.type === "vip_extended";
  const isFund = data.type === "fund_invested";

  const accentColor = isVip ? "primary" : "emerald-500";

  const vipStats = isVip ? [
    { icon: Award, label: t("celebration.level"), value: data.packageName || "", color: "#3B82F6" },
    { icon: Zap, label: t("celebration.dailyTasks"), value: `${data.dailyTasks} ${t("celebration.tasks")}`, color: "#8B5CF6" },
    { icon: Coins, label: t("celebration.perVideo"), value: `${data.perVideoReward} USDT`, color: "#10B981", highlight: true },
    { icon: Timer, label: t("celebration.duration"), value: `${data.durationDays} ${t("celebration.workDays")}`, color: "#F59E0B" },
  ] : [];

  const fundStats = isFund ? [
    { icon: Layers, label: t("celebration.fundPlan"), value: data.planName || "", color: "#3B82F6" },
    { icon: Coins, label: t("celebration.invested"), value: `${data.amount} USDT`, color: "#10B981", highlight: true },
    { icon: Star, label: t("celebration.dailyProfit"), value: `+${data.dailyProfit} USDT`, color: "#F59E0B", highlight: true },
    { icon: BarChart3, label: t("celebration.roi"), value: `${data.dailyRoi}% / ${t("celebration.day")}`, color: "#8B5CF6" },
  ] : [];

  const stats = isVip ? vipStats : fundStats;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${showContent ? "bg-black/70 backdrop-blur-md" : "bg-transparent"}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("celebration.congratulations")}
      data-testid="celebration-overlay"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative w-full max-w-[340px] transition-all duration-500 ease-out outline-none ${showContent ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-8"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-lg"
          data-testid="celebration-close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="rounded-2xl overflow-hidden bg-card border border-border/50 shadow-2xl">
          <div className="relative px-6 pt-8 pb-6 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/4 to-transparent" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-32 bg-gradient-to-b from-primary/10 to-transparent rounded-full blur-3xl" />

            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-600/20 animate-pulse" />
                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25">
                  {isVip ? (
                    <Crown className="w-7 h-7 text-white" />
                  ) : (
                    <TrendingUp className="w-7 h-7 text-white" />
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <h2 className="text-xl font-bold text-foreground mb-1" data-testid="celebration-title">
                {t("celebration.congratulations")}
              </h2>

              <p className="text-muted-foreground text-sm" data-testid="celebration-subtitle">
                {isVip
                  ? (data.type === "vip_extended"
                    ? t("celebration.vipExtended", { name: data.packageName || "" })
                    : t("celebration.vipActivated", { name: data.packageName || "" }))
                  : t("celebration.fundInvested", { name: data.planName || "" })
                }
              </p>
            </div>
          </div>

          <div className="px-4 pb-4 space-y-2">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={`flex items-center justify-between py-3 px-3.5 rounded-xl border transition-all duration-500 ${showItems ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${stat.highlight ? "bg-card border-border/80" : "bg-card/50 border-border/40"}`}
                style={{ transitionDelay: `${i * 80}ms` }}
                data-testid={`celebration-stat-${i}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + "15" }}>
                    <stat.icon className="w-4.5 h-4.5" style={{ color: stat.color }} />
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <span className={`text-sm font-semibold ${stat.highlight ? "text-emerald-500" : "text-foreground"}`}>
                  {stat.value}
                </span>
              </div>
            ))}

            {isVip && data.refundAmount && (
              <div
                className={`flex items-center justify-between py-3 px-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20 transition-all duration-500 ${showItems ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                style={{ transitionDelay: `${stats.length * 80}ms` }}
                data-testid="celebration-stat-refund"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                    <ArrowDownLeft className="w-4.5 h-4.5 text-emerald-500" />
                  </div>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400">{t("celebration.refund")}</span>
                </div>
                <span className="text-sm font-bold text-emerald-500">+{data.refundAmount} USDT</span>
              </div>
            )}

            <button
              onClick={handleClose}
              className={`w-full mt-2 h-11 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all duration-500 ${showItems ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
              style={{ transitionDelay: `${(stats.length + 1) * 80}ms` }}
              data-testid="celebration-continue"
            >
              {t("celebration.continue")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
