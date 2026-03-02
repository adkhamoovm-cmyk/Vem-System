import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, CheckCircle, Lock, DollarSign, Film, Calendar, TrendingUp, Send, Clock, MessageSquare, Shield, ChevronRight, ArrowUpRight } from "lucide-react";
import type { VipPackage, User, StajyorRequest } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";
import CelebrationModal from "@/components/celebration-modal";

function VipLevelIcon({ level, size = 22 }: { level: number; size?: number }) {
  const s = size;
  
  const icons: Record<number, JSX.Element> = {
    0: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="g0" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="#B0BEC5" />
            <stop offset="100%" stopColor="#78909C" />
          </linearGradient>
        </defs>
        <path d="M8 5v14l11-7L8 5z" fill="url(#g0)" />
      </svg>
    ),
    1: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="#D4A574" />
            <stop offset="100%" stopColor="#cd7f32" />
          </linearGradient>
        </defs>
        <path d="M12 2L9 9H2l6 4.5L5.5 21 12 16.5 18.5 21 16 13.5 22 9h-7L12 2z" fill="url(#g1)" opacity="0.3" />
        <path d="M12 6l-2 4.5H5.5l3.5 2.8-1.3 4.2L12 14.5l4.3 3L15 13.3l3.5-2.8H14L12 6z" fill="url(#g1)" />
      </svg>
    ),
    2: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="g2" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="#B8C6D0" />
            <stop offset="100%" stopColor="#90A4AE" />
          </linearGradient>
        </defs>
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="url(#g2)" opacity="0.25" />
        <path d="M12 4.5L5 8.5v4.5c0 4.3 3 8.3 7 9.5 4-1.2 7-5.2 7-9.5V8.5L12 4.5z" fill="none" stroke="url(#g2)" strokeWidth="1.5" />
        <path d="M12 8l1.5 3 3.5.5-2.5 2.5.5 3.5L12 15.5 8.5 17.5l.5-3.5L6.5 11.5l3.5-.5L12 8z" fill="url(#g2)" />
      </svg>
    ),
    3: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="g3" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="#FFD54F" />
            <stop offset="100%" stopColor="#FF8F00" />
          </linearGradient>
        </defs>
        <path d="M5 16h14v3H5z" fill="url(#g3)" opacity="0.3" rx="1" />
        <path d="M7 19h10v2H7z" fill="url(#g3)" opacity="0.5" rx="1" />
        <path d="M6 16l1-8 3 3 2-6 2 6 3-3 1 8H6z" fill="url(#g3)" />
        <circle cx="12" cy="11" r="1.5" fill="#fff" opacity="0.4" />
      </svg>
    ),
    4: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="g4" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="#64B5F6" />
            <stop offset="100%" stopColor="#1976D2" />
          </linearGradient>
        </defs>
        <path d="M12 2l4 8 4-2-2 7H6L4 8l4 2 4-8z" fill="url(#g4)" opacity="0.3" />
        <path d="M12 4l3 6 3.5-1.5L16.5 15h-9L5.5 8.5 9 10l3-6z" fill="url(#g4)" />
        <path d="M12 10l1.2 2.4 2.8.4-2 2 .5 2.8L12 16l-2.5 1.6.5-2.8-2-2 2.8-.4L12 10z" fill="#fff" opacity="0.35" />
      </svg>
    ),
    5: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="g5" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="#CE93D8" />
            <stop offset="100%" stopColor="#7B1FA2" />
          </linearGradient>
        </defs>
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="url(#g5)" opacity="0.2" />
        <path d="M12 3.5L4.5 7.8v5.2c0 4.8 3.3 9.3 7.5 10.5 4.2-1.2 7.5-5.7 7.5-10.5V7.8L12 3.5z" fill="url(#g5)" />
        <path d="M13 7h-2l-.5 4.5L8 10l1 2.5-2.5 1L9 15l-1 2.5L10.5 16l1 3h1l1-3 2.5 1.5L15 15l2.5-1.5-2.5-1L16 10l-2.5 1.5L13 7z" fill="#fff" opacity="0.4" />
      </svg>
    ),
    6: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="g6" x1="12" y1="2" x2="12" y2="22">
            <stop offset="0%" stopColor="#FF6F60" />
            <stop offset="100%" stopColor="#B71C1C" />
          </linearGradient>
        </defs>
        <path d="M12 23c-4.5 0-8-3.5-8-8.5C4 9 12 1 12 1s8 8 8 13.5c0 5-3.5 8.5-8 8.5z" fill="url(#g6)" opacity="0.2" />
        <path d="M12 21c-3.3 0-6-2.7-6-6.5C6 10 12 3 12 3s6 7 6 11.5c0 3.8-2.7 6.5-6 6.5z" fill="url(#g6)" />
        <path d="M12 18c-1.7 0-3-1.3-3-3.2C9 12.5 12 9 12 9s3 3.5 3 5.8c0 1.9-1.3 3.2-3 3.2z" fill="#fff" opacity="0.3" />
      </svg>
    ),
    7: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="g7" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="#4DB6AC" />
            <stop offset="100%" stopColor="#004D40" />
          </linearGradient>
        </defs>
        <polygon points="12,1 22,6.5 22,17.5 12,23 2,17.5 2,6.5" fill="url(#g7)" opacity="0.2" />
        <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" fill="url(#g7)" />
        <polygon points="12,7 16,9.5 16,14.5 12,17 8,14.5 8,9.5" fill="#fff" opacity="0.2" />
        <circle cx="12" cy="12" r="2" fill="#fff" opacity="0.4" />
      </svg>
    ),
    8: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="g8" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="#7986CB" />
            <stop offset="100%" stopColor="#283593" />
          </linearGradient>
        </defs>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" fill="url(#g8)" opacity="0.2" />
        <path d="M12 4l2.47 5.01L20 9.97l-4 3.9.94 5.49L12 16l-4.94 3.36.94-5.49-4-3.9 5.53-.96L12 4z" fill="url(#g8)" />
        <circle cx="12" cy="11.5" r="2.5" fill="none" stroke="#fff" strokeWidth="1" opacity="0.5" />
        <circle cx="12" cy="11.5" r="1" fill="#fff" opacity="0.5" />
      </svg>
    ),
    9: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="g9" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="#FF8A65" />
            <stop offset="100%" stopColor="#BF360C" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#g9)" opacity="0.15" />
        <circle cx="12" cy="12" r="8" fill="url(#g9)" />
        <path d="M7 13l2-5 3 2 2-4h0l2 4 3-2-2 5H7z" fill="#fff" opacity="0.5" />
        <path d="M7 13h10v2.5c0 .8-.7 1.5-1.5 1.5h-7c-.8 0-1.5-.7-1.5-1.5V13z" fill="#fff" opacity="0.25" />
      </svg>
    ),
    10: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <defs>
          <linearGradient id="g10" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="50%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF8F00" />
          </linearGradient>
          <filter id="glow10">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx="12" cy="12" r="11" fill="url(#g10)" opacity="0.1" />
        <path d="M5 14l2-6 3 3 2-7 2 7 3-3 2 6H5z" fill="url(#g10)" filter="url(#glow10)" />
        <path d="M5 14h14v3c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2v-3z" fill="url(#g10)" opacity="0.7" />
        <circle cx="12" cy="10" r="1.5" fill="#fff" opacity="0.6" />
        <path d="M9 6l.5-2M12 4l0-2.5M15 6l-.5-2" stroke="url(#g10)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      </svg>
    ),
  };
  
  return icons[level] || icons[1];
}

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
  const [celebrationData, setCelebrationData] = useState<any>(null);

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
      if (data.celebration) {
        setCelebrationData(data.celebration);
      } else {
        toast({ title: t("common.success"), description: translateServerMessage(data.message) });
      }
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
                        className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}35)`, border: `1px solid ${colors.primary}30` }}
                      >
                        <VipLevelIcon level={pkg.level} size={22} />
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
      <CelebrationModal data={celebrationData} onClose={() => setCelebrationData(null)} />
    </div>
  );
}
