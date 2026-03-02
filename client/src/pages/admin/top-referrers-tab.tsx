import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";

export function TopReferrersTab() {
  const { t, locale } = useI18n();
  const { data: topReferrers = [] } = useQuery<any[]>({ queryKey: ["/api/admin/top-referrers"] });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-5 h-5 text-[#FFB300]" />
        <h3 className="text-foreground font-bold text-sm">{t("admin.topReferrers")}</h3>
        <span className="text-muted-foreground text-xs">{t("admin.byLevel1Invites")}</span>
      </div>

      {topReferrers.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{t("admin.noDataFound")}</p>}

      <div className="space-y-2">
        {topReferrers.map((r: any, i: number) => (
          <div key={r.referrerId} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i < 3 ? "bg-[#FFB300]/20 text-[#FFB300]" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-foreground text-sm font-medium">{r.phone || r.referrerId.slice(0, 8)}</p>
              <p className="text-muted-foreground text-xs">VIP: {getVipName(r.vipLevel, locale)} | UID: {r.numericId?.slice(0, 8) || "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">{t("admin.count", { count: String(r.count) })}</p>
              <p className="text-muted-foreground text-[10px]">{Number(r.totalCommission).toFixed(2)} USDT</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
