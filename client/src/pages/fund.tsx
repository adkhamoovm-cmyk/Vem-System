import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Lock, Unlock, TrendingUp, Clock, DollarSign, Infinity, ArrowRight, X, CheckCircle } from "lucide-react";
import type { User, FundPlan, Investment } from "@shared/schema";
import AppLayout from "@/components/app-layout";

const planColors: Record<string, { gradient: string; bg: string; accent: string; icon: string }> = {
  F1: { gradient: "from-[#4CAF50] to-[#2E7D32]", bg: "bg-[#E8F5E9]", accent: "#4CAF50", icon: "🌱" },
  F2: { gradient: "from-[#2196F3] to-[#1565C0]", bg: "bg-[#E3F2FD]", accent: "#2196F3", icon: "💎" },
  F3: { gradient: "from-[#FF9800] to-[#E65100]", bg: "bg-[#FFF3E0]", accent: "#FF9800", icon: "🏆" },
  F4: { gradient: "from-[#9C27B0] to-[#6A1B9A]", bg: "bg-[#F3E5F5]", accent: "#9C27B0", icon: "♾️" },
};

export default function FundPage() {
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
      toast({ title: "Muvaffaqiyatli!", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  const handleInvest = () => {
    if (!selectedPlan || !amount) return;
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      toast({ title: "Xatolik", description: "Noto'g'ri summa", variant: "destructive" });
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
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-4">
        <div className="bg-gradient-to-br from-[#FF6B35] to-[#E8453C] rounded-2xl p-4 text-white shadow-lg" data-testid="fund-header">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">VEM Fund</h1>
              <p className="text-white/70 text-xs">Passiv investitsiya</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-white/60">Balans</p>
              <p className="text-sm font-bold" data-testid="text-fund-balance">${Number(user?.balance || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-white/60">Jami kiritilgan</p>
              <p className="text-sm font-bold" data-testid="text-total-invested">${totalInvested.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-white/60">Kunlik foyda</p>
              <p className="text-sm font-bold text-green-300" data-testid="text-daily-profit">+${totalDailyProfit.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-[#1a1a2e] mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FF6B35]" />
            Investitsiya tariflari
          </h2>
          <div className="space-y-3">
            {plans?.sort((a, b) => Number(a.minDeposit) - Number(b.minDeposit)).map((plan) => {
              const colors = planColors[plan.name] || planColors.F1;
              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-2xl border border-[#eee] overflow-hidden shadow-sm"
                  data-testid={`card-plan-${plan.name}`}
                >
                  <div className={`bg-gradient-to-r ${colors.gradient} p-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{colors.icon}</span>
                      <div>
                        <h3 className="text-white font-bold text-base">{plan.name}</h3>
                        <p className="text-white/70 text-xs">
                          {plan.lockDays ? `${plan.lockDays} kunlik muzlatish` : "Umrbod (Infinity)"}
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
                        <p className="text-[10px] text-gray-500">Kunlik foyda</p>
                        <p className="text-sm font-bold" style={{ color: colors.accent }}>{plan.dailyRoi}%</p>
                      </div>
                      <div className={`${colors.bg} rounded-xl p-2.5 text-center`}>
                        <p className="text-[10px] text-gray-500">Asosiy pul</p>
                        <p className="text-sm font-bold" style={{ color: colors.accent }}>
                          {plan.returnPrincipal ? "Qaytadi" : "Qaytmaydi"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                      <span>Min: <span className="font-semibold text-[#1a1a2e]">${Number(plan.minDeposit).toLocaleString()}</span></span>
                      <span>Max: <span className="font-semibold text-[#1a1a2e]">{plan.maxDeposit ? `$${Number(plan.maxDeposit).toLocaleString()}` : "Cheksiz"}</span></span>
                    </div>

                    <Button
                      className={`w-full bg-gradient-to-r ${colors.gradient} text-white font-semibold rounded-xl h-10 shadow-md`}
                      onClick={() => { setSelectedPlan(plan); setAmount(""); }}
                      data-testid={`button-invest-${plan.name}`}
                    >
                      Investitsiya qilish <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {activeInvestments.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-[#1a1a2e] mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FF6B35]" />
              Aktiv investitsiyalar
            </h2>
            <div className="space-y-2">
              {activeInvestments.map((inv) => {
                const plan = plans?.find(p => p.id === inv.fundPlanId);
                const colors = planColors[plan?.name || "F1"] || planColors.F1;
                const daysLeft = inv.endDate
                  ? Math.max(0, Math.ceil((new Date(inv.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                  : null;
                return (
                  <div key={inv.id} className="bg-white rounded-xl border border-[#eee] p-3 shadow-sm" data-testid={`investment-${inv.id}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{colors.icon}</span>
                        <div>
                          <p className="font-semibold text-sm text-[#1a1a2e]">{plan?.name || "Fund"}</p>
                          <p className="text-[10px] text-gray-400">
                            {new Date(inv.startDate).toLocaleDateString("uz-UZ")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: colors.accent }}>${Number(inv.investedAmount).toFixed(2)}</p>
                        <p className="text-[10px] text-green-500 font-medium">+${Number(inv.dailyProfit).toFixed(2)}/kun</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 bg-[#f9f9f9] rounded-lg px-2 py-1.5">
                      <span className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        Aktiv
                      </span>
                      <span>
                        {daysLeft !== null ? `${daysLeft} kun qoldi` : "Umrbod"}
                      </span>
                      <span>{plan?.returnPrincipal ? "Pul qaytadi" : "Pul qaytmaydi"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {completedInvestments.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-[#1a1a2e] mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Yakunlangan
            </h2>
            <div className="space-y-2">
              {completedInvestments.map((inv) => {
                const plan = plans?.find(p => p.id === inv.fundPlanId);
                return (
                  <div key={inv.id} className="bg-white rounded-xl border border-[#eee] p-3 shadow-sm opacity-70">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-gray-500">{plan?.name || "Fund"}</p>
                        <p className="text-[10px] text-gray-400">{new Date(inv.startDate).toLocaleDateString("uz-UZ")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-500">${Number(inv.investedAmount).toFixed(2)}</p>
                        <p className="text-[10px] text-gray-400">Yakunlangan</p>
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
            <div className="bg-white w-full max-w-lg rounded-t-3xl p-5 space-y-4 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#1a1a2e]">
                  {planColors[selectedPlan.name]?.icon} {selectedPlan.name} ga investitsiya
                </h3>
                <button onClick={() => setSelectedPlan(null)} className="text-gray-400 hover:text-gray-600" data-testid="button-close-invest">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-[#f5f5f5] rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Kunlik foyda:</span>
                  <span className="font-semibold text-[#1a1a2e]">{selectedPlan.dailyRoi}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Muzlatish:</span>
                  <span className="font-semibold text-[#1a1a2e]">{selectedPlan.lockDays ? `${selectedPlan.lockDays} kun` : "Umrbod"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Asosiy pul:</span>
                  <span className="font-semibold text-[#1a1a2e]">{selectedPlan.returnPrincipal ? "Qaytadi ✓" : "Qaytmaydi ✗"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Depozit:</span>
                  <span className="font-semibold text-[#1a1a2e]">
                    ${Number(selectedPlan.minDeposit).toLocaleString()} - {selectedPlan.maxDeposit ? `$${Number(selectedPlan.maxDeposit).toLocaleString()}` : "Cheksiz"}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 mb-1.5 block">Summa kiriting ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min: $${Number(selectedPlan.minDeposit).toLocaleString()}`}
                  className="w-full border border-[#ddd] rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#FF6B35] transition-colors"
                  data-testid="input-invest-amount"
                />
                {amount && Number(amount) > 0 && (
                  <p className="text-xs text-green-600 mt-1.5 font-medium">
                    Kunlik foyda: +${(Number(amount) * Number(selectedPlan.dailyRoi) / 100).toFixed(2)}
                    {selectedPlan.lockDays && (
                      <span className="text-gray-400 ml-1">
                        | Jami: +${(Number(amount) * Number(selectedPlan.dailyRoi) / 100 * selectedPlan.lockDays).toFixed(2)}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 bg-[#f9f9f9] rounded-lg px-3 py-2">
                <span>Balans:</span>
                <span className="font-semibold text-[#1a1a2e]">${Number(user?.balance || 0).toFixed(2)}</span>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white font-bold rounded-xl h-12 text-base shadow-lg"
                onClick={handleInvest}
                disabled={investMutation.isPending || !amount || Number(amount) <= 0}
                data-testid="button-confirm-invest"
              >
                {investMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <DollarSign className="w-5 h-5 mr-1" />
                    Investitsiya qilish
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
