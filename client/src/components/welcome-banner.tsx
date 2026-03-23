import { useState, useEffect } from "react";
import { X, PlayCircle, Users, TrendingUp, HelpCircle, Send } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { User } from "@shared/schema";

interface WelcomeBannerProps {
  user: User | undefined;
}

export function WelcomeBanner({ user }: WelcomeBannerProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    const key = `vem-welcome-${user.id}`;
    if (localStorage.getItem(key) !== "1") {
      setVisible(true);
    }
  }, [user?.id]);

  if (!visible || !user) return null;

  const handleClose = () => {
    localStorage.setItem(`vem-welcome-${user.id}`, "1");
    setVisible(false);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-gradient-to-r from-primary/20 via-blue-500/10 to-primary/5 px-4 py-3 border-b border-border flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <PlayCircle className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-bold text-sm">{t("welcome.title")}</p>
            <p className="text-muted-foreground text-[10px]">{t("welcome.subtitle")}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
            data-testid="button-close-welcome"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-3 space-y-3">
          <p className="text-foreground text-sm leading-relaxed">
            {t("welcome.greeting")}
          </p>

          <div className="space-y-2">
            <div className="flex items-start gap-2.5 bg-muted/40 rounded-xl p-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <PlayCircle className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-foreground text-xs font-semibold">{t("welcome.step1Title")}</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">{t("welcome.step1Desc")}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-muted/40 rounded-xl p-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-foreground text-xs font-semibold">{t("welcome.step2Title")}</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">{t("welcome.step2Desc")}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-muted/40 rounded-xl p-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-foreground text-xs font-semibold">{t("welcome.step3Title")}</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">{t("welcome.step3Desc")}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-muted/40 rounded-xl p-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-foreground text-xs font-semibold">{t("welcome.step4Title")}</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed mt-0.5">{t("welcome.step4Desc")}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2.5">
            <Send className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <p className="text-foreground text-[11px] leading-relaxed">
              {t("welcome.supportHint")}{" "}
              <a
                href="https://t.me/vem_ms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline font-medium"
                data-testid="link-welcome-support"
              >
                @vem_ms
              </a>
            </p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl h-10 text-sm font-semibold flex items-center justify-center gap-2 active:opacity-90 transition-all shadow-lg shadow-primary/20"
            data-testid="button-welcome-understood"
          >
            {t("welcome.understood")}
          </button>
        </div>
      </div>
    </div>
  );
}
