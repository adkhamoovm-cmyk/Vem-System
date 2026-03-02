import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Mail, Eye, Ban, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PromoCode } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

export function PromoCodesTab() {
  const { t, translateServerMessage } = useI18n();
  const { toast } = useToast();
  const [newCode, setNewCode] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isOneTime, setIsOneTime] = useState(true);
  const [maxUses, setMaxUses] = useState("");
  const [viewUsagesId, setViewUsagesId] = useState<string | null>(null);

  const { data: promoCodes = [] } = useQuery<PromoCode[]>({ queryKey: ["/api/admin/promo-codes"] });
  const { data: usages = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/promo-codes", viewUsagesId, "usages"],
    queryFn: async () => {
      if (!viewUsagesId) return [];
      const res = await fetch(`/api/admin/promo-codes/${viewUsagesId}/usages`, { credentials: "include" });
      return res.json();
    },
    enabled: !!viewUsagesId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/promo-codes", {
        code: newCode.trim(),
        amount: newAmount,
        isOneTime,
        maxUses: !isOneTime && maxUses ? Number(maxUses) : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("admin.promoCreated") });
      setNewCode(""); setNewAmount(""); setMaxUses("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
    },
    onError: (e: any) => toast({ title: t("common.error"), description: translateServerMessage(e.message), variant: "destructive" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/promo-codes/${id}/deactivate`); },
    onSuccess: () => {
      toast({ title: t("admin.deleted") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/promo-codes/${id}`); },
    onSuccess: () => {
      toast({ title: t("admin.deleted") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <h3 className="text-foreground font-bold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#EF4444]" />
          {t("admin.createPromoCode")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder={t("admin.codeExample")}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10 font-mono uppercase"
            data-testid="input-admin-promo-code"
          />
          <Input
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder={t("admin.amountUsdt")}
            type="number"
            step="0.01"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10"
            data-testid="input-admin-promo-amount"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={isOneTime} onChange={() => setIsOneTime(true)} className="accent-[#EF4444]" />
            <span className="text-foreground text-xs">{t("admin.oneTime")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={!isOneTime} onChange={() => setIsOneTime(false)} className="accent-[#EF4444]" />
            <span className="text-foreground text-xs">{t("admin.multiUse")}</span>
          </label>
          {!isOneTime && (
            <Input
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder={t("admin.maxUses")}
              type="number"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-8 w-28 text-xs"
              data-testid="input-admin-promo-max-uses"
            />
          )}
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!newCode.trim() || !newAmount || createMutation.isPending}
          className="w-full bg-gradient-to-r from-[#EF4444] to-[#F97316] text-white font-semibold rounded-xl h-10 disabled:opacity-50"
          data-testid="button-admin-create-promo"
        >
          {createMutation.isPending ? t("admin.creating") : t("admin.createPromo")}
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-foreground font-bold text-sm flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#EF4444]" />
            {t("admin.allPromoCodes")} ({promoCodes.length})
          </h3>
        </div>
        <div className="divide-y divide-border">
          {promoCodes.length === 0 && (
            <p className="text-muted-foreground text-xs text-center py-6">{t("admin.noPromoCodes")}</p>
          )}
          {promoCodes.map((promo) => (
            <div key={promo.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground text-sm">{promo.code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${promo.isActive ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}`}>
                    {promo.isActive ? t("common.active") : t("admin.inactive")}
                  </span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{Number(promo.amount).toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-muted-foreground text-[10px]">
                  <span>{promo.isOneTime ? t("admin.oneTime") : `${t("admin.multiUse")}${promo.maxUses ? ` (max: ${promo.maxUses})` : ""}`}</span>
                  <span>{t("admin.used")}: {promo.currentUses}</span>
                  <span>{promo.createdAt ? new Date(promo.createdAt).toLocaleDateString("uz-UZ") : ""}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewUsagesId(viewUsagesId === promo.id ? null : promo.id)}
                    className="text-[#3B82F6] hover:text-foreground transition-colors p-1"
                    data-testid={`button-view-usages-${promo.id}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {promo.isActive && (
                    <button
                      onClick={() => deactivateMutation.mutate(promo.id)}
                      className="text-[#FFB300] hover:text-foreground transition-colors p-1"
                      data-testid={`button-deactivate-${promo.id}`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm(t("admin.confirmDeletePromo"))) deleteMutation.mutate(promo.id); }}
                    className="text-red-500 hover:text-foreground transition-colors p-1"
                    data-testid={`button-delete-promo-${promo.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {viewUsagesId === promo.id && (
                <div className="mt-2 bg-background rounded-xl border border-border overflow-hidden">
                  <div className="px-3 py-2 border-b border-border">
                    <span className="text-foreground text-xs font-semibold">{t("admin.usedByUsers")}</span>
                  </div>
                  {usages.length === 0 ? (
                    <p className="text-muted-foreground text-xs text-center py-3">{t("admin.noUsersUsed")}</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {usages.map((u: any, i: number) => (
                        <div key={i} className="px-3 py-2 flex items-center justify-between text-xs">
                          <span className="text-foreground">{u.userPhone || u.userId}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{Number(u.amount).toFixed(2)} USDT</span>
                            <span className="text-muted-foreground text-[10px]">{u.usedAt ? new Date(u.usedAt).toLocaleDateString("uz-UZ") : ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
