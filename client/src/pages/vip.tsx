import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, CheckCircle, Lock, DollarSign, Film, Calendar, TrendingUp, Send, Clock, MessageSquare, Shield, Star, Award, Gem, Zap, Flame, Rocket, Target, Sparkles, Medal, ChevronRight, ArrowUpRight } from "lucide-react";
import type { VipPackage, User, StajyorRequest } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";

const levelIcons: Record<number, typeof Shield> = {
  0: Shield, 1: Medal, 2: Star, 3: Award, 4: Gem, 5: Zap,
  6: Flame, 7: Rocket, 8: Target, 9: Sparkles, 10: Crown,
};

function workDaysToCalendarDays(workDays: number): number {
  let calendarDays = 0;
  let counted = 0;
  const start = new Date();
  const d = new Date(start);
  while (counted < workDays) {
    d.setDate(d.getDate() + 1);
    calendarDays++;
    if (d.getDay() !== 0) {
      counted++;
    }
  }
  return calendarDays;
}

const levelColors: Record<number, { primary: string; bg: string; gradient: string; border: string; glow: string }> = {
  0: { primary: "#78909C", bg: "#78909C10", gradient: "from-[#90A4AE] to-[#607D8B]", border: "border-[#B0BEC5]/20", glow: "shadow-[#78909C]/10" },
  1: { primary: "#cd7f32", bg: "#cd7f3210", gradient: "from-[#cd7f32] to-[#a0622b]", border: "border-[#cd7f32]/20", glow: "shadow-[#cd7f32]/10" },
  2: { primary: "#78909C", bg: "#78909C10", gradient: "from-[#90A4AE] to-[#607D8B]", border: "border-[#90A4AE]/20", glow: "shadow-[#78909C]/10" },
  3: { primary: "#FFB300", bg: "#FFB30010", gradient: "from-[#FFB300] to-[#FF8F00]", border: "border-[#FFB300]/20", glow: "shadow-[#FFB300]/10" },
  4: { primary: "#42A5F5", bg: "#42A5F510", gradient: "from-[#42A5F5] to-[#1976D2]", border: "border-[#42A5F5]/20", glow: "shadow-[#42A5F5]/10" },
  5: { primary: "#AB47BC", bg: "#AB47BC10", gradient: "from-[#AB47BC] to-[#7B1FA2]", border: "border-[#AB47BC]/20", glow: "shadow-[#AB47BC]/10" },
  6: { primary: "#E53935", bg: "#E5393510", gradient: "from-[#E53935] to-[#B71C1C]", border: "border-[#E53935]/20", glow: "shadow-[#E53935]/10" },
  7: { primary: "#00897B", bg: "#00897B10", gradient: "from-[#00897B] to-[#004D40]", border: "border-[#00897B]/20", glow: "shadow-[#00897B]/10" },
  8: { primary: "#5C6BC0", bg: "#5C6BC010", gradient: "from-[#5C6BC0] to-[#283593]", border: "border-[#5C6BC0]/20", glow: "shadow-[#5C6BC0]/10" },
  9: { primary: "#F4511E", bg: "#F4511E10", gradient: "from-[#F4511E] to-[#BF360C]", border: "border-[#F4511E]/20", glow: "shadow-[#F4511E]/10" },
  10: { primary: "#FFD700", bg: "#FFD70010", gradient: "from-[#FFD700] to-[#FF8F00]", border: "border-[#FFD700]/20", glow: "shadow-[#FFD700]/10" },
};

