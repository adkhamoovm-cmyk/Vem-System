import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Lock, TrendingUp, DollarSign, Infinity, ArrowRight, X, CheckCircle, Sprout, Gem, Trophy, AlertTriangle, ShieldAlert, KeyRound, ChevronRight, ChevronLeft, BarChart3, Calendar, ArrowUpRight } from "lucide-react";
import type { User, FundPlan, Investment } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

const planIcons: Record<string, typeof Sprout> = {
  F1: Sprout, F2: Gem, F3: Trophy, F4: Infinity,
};

const planColors: Record<string, { gradient: string; bg: string; accent: string; light: string }> = {
  F1: { gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-500/10", accent: "#10B981", light: "#10B98112" },
  F2: { gradient: "from-blue-500 to-blue-600", bg: "bg-blue-500/10", accent: "#3B82F6", light: "#3B82F612" },
  F3: { gradient: "from-amber-500 to-amber-600", bg: "bg-amber-500/10", accent: "#F59E0B", light: "#F59E0B12" },
  F4: { gradient: "from-purple-500 to-purple-600", bg: "bg-purple-500/10", accent: "#8B5CF6", light: "#8B5CF612" },
};

type ModalStep = "amount" | "pin";

export default function FundPage() {
  const { t, translateServerMessage } = useI18n();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<FundPlan | null>(null);
  const [modalStep, setModalStep] = useState<ModalStep>("amount");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: plans, isLoading: plansLoading } = useQuery<FundPlan[]>({
    queryKey: ["/api/fund-plans"],
  });

  const { data: myInvestments, isLoading: investmentsLoading } = useQuery<Investment[]>({
    queryKey: ["/api/investments"],
  });

  const investMutation = useMutation({
    mutationFn: async ({ fundPlanId, amount, fundPassword }: { fundPlanId: string; amount: number; fundPassword: string }) => {
      const res = await apiRequest("POST", "/api/fund/invest", { fundPlanId, amount, fundPassword });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance-history"] });
      closeModal();
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
    },
    onError: (error: Error) => {
      setPin("");
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const closeModal = () => {
    setSelectedPlan(null);
    setModalStep("amount");
    setAmount("");
    setPin("");
    setShowWarning(false);
  };

  const handleOpenPlan = (plan: FundPlan) => {
    if (hasActiveInvestment) {
      setShowWarning(true);
      return;
    }
    setSelectedPlan(plan);
    setModalStep("amount");
    setAmount("");
    setPin("");
  };

  const handleNextStep = () => {
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      toast({ title: t("common.error"), description: t("fund.invalidAmount"), variant: "destructive" });
      return;
    }
    if (selectedPlan && num < Number(selectedPlan.minDeposit)) {
      toast({ title: t("common.error"), description: `${t("fund.min")}: $${Number(selectedPlan.minDeposit).toLocaleString()}`, variant: "destructive" });
      return;
    }
    if (selectedPlan?.maxDeposit && num > Number(selectedPlan.maxDeposit)) {
      toast({ title: t("common.error"), description: `${t("fund.max")}: $${Number(selectedPlan.maxDeposit).toLocaleString()}`, variant: "destructive" });
      return;
    }
    if (num > Number(user?.balance || 0)) {
      toast({ title: t("common.error"), description: t("fund.insufficientBalance"), variant: "destructive" });
      return;
    }
    setModalStep("pin");
  };

  const handleConfirmInvest = () => {
    if (!selectedPlan || !amount || !pin) return;
    if (pin.length !== 6) {
      toast({ title: t("common.error"), description: t("fund.fundCodeLength"), variant: "destructive" });
      return;
    }
    investMutation.mutate({ fundPlanId: selectedPlan.id, amount: Number(amount), fundPassword: pin });
  };

  const activeInvestments = myInvestments?.filter(i => i.status === "active") || [];
  const completedInvestments = myInvestments?.filter(i => i.status === "completed") || [];
  const hasActiveInvestment = activeInvestments.length > 0;
  const totalDailyProfit = activeInvestments.reduce((sum, i) => sum + Number(i.dailyProfit), 0);
  const totalInvested = activeInvestments.reduce((sum, i) => sum + Number(i.investedAmount), 0);

  const daysUntilExpiry = activeInvestments[0]?.daysLeft != null
    ? activeInvestments[0].daysLeft
    : (activeInvestments[0]?.endDate
      ? Math.max(0, Math.floor((new Date(String(activeInvestments[0].endDate)).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null);

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-5 shadow-xl shadow-primary/20 animate-fade-up" style={{ animationDelay: "0.05s", animationFillMode: "both" }} data-testid="fund-header">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{t("fund.title")}</h1>
              <p className="text-white/50 text-xs">{t("fund.subtitle")}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center border border-white/5">
              <p className="text-[10px] text-white/50 uppercase tracking-wider">{t("common.balance")}</p>
              <p className="text-sm font-bold text-white mt-0.5" data-testid="text-fund-balance">${Number(user?.balance || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center border border-white/5">
              <p className="text-[10px] text-white/50 uppercase tracking-wider">{t("fund.totalInvested")}</p>
              <p className="text-sm font-bold text-white mt-0.5" data-testid="text-total-invested">${totalInvested.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 text-center border border-white/5">
              <p className="text-[10px] text-white/50 uppercase tracking-wider">{t("fund.dailyProfit")}</p>
              <p className="text-sm font-bold text-emerald-300 mt-0.5" data-testid="text-daily-profit">+${totalDailyProfit.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {hasActiveInvestment && (
        <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3" data-testid="active-investment-warning">
          <div className="w-9 h-9 bg-amber-500/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="text-amber-500 font-bold text-sm">{t("fund.activeWarningTitle")}</p>
            <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">
              {t("fund.activeWarningLine1")} {daysUntilExpiry !== null
                ? t("fund.activeWarningLine2Days", { days: daysUntilExpiry })
                : t("fund.activeWarningLine2Forever")
              }
            </p>
          </div>
        </div>
      )}

      {activeInvestments.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            {t("fund.activeInvestments")}
          </h2>
          <div className="space-y-3">
            {activeInvestments.map((inv: any) => {
              const plan = plans?.find(p => p.id === inv.fundPlanId);
              const colors = planColors[plan?.name || "F1"] || planColors.F1;
              const daysLeft = inv.daysLeft != null ? inv.daysLeft : (inv.endDate
                ? Math.max(0, Math.floor((new Date(inv.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : null);
              const totalEarned = Number(inv.totalEarned || 0);
              const daysPassed = inv.daysPassed || 0;
              const maxDays = inv.maxDays || (plan?.lockDays || 0);
              const progress = maxDays > 0 ? Math.min(100, (daysPassed / maxDays) * 100) : 0;
              return (
                <div key={inv.id} className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm" data-testid={`investment-${inv.id}`}>
                  <div className={`bg-gradient-to-r ${colors.gradient} px-4 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        {(() => { const Icon = planIcons[plan?.name || "F1"] || Sprout; return <Icon className="w-5 h-5 text-white" />; })()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-white">{plan?.name || "Fund"}</p>
                        <p className="text-[10px] text-white/60">
                          {new Date(inv.startDate).toLocaleDateString("uz-UZ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-white">${Number(inv.investedAmount).toFixed(2)}</p>
                      <p className="text-[10px] text-white/70 font-medium">+${Number(inv.dailyProfit).toFixed(2)}/{t("common.days")}</p>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl p-2.5 border" style={{ backgroundColor: colors.light, borderColor: colors.accent + "15" }}>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{t("fund.earnedProfit")}</p>
                        <p className="text-sm font-bold text-emerald-500 mt-0.5">+${totalEarned.toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl p-2.5 border" style={{ backgroundColor: colors.light, borderColor: colors.accent + "15" }}>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{t("fund.daysPassed")}</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{daysPassed} / {maxDays || "∞"} {t("common.days")}</p>
                      </div>
                    </div>

                    {maxDays > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{t("fund.progress")}</span>
                          <span className="font-bold" style={{ color: colors.accent }}>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}cc)` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border border-border/30">
                      <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        <span className="font-medium text-emerald-500">{t("common.active")}</span>
                      </span>
                      <span className="font-medium text-foreground">
                        {daysLeft !== null ? t("fund.daysLeft", { days: daysLeft }) : t("fund.forever")}
                      </span>
                      <span className={`font-medium ${plan?.returnPrincipal ? "text-emerald-500" : "text-amber-500"}`}>
                        {plan?.returnPrincipal ? t("fund.moneyReturns") : t("fund.moneyNoReturn")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 text-primary" />
          </div>
          {t("fund.plans")}
        </h2>
        <div className="space-y-3">
          {plans?.sort((a, b) => Number(a.minDeposit) - Number(b.minDeposit)).map((plan) => {
            const colors = planColors[plan.name] || planColors.F1;
            const isBlocked = hasActiveInvestment;
            return (
              <div
                key={plan.id}
                className={`bg-card rounded-2xl border overflow-hidden shadow-sm transition-all ${isBlocked ? "opacity-50 border-border/30" : "border-border/50 hover:border-border"}`}
                data-testid={`card-plan-${plan.name}`}
              >
                <div className={`bg-gradient-to-r ${colors.gradient} px-4 py-3.5 flex items-center justify-between`}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                      {(() => { const Icon = planIcons[plan.name] || Sprout; return <Icon className="w-5 h-5 text-white" />; })()}
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base">{plan.name}</h3>
                      <p className="text-white/60 text-[11px]">
                        {plan.lockDays ? t("fund.lockDays", { days: plan.lockDays }) : t("fund.forever")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">{plan.dailyRoi}%</p>
                    <p className="text-white/50 text-[10px] uppercase tracking-wider">{t("fund.dailyRoi")}</p>
                  </div>
                </div>

                <div className="p-3.5 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl p-2.5 text-center border" style={{ backgroundColor: colors.light, borderColor: colors.accent + "15" }}>
                      <Calendar className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: colors.accent }} />
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{t("fund.lockPeriod")}</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">{plan.lockDays ? `${plan.lockDays}d` : "∞"}</p>
                    </div>
                    <div className="rounded-xl p-2.5 text-center border" style={{ backgroundColor: colors.light, borderColor: colors.accent + "15" }}>
                      <ArrowUpRight className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: colors.accent }} />
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{t("fund.principal")}</p>
                      <p className={`text-xs font-bold mt-0.5 ${plan.returnPrincipal ? "text-emerald-500" : "text-amber-500"}`}>
                        {plan.returnPrincipal ? t("fund.returns") : t("fund.noReturn")}
                      </p>
                    </div>
                    <div className="rounded-xl p-2.5 text-center border" style={{ backgroundColor: colors.light, borderColor: colors.accent + "15" }}>
                      <DollarSign className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: colors.accent }} />
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{t("fund.min")}</p>
                      <p className="text-xs font-bold text-foreground mt-0.5">${Number(plan.minDeposit).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                    <span>{t("fund.depositRange")}: <span className="font-semibold text-foreground">${Number(plan.minDeposit).toLocaleString()} - {plan.maxDeposit ? `$${Number(plan.maxDeposit).toLocaleString()}` : t("fund.unlimited")}</span></span>
                  </div>

                  <Button
                    className={`w-full font-bold rounded-xl h-11 text-sm shadow-md transition-all ${isBlocked ? "bg-muted text-muted-foreground cursor-not-allowed" : `bg-gradient-to-r ${colors.gradient} text-white hover:shadow-lg`}`}
                    onClick={() => handleOpenPlan(plan)}
                    data-testid={`button-invest-${plan.name}`}
                    disabled={isBlocked}
                  >
                    {isBlocked
                      ? <><Lock className="w-4 h-4 mr-1.5" /> {t("fund.blocked")}</>
                      : <>{t("fund.invest")} <ArrowRight className="w-4 h-4 ml-1.5" /></>
                    }
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {completedInvestments.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            {t("fund.completedInvestments")}
          </h2>
          <div className="space-y-2">
            {completedInvestments.map((inv) => {
              const plan = plans?.find(p => p.id === inv.fundPlanId);
              const colors = planColors[plan?.name || "F1"] || planColors.F1;
              return (
                <div key={inv.id} className="bg-card rounded-xl border border-border/30 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center opacity-50" style={{ backgroundColor: colors.light }}>
                        {(() => { const Icon = planIcons[plan?.name || "F1"] || Sprout; return <Icon className="w-4 h-4" style={{ color: colors.accent }} />; })()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-muted-foreground">{plan?.name || "Fund"}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(inv.startDate).toLocaleDateString("uz-UZ")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-muted-foreground">${Number(inv.investedAmount).toFixed(2)}</p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                        {t("common.completed")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showWarning && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center" onClick={closeModal} data-testid="modal-active-warning">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                </div>
                {t("fund.cannotInvestTitle")}
              </h3>
              <button onClick={() => setShowWarning(false)} className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center" data-testid="button-close-warning">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 space-y-2">
              <p className="text-amber-500 font-bold text-sm">{t("fund.activeWarningBadge")}</p>
              <p className="text-foreground text-sm leading-relaxed">
                {t("fund.oneInvestmentRule")}
              </p>
              {activeInvestments[0] && (
                <div className="bg-card rounded-xl p-3 space-y-1.5 mt-2 border border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("fund.currentPlan")}</span>
                    <span className="font-bold text-foreground">{(activeInvestments[0] as any).planName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("fund.amount")}</span>
                    <span className="font-bold text-foreground">${Number(activeInvestments[0].investedAmount).toFixed(2)}</span>
                  </div>
                  {daysUntilExpiry !== null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("fund.remainingDays")}</span>
                      <span className="font-bold text-amber-500">{t("fund.daysCount", { days: daysUntilExpiry })}</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-muted-foreground text-xs mt-2">
                {t("fund.afterExpiryNote")}
              </p>
            </div>
            <Button className="w-full rounded-xl h-11 font-bold" onClick={() => setShowWarning(false)} data-testid="button-ok-warning">
              {t("fund.understood")}
            </Button>
          </div>
        </div>
      )}

      {selectedPlan && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center" onClick={closeModal} data-testid="modal-invest">
          <div className="bg-card w-full max-w-lg rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>

            {modalStep === "amount" && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: planColors[selectedPlan.name]?.light }}>
                      {(() => { const Icon = planIcons[selectedPlan.name] || Sprout; return <Icon className="w-4 h-4" style={{ color: planColors[selectedPlan.name]?.accent }} />; })()}
                    </div>
                    {t("fund.investIn", { plan: selectedPlan.name })}
                  </h3>
                  <button onClick={closeModal} className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center" data-testid="button-close-invest">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="bg-muted/30 rounded-xl p-3.5 space-y-2 text-sm border border-border/30">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("fund.dailyProfit")}:</span>
                    <span className="font-bold" style={{ color: planColors[selectedPlan.name]?.accent }}>{selectedPlan.dailyRoi}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("fund.lockPeriod")}</span>
                    <span className="font-semibold text-foreground">{selectedPlan.lockDays ? `${selectedPlan.lockDays} ${t("common.days")}` : t("fund.forever")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("fund.principal")}:</span>
                    <span className={`font-semibold ${selectedPlan.returnPrincipal ? "text-emerald-500" : "text-amber-500"}`}>{selectedPlan.returnPrincipal ? t("fund.returns") : t("fund.noReturn")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("fund.depositRange")}</span>
                    <span className="font-semibold text-foreground">
                      ${Number(selectedPlan.minDeposit).toLocaleString()} - {selectedPlan.maxDeposit ? `$${Number(selectedPlan.maxDeposit).toLocaleString()}` : t("fund.unlimited")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">{t("fund.enterAmount")}</label>
                  <input
                    type="number"
                    autoComplete="off"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`${t("fund.min")}: $${Number(selectedPlan.minDeposit).toLocaleString()}`}
                    className="w-full border border-border bg-transparent text-foreground rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary transition-colors"
                    data-testid="input-invest-amount"
                  />
                  {amount && Number(amount) > 0 && (
                    <div className="mt-2 bg-emerald-500/8 border border-emerald-500/15 rounded-lg px-3 py-2">
                      <p className="text-xs text-emerald-500 font-semibold">
                        {t("fund.dailyProfit")}: +${(Number(amount) * Number(selectedPlan.dailyRoi) / 100).toFixed(2)}
                        {selectedPlan.lockDays && (
                          <span className="text-muted-foreground ml-2">
                            | {t("fund.totalCalc", { amount: (Number(amount) * Number(selectedPlan.dailyRoi) / 100 * selectedPlan.lockDays).toFixed(2) })}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-xl px-3.5 py-2.5 border border-border/30">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    {t("common.balance")}:
                  </span>
                  <span className="font-bold text-foreground">${Number(user?.balance || 0).toFixed(2)}</span>
                </div>

                <Button
                  className={`w-full font-bold rounded-xl h-12 text-base shadow-lg bg-gradient-to-r ${planColors[selectedPlan.name]?.gradient || "from-primary to-blue-600"} text-white`}
                  onClick={handleNextStep}
                  disabled={!amount || Number(amount) <= 0}
                  data-testid="button-next-to-pin"
                >
                  {t("fund.continueBtn")} <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </>
            )}

            {modalStep === "pin" && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setModalStep("amount")} className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center" data-testid="button-back-to-amount">
                      <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-primary" />
                      {t("fund.enterFundCode")}
                    </h3>
                  </div>
                  <button onClick={closeModal} className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center" data-testid="button-close-pin">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("fund.currentPlan")}</span>
                    <span className="font-bold text-foreground">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("fund.amount")}</span>
                    <span className="font-bold text-primary">${Number(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("fund.dailyIncome")}</span>
                    <span className="font-bold text-emerald-500">+${(Number(amount) * Number(selectedPlan.dailyRoi) / 100).toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wider">
                    {t("fund.fundCodeLabel")}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="off"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    className="w-full border border-border bg-transparent text-foreground rounded-xl px-4 py-3 text-center text-xl tracking-[0.5em] focus:outline-none focus:border-primary transition-colors"
                    data-testid="input-fund-pin"
                    autoFocus
                  />
                  <p className="text-muted-foreground text-xs mt-1.5 text-center">
                    {t("fund.fundCodeHint")}
                  </p>
                </div>

                <Button
                  className={`w-full font-bold rounded-xl h-12 text-base shadow-lg bg-gradient-to-r ${planColors[selectedPlan.name]?.gradient || "from-primary to-blue-600"} text-white`}
                  onClick={handleConfirmInvest}
                  disabled={investMutation.isPending || pin.length !== 6}
                  data-testid="button-confirm-invest"
                >
                  {investMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 mr-1" />
                      {t("fund.invest")}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
