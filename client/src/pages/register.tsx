import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Lock, Shield, Eye, EyeOff, UserPlus, ChevronDown, CheckCircle, ArrowRight, Phone, Sun, Moon, X, FileText } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/lib/i18n";
import vemLogo from "@assets/photo_2026-02-24_19-42-53-removebg-preview_1771944480591.png";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SupportWidget } from "@/components/support-widget";

const countryCodes = [
  { code: "+998", country: "UZ", flag: "\u{1F1FA}\u{1F1FF}" },
  { code: "+7", country: "RU", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "+1", country: "US", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "+44", country: "GB", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "+49", country: "DE", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "+82", country: "KR", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "+90", country: "TR", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "+86", country: "CN", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "+91", country: "IN", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "+81", country: "JP", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "+971", country: "AE", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "+992", country: "TJ", flag: "\u{1F1F9}\u{1F1EF}" },
  { code: "+996", country: "KG", flag: "\u{1F1F0}\u{1F1EC}" },
  { code: "+993", country: "TM", flag: "\u{1F1F9}\u{1F1F2}" },
  { code: "+7", country: "KZ", flag: "\u{1F1F0}\u{1F1FF}" },
];

function SliderCaptcha({ onVerified, t }: { onVerified: () => void; t: (key: string) => string }) {
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((_clientX: number) => {
    if (verified) return;
    setIsDragging(true);
  }, [verified]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !trackRef.current || verified) return;
    const rect = trackRef.current.getBoundingClientRect();
    const maxX = rect.width - 44;
    const x = Math.max(0, Math.min(clientX - rect.left - 22, maxX));
    setSliderPos(x);

    if (x >= maxX - 5) {
      setVerified(true);
      setIsDragging(false);
      setSliderPos(maxX);
      onVerified();
    }
  }, [isDragging, verified, onVerified]);

  const handleEnd = useCallback(() => {
    if (!verified) {
      setSliderPos(0);
    }
    setIsDragging(false);
  }, [verified]);

  const trackWidth = trackRef.current?.getBoundingClientRect().width || 300;
  const maxX = trackWidth - 48;
  const progress = maxX > 0 ? Math.min((sliderPos / maxX) * 100, 100) : 0;

  return (
    <div
      ref={trackRef}
      className={`relative h-[52px] rounded-xl select-none overflow-hidden transition-all duration-500 ${
        verified
          ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10"
          : "bg-muted/50"
      }`}
      style={{
        border: verified ? "1.5px solid rgba(34,197,94,0.3)" : "1.5px solid hsl(var(--border) / 0.5)",
      }}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      data-testid="captcha-slider-track"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-xl transition-all duration-100"
        style={{
          width: `${progress}%`,
          background: verified
            ? "linear-gradient(90deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))"
            : "linear-gradient(90deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.04))",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {verified ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-500 tracking-wide">{t("auth.captchaVerified")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground font-medium tracking-wide">{t("auth.captchaSlide")}</span>
            <div className="flex -space-x-1">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 animate-pulse" />
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 animate-pulse" style={{ animationDelay: "150ms" }} />
            </div>
          </div>
        )}
      </div>

      <div
        className={`absolute top-[5px] w-[42px] h-[42px] rounded-lg flex items-center justify-center z-20 transition-all duration-150 ${
          verified
            ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30"
            : isDragging
              ? "bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl shadow-primary/30 scale-105"
              : "bg-card text-primary border border-border/50 shadow-md"
        }`}
        style={{
          left: `${sliderPos + 4}px`,
          cursor: verified ? "default" : isDragging ? "grabbing" : "grab",
        }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        data-testid="captcha-slider-handle"
      >
        {verified ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <ArrowRight className="w-5 h-5" />
        )}
      </div>
    </div>
  );
}

