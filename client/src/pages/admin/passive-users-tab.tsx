import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";
import { UserDetailModal } from "./user-detail-modal";

type PassiveUser = {
  id: string;
  phone: string;
  numericId: string | null;
  vipLevel: number;
  balance: string;
  totalDeposit: string;
  totalEarnings: string;
  lastLoginIp: string | null;
  isBanned: boolean;
  withdrawalBanned: boolean;
  vipExpiresAt: string | null;
  createdAt: string;
};

export function PassiveUsersTab() {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: passiveUsers = [], isLoading } = useQuery<PassiveUser[]>({
    queryKey: ["/api/admin/passive-users"],
    refetchInterval: 30000,
  });

  const filtered = passiveUsers.filter(u => {
    const q = search.toLowerCase();
    return u.phone.toLowerCase().includes(q) ||
      (u.numericId || "").toLowerCase().includes(q) ||
      (u.lastLoginIp || "").includes(q);
  });

  const vipExpired = (u: PassiveUser) => {
    if (!u.vipExpiresAt) return false;
    return new Date(u.vipExpiresAt) < new Date();
  };

  const daysLeft = (u: PassiveUser) => {
    if (!u.vipExpiresAt) return null;
    const diff = new Date(u.vipExpiresAt).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-1">
          <UserX className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-semibold text-foreground">{t("admin.passiveUsers")}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t("admin.passiveUsersDesc")}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.searchPlaceholder")}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10 text-sm"
            data-testid="input-search-passive"
          />
        </div>
        <span className="text-muted-foreground text-xs whitespace-nowrap">
          {t("admin.count", { count: String(filtered.length) })}
        </span>
      </div>

      <div className="bg-card rounded-xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">{t("admin.phone")}</th>
                <th className="text-left text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">VIP</th>
                <th className="text-left text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">{t("common.deposit")}</th>
                <th className="text-left text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">{t("admin.vipExpiry")}</th>
                <th className="text-left text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">{t("admin.status")}</th>
                <th className="text-right text-muted-foreground font-semibold py-3 px-3 text-[10px] uppercase tracking-widest">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted-foreground py-8 text-sm">{t("admin.noPassiveUsers")}</td>
                </tr>
              ) : filtered.map(u => {
                const days = daysLeft(u);
                const expired = vipExpired(u);
                return (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors" data-testid={`row-passive-user-${u.id}`}>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-foreground">{u.phone}</div>
                      <div className="text-muted-foreground text-[10px]">ID: {u.numericId || "—"}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {getVipName(u.vipLevel, locale)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-medium text-foreground">${Number(u.totalDeposit).toFixed(0)}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      {expired ? (
                        <span className="text-red-500 text-[10px] font-bold">{t("admin.expired")}</span>
                      ) : days !== null ? (
                        <span className={`text-[10px] font-bold ${days <= 3 ? "text-orange-500" : "text-emerald-500"}`}>
                          {days} {t("admin.daysLeft")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {u.isBanned ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-500">BAN</span>
                      ) : u.withdrawalBanned ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/15 text-orange-500">W-BAN</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-500">{t("common.active")}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => setSelectedUserId(u.id)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        data-testid={`button-view-passive-${u.id}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUserId && (
        <UserDetailModal userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}
    </div>
  );
}
