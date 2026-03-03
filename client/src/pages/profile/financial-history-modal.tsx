import { useState } from "react";
import {
  ArrowDownCircle, ArrowUpCircle, Crown, ScrollText,
  TrendingUp, Users, Settings, History, Banknote, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { BalanceHistory } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

export function FinancialHistoryModal({
  open, onClose, balHistory, historyTotalPages, historyPage, setHistoryPage
}: {
  open: boolean;
  onClose: (val: boolean) => void;
  balHistory: BalanceHistory[];
  historyTotalPages: number;
  historyPage: number;
  setHistoryPage: (fn: (p: number) => number) => void;
}) {
  const { t } = useI18n();
  const [historyFilter, setHistoryFilter] = useState<"all" | "deposit" | "withdrawal" | "earning" | "fund_invest" | "vip_purchase" | "admin_adjust" | "commission">("all");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border p-0 max-w-md w-full h-[92vh] max-h-[92vh] rounded-2xl overflow-hidden flex flex-col" aria-describedby="finance-history-desc">
        <DialogTitle className="sr-only">{t("profile.financialHistory")}</DialogTitle>
        <div className="bg-gradient-to-br from-[#A78BFA]/20 via-card to-card px-4 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/20 flex items-center justify-center">
              <History className="w-5 h-5 text-[#A78BFA]" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-base">{t("profile.financialHistory")}</h2>
              <p id="finance-history-desc" className="text-muted-foreground text-xs">{balHistory.length} {t("profile.operations")}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="bg-emerald-500/10 rounded-xl p-2">
              <div className="flex items-center gap-1 mb-1">
                <ArrowDownCircle className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 text-[9px] font-medium">{t("profile.filterDeposit")}</span>
              </div>
              <p className="text-emerald-500 font-bold text-xs">
                +{balHistory.filter(h => h.type === "deposit" && Number(h.amount) > 0).reduce((s, h) => s + Number(h.amount), 0).toFixed(2)} USDT
              </p>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-2">
              <div className="flex items-center gap-1 mb-1">
                <ArrowUpCircle className="w-3 h-3 text-amber-500" />
                <span className="text-amber-500 text-[9px] font-medium">{t("profile.filterExpense")}</span>
              </div>
              <p className="text-amber-500 font-bold text-xs">
                {balHistory.filter(h => ["vip_purchase", "fund_invest"].includes(h.type)).reduce((s, h) => s + Number(h.amount), 0).toFixed(2)} USDT
              </p>
            </div>
            <div className="bg-red-500/10 rounded-xl p-2">
              <div className="flex items-center gap-1 mb-1">
                <ArrowUpCircle className="w-3 h-3 text-red-500" />
                <span className="text-red-500 text-[9px] font-medium">{t("profile.filterWithdrawal")}</span>
              </div>
              <p className="text-red-500 font-bold text-xs">
                {balHistory.filter(h => h.type === "withdrawal").reduce((s, h) => s + Number(h.amount), 0).toFixed(2)} USDT
              </p>
            </div>
          </div>
        </div>
        <div className="shrink-0 px-4 py-2.5 border-b border-border">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: "none" }}>
            {([
              { key: "all", label: t("profile.filterAll") },
              { key: "earning", label: t("profile.filterEarning") },
              { key: "deposit", label: t("profile.filterDeposit") },
              { key: "withdrawal", label: t("profile.filterWithdrawal") },
              { key: "vip_purchase", label: t("profile.filterVip") },
              { key: "fund_invest", label: t("profile.filterFund") },
              { key: "commission", label: t("profile.filterCommission") },
              { key: "admin_adjust", label: t("profile.filterTech") },
            ] as const).map(f => (
              <button
                key={f.key}
                onClick={() => setHistoryFilter(f.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-medium transition-colors ${historyFilter === f.key ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                data-testid={`filter-history-${f.key}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {(() => {
            const filtered = balHistory.filter(h => historyFilter === "all" || h.type === historyFilter || (historyFilter === "withdrawal" && h.type === "withdrawal_cancel"));
            if (filtered.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                    <ScrollText className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">{t("profile.noOperations")}</p>
                </div>
              );
            }
            return filtered.map((h) => {
              const isPositive = Number(h.amount) >= 0;
              const typeIcons: Record<string, { icon: typeof TrendingUp; color: string }> = {
                earning: { icon: TrendingUp, color: "#4ADE80" },
                deposit: { icon: ArrowDownCircle, color: "#4ADE80" },
                withdrawal: { icon: ArrowUpCircle, color: "hsl(var(--primary))" },
                withdrawal_cancel: { icon: RotateCcw, color: "#FFB300" },
                vip_purchase: { icon: Crown, color: "#FFB300" },
                fund_invest: { icon: Banknote, color: "#60A5FA" },
                commission: { icon: Users, color: "#A78BFA" },
                refund: { icon: RotateCcw, color: "#34D399" },
                admin_adjust: { icon: Settings, color: "hsl(var(--muted-foreground))" },
              };
              const config = typeIcons[h.type] || { icon: ScrollText, color: "hsl(var(--muted-foreground))" };
              const IconComp = config.icon;
              const desc = h.description || "";
              const parts = desc.split("|");
              const hasStatusFormat = parts.length >= 2 && ["pending", "approved", "rejected"].includes(parts[0]);
              const entryStatus = hasStatusFormat ? parts[0] : null;
              const rawMethodInfo = hasStatusFormat ? parts[1] : "";
              const methodInfo = rawMethodInfo
                .replace(/^Bank karta\s*\(UZS\)$/i, t("profile.bankCardUzs"))
                .replace(/^Bank karta$/i, t("profile.bankCard"))
                .replace(/^USDT\s*\(Crypto\)$/i, "USDT (Crypto)");
              const statusColor = entryStatus === "pending" ? "text-yellow-500" : entryStatus === "approved" ? "text-emerald-500" : "text-red-500";
              const statusLabel = entryStatus === "pending" ? t("common.pending") : entryStatus === "approved" ? t("common.approved") : entryStatus === "rejected" ? t("common.rejected") : "";
              const extractName = (d: string) => { const m = d.match(/^(\w+)\s/); return m ? m[1] : "VIP"; };
              const typeMap: Record<string, () => string> = {
                earning: () => { if (desc.includes("Fond") || desc.includes("fond")) return t("vip.historyFundProfit"); if (desc.includes("Promokod") || desc.includes("promokod")) { const codeMatch = desc.match(/Promokod:\s*(.+)/i); return t("vip.historyPromo", { code: codeMatch ? codeMatch[1] : "" }); } return t("vip.historyEarning", { name: extractName(desc) || "VIP" }); },
                deposit: () => { if (desc.includes("qaytarildi") || desc.includes("fond")) return t("vip.historyFundReturn"); return t("vip.historyDeposit"); },
                withdrawal: () => { if (hasStatusFormat) return t("vip.historyWithdrawalMethod", { method: methodInfo }); return t("vip.historyWithdrawal", { commission: "10%" }); },
                withdrawal_cancel: () => t("vip.historyWithdrawalCancel"),
                vip_purchase: () => { const name = extractName(desc); if (desc.includes("uzaytirildi")) return t("vip.historyVipExtend", { name }); return t("vip.historyVipPurchase", { name }); },
                fund_invest: () => t("vip.historyFundInvest"),
                commission: () => t("vip.historyCommission"),
                refund: () => t("vip.historyRefund"),
                admin_adjust: () => t("vip.historyAdminAdjust"),
                fund_profit: () => t("vip.historyFundProfit"),
                fund_return: () => t("vip.historyFundReturn"),
              };
              const fn = typeMap[h.type];
              const label = fn ? fn() : h.description;
              return (
                <div key={h.id} className="px-4 py-3.5 flex items-center justify-between" data-testid={`history-item-${h.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: config.color + "18" }}>
                      <IconComp className="w-4.5 h-4.5" style={{ color: config.color }} />
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-medium">{label}</p>
                      {hasStatusFormat && (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-semibold ${statusColor}`}>{statusLabel}</span>
                          {methodInfo && <span className="text-muted-foreground text-[10px]">• {methodInfo}</span>}
                        </div>
                      )}
                      <p className="text-muted-foreground text-[10px] mt-0.5">{new Date(h.createdAt).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className={`text-sm font-bold ${isPositive ? "text-emerald-500 dark:text-emerald-400" : "text-primary"}`}>
                      {isPositive ? "+" : ""}{Number(h.amount).toFixed(2)}
                    </p>
                    <p className="text-muted-foreground text-[10px]">USDT</p>
                  </div>
                </div>
              );
            });
          })()}
          {historyTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 px-4">
              <Button
                variant="outline"
                size="sm"
                disabled={historyPage <= 1}
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                className="h-8 px-3 text-xs rounded-lg"
                data-testid="btn-history-prev"
              >
                ←
              </Button>
              <span className="text-xs text-muted-foreground">{historyPage} / {historyTotalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={historyPage >= historyTotalPages}
                onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                className="h-8 px-3 text-xs rounded-lg"
                data-testid="btn-history-next"
              >
                →
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
