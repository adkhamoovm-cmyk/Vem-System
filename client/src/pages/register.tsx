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
      className={`relative h-12 rounded-2xl select-none overflow-hidden transition-all duration-300 ${
        verified
          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 shadow-[0_0_20px_rgba(34,197,94,0.15)]"
          : "bg-muted"
      }`}
      style={{
        border: verified ? "1.5px solid rgba(34,197,94,0.4)" : "1.5px solid hsl(var(--border))",
      }}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      data-testid="captcha-slider-track"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-2xl transition-all duration-100"
        style={{
          width: `${progress}%`,
          background: verified
            ? "linear-gradient(90deg, rgba(34,197,94,0.25), rgba(16,185,129,0.25))"
            : "linear-gradient(90deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.08))",
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {verified ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-semibold text-green-400 tracking-wide">{t("auth.captchaVerified")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] text-muted-foreground font-medium tracking-wide">{t("auth.captchaSlide")}</span>
            <div className="flex -space-x-1">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 animate-pulse" />
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 animate-pulse" style={{ animationDelay: "150ms" }} />
            </div>
          </div>
        )}
      </div>

      <div
        className={`absolute top-1 w-10 h-10 rounded-xl flex items-center justify-center z-20 transition-all duration-150 ${
          verified
            ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-[0_2px_12px_rgba(34,197,94,0.4)]"
            : isDragging
              ? "bg-primary text-white shadow-lg scale-105"
              : "bg-card text-primary border border-border shadow-md"
        }`}
        style={{
          left: `${sliderPos + 3}px`,
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
    <div className="flex gap-2 justify-center" data-testid="input-fund-password-pins">
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
          className={`w-11 h-12 text-center text-lg font-bold rounded-xl border-2 bg-card outline-none transition-all
            ${error ? "border-red-400 text-red-500" : digits[i]?.trim() ? "border-primary text-foreground" : "border-border text-foreground"}
            focus:border-primary focus:ring-2 focus:ring-primary/20`}
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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-accent transition-all duration-300 shadow-sm"
          data-testid="button-theme-toggle-register"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 transition-transform duration-300 rotate-0" /> : <Moon className="w-5 h-5 transition-transform duration-300 rotate-0" />}
        </button>
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-5">
          <img src={vemLogo} alt="VEM" className="pro-logo h-14 mx-auto" />
          <p className="text-muted-foreground text-sm mt-0.5">{t("auth.welcome")}</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-border/50">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-1.5 h-5 bg-gradient-to-b from-primary to-blue-600 rounded-full" />
            <h2 className="text-lg font-bold text-foreground">{t("auth.register")}</h2>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("auth.phone")}</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowCountryList(!showCountryList)}
                            className="flex items-center gap-1.5 h-11 px-3 bg-card border border-border rounded-xl text-sm font-medium text-foreground whitespace-nowrap hover:border-primary/40 transition-colors"
                            data-testid="button-country-code"
                          >
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span className="text-sm">{selectedCountry.code}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showCountryList ? "rotate-180" : ""}`} />
                          </button>
                          {showCountryList && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowCountryList(false)} />
                              <div className="absolute top-full left-0 mt-1 w-72 max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-50">
                                {countryCodes.map((c) => (
                                  <button
                                    key={c.country + c.code}
                                    type="button"
                                    onClick={() => { setSelectedCountry(c); setShowCountryList(false); }}
                                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors ${
                                      selectedCountry.country === c.country ? "bg-muted" : ""
                                    }`}
                                    data-testid={`option-country-${c.country}`}
                                  >
                                    <span className="text-lg">{c.flag}</span>
                                    <span className="text-foreground font-medium flex-1">{t(`countries.${c.country}`)}</span>
                                    <span className="text-muted-foreground text-xs">{c.code}</span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder=""
                            autoComplete="tel"
                            className="pl-10 h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-xl"
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
                    <FormLabel className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("auth.loginPassword")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          placeholder={t("auth.minChars")}
                          className="pl-10 pr-10 h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                      <FormLabel className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("auth.fundPassword")}</FormLabel>
                      <span className="text-[10px] text-muted-foreground">{t("auth.sixDigitPin")}</span>
                    </div>
                    <FormControl>
                      <div>
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3.5">
                          <div className="flex items-center gap-2 mb-2.5">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="text-primary text-xs font-semibold">{t("auth.createFundPin")}</span>
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
                    <FormLabel className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("auth.referralCode")} <span className="text-muted-foreground normal-case">({t("auth.optional")})</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder={t("auth.enterReferral")}
                          className="pl-10 h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-xl"
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
                      <div className={`rounded-xl p-3 border transition-all duration-300 ${hasReadTerms ? "bg-muted border-border" : "bg-muted/50 border-dashed border-border/60"}`}>
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
                              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              data-testid="checkbox-age-confirm"
                            />
                          </div>
                          <span className="text-muted-foreground text-xs leading-relaxed flex-1">
                            <strong>{t("auth.ageConfirm")}</strong>. {t("auth.ageResponsibility")}
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTerms(true); }}
                              className="text-primary font-semibold ml-1 underline"
                              data-testid="link-terms"
                            >{t("auth.termsOfUse")}</button>{" "}
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTerms(true); }}
                              className="text-primary font-semibold underline"
                              data-testid="link-privacy"
                            >{t("auth.privacyPolicy")}</button>{t("auth.readAndAccept")}
                          </span>
                        </div>
                        {!hasReadTerms && (
                          <div className="mt-2.5 flex items-center gap-2 text-[11px] text-amber-500 dark:text-amber-400">
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {t("auth.termsReadFirst")}
                            </span>
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
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate h-12 rounded-xl shadow-lg shadow-primary/20 text-base mt-1 active:scale-[0.98] transition-transform"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? t("auth.registering") : t("auth.register")}
              </Button>
            </form>
          </Form>

          <div className="mt-5 text-center">
            <p className="text-muted-foreground text-sm">
              {t("auth.hasAccount")}{" "}
              <Link href="/login" className="text-primary font-semibold" data-testid="link-login">
                {t("auth.loginLink")}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-muted-foreground text-[10px] mt-4">
          {t("common.copyright")}
        </p>
      </div>

      {showTerms && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" data-testid="terms-modal">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTerms(false)} onTouchMove={(e) => e.preventDefault()} />
          <div className="relative bg-card border border-border rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl">

            <div className="flex items-center justify-between p-5 pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground leading-tight">{termsContent[locale]?.title || termsContent.en.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t("auth.termsButtonActivates")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTerms(false)}
                className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
                data-testid="button-close-terms"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-2 pb-1 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-muted-foreground">
                  {t("auth.readingProgress")}
                </span>
                <span className={`text-[11px] font-semibold ${hasReadTerms ? "text-green-500" : "text-primary"}`}>
                  {Math.round(scrollProgress)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${hasReadTerms ? "bg-green-500" : "bg-primary"}`}
                  style={{ width: `${scrollProgress}%` }}
                />
              </div>
            </div>

            <div
              ref={termsScrollRef}
              onScroll={handleTermsScroll}
              className="overflow-y-auto px-5 pb-5 pt-3 space-y-4 flex-1 overscroll-contain"
              style={{ WebkitOverflowScrolling: "touch" }}
              data-testid="terms-scroll-area"
            >
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t("auth.termsWelcomeText")}
              </p>

              {(termsContent[locale] || termsContent.en).sections.map((section, i) => (
                <div key={i} className="space-y-1.5 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <h4 className="text-sm font-bold text-foreground">{section.heading}</h4>
                  <p className="text-muted-foreground text-[13px] leading-relaxed whitespace-pre-line">{section.text}</p>
                </div>
              ))}

              <div className="h-2" />
            </div>

            <div className="p-4 pt-3 border-t border-border shrink-0 space-y-2">
              {!hasReadTerms && (
                <div className="flex items-center justify-center gap-2 text-[12px] text-amber-500 dark:text-amber-400 py-1">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {t("auth.scrollToAccept")}
                  </span>
                </div>
              )}
              <button
                onClick={() => {
                  if (!hasReadTerms) return;
                  form.setValue("ageConfirm", true);
                  setShowTerms(false);
                }}
                disabled={!hasReadTerms}
                className={`w-full font-semibold h-11 rounded-xl text-sm transition-all duration-300 ${
                  hasReadTerms
                    ? "bg-primary text-white hover:bg-primary/90 shadow-md cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
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