export default function VipPage() {
  const { t, locale, translateServerMessage } = useI18n();
  const { toast } = useToast();
  const [stajyorMsg, setStajyorMsg] = useState("");
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);

  const { data: packages, isLoading } = useQuery<VipPackage[]>({
    queryKey: ["/api/vip-packages"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: stajyorRequests = [] } = useQuery<StajyorRequest[]>({
    queryKey: ["/api/stajyor/status"],
    enabled: !!user && user.vipLevel < 0,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const res = await apiRequest("POST", "/api/vip/purchase", { packageId });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vip-packages"] });
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const stajyorMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stajyor/request", { message: stajyorMsg || t("vip.defaultStajyorMessage") });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stajyor/status"] });
      setStajyorMsg("");
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sortedPackages = [...(packages || [])].sort((a, b) => a.level - b.level);

  return (
    <div className="px-4 py-4 space-y-4 pb-24">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-5 shadow-xl shadow-primary/20 animate-fade-up" style={{ animationDelay: "0.05s", animationFillMode: "both" }} data-testid="vip-header">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{t("vip.title")}</h1>
              <p className="text-white/50 text-xs">{t("vip.subtitle")}</p>
            </div>
          </div>
          {user && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-white/50 uppercase tracking-wider">{t("vip.currentLevel")}</p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {user.vipLevel < 0 ? t("common.notEmployee") : getVipName(user.vipLevel, locale)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/5">
                <p className="text-[10px] text-white/50 uppercase tracking-wider">{t("common.balance")}</p>
                <p className="text-sm font-bold text-white mt-0.5">${Number(user.balance).toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {user && user.vipLevel < 0 && (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm" data-testid="stajyor-request-section">
          <div className="bg-gradient-to-r from-[#90A4AE] to-[#607D8B] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm">{t("vip.stajyorActivation")}</h3>
                <p className="text-white/60 text-[11px]">{t("vip.stajyorDesc")}</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            {stajyorRequests.some(r => r.status === "pending") ? (
              <div className="bg-amber-500/8 rounded-xl p-4 border border-amber-500/15 text-center">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-2.5">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <p className="text-amber-500 font-bold text-sm">{t("vip.requestSent")}</p>
                <p className="text-muted-foreground text-xs mt-1">{t("vip.adminChecking")}</p>
              </div>
            ) : stajyorRequests.some(r => r.status === "rejected") && !stajyorRequests.some(r => r.status === "pending") ? (
              <div className="space-y-3">
                <div className="bg-red-500/8 rounded-xl p-3 border border-red-500/15">
                  <p className="text-red-500 text-xs font-medium">{t("vip.previousRejected")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={stajyorMsg}
                      onChange={(e) => setStajyorMsg(e.target.value)}
                      placeholder={t("vip.writeMessage")}
                      className="w-full bg-transparent border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      data-testid="input-stajyor-message"
                    />
                  </div>
                  <Button
                    onClick={() => stajyorMutation.mutate()}
                    disabled={stajyorMutation.isPending}
                    className="bg-gradient-to-r from-[#90A4AE] to-[#607D8B] text-white rounded-xl px-5 font-bold shadow-md"
                    data-testid="button-send-stajyor"
                  >
                    {stajyorMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4 mr-1.5" /> {t("common.send")}</>}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-[10px] font-bold">1</span>
                    </div>
                    <p className="leading-relaxed">{t("vip.stajyorInfo1")}</p>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-primary text-[10px] font-bold">2</span>
                    </div>
                    <p className="leading-relaxed">{t("vip.stajyorInfo2")}</p>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                    </div>
                    <p className="text-primary leading-relaxed font-medium">{t("vip.stajyorInfo3")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={stajyorMsg}
                      onChange={(e) => setStajyorMsg(e.target.value)}
                      placeholder={t("vip.writeMessage")}
                      className="w-full bg-transparent border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      data-testid="input-stajyor-message"
                    />
                  </div>
                  <Button
                    onClick={() => stajyorMutation.mutate()}
                    disabled={stajyorMutation.isPending}
                    className="bg-gradient-to-r from-[#90A4AE] to-[#607D8B] text-white rounded-xl px-5 font-bold shadow-md"
                    data-testid="button-send-stajyor"
                  >
                    {stajyorMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4 mr-1.5" /> {t("common.send")}</>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center">
            <Crown className="w-3.5 h-3.5 text-primary" />
          </div>
          {t("vip.allPackages")}
        </h2>
        <div className="space-y-3">
          {sortedPackages.map((pkg) => {
            const colors = levelColors[pkg.level] || levelColors[1];
            const isCurrentLevel = user?.vipLevel === pkg.level;
            const isLocked = pkg.isLocked;
            const canBuy = !isCurrentLevel && !isLocked && user && Number(user.balance) >= Number(pkg.price);
            const isExpanded = expandedPkg === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`bg-card rounded-2xl border overflow-hidden shadow-sm transition-all card-hover animate-fade-up ${
                  isCurrentLevel
                    ? `ring-1 ${colors.border} shadow-md ${colors.glow}`
                    : isLocked
                    ? "border-border/30 opacity-60"
                    : "border-border/50"
                }`}
                data-testid={`card-vip-${pkg.level}`}
              >
                {isCurrentLevel && (
                  <div className={`bg-gradient-to-r ${colors.gradient} px-4 py-1.5 text-center`}>
                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                      {t("vip.currentPackage")}
                    </span>
                  </div>
                )}

                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedPkg(isExpanded ? null : pkg.id)}
                  data-testid={`toggle-vip-${pkg.level}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center border"
                        style={{ backgroundColor: colors.bg, borderColor: colors.primary + "20" }}
                      >
                        {(() => { const Icon = levelIcons[pkg.level] || (isLocked ? Lock : Crown); return <Icon className="w-5 h-5" style={{ color: colors.primary }} />; })()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-foreground font-bold text-sm">{pkg.name === "Stajyor" ? getVipName(0, locale) : pkg.name}</h3>
                          {isLocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                          {isCurrentLevel && (
                            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider" style={{ backgroundColor: colors.primary + "15", color: colors.primary }}>
                              {t("common.active")}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-0.5">
                          {pkg.level === 0 ? t("vip.descStajyor") : t("vip.descDaily", { count: pkg.dailyTasks })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-base font-bold" style={{ color: colors.primary }}>
                          {Number(pkg.price) === 0 ? t("common.free") : `$${Number(pkg.price).toLocaleString()}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">
                          +${Number(pkg.dailyEarning).toFixed(2)}/{t("common.days")}
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="h-px bg-border/50" />

                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-xl p-2.5 text-center border" style={{ backgroundColor: colors.bg, borderColor: colors.primary + "15" }}>
                        <Film className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: colors.primary }} />
                        <p className="text-foreground font-bold text-xs">{pkg.dailyTasks}</p>
                        <p className="text-muted-foreground text-[9px] uppercase tracking-wider">{t("common.dailyVideo")}</p>
                      </div>
                      <div className="rounded-xl p-2.5 text-center border" style={{ backgroundColor: colors.bg, borderColor: colors.primary + "15" }}>
                        <DollarSign className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: colors.primary }} />
                        <p className="font-bold text-xs" style={{ color: colors.primary }}>${Number(pkg.perVideoReward).toFixed(2)}</p>
                        <p className="text-muted-foreground text-[9px] uppercase tracking-wider">{t("common.perVideo")}</p>
                      </div>
                      <div className="rounded-xl p-2.5 text-center border" style={{ backgroundColor: colors.bg, borderColor: colors.primary + "15" }}>
                        <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: colors.primary }} />
                        <p className="font-bold text-xs" style={{ color: colors.primary }}>${Number(pkg.dailyEarning).toFixed(2)}</p>
                        <p className="text-muted-foreground text-[9px] uppercase tracking-wider">{t("common.dailyEarning")}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2.5 border border-border/30">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground text-[11px]">
                          {t("vip.duration", { days: workDaysToCalendarDays(pkg.durationDays) })} ({pkg.durationDays} {t("vip.workDays")})
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                        style={{
                          color: isLocked ? "var(--muted-foreground)" : colors.primary,
                          backgroundColor: isLocked ? "transparent" : colors.bg,
                          borderColor: isLocked ? "var(--border)" : colors.primary + "20",
                        }}
                      >
                        {isLocked ? t("common.locked") : t("common.open")}
                      </span>
                    </div>

                    {Number(pkg.price) > 0 && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/20 rounded-lg px-3 py-2 border border-border/20">
                        <Shield className="w-3.5 h-3.5 shrink-0" />
                        <span>{t("vip.guarantee")}</span>
                      </div>
                    )}

                    {!isCurrentLevel && !isLocked && Number(pkg.price) > 0 && (
                      <Button
                        className={`w-full font-bold rounded-xl shadow-md text-white bg-gradient-to-r ${colors.gradient} no-default-hover-elevate no-default-active-elevate`}
                        disabled={purchaseMutation.isPending || !canBuy}
                        onClick={() => purchaseMutation.mutate(pkg.id)}
                        data-testid={`button-buy-vip-${pkg.level}`}
                      >
                        {purchaseMutation.isPending
                          ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : canBuy
                          ? <><ArrowUpRight className="w-4 h-4 mr-1.5" /> {t("vip.buyNow")}</>
                          : t("vip.needAmount", { amount: Number(pkg.price).toLocaleString() })
                        }
                      </Button>
                    )}

                    {isLocked && (
                      <div className="flex items-center justify-center gap-2 py-2.5 bg-muted/20 rounded-xl border border-border/20">
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm font-medium">{t("common.locked")}</span>
                      </div>
                    )}

                    {isCurrentLevel && (
                      <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl border" style={{ backgroundColor: colors.primary + "08", borderColor: colors.primary + "15" }}>
                        <CheckCircle className="w-4 h-4" style={{ color: colors.primary }} />
                        <span className="text-sm font-bold" style={{ color: colors.primary }}>{t("common.active")}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-primary/80 text-xs leading-relaxed">
            <span className="font-bold text-primary">{t("vip.important")}</span>{" "}
            {t("vip.importantNote")}
          </p>
        </div>
      </div>
    </div>
  );
}
