import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Monitor, Globe, X, Shield, LogOut, LogIn,
  Smartphone, Laptop, Tablet, Clock, Wifi
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { UserSessionLog } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

function parseDevice(ua: string | null): { name: string; icon: "phone" | "tablet" | "laptop"; browser: string; os: string } {
  if (!ua) return { name: "Unknown", icon: "laptop", browser: "Browser", os: "" };
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
  if (isTablet) return { name, icon: "tablet", browser, os };
  if (isMobile) return { name, icon: "phone", browser, os };
  return { name, icon: "laptop", browser, os };
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

function timeAgo(dateStr: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return t("profile.timeJustNow");
  if (diff < 3600) return t("profile.timeMinAgo", { n: Math.floor(diff / 60) });
  if (diff < 86400) return t("profile.timeHourAgo", { n: Math.floor(diff / 3600) });
  if (diff < 604800) return t("profile.timeDayAgo", { n: Math.floor(diff / 86400) });
  return t("profile.timeWeekAgo", { n: Math.floor(diff / 604800) });
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

  const DeviceIconComponent = ({ icon, className }: { icon: string; className?: string }) => {
    if (icon === "phone") return <Smartphone className={className} />;
    if (icon === "tablet") return <Tablet className={className} />;
    return <Laptop className={className} />;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-background border-border/60 p-0 max-w-md w-full h-[80vh] max-h-[80vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl" aria-describedby="sessions-desc">
        <DialogTitle className="sr-only">{t("profile.sessions")}</DialogTitle>

        <div className="relative shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent" />
          <div className="relative px-5 pt-5 pb-4">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-cyan-500/20">
                <Monitor className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-foreground font-bold text-[15px] tracking-tight">{t("profile.sessions")}</h2>
                <p id="sessions-desc" className="text-muted-foreground text-xs mt-0.5">{t("profile.sessionsDesc")}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-semibold text-emerald-400">{activeSessions.length}</span>
              </div>
            </div>

            <div className="flex gap-1 bg-muted/40 rounded-xl p-1 backdrop-blur-sm ring-1 ring-border/30">
              <button
                onClick={() => setTab("active")}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all duration-200 ${tab === "active"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-active-sessions"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Wifi className="w-3 h-3" />
                  {t("profile.sessionActive")}
                </div>
              </button>
              <button
                onClick={() => setTab("history")}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all duration-200 ${tab === "history"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-session-history"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  {t("profile.sessionHistory")}
                </div>
              </button>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-2xl p-4 border border-border/30 animate-pulse bg-card/50">
                  <div className="flex gap-3.5">
                    <div className="w-10 h-10 bg-muted/60 rounded-xl" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-3.5 bg-muted/60 rounded-lg w-28" />
                      <div className="h-2.5 bg-muted/40 rounded-lg w-36" />
                      <div className="h-2.5 bg-muted/40 rounded-lg w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : tab === "active" ? (
            activeSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                  <Monitor className="w-7 h-7 opacity-30" />
                </div>
                <p className="text-sm font-medium">{t("profile.sessionNoData")}</p>
              </div>
            ) : (
              activeSessions.map((s, idx) => {
                const device = parseDevice(s.userAgent);
                return (
                  <div
                    key={s.sid}
                    className={`group rounded-2xl p-3.5 border transition-all duration-200 ${
                      s.isCurrent
                        ? "bg-gradient-to-br from-cyan-500/[0.06] to-blue-500/[0.03] border-cyan-500/30 ring-1 ring-cyan-500/10"
                        : "bg-card/60 border-border/40 hover:border-border/70 hover:bg-card/80"
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    data-testid={`active-session-${s.sid}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        s.isCurrent
                          ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/15"
                          : "bg-emerald-500/10"
                      }`}>
                        <DeviceIconComponent
                          icon={device.icon}
                          className={`w-[18px] h-[18px] ${s.isCurrent ? "text-cyan-400" : "text-emerald-400"}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-foreground">{device.name}</span>
                            {s.isCurrent && (
                              <span className="text-[9px] bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full font-bold tracking-wide uppercase ring-1 ring-cyan-500/20">
                                {t("profile.sessionCurrent")}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground/70">{timeAgo(s.lastActive, t)}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {s.ip && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-muted-foreground/60" />
                              <span className="text-[11px] text-muted-foreground font-mono">{maskIp(s.ip)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${s.isCurrent ? "bg-cyan-400" : "bg-emerald-400"}`} />
                            <span className="text-[10px] text-muted-foreground/70">{t("profile.sessionOnline")}</span>
                          </div>
                        </div>

                        {!s.isCurrent && (
                          <button
                            onClick={() => terminateMutation.mutate(s.sid)}
                            disabled={terminateMutation.isPending}
                            className="flex items-center gap-1.5 text-[11px] text-red-400/80 hover:text-red-400 transition-all mt-2 group/btn"
                            data-testid={`terminate-session-${s.sid}`}
                          >
                            <div className="w-5 h-5 rounded-md bg-red-500/10 flex items-center justify-center group-hover/btn:bg-red-500/15 transition-colors">
                              <X className="w-3 h-3" />
                            </div>
                            <span className="font-medium">{t("profile.sessionTerminate")}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                <Clock className="w-7 h-7 opacity-30" />
              </div>
              <p className="text-sm font-medium">{t("profile.sessionNoData")}</p>
            </div>
          ) : (
            sessions.map((s, idx) => {
              const device = parseDevice(s.userAgent);
              const isLogin = s.action === "login";
              const isForceLogout = s.action === "force_logout";
              const actionColor = isLogin ? "emerald" : isForceLogout ? "amber" : "red";
              const colorMap = {
                emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", ring: "ring-emerald-500/15", gradient: "from-emerald-500/[0.06] to-emerald-500/[0.02]" },
                amber: { bg: "bg-amber-500/10", text: "text-amber-400", ring: "ring-amber-500/15", gradient: "from-amber-500/[0.06] to-amber-500/[0.02]" },
                red: { bg: "bg-red-500/10", text: "text-red-400", ring: "ring-red-500/15", gradient: "from-red-500/[0.06] to-red-500/[0.02]" },
              };
              const colors = colorMap[actionColor];

              return (
                <div
                  key={s.id}
                  className={`rounded-2xl p-3.5 border border-border/30 hover:border-border/50 transition-all duration-200 bg-card/50`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                  data-testid={`session-${s.id}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.bg}`}>
                      {isLogin ? (
                        <LogIn className={`w-[18px] h-[18px] ${colors.text}`} />
                      ) : isForceLogout ? (
                        <Shield className={`w-[18px] h-[18px] ${colors.text}`} />
                      ) : (
                        <LogOut className={`w-[18px] h-[18px] ${colors.text}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${colors.text}`}>
                            {isLogin ? t("profile.sessionLogin") : isForceLogout ? t("profile.sessionForceLogout") : t("profile.sessionLogout")}
                          </span>
                          <span className={`text-[9px] ${colors.bg} ${colors.text} px-1.5 py-0.5 rounded-full font-semibold ring-1 ${colors.ring}`}>
                            {isLogin ? "↗" : isForceLogout ? "⚡" : "↙"}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">{formatDate(String(s.createdAt))}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1">
                          <DeviceIconComponent icon={device.icon} className="w-3 h-3 text-muted-foreground/60" />
                          <span className="text-[11px] text-foreground/70">{device.name}</span>
                        </div>
                        {s.ip && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-muted-foreground/50" />
                              <span className="text-[10px] text-muted-foreground/60 font-mono">{maskIp(s.ip)}</span>
                            </div>
                          </>
                        )}
                      </div>
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
