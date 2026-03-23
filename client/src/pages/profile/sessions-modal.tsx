import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Monitor, Globe, Shield, LogOut, LogIn,
  Smartphone, Laptop, Tablet, Clock, Wifi, Trash2, AlertTriangle
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { UserSessionLog } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

function parseDevice(ua: string | null): { name: string; icon: "phone" | "tablet" | "laptop"; browser: string; os: string } {
  if (!ua) return { name: "Web Browser", icon: "laptop", browser: "Browser", os: "" };
  const lower = ua.toLowerCase();
  const isTablet = /ipad|tablet|tab/i.test(lower);
  const isMobile = /mobile|android|iphone/i.test(lower);

  let browser = "Browser";
  if (/chrome/i.test(lower) && !/edg/i.test(lower) && !/chromium/i.test(lower)) browser = "Chrome";
  else if (/safari/i.test(lower) && !/chrome/i.test(lower)) browser = "Safari";
  else if (/firefox/i.test(lower)) browser = "Firefox";
  else if (/edg/i.test(lower)) browser = "Edge";
  else if (/opera|opr/i.test(lower)) browser = "Opera";
  else if (/samsungbrowser/i.test(lower)) browser = "Samsung";
  else if (/yabrowser/i.test(lower)) browser = "Yandex";

  let os = "";
  if (/iphone/i.test(lower)) os = "iPhone";
  else if (/ipad/i.test(lower)) os = "iPad";
  else if (/android/i.test(lower)) os = "Android";
  else if (/windows nt 10/i.test(lower)) os = "Windows 10/11";
  else if (/windows/i.test(lower)) os = "Windows";
  else if (/mac os x|macos/i.test(lower)) os = "macOS";
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

const DeviceIconComponent = ({ icon, className }: { icon: string; className?: string }) => {
  if (icon === "phone") return <Smartphone className={className} />;
  if (icon === "tablet") return <Tablet className={className} />;
  return <Laptop className={className} />;
};

function TerminateButton({ sid, onTerminate, isPending }: { sid: string; onTerminate: (sid: string) => void; isPending: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const { t } = useI18n();

  if (confirm) {
    return (
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-medium flex-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{t("profile.sessionTerminateConfirm")}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setConfirm(false)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-muted-foreground bg-muted/50 hover:bg-muted transition-colors"
            data-testid={`cancel-terminate-${sid}`}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={() => { onTerminate(sid); setConfirm(false); }}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors disabled:opacity-60 flex items-center gap-1"
            data-testid={`confirm-terminate-${sid}`}
          >
            <Trash2 className="w-3 h-3" />
            {t("profile.sessionTerminate")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/20">
      <button
        onClick={() => setConfirm(true)}
        className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-semibold text-red-400 bg-red-500/8 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/35 transition-all active:scale-[0.98]"
        data-testid={`terminate-session-${sid}`}
      >
        <LogOut className="w-3.5 h-3.5" />
        {t("profile.sessionTerminate")}
      </button>
    </div>
  );
}

export function SessionsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [tab, setTab] = useState<"active" | "history">("active");

  const { data, isLoading } = useQuery<{ logs: UserSessionLog[]; activeSessions: ActiveSession[] }>({
    queryKey: ["/api/my-sessions"],
    enabled: open,
    refetchInterval: open ? 20000 : false,
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
              <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full ring-1 ring-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-400">{activeSessions.length}</span>
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
              {[1, 2].map(i => (
                <div key={i} className="rounded-2xl p-4 border border-border/30 animate-pulse bg-card/50">
                  <div className="flex gap-3.5">
                    <div className="w-10 h-10 bg-muted/60 rounded-xl" />
                    <div className="flex-1 space-y-2.5">
                      <div className="h-3.5 bg-muted/60 rounded-lg w-36" />
                      <div className="h-2.5 bg-muted/40 rounded-lg w-28" />
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
                    className={`rounded-2xl p-3.5 border transition-all duration-200 ${
                      s.isCurrent
                        ? "bg-gradient-to-br from-cyan-500/[0.07] to-blue-500/[0.04] border-cyan-500/30 ring-1 ring-cyan-500/10"
                        : "bg-card/60 border-border/40 hover:border-border/60"
                    }`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    data-testid={`active-session-${s.sid}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ring-1 ${
                        s.isCurrent
                          ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/15 ring-cyan-500/20"
                          : "bg-muted/50 ring-border/30"
                      }`}>
                        <DeviceIconComponent
                          icon={device.icon}
                          className={`w-[19px] h-[19px] ${s.isCurrent ? "text-cyan-400" : "text-muted-foreground/70"}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <span className="text-[13px] font-bold text-foreground leading-tight">{device.name}</span>
                            {s.isCurrent && (
                              <span className="inline-flex items-center text-[9px] bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded-full font-bold tracking-wide uppercase ring-1 ring-cyan-500/25 shrink-0">
                                {t("profile.sessionCurrent")}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-0.5">{timeAgo(s.lastActive, t)}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          {s.ip && (
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-muted-foreground/50" />
                              <span className="text-[11px] text-muted-foreground/70 font-mono">{maskIp(s.ip)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${s.isCurrent ? "bg-cyan-400 animate-pulse" : "bg-emerald-400"}`} />
                            <span className="text-[10px] text-muted-foreground/60">{t("profile.sessionOnline")}</span>
                          </div>
                        </div>

                        {!s.isCurrent && (
                          <TerminateButton
                            sid={s.sid}
                            onTerminate={(sid) => terminateMutation.mutate(sid)}
                            isPending={terminateMutation.isPending}
                          />
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
                emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", ring: "ring-emerald-500/15", icon: <LogIn className="w-[17px] h-[17px] text-emerald-400" />, label: "↗" },
                amber:   { bg: "bg-amber-500/10",   text: "text-amber-400",   ring: "ring-amber-500/15",   icon: <Shield className="w-[17px] h-[17px] text-amber-400" />,   label: "⚡" },
                red:     { bg: "bg-red-500/10",      text: "text-red-400",     ring: "ring-red-500/15",     icon: <LogOut className="w-[17px] h-[17px] text-red-400" />,     label: "↙" },
              };
              const colors = colorMap[actionColor];

              return (
                <div
                  key={s.id}
                  className="rounded-2xl p-3.5 border border-border/30 hover:border-border/50 transition-all duration-200 bg-card/50"
                  style={{ animationDelay: `${idx * 30}ms` }}
                  data-testid={`session-${s.id}`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ring-1 ${colors.bg} ${colors.ring}`}>
                      {colors.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${colors.text}`}>
                            {isLogin ? t("profile.sessionLogin") : isForceLogout ? t("profile.sessionForceLogout") : t("profile.sessionLogout")}
                          </span>
                          <span className={`text-[9px] ${colors.bg} ${colors.text} px-1.5 py-0.5 rounded-full font-bold ring-1 ${colors.ring}`}>
                            {colors.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/50">{formatDate(String(s.createdAt))}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1">
                          <DeviceIconComponent icon={device.icon} className="w-3 h-3 text-muted-foreground/50" />
                          <span className="text-[11px] text-foreground/65">{device.name}</span>
                        </div>
                        {s.ip && (
                          <>
                            <span className="text-muted-foreground/30">·</span>
                            <div className="flex items-center gap-1">
                              <Globe className="w-3 h-3 text-muted-foreground/40" />
                              <span className="text-[10px] text-muted-foreground/55 font-mono">{maskIp(s.ip)}</span>
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
