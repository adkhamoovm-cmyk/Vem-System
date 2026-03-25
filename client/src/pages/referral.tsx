import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Copy, UserPlus, Check, Share2, Crown, User, ChevronDown, ChevronRight, Phone, QrCode, ExternalLink, TrendingUp, TrendingDown, BarChart3, Activity, Users, Zap, Clock } from "lucide-react";
import { SiTelegram, SiWhatsapp } from "react-icons/si";
import { useState, useEffect, useRef } from "react";
import type { User as UserType } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/utils";
import { getVipName } from "@/lib/vip-utils";

interface ReferralStats {
  level1: { count: number; commission: string };
  level2: { count: number; commission: string };
  level3: { count: number; commission: string };
}

interface ExtendedStats {
  vipDistribution: Record<string, number>;
  thisMonthEarnings: string;
  lastMonthEarnings: string;
  recentActivity: { amount: string; description: string; date: string }[];
  activeReferrals: number;
  totalReferrals: number;
}

interface ReferredUser {
  phone: string;
  vipLevel: number;
  level: number;
}

function maskPhone(phone: string | null | undefined) {
  if (!phone) return "••••••";
  if (phone.length <= 6) return phone;
  return phone.slice(0, 3) + "••••" + phone.slice(-3);
}

function timeAgo(dateStr: string, locale: string) {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) {
    const t: Record<string, string> = { uz: "hozirgina", ru: "только что", en: "just now", es: "ahora mismo", tr: "az önce" };
    return t[locale] || t.en;
  }
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    const t: Record<string, string> = { uz: `${m} daqiqa oldin`, ru: `${m} мин. назад`, en: `${m}m ago`, es: `hace ${m} min`, tr: `${m} dk önce` };
    return t[locale] || t.en;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    const t: Record<string, string> = { uz: `${h} soat oldin`, ru: `${h} ч. назад`, en: `${h}h ago`, es: `hace ${h}h`, tr: `${h} sa önce` };
    return t[locale] || t.en;
  }
  const days = Math.floor(diff / 86400);
  const t: Record<string, string> = { uz: `${days} kun oldin`, ru: `${days} дн. назад`, en: `${days}d ago`, es: `hace ${days}d`, tr: `${days} gün önce` };
  return t[locale] || t.en;
}

