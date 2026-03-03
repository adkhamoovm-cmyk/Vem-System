import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowDownCircle, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User, DepositRequest } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { StatusBadge } from "./shared";

export function DepositsTab({ deposits, users: allUsers }: { deposits: DepositRequest[]; users: User[] }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const userMap = Object.fromEntries((allUsers || []).map(u => [u.id, u]));

  const approveMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/deposits/${id}/approve`); },
    onSuccess: () => { toast({ title: t("admin.approved") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits"] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/deposits/${id}/reject`); },
    onSuccess: () => { toast({ title: t("admin.rejected") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits"] }); },
  });

  const filtered = deposits.filter(d => filter === "all" || d.status === filter);

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
            data-testid={`button-filter-${f}`}
          >
            {filterLabels[f]}
            <span className="ml-1 opacity-60">({deposits.filter(d => f === "all" || d.status === f).length})</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{t("admin.nothingFound")}</p>}
        {filtered.map(d => {
          const user = userMap[d.userId];
          return (
            <div key={d.id} className="bg-card rounded-xl p-4 border border-border/50 hover:border-border transition-colors shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-foreground font-bold text-sm">{Number(d.amount).toFixed(2)} {d.currency}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="ml-9 space-y-0.5">
                    <p className="text-muted-foreground text-xs">{t("admin.user")}: <span className="text-foreground font-medium">{user?.phone || d.userId.slice(0, 8)}</span></p>
                    <p className="text-muted-foreground text-xs">{t("admin.paymentType")}: {d.paymentType === "crypto" ? t("admin.crypto") : t("admin.local")}</p>
                    <p className="text-muted-foreground text-xs">{t("admin.date")}: {new Date(d.createdAt).toLocaleString()}</p>
                  </div>
                  {d.receiptUrl && (
                    <div className="mt-2 cursor-pointer" onClick={() => setViewReceipt(d.receiptUrl)} data-testid={`receipt-thumbnail-${d.id}`}>
                      <img
                        src={d.receiptUrl}
                        alt={t("admin.viewReceipt")}
                        loading="lazy"
                        className="w-full max-w-[200px] h-auto rounded-lg border border-border object-cover hover:opacity-80 transition-opacity"
                      />
                      <p className="text-primary text-[10px] mt-1">{t("admin.viewReceipt")}</p>
                    </div>
                  )}
                </div>
                {d.status === "pending" && (
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => approveMutation.mutate(d.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white h-8 text-xs rounded-lg shadow-sm" data-testid={`button-approve-deposit-${d.id}`}>
                      <Check className="w-3 h-3 mr-1" /> {t("common.confirm")}
                    </Button>
                    <Button size="sm" onClick={() => rejectMutation.mutate(d.id)} className="bg-red-500 hover:bg-red-600 text-white h-8 text-xs rounded-lg shadow-sm" data-testid={`button-reject-deposit-${d.id}`}>
                      <X className="w-3 h-3 mr-1" /> {t("admin.reject")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!viewReceipt} onOpenChange={() => setViewReceipt(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-4" aria-describedby="receipt-preview-desc">
          <DialogHeader>
            <DialogTitle>{t("admin.viewReceipt")}</DialogTitle>
          </DialogHeader>
          <p id="receipt-preview-desc" className="sr-only">{t("admin.viewReceipt")}</p>
          {viewReceipt && (
            <div className="flex items-center justify-center overflow-auto max-h-[80vh]">
              <img
                src={viewReceipt}
                alt={t("admin.viewReceipt")}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
