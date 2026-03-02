import { useRef, useState, useCallback, useEffect } from "react";
import { FileText, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const termsContent: Record<string, { title: string; sections: { heading: string; text: string }[] }> = {
  uz: {
    title: "VEM Media Platformasi Foydalanish Shartlari",
    sections: [
      { heading: "1. Shartlarni qabul qilish", text: "1.1. Ro'yxatdan o'tish jarayonida \"Ro'yxatdan o'tish\" tugmasini bosish orqali siz ushbu Shartlarga to'liq rozi ekanligingizni bildirasiz." },
      { heading: "2. Foydalanuvchi yoshi", text: "2.1. Ushbu Platforma xizmatlaridan foydalanish uchun siz kamida 18 yoshga to'lgan bo'lishingiz shart." },
      { heading: "3. Hisobni boshqarish va Xavfsizlik", text: "3.1. Foydalanuvchi o'z paroli va hisob ma'lumotlarining xavfsizligi uchun shaxsan o'zi javobgardir. Hisobni boshqa shaxslarga berish yoki sotish taqiqlanadi." },
      { heading: "4. Moliyaviy va Investitsiya Xavflari", text: "4.1. Kunlik vazifalar soni va daromadni oshirish uchun VIP paketlarni sotib olish moliyaviy tavakkalchilikni o'z ichiga oladi.\n\n4.2. Platforma an'anaviy bank hisoblanmaydi. Iltimos, faqat o'zingiz yo'qotishga tayyor bo'lgan mablag'larni ishlating." },
      { heading: "5. Komissiya va Pul yechish", text: "5.1. Platforma pul yechish amaliyotlarida ma'lum miqdorda xizmat haqini ushlab qolishi mumkin." },
      { heading: "6. Qat'iy Taqiqlangan Qoidalar", text: "6.1. Platformadan pul yuvish yoki noqonuniy maqsadlarda foydalanish mumkin emas.\n\n6.2. Avtomatlashtirilgan botlar, skriptlar yoki bir nechta soxta akkauntlar ochish qat'iyan taqiqlanadi. Qoidabuzarlarning hisobi ogohlantirishsiz bloklanadi." },
      { heading: "7. Javobgarlikni cheklash", text: "7.1. Platforma tizimdagi uzilishlar yoki uchinchi tomon xatolari oqibatida yetkazilgan zararlar uchun javobgar bo'lmaydi." },
    ]
  },
  ru: {
    title: "Условия использования платформы VEM Media",
    sections: [
      { heading: "1. Принятие условий", text: "1.1. Нажимая «Зарегистрироваться», вы подтверждаете полное согласие с настоящими Условиями." },
      { heading: "2. Возраст пользователя", text: "2.1. Для использования Платформы вам должно быть не менее 18 лет." },
      { heading: "3. Управление аккаунтом", text: "3.1. Пользователь несёт ответственность за безопасность своих учётных данных. Передача аккаунта запрещена." },
      { heading: "4. Финансовые риски", text: "4.1. Покупка VIP-пакетов сопряжена с финансовыми рисками. Мы не гарантируем возврат вложенных средств.\n\n4.2. Платформа не является банком. Используйте только средства, потерю которых вы готовы допустить." },
      { heading: "5. Комиссии и вывод", text: "5.1. Платформа может удерживать комиссию при операциях вывода средств." },
      { heading: "6. Запрещённые действия", text: "6.1. Использование для отмывания денег или незаконных целей запрещено.\n\n6.2. Боты, скрипты и множественные аккаунты строго запрещены. Нарушители блокируются без предупреждения." },
      { heading: "7. Ограничение ответственности", text: "7.1. Платформа не несёт ответственности за убытки от сбоев системы или ошибок третьих сторон." },
    ]
  },
  en: {
    title: "VEM Media Platform Terms of Service",
    sections: [
      { heading: "1. Acceptance of Terms", text: "1.1. By clicking \"Register\", you confirm full agreement with these Terms." },
      { heading: "2. User Age", text: "2.1. You must be at least 18 years old to use the Platform." },
      { heading: "3. Account Security", text: "3.1. You are personally responsible for your account credentials. Transferring accounts is prohibited." },
      { heading: "4. Financial Risks", text: "4.1. Purchasing VIP packages involves financial risk. We do not guarantee returns.\n\n4.2. The Platform is not a bank. Only use funds you can afford to lose." },
      { heading: "5. Commissions", text: "5.1. The Platform may charge fees on withdrawal operations." },
      { heading: "6. Prohibited Actions", text: "6.1. Using the Platform for money laundering or illegal purposes is prohibited.\n\n6.2. Bots, scripts, and multiple fake accounts are strictly forbidden. Violators are blocked without warning." },
      { heading: "7. Limitation of Liability", text: "7.1. The Platform is not liable for damages from system outages or third-party errors." },
    ]
  }
};

interface TermsModalProps {
  locale: Locale;
  t: (key: string) => string;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsModal({ locale, t, onClose, onAccept }: TermsModalProps) {
  const termsScrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const handleTermsScroll = useCallback(() => {
    const el = termsScrollRef.current;
    if (!el) return;
    const scrolled = Math.max(0, el.scrollTop);
    const total = el.scrollHeight - el.clientHeight;
    if (total <= 0) { setScrollProgress(100); setHasReadTerms(true); return; }
    const progress = Math.max(0, Math.min(Math.round((scrolled / total) * 100), 100));
    setScrollProgress(progress);
    if (progress >= 95) setHasReadTerms(true);
  }, []);

  useEffect(() => {
    setScrollProgress(0);
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    setTimeout(() => {
      const el = termsScrollRef.current;
      if (el) { el.scrollTop = 0; if (el.scrollHeight - el.clientHeight <= 0) setHasReadTerms(true); }
    }, 100);
    return () => { document.body.style.overflow = ""; document.body.style.touchAction = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" data-testid="terms-modal">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} onTouchMove={(e) => e.preventDefault()} />
      <div className="relative bg-card/95 backdrop-blur-md border border-border/50 rounded-t-[24px] sm:rounded-[24px] w-full max-w-lg max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between p-5 pb-3 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary/15 to-blue-500/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground leading-tight">{termsContent[locale]?.title || termsContent.en.title}</h3>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">{t("auth.termsButtonActivates")}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 shrink-0" data-testid="button-close-terms">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 pt-3 pb-1 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-muted-foreground/60">{t("auth.readingProgress")}</span>
            <span className={`text-[11px] font-bold ${hasReadTerms ? "text-emerald-500" : "text-primary"}`}>{Math.round(scrollProgress)}%</span>
          </div>
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${hasReadTerms ? "bg-gradient-to-r from-emerald-500 to-green-500" : "bg-gradient-to-r from-primary to-blue-500"}`} style={{ width: `${scrollProgress}%` }} />
          </div>
        </div>
        <div ref={termsScrollRef} onScroll={handleTermsScroll} className="overflow-y-auto px-5 pb-5 pt-3 space-y-3 flex-1 overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }} data-testid="terms-scroll-area">
          <p className="text-muted-foreground text-sm leading-relaxed">{t("auth.termsWelcomeText")}</p>
          {(termsContent[locale] || termsContent.en).sections.map((section, i) => (
            <div key={i} className="space-y-1.5 p-3.5 rounded-xl bg-muted/30 border border-border/30">
              <h4 className="text-sm font-bold text-foreground">{section.heading}</h4>
              <p className="text-muted-foreground text-[13px] leading-relaxed whitespace-pre-line">{section.text}</p>
            </div>
          ))}
          <div className="h-2" />
        </div>
        <div className="p-5 pt-3 border-t border-border/30 shrink-0 space-y-2.5">
          {!hasReadTerms && (
            <div className="flex items-center justify-center gap-2 text-[12px] text-amber-500/80 dark:text-amber-400/80 py-0.5">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>{t("auth.scrollToAccept")}</span>
            </div>
          )}
          <button
            onClick={() => { if (!hasReadTerms) return; onAccept(); }}
            disabled={!hasReadTerms}
            className={`w-full font-semibold h-[52px] rounded-xl text-sm transition-all duration-300 ${hasReadTerms ? "bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white shadow-xl shadow-primary/25 hover:shadow-primary/35 cursor-pointer active:scale-[0.98]" : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50"}`}
            data-testid="button-accept-terms"
          >
            {hasReadTerms ? t("auth.readAndAgree") : t("auth.keepReading")}
          </button>
        </div>
      </div>
    </div>
  );
}