function PinInput({ value, onChange, error }: { value: string; onChange: (val: string) => void; error?: boolean }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").split("").slice(0, 6);

  const handleDigitChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;
    const newDigits = [...digits];
    newDigits[index] = digit.slice(-1);
    const newValue = newDigits.join("").replace(/\s/g, "");
    onChange(newValue);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      onChange(newDigits.join("").replace(/\s/g, ""));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center" data-testid="input-fund-password-pins">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]?.trim() || ""}
          onChange={(e) => handleDigitChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`w-11 h-[52px] text-center text-lg font-bold rounded-xl border-2 bg-card/50 outline-none transition-all duration-200
            ${error ? "border-red-400 text-red-500 shake" : digits[i]?.trim() ? "border-primary/60 text-foreground shadow-sm shadow-primary/10" : "border-border/40 text-foreground"}
            focus:border-primary focus:ring-2 focus:ring-primary/15 focus:shadow-md focus:shadow-primary/10`}
          data-testid={`input-pin-${i}`}
        />
      ))}
    </div>
  );
}

const termsContent: Record<string, { title: string; sections: { heading: string; text: string }[] }> = {
  uz: {
    title: "VEM Media Platformasi Foydalanish Shartlari",
    sections: [
      {
        heading: "1. Shartlarni qabul qilish",
        text: "1.1. Ro'yxatdan o'tish jarayonida \"Ro'yxatdan o'tish\" tugmasini bosish orqali siz ushbu Shartlarga to'liq rozi ekanligingizni bildirasiz."
      },
      {
        heading: "2. Foydalanuvchi yoshi",
        text: "2.1. Ushbu Platforma xizmatlaridan foydalanish uchun siz kamida 18 yoshga to'lgan bo'lishingiz shart."
      },
      {
        heading: "3. Hisobni boshqarish va Xavfsizlik",
        text: "3.1. Foydalanuvchi o'z paroli va hisob ma'lumotlarining xavfsizligi uchun shaxsan o'zi javobgardir. Hisobni boshqa shaxslarga berish yoki sotish taqiqlanadi."
      },
      {
        heading: "4. Moliyaviy va Investitsiya Xavflari",
        text: "4.1. Kunlik vazifalar soni va daromadni oshirish uchun VIP paketlarni sotib olish moliyaviy tavakkalchilikni o'z ichiga oladi. Biz kiritilgan mablag'larning qaytishiga yoki doimiy daromadga yuz foiz kafolat bermaymiz.\n\n4.2. Platforma an'anaviy bank hisoblanmaydi. Iltimos, faqat o'zingiz yo'qotishga tayyor bo'lgan mablag'larni ishlating."
      },
      {
        heading: "5. Komissiya va Pul yechish",
        text: "5.1. Platforma pul yechish amaliyotlarida (masalan, USDT tarmog'i komissiyalari uchun) ma'lum miqdorda xizmat haqini ushlab qolishi mumkin."
      },
      {
        heading: "6. Qat'iy Taqiqlangan Qoidalar (Firibgarlikka qarshi)",
        text: "6.1. Platformadan pul yuvish yoki noqonuniy maqsadlarda foydalanish mumkin emas.\n\n6.2. Diqqat: Videolarni ko'rish uchun avtomatlashtirilgan botlar, skriptlardan foydalanish yoki referal bonuslarni sun'iy ravishda ko'paytirish uchun bitta odam tomonidan bir nechta soxta akkauntlar ochish qat'iyan taqiqlanadi. Ushbu qoidani buzgan foydalanuvchilarning hisobi ogohlantirishsiz bloklanadi va barcha mablag'lari musodara qilinadi."
      },
      {
        heading: "7. Javobgarlikni cheklash",
        text: "7.1. Platforma tizimdagi uzilishlar, kiber-hujumlar yoki uchinchi tomon to'lov tizimlaridagi xatolar oqibatida yetkazilgan zararlar uchun javobgar bo'lmaydi."
      }
    ]
  },
  ru: {
    title: "Условия использования платформы VEM Media",
    sections: [
      {
        heading: "1. Принятие условий",
        text: "1.1. Нажимая кнопку «Зарегистрироваться» в процессе регистрации, вы подтверждаете своё полное согласие с настоящими Условиями."
      },
      {
        heading: "2. Возраст пользователя",
        text: "2.1. Для использования услуг Платформы вам должно быть не менее 18 лет."
      },
      {
        heading: "3. Управление аккаунтом и Безопасность",
        text: "3.1. Пользователь несёт персональную ответственность за безопасность своего пароля и учётных данных. Передача или продажа аккаунта третьим лицам запрещена."
      },
      {
        heading: "4. Финансовые и Инвестиционные риски",
        text: "4.1. Покупка VIP-пакетов для увеличения количества ежедневных заданий и дохода сопряжена с финансовыми рисками. Мы не гарантируем возврат вложенных средств или стабильный доход.\n\n4.2. Платформа не является традиционным банком. Пожалуйста, используйте только те средства, потерю которых вы готовы допустить."
      },
      {
        heading: "5. Комиссии и Вывод средств",
        text: "5.1. Платформа может удерживать определённую сервисную комиссию при операциях вывода средств (например, комиссии сети USDT)."
      },
      {
        heading: "6. Строго запрещённые действия (Противодействие мошенничеству)",
        text: "6.1. Использование Платформы для отмывания денег или в незаконных целях запрещено.\n\n6.2. Внимание: Использование автоматизированных ботов, скриптов для просмотра видео или создание нескольких фиктивных аккаунтов одним лицом для искусственного увеличения реферальных бонусов строго запрещено. Аккаунты нарушителей блокируются без предупреждения, а все средства конфискуются."
      },
      {
        heading: "7. Ограничение ответственности",
        text: "7.1. Платформа не несёт ответственности за убытки, возникшие в результате сбоев системы, кибератак или ошибок сторонних платёжных систем."
      }
    ]
  },
  en: {
    title: "VEM Media Platform Terms of Service",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        text: "1.1. By clicking the \"Register\" button during the registration process, you confirm your full agreement with these Terms."
      },
      {
        heading: "2. User Age",
        text: "2.1. You must be at least 18 years old to use the Platform's services."
      },
      {
        heading: "3. Account Management and Security",
        text: "3.1. The user is personally responsible for the security of their password and account credentials. Transferring or selling accounts to third parties is prohibited."
      },
      {
        heading: "4. Financial and Investment Risks",
        text: "4.1. Purchasing VIP packages to increase daily tasks and income involves financial risk. We do not guarantee the return of invested funds or consistent income.\n\n4.2. The Platform is not a traditional bank. Please only use funds that you are prepared to lose."
      },
      {
        heading: "5. Commissions and Withdrawals",
        text: "5.1. The Platform may charge a certain service fee on withdrawal operations (e.g., USDT network commissions)."
      },
      {
        heading: "6. Strictly Prohibited Actions (Anti-Fraud)",
        text: "6.1. Using the Platform for money laundering or illegal purposes is prohibited.\n\n6.2. Warning: Using automated bots, scripts for watching videos, or creating multiple fake accounts by a single person to artificially inflate referral bonuses is strictly prohibited. Accounts of violators will be blocked without warning and all funds will be confiscated."
      },
      {
        heading: "7. Limitation of Liability",
        text: "7.1. The Platform is not liable for damages resulting from system outages, cyberattacks, or errors in third-party payment systems."
      }
    ]
  }
};

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, locale, translateServerMessage } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryList, setShowCountryList] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const termsScrollRef = useRef<HTMLDivElement>(null);

  const handleTermsScroll = useCallback(() => {
    const el = termsScrollRef.current;
    if (!el) return;
    const scrolled = Math.max(0, el.scrollTop);
    const total = el.scrollHeight - el.clientHeight;
    if (total <= 0) {
      setScrollProgress(100);
      setHasReadTerms(true);
      return;
    }
    const progress = Math.max(0, Math.min(Math.round((scrolled / total) * 100), 100));
    setScrollProgress(progress);
    if (progress >= 95) {
      setHasReadTerms(true);
    }
  }, []);

  useEffect(() => {
    if (showTerms) {
      setScrollProgress(0);
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      setTimeout(() => {
        const el = termsScrollRef.current;
        if (el) {
          el.scrollTop = 0;
          const total = el.scrollHeight - el.clientHeight;
          if (total <= 0) setHasReadTerms(true);
        }
      }, 100);
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [showTerms]);

  const params = new URLSearchParams(window.location.search);
  const refCode = params.get("ref") || "";

  const registerSchema = z.object({
    phone: z.string().min(5, t("auth.phoneValidation")),
    password: z.string().min(6, t("auth.passwordValidation")),
    fundPassword: z.string().length(6, t("auth.fundPasswordValidation")).regex(/^\d{6}$/, t("auth.onlyNumbers")),
    captcha: z.boolean().refine(val => val === true, t("auth.captchaValidation")),
    ageConfirm: z.boolean().refine(val => val === true, t("auth.termsValidation")),
    referralCode: z.string().optional(),
  });

  type RegisterForm = z.infer<typeof registerSchema>;

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: "", password: "", fundPassword: "", captcha: false, ageConfirm: false, referralCode: refCode },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const fullPhone = selectedCountry.code + data.phone;
      const res = await apiRequest("POST", "/api/auth/register", { ...data, phone: fullPhone });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-25 bg-gradient-to-br from-purple-500 to-primary animate-[float_9s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 bg-gradient-to-tl from-blue-500 to-cyan-400 animate-[float_11s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-[140px] opacity-[0.06] bg-primary" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.03) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className={`fixed top-0 right-0 flex items-center gap-2 z-50 px-4 py-3 rounded-bl-2xl transition-all duration-500 ${scrolled ? "bg-background/80 backdrop-blur-xl shadow-lg shadow-black/10 border-b border-l border-border/20" : ""}`}>
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-card/60 backdrop-blur-xl border border-border/30 flex items-center justify-center text-foreground hover:bg-card/80 transition-all duration-300 shadow-lg shadow-black/5"
          data-testid="button-theme-toggle-register"
        >
          {theme === "dark" ? <Sun className="w-4.5 h-4.5 transition-transform duration-500" /> : <Moon className="w-4.5 h-4.5 transition-transform duration-500" />}
        </button>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-7">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl opacity-60" />
            <img src={vemLogo} alt="VEM" className="pro-logo h-16 mx-auto relative" />
          </div>
          <p className="text-muted-foreground text-sm mt-2 font-medium tracking-wide">{t("auth.welcome")}</p>
        </div>

        <div className="relative">
          <div className="absolute -inset-[1px] rounded-[20px] bg-gradient-to-b from-border/60 via-border/20 to-border/60 pointer-events-none" />
          <div className="relative bg-card/70 backdrop-blur-md rounded-[20px] p-7 shadow-2xl shadow-black/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">{t("auth.register")}</h2>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">{t("auth.phone")}</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowCountryList(!showCountryList)}
                              className="flex items-center gap-1.5 h-12 px-3.5 bg-muted/50 border border-border/50 rounded-xl text-sm font-medium text-foreground whitespace-nowrap hover:border-primary/40 hover:bg-muted/80 transition-all duration-200"
                              data-testid="button-country-code"
                            >
                              <span className="text-lg">{selectedCountry.flag}</span>
                              <span className="text-sm font-semibold">{selectedCountry.code}</span>
                              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${showCountryList ? "rotate-180" : ""}`} />
                            </button>
                            {showCountryList && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowCountryList(false)} />
                                <div className="absolute top-full left-0 mt-2 w-72 max-h-64 overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20 z-50 py-1">
                                  {countryCodes.map((c) => (
                                    <button
                                      key={c.country + c.code}
                                      type="button"
                                      onClick={() => { setSelectedCountry(c); setShowCountryList(false); }}
                                      className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-primary/5 transition-colors ${
                                        selectedCountry.country === c.country ? "bg-primary/10 text-primary" : ""
                                      }`}
                                      data-testid={`option-country-${c.country}`}
                                    >
                                      <span className="text-lg">{c.flag}</span>
                                      <span className="text-foreground font-medium flex-1">{t(`countries.${c.country}`)}</span>
                                      <span className="text-muted-foreground text-xs font-mono">{c.code}</span>
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="relative flex-1 group">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                              {...field}
                              placeholder=""
                              autoComplete="tel"
                              className="pl-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl transition-all duration-200"
                              data-testid="input-phone"
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">{t("auth.loginPassword")}</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder={t("auth.minChars")}
                            className="pl-11 pr-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl transition-all duration-200"
                            data-testid="input-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                            data-testid="button-toggle-password"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fundPassword"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">{t("auth.fundPassword")}</FormLabel>
                        <span className="text-[10px] text-muted-foreground/60 font-medium">{t("auth.sixDigitPin")}</span>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <div className="bg-gradient-to-br from-primary/[0.06] to-blue-500/[0.04] border border-primary/15 rounded-xl p-4">
                            <div className="flex items-center gap-2.5 mb-3">
                              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Shield className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <span className="text-primary/80 text-xs font-semibold">{t("auth.createFundPin")}</span>
                            </div>
                            <PinInput
                              value={field.value}
                              onChange={field.onChange}
                              error={!!form.formState.errors.fundPassword}
                            />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referralCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">
                        {t("auth.referralCode")} <span className="text-muted-foreground/50 normal-case font-normal">({t("auth.optional")})</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            {...field}
                            placeholder={t("auth.enterReferral")}
                            className="pl-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl transition-all duration-200"
                            data-testid="input-referral"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="captcha"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SliderCaptcha onVerified={() => field.onChange(true)} t={t} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ageConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className={`rounded-xl p-3.5 border transition-all duration-300 ${
                          hasReadTerms
                            ? "bg-muted/30 border-border/40"
                            : "bg-muted/20 border-dashed border-border/30"
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className="relative mt-0.5">
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  if (!hasReadTerms && checked) {
                                    setShowTerms(true);
                                    return;
                                  }
                                  field.onChange(checked);
                                }}
                                className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md"
                                data-testid="checkbox-age-confirm"
                              />
                            </div>
                            <span className="text-muted-foreground text-xs leading-relaxed flex-1">
                              <strong className="text-foreground/80">{t("auth.ageConfirm")}</strong>. {t("auth.ageResponsibility")}
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTerms(true); }}
                                className="text-primary/80 font-semibold ml-1 hover:text-primary transition-colors underline underline-offset-2"
                                data-testid="link-terms"
                              >{t("auth.termsOfUse")}</button>{" "}
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTerms(true); }}
                                className="text-primary/80 font-semibold hover:text-primary transition-colors underline underline-offset-2"
                                data-testid="link-privacy"
                              >{t("auth.privacyPolicy")}</button>{t("auth.readAndAccept")}
                            </span>
                          </div>
                          {!hasReadTerms && (
                            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-amber-500/80 dark:text-amber-400/80 pl-8">
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span>{t("auth.termsReadFirst")}</span>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] mt-1 active:scale-[0.98] transition-all duration-200 hover:shadow-primary/35 hover:brightness-110"
                  disabled={registerMutation.isPending}
                  data-testid="button-register"
                >
                  {registerMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("auth.registering")}
                    </div>
                  ) : t("auth.register")}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-5 border-t border-border/30 text-center">
              <p className="text-muted-foreground text-sm">
                {t("auth.hasAccount")}{" "}
                <Link href="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="link-login">
                  {t("auth.loginLink")}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-5">
          <Shield className="w-3.5 h-3.5 text-muted-foreground/50" />
          <p className="text-muted-foreground/50 text-[10px] tracking-wide">
            {t("common.copyright")}
          </p>
        </div>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" data-testid="terms-modal">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTerms(false)} onTouchMove={(e) => e.preventDefault()} />
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
              <button
                onClick={() => setShowTerms(false)}
                className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 shrink-0"
                data-testid="button-close-terms"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-3 pb-1 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-muted-foreground/60">{t("auth.readingProgress")}</span>
                <span className={`text-[11px] font-bold ${hasReadTerms ? "text-emerald-500" : "text-primary"}`}>
                  {Math.round(scrollProgress)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${hasReadTerms ? "bg-gradient-to-r from-emerald-500 to-green-500" : "bg-gradient-to-r from-primary to-blue-500"}`}
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
            </div>

            <div
              ref={termsScrollRef}
              onScroll={handleTermsScroll}
              className="overflow-y-auto px-5 pb-5 pt-3 space-y-3 flex-1 overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
              data-testid="terms-scroll-area"
            >
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
                onClick={() => {
                  if (!hasReadTerms) return;
                  form.setValue("ageConfirm", true);
                  setShowTerms(false);
                }}
                disabled={!hasReadTerms}
                className={`w-full font-semibold h-[52px] rounded-xl text-sm transition-all duration-300 ${
                  hasReadTerms
                    ? "bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white shadow-xl shadow-primary/25 hover:shadow-primary/35 cursor-pointer active:scale-[0.98]"
                    : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50"
                }`}
                data-testid="button-accept-terms"
              >
                {hasReadTerms ? t("auth.readAndAgree") : t("auth.keepReading")}
              </button>
            </div>
          </div>
        </div>
      )}
      <SupportWidget />
    </div>
  );
}
