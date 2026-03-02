import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VipPackage } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

export function VipManageTab() {
  const { t, translateServerMessage } = useI18n();
  const { toast } = useToast();
  const { data: packages = [] } = useQuery<VipPackage[]>({ queryKey: ["/api/vip-packages"] });

  const toggleLockMutation = useMutation({
    mutationFn: async ({ id, locked }: { id: string; locked: boolean }) => {
      await apiRequest("POST", `/api/admin/vip-packages/${id}/toggle-lock`, { locked });
    },
    onSuccess: () => {
      toast({ title: t("admin.vipLevelUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/vip-packages"] });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: translateServerMessage(e.message), variant: "destructive" }),
  });

  const sorted = [...packages].sort((a, b) => a.level - b.level);

  return (
    <div>
      <h3 className="text-foreground font-bold text-sm mb-3">{t("admin.manageVipLevels")}</h3>
      <p className="text-muted-foreground text-xs mb-4">{t("admin.vipManageDesc")}</p>
      <div className="space-y-2">
        {sorted.map((pkg) => (
          <div key={pkg.id} className="bg-card rounded-xl p-4 border border-border/50 hover:border-border transition-colors shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pkg.isLocked ? "bg-red-500/15" : "bg-emerald-500/15"}`}>
                <Crown className={`w-5 h-5 ${pkg.isLocked ? "text-red-500" : "text-emerald-500"}`} />
              </div>
              <div>
                <p className="text-foreground text-sm font-bold">{pkg.name}</p>
                <p className="text-muted-foreground text-xs">
                  {t("admin.price")}: <span className="text-foreground font-medium">${Number(pkg.price).toFixed(0)}</span> | {t("admin.dailyLabel")}: {pkg.dailyTasks} {t("admin.tasksLabel")} | {t("admin.perVideo")}: ${Number(pkg.perVideoReward).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pkg.isLocked ? "bg-red-500/15 text-red-500 border-red-500/20" : "bg-emerald-500/15 text-emerald-500 border-emerald-500/20"}`}>
                {pkg.isLocked ? t("admin.closed") : t("common.open")}
              </span>
              <Button
                size="sm"
                onClick={() => toggleLockMutation.mutate({ id: pkg.id, locked: !pkg.isLocked })}
                className={`text-xs rounded-lg h-8 px-3 shadow-sm ${pkg.isLocked ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                data-testid={`button-toggle-vip-${pkg.level}`}
              >
                {pkg.isLocked ? t("admin.unlock") : t("admin.lock")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
