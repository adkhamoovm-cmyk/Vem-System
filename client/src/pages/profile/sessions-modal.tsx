import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Monitor, Globe, X, Shield, LogOut, LogIn,
  Smartphone, Laptop, Tablet
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { UserSessionLog } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

function parseDevice(ua: string | null): { name: string; icon: "phone" | "tablet" | "laptop" } {
  if (!ua) return { name: "Unknown", icon: "laptop" };
  const lower = ua.toLowerCase();
  const isTablet = /ipad|tablet|tab/i.test(lower);
  const isMobile = /mobile|android|iphone/i.test(lower);

  let browser = "Browser";
  if (/chrome/i.test(lower) && !/edg/i.test(lower)) browser = "Chrome";
  else if (/safari/i.test(lower) && !/chrome/i.test(lower)) browser = "Safari";
  else if (/firefox/i.test(lower)) browser = "Firefox";
  else if (/edg/i.test(lower)) browser = "Edge";
  else if (/opera|opr/i.test(lower)) browser = "Opera";

  let os = "";
  if (/iphone|ipad/i.test(lower)) os = "iOS";
  else if (/android/i.test(lower)) os = "Android";
  else if (/windows/i.test(lower)) os = "Windows";
  else if (/mac/i.test(lower)) os = "macOS";
  else if (/linux/i.test(lower)) os = "Linux";

  const name = os ? `${browser} · ${os}` : browser;
  if (isTablet) return { name, icon: "tablet" };
  if (isMobile) return { name, icon: "phone" };
  return { name, icon: "laptop" };
}

function maskIp(ip: string): string {
  if (!ip) return "";
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length >= 4) return parts[0] + ":" + parts[1] + ":***:***:" + parts[parts.length - 1];
    return ip;
  }
  const parts = ip.split(".");
  if (parts.length === 4) return parts[0] + "." + "***" + "." + "***" + "." + parts[3];
  return ip;
}

type ActiveSession = { sid: string; ip: string; userAgent: string; lastActive: string; isCurrent: boolean };

export function SessionsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [tab, setTab] = useState<"active" | "history">("active");

  const { data, isLoading } = useQuery<{ logs: UserSessionLog[]; activeSessions: ActiveSession[] }>({
    queryKey: ["/api/my-sessions"],
    enabled: open,
    queryFn: async () => {
      const res = await fetch("/api/my-sessions", { credentials: "include" });
      if (!res.ok) return { logs: [], activeSessions: [] };
      return res.json();
    },
  });

  const sessions = data?.logs || [];
  const activeSessions = data?.activeSessions || [];

  const terminateMutation = useMutation({
    mutationFn: async (sid: string) => {
      const res = await apiRequest("POST", "/api/my-sessions/terminate", { sid });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
    },
    onSuccess: () => {
      toast({ title: t("profile.sessionTerminated") });
      queryClient.invalidateQueries({ queryKey: ["/api/my-sessions"] });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, "0");
    const mon = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, "0");
    const mins = d.getMinutes().toString().padStart(2, "0");
    return `${day}.${mon}.${year} ${hours}:${mins}`;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background border-border p-0 max-w-md w-full h-[80vh] max-h-[80vh] rounded-2xl overflow-hidden flex flex-col" aria-describedby="sessions-desc">
        <DialogTitle className="sr-only">{t("profile.sessions")}</DialogTitle>
        <div className="bg-gradient-to-br from-cyan-500/20 via-card to-card px-4 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-base">{t("profile.sessions")}</h2>
              <p id="sessions-desc" className="text-muted-foreground text-xs">{t("profile.sessionsDesc")}</p>
            </div>
          </div>
          <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
            <button
              onClick={() => setTab("active")}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${tab === "active" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="tab-active-sessions"
            >
              {t("profile.sessionActive")} ({activeSessions.length})
            </button>
            <button
              onClick={() => setTab("history")}
              className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${tab === "history" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              data-testid="tab-session-history"
            >
              {t("profile.sessionHistory")}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-card rounded-xl p-3 border border-border/50 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-muted rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-24" />
                      <div className="h-2.5 bg-muted rounded w-32" />
                      <div className="h-2.5 bg-muted rounded w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "active" ? (
            activeSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Monitor className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">{t("profile.sessionNoData")}</p>
              </div>
            ) : (
              activeSessions.map((s) => {
                const device = parseDevice(s.userAgent);
                const DeviceIcon = device.icon === "phone" ? Smartphone : device.icon === "tablet" ? Tablet : Laptop;
                return (
                  <div key={s.sid} className={`bg-card rounded-xl p-3 border ${s.isCurrent ? "border-cyan-500/50" : "border-border/50"} hover:border-border transition-colors`} data-testid={`active-session-${s.sid}`}>
                    <div className="flex gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.isCurrent ? "bg-cyan-500/15" : "bg-emerald-500/15"}`}>
                        <DeviceIcon className={`w-4 h-4 ${s.isCurrent ? "text-cyan-500" : "text-emerald-500"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground">{device.name}</span>
                            {s.isCurrent && (
                              <span className="text-[9px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded-full font-medium">{t("profile.sessionCurrent")}</span>
                            )}
                          </div>
                        </div>
                        {s.ip && (
                          <div className="flex items-center gap-1.5 mb-1">
                            <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                            <span className="text-[11px] text-muted-foreground font-mono">{maskIp(s.ip)}</span>
                          </div>
                        )}
                        {!s.isCurrent && (
                          <button
                            onClick={() => terminateMutation.mutate(s.sid)}
                            disabled={terminateMutation.isPending}
                            className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition-colors mt-0.5"
                            data-testid={`terminate-session-${s.sid}`}
                          >
                            <X className="w-3 h-3" />
                            {t("profile.sessionTerminate")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Monitor className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">{t("profile.sessionNoData")}</p>
            </div>
          ) : (
            sessions.map((s) => {
              const device = parseDevice(s.userAgent);
              const DeviceIcon = device.icon === "phone" ? Smartphone : device.icon === "tablet" ? Tablet : Laptop;
              const isLogin = s.action === "login";
              const isForceLogout = s.action === "force_logout";
              return (
                <div key={s.id} className="bg-card rounded-xl p-3 border border-border/50 hover:border-border transition-colors" data-testid={`session-${s.id}`}>
                  <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isLogin ? "bg-emerald-500/15" : isForceLogout ? "bg-amber-500/15" : "bg-red-500/15"}`}>
                      {isLogin ? <LogIn className="w-4 h-4 text-emerald-500" /> : isForceLogout ? <Shield className="w-4 h-4 text-amber-500" /> : <LogOut className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-semibold ${isLogin ? "text-emerald-500" : isForceLogout ? "text-amber-500" : "text-red-500"}`}>
                          {isLogin ? t("profile.sessionLogin") : isForceLogout ? t("profile.sessionForceLogout") : t("profile.sessionLogout")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{formatDate(s.createdAt as string | Date)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <DeviceIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-foreground/80 truncate">{device.name}</span>
                      </div>
                      {s.ip && (
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-[11px] text-muted-foreground font-mono">{maskIp(s.ip)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
