import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Lock, Unlock, TrendingUp, Clock, DollarSign, Infinity, ArrowRight, X, CheckCircle, Sprout, Gem, Trophy } from "lucide-react";
import type { User, FundPlan, Investment } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

const planIcons: Record<string, typeof Sprout> = {
  F1: Sprout, F2: Gem, F3: Trophy, F4: Infinity,
};

const planColors: Record<string, { gradient: string; bg: string; accent: string }> = {
  F1: { gradient: "from-[#4CAF50] to-[#2E7D32]", bg: "bg-[#4CAF50]/10", accent: "#4CAF50" },
  F2: { gradient: "from-[#2196F3] to-[#1565C0]", bg: "bg-[#2196F3]/10", accent: "#2196F3" },
  F3: { gradient: "from-[#FF9800] to-[#E65100]", bg: "bg-[#FF9800]/10", accent: "#FF9800" },
  F4: { gradient: "from-[#9C27B0] to-[#6A1B9A]", bg: "bg-[#9C27B0]/10", accent: "#9C27B0" },
};

export default function FundPage() {
  const { t, translateServerMessage } = useI18n();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<FundPlan | null>(null);
  const [amount, setAmount] = useState("");

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
    mutationFn: async ({ fundPlanId, amount }: { fundPlanId: string; amount: number }) => {
      const res = await apiRequest("POST", "/api/fund/invest", { fundPlanId, amount });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      setSelectedPlan(null);
      setAmount("");
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const handleInvest = () => {
    if (!selectedPlan || !amount) return;
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      toast({ title: t("common.error"), description: t("fund.invalidAmount"), variant: "destructive" });
      return;
    }
    investMutation.mutate({ fundPlanId: selectedPlan.id, amount: num });
  };

  const activeInvestments = myInvestments?.filter(i => i.status === "active") || [];
  const completedInvestments = myInvestments?.filter(i => i.status === "completed") || [];
  const totalDailyProfit = activeInvestments.reduce((sum, i) => sum + Number(i.dailyProfit), 0);
  const totalInvested = activeInvestments.reduce((sum, i) => sum + Number(i.investedAmount), 0);

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
        <div className="bg-primary rounded-2xl p-4 text-primary-foreground shadow-lg" data-testid="fund-header">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{t("fund.title")}</h1>
              <p className="text-primary-foreground/70 text-xs">{t("fund.subtitle")}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-primary-foreground/60">{t("common.balance")}</p>
              <p className="text-sm font-bold" data-testid="text-fund-balance">${Number(user?.balance || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-primary-foreground/60">{t("fund.totalInvested")}</p>
              <p className="text-sm font-bold" data-testid="text-total-invested">${totalInvested.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-primary-foreground/60">{t("fund.dailyProfit")}</p>
              <p className="text-sm font-bold text-green-300" data-testid="text-daily-profit">+${totalDailyProfit.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            {t("fund.plans")}
          </h2>
          <div className="space-y-3">
            {plans?.sort((a, b) => Number(a.minDeposit) - Number(b.minDeposit)).map((plan) => {
              const colors = planColors[plan.name] || planColors.F1;
              return (
                <div
                  key={plan.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
                  data-testid={`card-plan-${plan.name}`}
                >
                  <div className={`bg-gradient-to-r ${colors.gradient} p-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      {(() => { const Icon = planIcons[plan.name] || Sprout; return <Icon className="w-6 h-6 text-white" />; })()}
                      <div>
                        <h3 className="text-white font-bold text-base">{plan.name}</h3>
                        <p className="text-white/70 text-xs">
                          {plan.lockDays ? t("fund.lockDays", { days: plan.lockDays }) : t("fund.forever")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-white/80">
                      {plan.lockDays ? <Lock className="w-4 h-4" /> : <Infinity className="w-4 h-4" />}
                    </div>
                  </div>

                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`${colors.bg} rounded-xl p-2.5 text-center`}>
                        <p className="text-[10px] text-muted-foreground">{t("fund.dailyRoi")}</p>
                        <p className="text-sm font-bold" style={{ color: colors.accent }}>{plan.dailyRoi}%</p>
                      </div>
                      <div className={`${colors.bg} rounded-xl p-2.5 text-center`}>
                        <p className="text-[10px] text-muted-foreground">{t("fund.principal")}</p>
                        <p className="text-sm font-bold" style={{ color: colors.accent }}>
                          {plan.returnPrincipal ? t("fund.returns") : t("fund.noReturn")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                      <span>{t("fund.min")}: <span className="font-semibold text-foreground">${Number(plan.minDeposit).toLocaleString()}</span></span>
                      <span>{t("fund.max")}: <span className="font-semibold text-foreground">{plan.maxDeposit ? `$${Number(plan.maxDeposit).toLocaleString()}` : t("fund.unlimited")}</span></span>
                    </div>

                    <Button
                      className={`w-full bg-gradient-to-r ${colors.gradient} text-white font-semibold rounded-xl h-10 shadow-md`}
                      onClick={() => { setSelectedPlan(plan); setAmount(""); }}
                      data-testid={`button-invest-${plan.name}`}
                    >
                      {t("fund.invest")} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activeInvestments.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              {t("fund.activeInvestments")}
            </h2>
            <div className="space-y-2">
              {activeInvestments.map((inv) => {
                const plan = plans?.find(p => p.id === inv.fundPlanId);
                const colors = planColors[plan?.name || "F1"] || planColors.F1;
                const daysLeft = inv.endDate
                  ? Math.max(0, Math.ceil((new Date(inv.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : null;
                return (
                  <div key={inv.id} className="bg-card rounded-xl border border-border p-3 shadow-sm" data-testid={`investment-${inv.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {(() => { const Icon = planIcons[plan?.name || "F1"] || Sprout; return <Icon className="w-5 h-5" style={{ color: colors.accent }} />; })()}
                        <div>
                          <p className="font-semibold text-sm text-foreground">{plan?.name || "Fund"}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(inv.startDate).toLocaleDateString("uz-UZ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: colors.accent }}>${Number(inv.investedAmount).toFixed(2)}</p>
                        <p className="text-[10px] text-green-500 font-medium">+${Number(inv.dailyProfit).toFixed(2)}/{t("common.days")}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-card rounded-lg px-2 py-1.5">
                      <span className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        {t("common.active")}
                      </span>
                      <span>
                        {daysLeft !== null ? t("fund.daysLeft", { days: daysLeft }) : t("fund.forever")}
                      </span>
                      <span>{plan?.returnPrincipal ? t("fund.moneyReturns") : t("fund.moneyNoReturn")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {completedInvestments.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {t("fund.completedInvestments")}
            </h2>
            <div className="space-y-2">
              {completedInvestments.map((inv) => {
                const plan = plans?.find(p => p.id === inv.fundPlanId);
                return (
                  <div key={inv.id} className="bg-card rounded-xl border border-border p-3 shadow-sm opacity-70">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-muted-foreground">{plan?.name || "Fund"}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(inv.startDate).toLocaleDateString("uz-UZ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-muted-foreground">${Number(inv.investedAmount).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">{t("common.completed")}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedPlan && (
          <div className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center" data-testid="modal-invest">
            <div className="bg-card w-full max-w-lg rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  {(() => { const Icon = planIcons[selectedPlan.name] || Sprout; return <Icon className="w-5 h-5" style={{ color: planColors[selectedPlan.name]?.accent }} />; })()}
                  {t("fund.investIn", { plan: selectedPlan.name })}
                </h3>
                <button onClick={() => setSelectedPlan(null)} className="text-muted-foreground hover:text-foreground" data-testid="button-close-invest">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-muted rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("fund.dailyProfit")}:</span>
                  <span className="font-semibold text-foreground">{selectedPlan.dailyRoi}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("fund.lockPeriod")}</span>
                  <span className="font-semibold text-foreground">{selectedPlan.lockDays ? `${selectedPlan.lockDays} ${t("common.days")}` : t("fund.forever")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("fund.principal")}:</span>
                  <span className="font-semibold text-foreground">{selectedPlan.returnPrincipal ? t("fund.returns") : t("fund.noReturn")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("fund.depositRange")}</span>
                  <span className="font-semibold text-foreground">
                    ${Number(selectedPlan.minDeposit).toLocaleString()} - {selectedPlan.maxDeposit ? `$${Number(selectedPlan.maxDeposit).toLocaleString()}` : t("fund.unlimited")}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">{t("fund.enterAmount")}</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`${t("fund.min")}: $${Number(selectedPlan.minDeposit).toLocaleString()}`}
                  className="w-full border border-border bg-transparent text-foreground rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary transition-colors"
                  data-testid="input-invest-amount"
                />
                {amount && Number(amount) > 0 && (
                  <p className="text-xs text-emerald-500 dark:text-emerald-400 mt-1.5 font-medium">
                    {t("fund.dailyProfit")}: +${(Number(amount) * Number(selectedPlan.dailyRoi) / 100).toFixed(2)}
                    {selectedPlan.lockDays && (
                      <span className="text-muted-foreground ml-1">
                        | {t("fund.totalCalc", { amount: (Number(amount) * Number(selectedPlan.dailyRoi) / 100 * selectedPlan.lockDays).toFixed(2) })}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                <span>{t("common.balance")}:</span>
                <span className="font-semibold text-foreground">${Number(user?.balance || 0).toFixed(2)}</span>
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground font-bold rounded-xl h-12 text-base shadow-lg"
                onClick={handleInvest}
                disabled={investMutation.isPending || !amount || Number(amount) <= 0}
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
            </div>
          </div>
        )}
      </div>
  );
}
