import { useI18n, localeLabels, type Locale } from "@/lib/i18n";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const locales: Locale[] = ["uz", "ru", "en"];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg"
        data-testid="button-language-switcher"
      >
        {compact ? (
          <span className="text-sm font-medium uppercase">{locale}</span>
        ) : (
          <>
            <Globe className="w-4 h-4" />
            <span className="text-xs font-medium">{locale.toUpperCase()}</span>
          </>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-[200] min-w-[140px]">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => { setLocale(l); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                locale === l ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
              }`}
              data-testid={`button-lang-${l}`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{localeLabels[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
