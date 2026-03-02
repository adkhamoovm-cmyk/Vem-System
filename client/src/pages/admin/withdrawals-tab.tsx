import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpCircle, Check, X, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User, WithdrawalRequest, PaymentMethod } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { StatusBadge } from "./shared";

export function WithdrawalsTab({ withdrawals, users: allUsers }: { withdrawals: (WithdrawalRequest & { paymentMethod?: PaymentMethod | null })[]; users: User[] }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

  const approveMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/withdrawals/${id}/approve`); },
    onSuccess: () => { toast({ title: t("admin.approved") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/withdrawals/${id}/reject`); },
    onSuccess: () => { toast({ title: t("admin.rejected") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] }); },
  });

  const filtered = withdrawals.filter(w => filter === "all" || w.status === filter);

  const filterLabels: Record<string, string> = {
    all: t("common.all"),
    pending: t("common.pending"),
    approved: t("common.approved"),
    rejected: t("common.rejected"),
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? f === "pending" ? "bg-amber-500/15 text-amber-500 border border-amber-500/20" :
                  f === "approved" ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20" :
                  f === "rejected" ? "bg-red-500/15 text-red-500 border border-red-500/20" :
                  "bg-primary/15 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/50 border border-transparent"
            }`}
            data-testid={`button-filter-w-${f}`}
          >
            {filterLabels[f]}
            <span className="ml-1 opacity-60">({withdrawals.filter(w => f === "all" || w.status === f).length})</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{t("admin.nothingFound")}</p>}
        {filtered.map(w => {
          const user = userMap[w.userId];
          const pm = w.paymentMethod;
          return (
            <div key={w.id} className="bg-card rounded-xl p-4 border border-border/50 hover:border-border transition-colors shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                      <ArrowUpCircle className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-foreground font-bold text-sm">{Number(w.amount).toFixed(2)} USDT</span>
                    <StatusBadge status={w.status} />
                  </div>
                  <div className="ml-9 space-y-0.5">
                    <p className="text-muted-foreground text-xs">{t("admin.user")}: <span className="text-foreground font-medium">{user?.phone || w.userId.slice(0, 8)}</span></p>
                    <p className="text-muted-foreground text-xs">{t("admin.commission")}: {Number(w.commission).toFixed(2)} USDT | {t("admin.net")}: {Number(w.netAmount).toFixed(2)} USDT</p>
                  </div>
                  {pm && (
                    <div className="mt-2 ml-9 p-2.5 bg-muted/30 rounded-lg border border-border/50">
                      <div className="flex items-center gap-1.5 mb-1">
                        {pm.type === "bank" ? <CreditCard className="w-3.5 h-3.5 text-blue-500" /> : <Wallet className="w-3.5 h-3.5 text-emerald-500" />}
                        <span className="text-foreground text-xs font-medium">{pm.type === "bank" ? t("admin.bankCard") : t("admin.usdtWallet")}</span>
                      </div>
                      {pm.type === "bank" ? (
                        <>
                          <p className="text-foreground text-xs">{t("admin.card")}: <span className="text-foreground font-mono">{pm.cardNumber}</span></p>
                          <p className="text-foreground text-xs">{t("admin.owner")}: <span className="text-foreground">{pm.holderName}</span></p>
                          <p className="text-foreground text-xs">{t("admin.bankLabel")}: <span className="text-foreground">{pm.bankName}</span></p>
                        </>
                      ) : (
                        <>
                          <p className="text-foreground text-xs">{t("admin.address")}: <span className="text-foreground font-mono text-[10px]">{pm.walletAddress}</span></p>
                          <p className="text-foreground text-xs">{t("admin.exchange")}: <span className="text-foreground">{pm.exchangeName}</span></p>
                        </>
                      )}
                    </div>
                  )}
                  {!pm && <p className="text-red-400 text-xs mt-1 ml-9">{t("admin.noRequisites")}</p>}
                  <p className="text-muted-foreground text-xs mt-1 ml-9">{t("admin.date")}: {new Date(w.createdAt).toLocaleString()}</p>
                </div>
                {w.status === "pending" && (
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => approveMutation.mutate(w.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 text-xs rounded-lg shadow-sm" data-testid={`button-approve-withdrawal-${w.id}`}>
                      <Check className="w-3 h-3 mr-1" /> {t("common.confirm")}
                    </Button>
                    <Button size="sm" onClick={() => rejectMutation.mutate(w.id)} className="bg-red-500 hover:bg-red-600 text-white h-8 text-xs rounded-lg shadow-sm" data-testid={`button-reject-withdrawal-${w.id}`}>
                      <X className="w-3 h-3 mr-1" /> {t("admin.reject")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