export default function ReferralPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(1);
  const [showQr, setShowQr] = useState(false);
  const [activeTab, setActiveTab] = useState<"levels" | "stats">("levels");
  const prevCountRef = useRef<number | null>(null);

  function getVipBadge(vipLevel: number) {
    if (vipLevel > 0) {
      return { label: getVipName(vipLevel, locale), color: "#FFB300", bg: "rgba(255, 179, 0, 0.15)" };
    }
    if (vipLevel === 0) {
      return { label: getVipName(0, locale), color: "#4ADE80", bg: "rgba(74, 222, 128, 0.15)" };
    }
    return { label: t("referral.regularMember"), color: "hsl(var(--muted-foreground))", bg: "rgba(102, 102, 102, 0.15)" };
  }

  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals/stats"],
  });

  const { data: referredUsers = [] } = useQuery<ReferredUser[]>({
    queryKey: ["/api/referrals/users"],
  });

  const { data: extStats } = useQuery<ExtendedStats>({
    queryKey: ["/api/referrals/extended-stats"],
  });

  const referralLink = user ? `${window.location.origin}/register?ref=${user.referralCode}` : "";
  const referralCode = user?.referralCode ?? "";

  const levels = [
    { level: 1, percent: "9%", color: "hsl(var(--primary))", bg: "rgba(255, 107, 53, 0.15)", borderColor: "hsl(var(--primary))", data: stats?.level1 },
    { level: 2, percent: "3%", color: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)", borderColor: "#4CAF50", data: stats?.level2 },
    { level: 3, percent: "1%", color: "#2196F3", bg: "rgba(33, 150, 243, 0.15)", borderColor: "#2196F3", data: stats?.level3 },
  ];

  const totalEarnings = levels.reduce((sum, l) => sum + Number(l.data?.commission || 0), 0);
  const totalCount = levels.reduce((sum, l) => sum + (l.data?.count || 0), 0);

  useEffect(() => {
    if (stats) {
      const currentCount = (stats.level1.count ?? 0) + (stats.level2.count ?? 0) + (stats.level3.count ?? 0);
      if (prevCountRef.current !== null && currentCount > prevCountRef.current) {
        toast({ title: t("referral.newReferral"), description: t("referral.newReferralDesc") });
      }
      prevCountRef.current = currentCount;
    }
  }, [stats]);

  const copyLink = async () => {
    try {
      const ok = await copyToClipboard(referralLink);
      if (ok) {
        setCopied(true);
        toast({ title: t("common.copied"), description: t("referral.linkCopied") });
        setTimeout(() => setCopied(false), 2000);
      } else {
        toast({ title: t("common.error"), description: t("referral.copyFailed"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("common.error"), description: t("referral.copyFailed"), variant: "destructive" });
    }
  };

  const copyCode = async () => {
    try {
      const ok = await copyToClipboard(referralCode);
      if (ok) {
        setCodeCopied(true);
        toast({ title: t("common.copied"), description: t("referral.codeCopied") });
        setTimeout(() => setCodeCopied(false), 2000);
      } else {
        toast({ title: t("common.error"), description: t("referral.copyFailed"), variant: "destructive" });
      }
    } catch {
      toast({ title: t("common.error"), description: t("referral.copyFailed"), variant: "destructive" });
    }
  };

  const shareText = `${t("referral.shareText")} ${referralCode}\n${referralLink}`;

  const shareViaTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(t("referral.shareText") + " " + referralCode)}`, "_blank");
  };

  const shareViaWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "VEM Media", text: shareText, url: referralLink });
      } catch {}
    } else {
      await copyLink();
    }
  };

  const qrUrl = referralLink ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(referralLink)}&margin=10` : "";

  const thisMonth = Number(extStats?.thisMonthEarnings || 0);
  const lastMonth = Number(extStats?.lastMonthEarnings || 0);
  const growthPct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : thisMonth > 0 ? 100 : 0;

  const vipDist = extStats?.vipDistribution || {};
  const vipEntries = Object.entries(vipDist)
    .map(([k, v]) => ({ level: Number(k), count: v }))
    .sort((a, b) => b.count - a.count);
  const maxVipCount = Math.max(...vipEntries.map(e => e.count), 1);

  const vipColors: Record<number, string> = {
    [-1]: "#6B7280",
    0: "#4ADE80",
    1: "#60A5FA",
    2: "#818CF8",
    3: "#A78BFA",
    4: "#C084FC",
    5: "#E879F9",
    6: "#F472B6",
    7: "#FB923C",
    8: "#FBBF24",
    9: "#F59E0B",
    10: "#FFB300",
  };

  return (
    <div className="p-4 space-y-4 pb-6">

      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-5 shadow-xl shadow-primary/20 animate-fade-up" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
              <Share2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white">{t("referral.title")}</h2>
              <p className="text-white/60 text-xs">{t("referral.threeLevel")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-white/50 text-[10px] uppercase tracking-widest font-medium">{t("referral.totalReferrals")}</p>
              <p className="text-white font-bold text-3xl mt-1" data-testid="text-total-referrals">{totalCount}</p>
              <p className="text-white/40 text-[10px] mt-0.5">{t("common.people")}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <p className="text-white/50 text-[10px] uppercase tracking-widest font-medium">{t("referral.totalEarnings")}</p>
              <p className="text-white font-bold text-3xl mt-1" data-testid="text-total-earnings">{totalEarnings.toFixed(2)}</p>
              <p className="text-white/40 text-[10px] mt-0.5">USDT</p>
            </div>
          </div>

          {totalEarnings > 0 && (
            <div className="mb-4 bg-white/5 rounded-xl p-3 border border-white/10">
              <p className="text-white/50 text-[10px] uppercase tracking-widest font-medium mb-2">{t("referral.earningsBreakdown")}</p>
              <div className="flex gap-1 h-2.5 rounded-full overflow-hidden bg-white/10">
                {levels.map((l) => {
                  const w = totalEarnings > 0 ? (Number(l.data?.commission || 0) / totalEarnings) * 100 : 0;
                  return w > 0 ? (
                    <div key={l.level} style={{ width: `${w}%`, backgroundColor: l.color }} className="h-full transition-all first:rounded-l-full last:rounded-r-full" />
                  ) : null;
                })}
              </div>
              <div className="flex gap-4 mt-2">
                {levels.map((l) => (
                  <div key={l.level} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: l.color }} />
                    <span className="text-white/60 text-[10px] font-medium">{t("referral.levelReferrals", { level: l.level })} · {l.percent}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-white/50 text-[11px] leading-relaxed">
            {t("referral.description")}
          </p>
        </div>
      </div>

      {(thisMonth > 0 || lastMonth > 0 || (extStats?.activeReferrals ?? 0) > 0) && (
        <div className="grid grid-cols-3 gap-2.5 animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          <div className="bg-card rounded-2xl border border-border p-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-muted-foreground text-[9px] uppercase tracking-widest font-medium">{t("referral.thisMonth")}</p>
            <p className="text-foreground font-bold text-lg mt-0.5" data-testid="text-this-month">{thisMonth.toFixed(2)}</p>
            <p className="text-muted-foreground text-[10px]">USDT</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-full -translate-y-1/3 translate-x-1/3" />
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center mb-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-muted-foreground text-[9px] uppercase tracking-widest font-medium">{t("referral.lastMonth")}</p>
            <p className="text-foreground font-bold text-lg mt-0.5" data-testid="text-last-month">{lastMonth.toFixed(2)}</p>
            <p className="text-muted-foreground text-[10px]">USDT</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-3.5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-12 h-12 ${growthPct >= 0 ? "bg-emerald-500/5" : "bg-red-500/5"} rounded-full -translate-y-1/3 translate-x-1/3`} />
            <div className={`w-8 h-8 rounded-xl ${growthPct >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"} flex items-center justify-center mb-2`}>
              {growthPct >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            </div>
            <p className="text-muted-foreground text-[9px] uppercase tracking-widest font-medium">{t("referral.growth")}</p>
            <p className={`font-bold text-lg mt-0.5 ${growthPct >= 0 ? "text-emerald-500" : "text-red-500"}`} data-testid="text-growth">
              {growthPct >= 0 ? "+" : ""}{growthPct.toFixed(0)}%
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              <span className="text-[10px] text-muted-foreground">{extStats?.activeReferrals ?? 0} {t("referral.activeDesc")}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden animate-fade-up" style={{ animationDelay: "0.12s", animationFillMode: "both" }}>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">{t("referral.yourCode")}</label>
            <div className="flex gap-2 mt-2 items-center">
              <div className="flex-1 relative bg-gradient-to-r from-primary/5 to-blue-500/5 dark:from-primary/10 dark:to-blue-500/10 border border-primary/20 rounded-xl px-4 py-3.5 text-center" data-testid="text-referral-code">
                <span className="text-foreground font-bold text-2xl tracking-[0.3em] font-mono">{referralCode}</span>
              </div>
              <button
                onClick={copyCode}
                className="shrink-0 w-14 h-14 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted/50 transition-colors active:scale-95"
                data-testid="button-copy-code"
              >
                {codeCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">{t("referral.yourLink")}</label>
            <div className="flex gap-2 mt-2">
              <div className="flex-1 bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-foreground text-xs truncate font-mono" data-testid="text-referral-link">
                {referralLink}
              </div>
              <Button
                onClick={copyLink}
                className="bg-gradient-to-r from-primary to-blue-600 text-white font-medium shrink-0 no-default-hover-elevate no-default-active-elevate rounded-xl h-10 px-5 shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                data-testid="button-copy-link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4">
          <label className="text-muted-foreground text-[10px] font-semibold uppercase tracking-widest">{t("referral.shareVia")}</label>
          <div className="grid grid-cols-4 gap-2 mt-2.5">
            <button
              onClick={shareViaTelegram}
              className="flex flex-col items-center gap-2 py-3.5 rounded-xl bg-gradient-to-b from-[#229ED9]/15 to-[#229ED9]/5 border border-[#229ED9]/20 text-[#229ED9] transition-all active:scale-95 hover:border-[#229ED9]/40"
              data-testid="button-share-telegram"
            >
              <div className="w-10 h-10 rounded-xl bg-[#229ED9]/15 flex items-center justify-center">
                <SiTelegram className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">Telegram</span>
            </button>
            <button
              onClick={shareViaWhatsApp}
              className="flex flex-col items-center gap-2 py-3.5 rounded-xl bg-gradient-to-b from-[#25D366]/15 to-[#25D366]/5 border border-[#25D366]/20 text-[#25D366] transition-all active:scale-95 hover:border-[#25D366]/40"
              data-testid="button-share-whatsapp"
            >
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 flex items-center justify-center">
                <SiWhatsapp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">WhatsApp</span>
            </button>
            <button
              onClick={() => setShowQr(true)}
              className="flex flex-col items-center gap-2 py-3.5 rounded-xl bg-gradient-to-b from-[#A78BFA]/15 to-[#A78BFA]/5 border border-[#A78BFA]/20 text-[#A78BFA] transition-all active:scale-95 hover:border-[#A78BFA]/40"
              data-testid="button-show-qr"
            >
              <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/15 flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">{t("referral.qrCode")}</span>
            </button>
            <button
              onClick={shareNative}
              className="flex flex-col items-center gap-2 py-3.5 rounded-xl bg-gradient-to-b from-muted/80 to-muted/30 border border-border text-muted-foreground transition-all active:scale-95 hover:border-primary/30"
              data-testid="button-share-native"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <ExternalLink className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold">{t("common.share") ?? "Share"}</span>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="bg-background border-border p-0 max-w-xs w-full rounded-2xl overflow-hidden" aria-describedby="qr-dialog-desc">
          <div className="bg-gradient-to-br from-violet-500/20 via-card to-card px-5 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/10 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h2 className="text-foreground font-bold text-base">{t("referral.qrCode")}</h2>
                <p id="qr-dialog-desc" className="text-muted-foreground text-xs">{t("referral.scanToJoin")}</p>
              </div>
            </div>
          </div>
          <div className="p-6 flex flex-col items-center gap-5">
            {qrUrl && (
              <div className="p-4 bg-white rounded-2xl shadow-md">
                <img src={qrUrl} alt="QR Code" className="w-[200px] h-[200px]" data-testid="img-qr-code" />
              </div>
            )}
            <div className="text-center">
              <p className="text-foreground font-bold text-xl tracking-[0.3em] font-mono">{referralCode}</p>
              <p className="text-muted-foreground text-xs mt-1">{t("referral.yourCode")}</p>
            </div>
            <Button
              onClick={copyLink}
              className="w-full bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl h-11 no-default-hover-elevate no-default-active-elevate font-semibold shadow-lg shadow-primary/20"
              data-testid="button-copy-link-qr"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {t("referral.linkCopied").includes("nusxalandi") || copied ? t("common.copied") : t("referral.yourLink")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex bg-card rounded-2xl border border-border p-1.5 gap-1 animate-fade-up" style={{ animationDelay: "0.15s", animationFillMode: "both" }}>
        <button
          onClick={() => setActiveTab("levels")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === "levels"
              ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-levels"
        >
          <Users className="w-4 h-4" />
          {t("referral.levelReferrals", { level: "" }).replace(/\d/, "").trim()}
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === "stats"
              ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/20"
              : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-stats"
        >
          <BarChart3 className="w-4 h-4" />
          {t("referral.statistics")}
        </button>
      </div>

      {activeTab === "levels" && (
        <div className="space-y-3 animate-fade-up" style={{ animationDelay: "0.18s", animationFillMode: "both" }}>
          {levels.map((item) => {
            const levelUsers = referredUsers.filter(u => u.level === item.level);
            const isExpanded = expandedLevel === item.level;
            const earningsPct = totalEarnings > 0 ? (Number(item.data?.commission || 0) / totalEarnings) * 100 : 0;
            return (
              <div
                key={item.level}
                className="bg-card rounded-2xl border overflow-hidden transition-all"
                style={{ borderColor: isExpanded ? item.borderColor + "40" : "hsl(var(--border))" }}
                data-testid={`card-referral-level-${item.level}`}
              >
                <button
                  onClick={() => setExpandedLevel(isExpanded ? null : item.level)}
                  className="flex items-center justify-between w-full px-4 py-4 text-left hover:bg-muted/30 transition-colors group"
                  data-testid={`button-expand-level-${item.level}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${item.color}25, ${item.color}10)`, color: item.color, border: `1px solid ${item.color}20` }}
                    >
                      {item.level}
                    </div>
                    <div>
                      <h4 className="text-foreground font-semibold text-sm">{t("referral.levelReferrals", { level: item.level })}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: item.color, backgroundColor: item.bg }}>{item.percent}</span>
                        <span className="text-muted-foreground text-xs">{item.data?.count ?? 0} {t("common.people")}</span>
                      </div>
                      {totalEarnings > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${earningsPct}%`, background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground font-medium">{earningsPct.toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-sm" style={{ color: item.color }}>
                        {Number(item.data?.commission ?? 0).toFixed(2)}
                      </p>
                      <p className="text-muted-foreground text-[10px]">USDT</p>
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-muted/50 flex items-center justify-center">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border" style={{ borderColor: item.borderColor + "20" }}>
                    {levelUsers.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                          <UserPlus className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground text-xs">{t("referral.noReferrals")}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {levelUsers.map((u, i) => {
                          const badge = getVipBadge(u.vipLevel);
                          return (
                            <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors" data-testid={`referral-user-${item.level}-${i}`}>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${item.color}15, ${item.color}08)` }}>
                                  <User className="w-4 h-4" style={{ color: item.color }} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3 text-muted-foreground" />
                                    <p className="text-foreground text-sm font-mono">{maskPhone(u.phone)}</p>
                                  </div>
                                </div>
                              </div>
                              <div
                                className="px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1"
                                style={{ backgroundColor: badge.bg, color: badge.color }}
                              >
                                {u.vipLevel > 0 && <Crown className="w-2.5 h-2.5" />}
                                {badge.label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "stats" && (
        <div className="space-y-4 animate-fade-up" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 pb-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <h3 className="text-foreground font-bold text-sm">{t("referral.vipDistribution")}</h3>
            </div>
            <div className="px-4 pb-4">
              {vipEntries.length === 0 ? (
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Crown className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-xs">{t("referral.noVipYet")}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {vipEntries.map((entry) => {
                    const color = vipColors[entry.level] || "#6B7280";
                    const pct = (entry.count / maxVipCount) * 100;
                    const name = entry.level === -1
                      ? t("referral.regularMember")
                      : getVipName(entry.level, locale);
                    return (
                      <div key={entry.level} className="flex items-center gap-3" data-testid={`vip-dist-${entry.level}`}>
                        <div className="w-20 shrink-0 flex items-center gap-1.5">
                          {entry.level > 0 && <Crown className="w-3 h-3" style={{ color }} />}
                          <span className="text-xs font-medium text-foreground truncate">{name}</span>
                        </div>
                        <div className="flex-1 h-6 bg-muted/50 rounded-lg overflow-hidden relative">
                          <div
                            className="h-full rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2"
                            style={{
                              width: `${Math.max(pct, 8)}%`,
                              background: `linear-gradient(90deg, ${color}30, ${color}60)`,
                            }}
                          >
                            <span className="text-[10px] font-bold" style={{ color }}>{entry.count}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="p-4 pb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-foreground font-bold text-sm">{t("referral.recentActivity")}</h3>
            </div>
            {(!extStats?.recentActivity || extStats.recentActivity.length === 0) ? (
              <div className="px-4 pb-4">
                <div className="py-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-xs">{t("referral.noActivity")}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {extStats.recentActivity.map((act, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors" data-testid={`activity-${i}`}>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-medium">{t("referral.commissionReceived")}</p>
                      <p className="text-muted-foreground text-[10px] truncate">{act.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-emerald-500 font-bold text-sm">+{Number(act.amount).toFixed(2)}</p>
                      <div className="flex items-center gap-1 justify-end">
                        <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                        <span className="text-muted-foreground text-[10px]">{timeAgo(act.date, locale)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-2xl border border-border p-4 overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-500" />
              <h3 className="text-foreground font-bold text-sm">{t("referral.activeReferrals")}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-xl p-3 border border-border">
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-medium">{t("referral.totalReferrals")}</p>
                <p className="text-foreground font-bold text-2xl mt-1" data-testid="text-total-refs-stat">{extStats?.totalReferrals ?? 0}</p>
                <p className="text-muted-foreground text-[10px]">{t("common.people")}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-3 border border-border">
                <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-medium">{t("referral.activeReferrals")}</p>
                <p className="text-emerald-500 font-bold text-2xl mt-1" data-testid="text-active-refs">{extStats?.activeReferrals ?? 0}</p>
                <p className="text-muted-foreground text-[10px]">{t("referral.activeDesc")}</p>
              </div>
            </div>
            {(extStats?.totalReferrals ?? 0) > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                  <span>{t("referral.activeDesc")}</span>
                  <span>{((extStats?.activeReferrals ?? 0) / (extStats?.totalReferrals ?? 1) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                    style={{ width: `${((extStats?.activeReferrals ?? 0) / (extStats?.totalReferrals ?? 1) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
        <div className="p-4 pb-3">
          <h3 className="text-foreground font-bold text-sm">{t("referral.howItWorks")}</h3>
        </div>
        <div className="px-4 pb-4 space-y-0">
          {[
            { step: "1", text: t("referral.step1"), color: "hsl(var(--primary))", gradient: "from-primary/20 to-primary/5" },
            { step: "2", text: t("referral.step2"), color: "#4CAF50", gradient: "from-emerald-500/20 to-emerald-500/5" },
            { step: "3", text: t("referral.step3"), color: "#2196F3", gradient: "from-blue-500/20 to-blue-500/5" },
          ].map((s, idx) => (
            <div key={s.step} className="flex items-start gap-3 relative">
              {idx < 2 && (
                <div className="absolute left-[18px] top-10 w-px h-6" style={{ backgroundColor: s.color + "30" }} />
              )}
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-sm`} style={{ color: s.color }}>
                {s.step}
              </div>
              <div className="flex-1 py-2">
                <p className="text-muted-foreground text-xs leading-relaxed">{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
