import { useState } from "react";
import { Search, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";
import { UserDetailModal } from "./user-detail-modal";

export function UsersTab({ users: allUsers }: { users: User[] }) {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filtered = allUsers.filter(u => {
    const q = search.toLowerCase();
    return u.phone.toLowerCase().includes(q) ||
      (u.numericId || "").toLowerCase().includes(q) ||
      (u.lastLoginIp || "").includes(q) ||
      (u.referralCode || "").toLowerCase().includes(q);
  });

  const exportCSV = () => {
    const headers = ["UID", t("admin.phone"), "VIP", `${t("common.balance")} (USDT)`, `${t("admin.earnings")} (USDT)`, `${t("common.deposit")} (USDT)`, "IP", t("admin.status"), t("admin.registeredAt")];
    const rows = filtered.map(u => [
      u.numericId || "",
      u.phone,
      getVipName(u.vipLevel, locale),
      Number(u.balance).toFixed(2),
      Number(u.totalEarnings).toFixed(2),
      Number(u.totalDeposit).toFixed(2),
      u.lastLoginIp || "",
      u.isBanned ? t("admin.blocked") : t("common.active"),
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vem-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.searchPlaceholder")}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10 text-sm"
            data-testid="input-search-users"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={exportCSV}
          className="shrink-0 w-10 h-10 rounded-xl"
          data-testid="button-export-csv"
        >
          <Download className="w-4 h-4" />
        </Button>
        <span className="text-muted-foreground text-xs whitespace-nowrap">{t("admin.count", { count: String(filtered.length) })}</span>
      </div>

      <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">{t("admin.phone")}</th>
                <th className="text-left text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">VIP</th>
                <th className="text-left text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">{t("common.balance")}</th>
                <th className="text-left text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">IP</th>
                <th className="text-left text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">{t("admin.status")}</th>
                <th className="text-right text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <p className="text-foreground font-medium">{u.phone}</p>
                    <p className="text-muted-foreground text-[10px]">UID: {u.numericId?.slice(0, 8) || "—"}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/20">
                      {getVipName(u.vipLevel, locale)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-emerald-500 dark:text-emerald-400 font-mono font-semibold">{Number(u.balance).toFixed(2)}</td>
                  <td className="py-3 px-3 text-muted-foreground font-mono text-[10px]">{u.lastLoginIp || "—"}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      {u.isBanned && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500/15 text-red-500 border border-red-500/20">BAN</span>}
                      {u.withdrawalBanned && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">W-BAN</span>}
                      {!u.isBanned && !u.withdrawalBanned && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">OK</span>}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button size="sm" onClick={() => setSelectedUserId(u.id)} variant="ghost"
                      className="text-primary h-7 px-2.5 text-xs rounded-lg hover:bg-primary/10" data-testid={`button-view-user-${u.id}`}
                    >
                      <Eye className="w-3 h-3 mr-1" /> {t("admin.view")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserDetailModal userId={selectedUserId} open={!!selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  );
}
