import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle, Shield, Globe, ChevronDown, ChevronRight, Smartphone, Monitor, Lock, Unlock, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";

function parseDevice(ua: string | null): { device: string; browser: string; isMobile: boolean } {
  if (!ua) return { device: "Noma'lum", browser: "Noma'lum", isMobile: false };
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
  let device = "Desktop";
  if (/iPhone/i.test(ua)) device = "iPhone";
  else if (/iPad/i.test(ua)) device = "iPad";
  else if (/Android/i.test(ua)) {
    const match = ua.match(/Android[^;]*;\s*([^)]+)/);
    device = match ? match[1].trim().split(" Build")[0] : "Android";
  } else if (/Windows/i.test(ua)) device = "Windows PC";
  else if (/Mac OS/i.test(ua)) device = "MacOS";
  else if (/Linux/i.test(ua)) device = "Linux";

  let browser = "Noma'lum";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/Chrome\//i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Opera|OPR/i.test(ua)) browser = "Opera";

  return { device, browser, isMobile };
}

export function MultiAccountsTab() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const { data: groups = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/multi-accounts"] });
  const [expandedIp, setExpandedIp] = useState<string | null>(null);

  const banMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/users/${userId}/ban`, { isBanned });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/multi-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: t("common.success") });
    },
  });

  const totalSuspicious = groups.reduce((s: number, g: any) => s + g.count, 0);

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl p-4 border border-red-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-foreground font-bold text-sm">{t("admin.multiAccounts")}</h3>
            <p className="text-muted-foreground text-[11px]">
              {groups.length} {t("admin.multiIpGroups")} · {totalSuspicious} {t("admin.accounts")}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/multi-accounts"] })}
            data-testid="button-refresh-multi"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            {t("admin.refresh")}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <RefreshCw className="w-6 h-6 text-muted-foreground mx-auto mb-2 animate-spin" />
          <p className="text-muted-foreground text-sm">{t("admin.loading")}</p>
        </div>
      )}

      {!isLoading && groups.length === 0 && (
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <Shield className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
          <p className="text-emerald-500 dark:text-emerald-400 text-sm font-semibold">{t("admin.noMultiAccounts")}</p>
          <p className="text-muted-foreground text-xs mt-1">{t("admin.noSameIpUsers")}</p>
        </div>
      )}

      {groups.map((g: any) => (
        <div key={g.ip} className="bg-card rounded-xl border border-red-500/20 overflow-hidden">
          <button
            onClick={() => setExpandedIp(expandedIp === g.ip ? null : g.ip)}
            className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
            data-testid={`button-expand-ip-${g.ip}`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Globe className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-foreground text-xs font-mono">{g.ip || "—"}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 font-bold">
                {g.count} {t("admin.accounts")}
              </span>
            </div>
            {expandedIp === g.ip ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>

          {expandedIp === g.ip && (
            <div className="border-t border-border">
              {(g.users || []).map((user: any) => {
                const { device, browser, isMobile } = parseDevice(user.lastUserAgent);
                const DeviceIcon = isMobile ? Smartphone : Monitor;
                return (
                  <div key={user.id} className={`p-3 border-b border-border last:border-b-0 ${user.isBanned ? "bg-red-500/5" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-foreground text-sm font-semibold">{user.phone}</span>
                          {user.numericId && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/15 text-primary font-mono">
                              UID: {user.numericId}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            user.vipLevel >= 0
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {getVipName(user.vipLevel, locale)}
                          </span>
                          {user.isBanned && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/20 text-red-500 font-bold">
                              {t("admin.blocked")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                          <span className="flex items-center gap-1">
                            <DeviceIcon className="w-3 h-3" />
                            {device}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {browser}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[10px] font-mono truncate" title={user.lastUserAgent || ""}>
                          {user.lastUserAgent ? user.lastUserAgent.slice(0, 80) + (user.lastUserAgent.length > 80 ? "..." : "") : "—"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={user.isBanned ? "outline" : "destructive"}
                        className="h-7 text-[11px] shrink-0"
                        onClick={() => banMutation.mutate({ userId: user.id, isBanned: !user.isBanned })}
                        disabled={banMutation.isPending}
                        data-testid={`button-ban-${user.id}`}
                      >
                        {user.isBanned ? (
                          <><Unlock className="w-3 h-3 mr-1" />{t("admin.unblock")}</>
                        ) : (
                          <><Lock className="w-3 h-3 mr-1" />{t("admin.block")}</>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
