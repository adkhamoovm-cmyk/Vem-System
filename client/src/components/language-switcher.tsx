import { useI18n, localeLabels, type Locale } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";

const flags: Record<Locale, string> = {
  uz: "🇺🇿",
  ru: "🇷🇺",
  en: "🇬🇧",
};

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [prevLocale, setPrevLocale] = useState<Locale>(locale);
  const ref = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  const handleSelect = (l: Locale) => {
    if (l === locale) {
      setOpen(false);
      return;
    }
    setPrevLocale(locale);
    setLocale(l);
    setOpen(false);
    setAnimating(true);
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    animTimerRef.current = setTimeout(() => setAnimating(false), 600);
  };

  const locales: Locale[] = ["uz", "ru", "en"];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-xl relative overflow-hidden"
        data-testid="button-language-switcher"
      >
        <span
          className={`text-base leading-none transition-all duration-300 ${animating ? "animate-flag-bounce" : ""}`}
        >
          {flags[locale]}
        </span>
        {!compact && (
          <span className={`text-xs font-semibold uppercase transition-all duration-300 ${animating ? "animate-text-slide" : ""}`}>
            {locale}
          </span>
        )}
        {animating && (
          <span className="absolute inset-0 rounded-xl bg-primary/10 animate-ripple pointer-events-none" />
        )}
      </button>

      <div
        ref={dropdownRef}
        className={`absolute right-0 top-full mt-1.5 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden z-[200] min-w-[160px] transition-all duration-200 origin-top-right ${
          open ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-1 pointer-events-none"
        }`}
      >
        <div className="p-1.5">
          {locales.map((l, i) => {
            const isActive = locale === l;
            return (
              <button
                key={l}
                onClick={() => handleSelect(l)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted/80"
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
                data-testid={`button-lang-${l}`}
              >
                <span className="text-lg leading-none">{flags[l]}</span>
                <span className="flex-1 text-left">{localeLabels[l]}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes flagBounce {
          0% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.3) rotate(-8deg); }
          50% { transform: scale(0.9) rotate(4deg); }
          75% { transform: scale(1.15) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes textSlide {
          0% { transform: translateY(0); opacity: 1; }
          30% { transform: translateY(-8px); opacity: 0; }
          60% { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .animate-flag-bounce { animation: flagBounce 0.5s ease-in-out; }
        .animate-text-slide { animation: textSlide 0.4s ease-in-out; }
        .animate-ripple { animation: ripple 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}
