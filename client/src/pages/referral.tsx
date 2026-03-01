import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Copy, UserPlus, Check, Share2, Crown, User, ChevronDown, ChevronRight, Phone, QrCode, ExternalLink } from "lucide-react";
import { SiTelegram, SiWhatsapp } from "react-icons/si";
import { useState, useEffect, useRef } from "react";
import type { User as UserType } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";

interface ReferralStats {
  level1: { count: number; commission: string };
  level2: { count: number; commission: string };
  level3: { count: number; commission: string };
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

export default function ReferralPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(1);
  const [showQr, setShowQr] = useState(false);
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
    refetchInterval: 30000,
  });

  const { data: referredUsers = [] } = useQuery<ReferredUser[]>({
    queryKey: ["/api/referrals/users"],
    refetchInterval: 30000,
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
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: t("common.copied"), description: t("referral.linkCopied") });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t("common.error"), description: t("referral.copyFailed"), variant: "destructive" });
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCodeCopied(true);
      toast({ title: t("common.copied"), description: t("referral.codeCopied") });
      setTimeout(() => setCodeCopied(false), 2000);
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

  return (
    <div className="p-4 space-y-4 pb-6">

      <div className="bg-primary rounded-2xl p-5 text-foreground shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg">{t("referral.title")}</h2>
            <p className="text-foreground/70 text-xs">{t("referral.threeLevel")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-foreground/60 text-[10px] uppercase tracking-wider">{t("referral.totalReferrals")}</p>
            <p className="text-foreground font-bold text-2xl" data-testid="text-total-referrals">{totalCount}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-foreground/60 text-[10px] uppercase tracking-wider">{t("referral.totalEarnings")}</p>
            <p className="text-foreground font-bold text-2xl" data-testid="text-total-earnings">{totalEarnings.toFixed(2)}</p>
            <p className="text-foreground/60 text-[10px]">USDT</p>
          </div>
        </div>

        {totalEarnings > 0 && (
          <div className="mb-3">
            <p className="text-foreground/60 text-[10px] uppercase tracking-wider mb-1.5">{t("referral.earningsBreakdown")}</p>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-white/10">
              {levels.map((l) => {
                const w = totalEarnings > 0 ? (Number(l.data?.commission || 0) / totalEarnings) * 100 : 0;
                return w > 0 ? (
                  <div key={l.level} style={{ width: `${w}%`, backgroundColor: l.color }} className="h-full transition-all" />
                ) : null;
              })}
            </div>
            <div className="flex gap-3 mt-1.5">
              {levels.map((l) => (
                <div key={l.level} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                  <span className="text-foreground/60 text-[9px]">{l.percent}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-foreground/70 text-[11px] leading-relaxed">
          {t("referral.description")}
        </p>
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border space-y-3">
        <div>
          <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("referral.yourCode")}</label>
          <div className="flex gap-2 mt-2 items-center">
            <div className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-3 text-center" data-testid="text-referral-code">
              <span className="text-foreground font-bold text-2xl tracking-[0.3em] font-mono">{referralCode}</span>
            </div>
            <Button
              onClick={copyCode}
              variant="outline"
              className="shrink-0 rounded-xl h-14 px-4 border-border"
              data-testid="button-copy-code"
            >
              {codeCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("referral.yourLink")}</label>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 text-foreground text-xs truncate font-mono" data-testid="text-referral-link">
              {referralLink}
            </div>
            <Button
              onClick={copyLink}
              className="bg-primary text-primary-foreground font-medium shrink-0 no-default-hover-elevate no-default-active-elevate rounded-xl h-10 px-4 shadow-md"
              data-testid="button-copy-link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("referral.shareVia")}</label>
          <div className="flex gap-2 mt-2">
            <button
              onClick={shareViaTelegram}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#229ED9]/10 border border-[#229ED9]/20 text-[#229ED9] transition-colors active:bg-[#229ED9]/20"
              data-testid="button-share-telegram"
            >
              <SiTelegram className="w-5 h-5" />
              <span className="text-[10px] font-medium">Telegram</span>
            </button>
            <button
              onClick={shareViaWhatsApp}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] transition-colors active:bg-[#25D366]/20"
              data-testid="button-share-whatsapp"
            >
              <SiWhatsapp className="w-5 h-5" />
              <span className="text-[10px] font-medium">WhatsApp</span>
            </button>
            <button
              onClick={() => setShowQr(true)}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/20 text-[#A78BFA] transition-colors active:bg-[#A78BFA]/20"
              data-testid="button-show-qr"
            >
              <QrCode className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t("referral.qrCode")}</span>
            </button>
            <button
              onClick={shareNative}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl bg-muted border border-border text-muted-foreground transition-colors active:bg-muted/70"
              data-testid="button-share-native"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t("common.share") ?? "Share"}</span>
            </button>
          </div>
        </div>
      </div>

      <Dialog open={showQr} onOpenChange={setShowQr}>
        <DialogContent className="bg-background border-border p-0 max-w-xs w-full rounded-2xl overflow-hidden" aria-describedby="qr-dialog-desc">
          <div className="bg-gradient-to-br from-[#A78BFA]/20 via-card to-card px-4 pt-5 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/20 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-[#A78BFA]" />
              </div>
              <div>
                <h2 className="text-foreground font-bold text-base">{t("referral.qrCode")}</h2>
                <p id="qr-dialog-desc" className="text-muted-foreground text-xs">{t("referral.scanToJoin")}</p>
              </div>
            </div>
          </div>
          <div className="p-5 flex flex-col items-center gap-4">
            {qrUrl && (
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <img src={qrUrl} alt="QR Code" className="w-[220px] h-[220px]" data-testid="img-qr-code" />
              </div>
            )}
            <div className="text-center">
              <p className="text-foreground font-bold text-xl tracking-[0.3em] font-mono">{referralCode}</p>
              <p className="text-muted-foreground text-xs mt-1">{t("referral.yourCode")}</p>
            </div>
            <Button
              onClick={copyLink}
              className="w-full bg-primary text-primary-foreground rounded-xl h-11 no-default-hover-elevate no-default-active-elevate font-semibold"
              data-testid="button-copy-link-qr"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {t("referral.linkCopied").includes("nusxalandi") || copied ? t("common.copied") : t("referral.yourLink")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {levels.map((item) => {
          const levelUsers = referredUsers.filter(u => u.level === item.level);
          const isExpanded = expandedLevel === item.level;
          const earningsPct = totalEarnings > 0 ? (Number(item.data?.commission || 0) / totalEarnings) * 100 : 0;
          return (
            <div
              key={item.level}
              className="bg-card rounded-2xl shadow-sm border overflow-hidden transition-colors"
              style={{ borderColor: isExpanded ? item.borderColor + "40" : "hsl(var(--border))" }}
              data-testid={`card-referral-level-${item.level}`}
            >
              <button
                onClick={() => setExpandedLevel(isExpanded ? null : item.level)}
                className="flex items-center justify-between w-full px-4 py-4 text-left"
                data-testid={`button-expand-level-${item.level}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: item.bg, color: item.color }}
                  >
                    {item.level}
                  </div>
                  <div>
                    <h4 className="text-foreground font-semibold text-sm">{t("referral.levelReferrals", { level: item.level })}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.percent} {t("referral.commission")}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground text-xs">{item.data?.count ?? 0} {t("common.people")}</span>
                    </div>
                    {totalEarnings > 0 && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${earningsPct}%`, backgroundColor: item.color }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{earningsPct.toFixed(0)}%</span>
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
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border">
                  {levelUsers.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <UserPlus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-xs">{t("referral.noReferrals")}</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {levelUsers.map((u, i) => {
                        const badge = getVipBadge(u.vipLevel);
                        return (
                          <div key={i} className="px-4 py-3 flex items-center justify-between" data-testid={`referral-user-${item.level}-${i}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Phone className="w-3 h-3 text-muted-foreground" />
                                  <p className="text-foreground text-sm font-mono">{maskPhone(u.phone)}</p>
                                </div>
                              </div>
                            </div>
                            <div
                              className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                              style={{ backgroundColor: badge.bg, color: badge.color }}
                            >
                              {u.vipLevel > 0 && <Crown className="w-2.5 h-2.5 inline mr-1" />}
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

      <div className="bg-card rounded-2xl p-4 border border-border">
        <h3 className="text-foreground font-bold text-sm mb-3">{t("referral.howItWorks")}</h3>
        <div className="space-y-2.5">
          {[
            { step: "1", text: t("referral.step1"), color: "hsl(var(--primary))" },
            { step: "2", text: t("referral.step2"), color: "#4CAF50" },
            { step: "3", text: t("referral.step3"), color: "#2196F3" },
          ].map((s) => (
            <div key={s.step} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: s.color + "20", color: s.color }}>
                {s.step}
              </div>
              <p className="text-muted-foreground text-xs">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
