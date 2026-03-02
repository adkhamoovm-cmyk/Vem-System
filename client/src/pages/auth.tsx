import { useState, useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Phone, Lock, Eye, EyeOff, ChevronDown, Sun, Moon,
  KeyRound, ArrowLeft, Shield, Ban, LogIn, UserPlus,
  ArrowRight, CheckCircle, X, FileText,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/lib/i18n";
import vemLogo from "@assets/photo_2026-02-24_19-42-53-removebg-preview_1771944480591.png";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SupportWidget } from "@/components/support-widget";

const countryCodes = [
  { code: "+998", country: "UZ", flag: "\u{1F1FA}\u{1F1FF}" },
  { code: "+7",   country: "RU", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "+1",   country: "US", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "+44",  country: "GB", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "+49",  country: "DE", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "+82",  country: "KR", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "+90",  country: "TR", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "+86",  country: "CN", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "+91",  country: "IN", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "+81",  country: "JP", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "+971", country: "AE", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "+992", country: "TJ", flag: "\u{1F1F9}\u{1F1EF}" },
  { code: "+996", country: "KG", flag: "\u{1F1F0}\u{1F1EC}" },
  { code: "+993", country: "TM", flag: "\u{1F1F9}\u{1F1F2}" },
  { code: "+7",   country: "KZ", flag: "\u{1F1F0}\u{1F1FF}" },
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
    if (!verified) setSliderPos(0);
    setIsDragging(false);
  }, [verified]);

  const trackWidth = trackRef.current?.getBoundingClientRect().width || 300;
  const maxX = trackWidth - 48;
  const progress = maxX > 0 ? Math.min((sliderPos / maxX) * 100, 100) : 0;

  return (
    <div
      ref={trackRef}
      className={`relative h-[52px] rounded-xl select-none overflow-hidden transition-all duration-500 ${verified ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10" : "bg-muted/50"}`}
      style={{ border: verified ? "1.5px solid rgba(34,197,94,0.3)" : "1.5px solid hsl(var(--border) / 0.5)" }}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      data-testid="captcha-slider-track"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-xl transition-all duration-100"
        style={{ width: `${progress}%`, background: verified ? "linear-gradient(90deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))" : "linear-gradient(90deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.04))" }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {verified ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
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
        className={`absolute top-[5px] w-[42px] h-[42px] rounded-lg flex items-center justify-center z-20 transition-all duration-150 ${verified ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30" : isDragging ? "bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl shadow-primary/30 scale-105" : "bg-card text-primary border border-border/50 shadow-md"}`}
        style={{ left: `${sliderPos + 4}px`, cursor: verified ? "default" : isDragging ? "grabbing" : "grab" }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        data-testid="captcha-slider-handle"
      >
        {verified ? <CheckCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
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
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
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
          className={`w-11 h-[52px] text-center text-lg font-bold rounded-xl border-2 bg-card/50 outline-none transition-all duration-200 ${error ? "border-red-400 text-red-500" : digits[i]?.trim() ? "border-primary/60 text-foreground shadow-sm shadow-primary/10" : "border-border/40 text-foreground"} focus:border-primary focus:ring-2 focus:ring-primary/15 focus:shadow-md focus:shadow-primary/10`}
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

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { t, locale, translateServerMessage } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const isRegister = location === "/register";
  const [activeTab, setActiveTab] = useState<"login" | "register">(isRegister ? "register" : "login");
  const [animating, setAnimating] = useState(false);

  const switchTab = (tab: "login" | "register") => {
    if (tab === activeTab || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveTab(tab);
      navigate(tab === "login" ? "/login" : "/register");
      setAnimating(false);
    }, 180);
  };

  useEffect(() => {
    const tab = location === "/register" ? "register" : "login";
    if (tab !== activeTab) setActiveTab(tab);
  }, [location]);

  const [showPassword, setShowPassword] = useState(false);
  const [showBannedAlert, setShowBannedAlert] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("vem_remember") === "true");

  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetPhone, setResetPhone] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [resetAnswer, setResetAnswer] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetVerifyType, setResetVerifyType] = useState<"card" | "crypto" | "referrer" | "">("");
  const [resetVerifyHint, setResetVerifyHint] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showCountryListReset, setShowCountryListReset] = useState(false);
  const [resetCountry, setResetCountry] = useState(countryCodes[0]);

  const [loginCountry, setLoginCountry] = useState(() => {
    const saved = localStorage.getItem("vem_country");
    if (saved) { const found = countryCodes.find(c => c.country === saved); if (found) return found; }
    return countryCodes[0];
  });
  const [showLoginCountryList, setShowLoginCountryList] = useState(false);

  const [regCountry, setRegCountry] = useState(countryCodes[0]);
  const [showRegCountryList, setShowRegCountryList] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const termsScrollRef = useRef<HTMLDivElement>(null);

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
    if (showTerms) {
      setScrollProgress(0);
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      setTimeout(() => {
        const el = termsScrollRef.current;
        if (el) { el.scrollTop = 0; if (el.scrollHeight - el.clientHeight <= 0) setHasReadTerms(true); }
      }, 100);
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => { document.body.style.overflow = ""; document.body.style.touchAction = ""; };
  }, [showTerms]);

  useEffect(() => {
    if (localStorage.getItem("vem-banned") === "1") {
      setShowBannedAlert(true);
      localStorage.removeItem("vem-banned");
    }
  }, []);

  const savedPhone = rememberMe ? (localStorage.getItem("vem_phone") || "") : "";

  const loginSchema = z.object({
    phone: z.string().min(5, t("auth.phoneValidation")),
    password: z.string().min(4, t("auth.passwordRequired")),
  });
  type LoginForm = z.infer<typeof loginSchema>;

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: savedPhone, password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const fullPhone = loginCountry.code + data.phone;
      const res = await apiRequest("POST", "/api/auth/login", { ...data, phone: fullPhone, rememberMe });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      if (rememberMe) {
        localStorage.setItem("vem_remember", "true");
        localStorage.setItem("vem_phone", variables.phone);
        localStorage.setItem("vem_country", loginCountry.country);
      } else {
        localStorage.removeItem("vem_remember");
        localStorage.removeItem("vem_phone");
        localStorage.removeItem("vem_country");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      if (error.message === "ACCOUNT_BANNED") { setShowBannedAlert(true); return; }
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

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

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: "", password: "", fundPassword: "", captcha: false, ageConfirm: false, referralCode: refCode },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const fullPhone = regCountry.code + data.phone;
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

  const openResetModal = async () => {
    try { await apiRequest("POST", "/api/auth/reset-cancel", {}); } catch {}
    setShowResetPassword(true);
    setResetStep(1); setResetPhone(""); setResetPin(""); setResetAnswer(""); setResetNewPass(""); setResetVerifyType(""); setResetVerifyHint("");
  };

  const handleResetStep1 = async () => {
    if (!resetPhone || resetPhone.length < 5) return;
    setResetLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-step1", { phone: resetCountry.code + resetPhone });
      const data = await res.json();
      if (data.success) setResetStep(2);
    } catch (e: any) { toast({ title: t("common.error"), description: translateServerMessage(e.message), variant: "destructive" }); }
    finally { setResetLoading(false); }
  };

  const handleResetStep2 = async () => {
    if (resetPin.length !== 6) return;
    setResetLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-step2", { fundPassword: resetPin });
      const data = await res.json();
      if (data.success) { setResetVerifyType(data.verifyType); setResetVerifyHint(data.verifyHint || ""); setResetStep(3); }
    } catch (e: any) { toast({ title: t("common.error"), description: translateServerMessage(e.message), variant: "destructive" }); }
    finally { setResetLoading(false); }
  };

  const handleResetStep3 = async () => {
    if (!resetAnswer.trim()) return;
    setResetLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-step3", { answer: resetAnswer.trim() });
      const data = await res.json();
      if (data.success) setResetStep(4);
    } catch (e: any) { toast({ title: t("common.error"), description: translateServerMessage(e.message), variant: "destructive" }); }
    finally { setResetLoading(false); }
  };

  const handleResetStep4 = async () => {
    if (resetNewPass.length < 6) return;
    setResetLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", { newPassword: resetNewPass });
      const data = await res.json();
      toast({ title: t("auth.resetSuccess"), description: translateServerMessage(data.message) });
      setShowResetPassword(false);
    } catch (e: any) { toast({ title: t("common.error"), description: translateServerMessage(e.message), variant: "destructive" }); }
    finally { setResetLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 bg-gradient-to-br from-blue-500 to-purple-600 animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 bg-gradient-to-tr from-primary to-cyan-500 animate-[float_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-[140px] opacity-[0.06] bg-primary" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-card/60 backdrop-blur-xl border border-border/30 flex items-center justify-center text-foreground hover:bg-card/80 transition-all duration-300 shadow-lg shadow-black/5"
          data-testid="button-theme-toggle"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-6">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl opacity-60" />
            <img src={vemLogo} alt="VEM" className="pro-logo h-20 mx-auto relative" style={{ imageRendering: "auto", filter: "contrast(1.05) brightness(1.02)" }} />
          </div>
          <p className="text-muted-foreground mt-3 text-sm font-medium tracking-wide">{t("auth.welcome")}</p>
        </div>

        <div className="relative flex bg-muted/30 rounded-2xl p-1.5 border border-border/30 mb-5" data-testid="auth-tabs">
          <div
            className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/20 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ left: activeTab === "login" ? "6px" : "calc(50% + 3px)", right: activeTab === "login" ? "calc(50% + 3px)" : "6px" }}
          />
          <button
            onClick={() => switchTab("login")}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors duration-300 z-10 ${activeTab === "login" ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-login"
          >
            <LogIn className="w-4 h-4" />
            {t("auth.login")}
          </button>
          <button
            onClick={() => switchTab("register")}
            className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors duration-300 z-10 ${activeTab === "register" ? "text-white" : "text-muted-foreground hover:text-foreground"}`}
            data-testid="tab-register"
          >
            <UserPlus className="w-4 h-4" />
            {t("auth.register")}
          </button>
        </div>

        <div className="relative">
          <div className="absolute -inset-[1px] rounded-[20px] bg-gradient-to-b from-border/60 via-border/20 to-border/60 pointer-events-none" />
          <div
            className={`relative bg-card/70 backdrop-blur-md rounded-[20px] p-7 shadow-2xl shadow-black/10 transition-opacity duration-180 ${animating ? "opacity-0" : "opacity-100"}`}
          >
            {activeTab === "login" && (
              <div>
                {showBannedAlert && (
                  <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-start gap-3" data-testid="alert-banned">
                    <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Ban className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-red-400 font-semibold text-sm mb-0.5">{t("auth.accountBanned")}</p>
                      <p className="text-red-400/70 text-xs">{t("auth.accountBannedDesc")}</p>
                    </div>
                  </div>
                )}

                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
                    <FormField
                      control={loginForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">{t("auth.phone")}</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setShowLoginCountryList(!showLoginCountryList)}
                                  className="flex items-center gap-1.5 h-12 px-3.5 bg-muted/50 border border-border/50 rounded-xl text-sm font-medium text-foreground whitespace-nowrap hover:border-primary/40 hover:bg-muted/80 transition-all duration-200"
                                  data-testid="button-country-code"
                                >
                                  <span className="text-lg">{loginCountry.flag}</span>
                                  <span className="text-sm font-semibold">{loginCountry.code}</span>
                                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${showLoginCountryList ? "rotate-180" : ""}`} />
                                </button>
                                {showLoginCountryList && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowLoginCountryList(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-72 max-h-64 overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20 z-50 py-1">
                                      {countryCodes.map((c) => (
                                        <button
                                          key={c.country + c.code}
                                          type="button"
                                          onClick={() => { setLoginCountry(c); setShowLoginCountryList(false); }}
                                          className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-primary/5 transition-colors ${loginCountry.country === c.country ? "bg-primary/10 text-primary" : ""}`}
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
                                <Input {...field} placeholder="" autoComplete="tel" className="pl-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl transition-all duration-200" data-testid="input-phone" />
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">{t("auth.password")}</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input {...field} type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder={t("auth.enterPassword")} className="pl-11 pr-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl transition-all duration-200" data-testid="input-password" />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5" data-testid="button-toggle-password">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-between pt-0.5">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <Checkbox checked={rememberMe} onCheckedChange={(val) => setRememberMe(val === true)} className="border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md" data-testid="checkbox-remember-me" />
                        <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors">{t("auth.rememberMe")}</span>
                      </label>
                      <button type="button" onClick={openResetModal} className="text-primary/80 text-sm font-medium hover:text-primary transition-colors" data-testid="link-forgot-password">
                        {t("auth.forgotPassword")}
                      </button>
                    </div>

                    <Button type="submit" className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all duration-200 hover:shadow-primary/35 hover:brightness-110 mt-1" disabled={loginMutation.isPending} data-testid="button-login">
                      {loginMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t("auth.loggingIn")}
                        </div>
                      ) : t("auth.loginButton")}
                    </Button>
                  </form>
                </Form>
              </div>
            )}

            {activeTab === "register" && (
              <div>
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">{t("auth.phone")}</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setShowRegCountryList(!showRegCountryList)}
                                  className="flex items-center gap-1.5 h-12 px-3.5 bg-muted/50 border border-border/50 rounded-xl text-sm font-medium text-foreground whitespace-nowrap hover:border-primary/40 hover:bg-muted/80 transition-all duration-200"
                                  data-testid="button-country-code-reg"
                                >
                                  <span className="text-lg">{regCountry.flag}</span>
                                  <span className="text-sm font-semibold">{regCountry.code}</span>
                                  <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${showRegCountryList ? "rotate-180" : ""}`} />
                                </button>
                                {showRegCountryList && (
                                  <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowRegCountryList(false)} />
                                    <div className="absolute top-full left-0 mt-2 w-72 max-h-64 overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20 z-50 py-1">
                                      {countryCodes.map((c) => (
                                        <button
                                          key={c.country + c.code}
                                          type="button"
                                          onClick={() => { setRegCountry(c); setShowRegCountryList(false); }}
                                          className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-primary/5 transition-colors ${regCountry.country === c.country ? "bg-primary/10 text-primary" : ""}`}
                                          data-testid={`option-reg-country-${c.country}`}
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
                                <Input {...field} placeholder="" autoComplete="tel" className="pl-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl transition-all duration-200" data-testid="input-phone-reg" />
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">{t("auth.loginPassword")}</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input {...field} type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder={t("auth.minChars")} className="pl-11 pr-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl transition-all duration-200" data-testid="input-password-reg" />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5" data-testid="button-toggle-password-reg">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="fundPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">{t("auth.fundPassword")}</FormLabel>
                          <FormControl>
                            <PinInput value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="referralCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">{t("auth.referralCode")}</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                              <Input {...field} placeholder={t("auth.enterReferral")} className="pl-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl transition-all duration-200" data-testid="input-referral" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
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
                      control={registerForm.control}
                      name="ageConfirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className={`rounded-xl p-3.5 border transition-all duration-300 ${hasReadTerms ? "bg-muted/30 border-border/40" : "bg-muted/20 border-dashed border-border/30"}`}>
                              <div className="flex items-start gap-3">
                                <div className="relative mt-0.5">
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                      if (!hasReadTerms && checked) { setShowTerms(true); return; }
                                      field.onChange(checked);
                                    }}
                                    className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md"
                                    data-testid="checkbox-age-confirm"
                                  />
                                </div>
                                <span className="text-muted-foreground text-xs leading-relaxed flex-1">
                                  <strong className="text-foreground/80">{t("auth.ageConfirm")}</strong>. {t("auth.ageResponsibility")}
                                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTerms(true); }} className="text-primary/80 font-semibold ml-1 hover:text-primary transition-colors underline underline-offset-2" data-testid="link-terms">{t("auth.termsOfUse")}</button>{" "}
                                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTerms(true); }} className="text-primary/80 font-semibold hover:text-primary transition-colors underline underline-offset-2" data-testid="link-privacy">{t("auth.privacyPolicy")}</button>{t("auth.readAndAccept")}
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

                    <Button type="submit" className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] mt-1 active:scale-[0.98] transition-all duration-200 hover:shadow-primary/35 hover:brightness-110" disabled={registerMutation.isPending} data-testid="button-register">
                      {registerMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t("auth.registering")}
                        </div>
                      ) : t("auth.register")}
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Shield className="w-3.5 h-3.5 text-muted-foreground/50" />
          <p className="text-muted-foreground/50 text-[10px] tracking-wide">{t("common.copyright")}</p>
        </div>
      </div>

      {showResetPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowResetPassword(false)}>
          <div className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="absolute -inset-[1px] rounded-[22px] bg-gradient-to-b from-border/60 via-border/20 to-border/60 pointer-events-none" />
            <div className="relative bg-card/95 backdrop-blur-md rounded-[22px] p-7 shadow-2xl shadow-black/30">
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={async () => {
                    if (resetStep > 1) {
                      if (resetStep === 2) { try { await apiRequest("POST", "/api/auth/reset-cancel", {}); } catch {} }
                      setResetStep(resetStep - 1);
                    } else {
                      try { await apiRequest("POST", "/api/auth/reset-cancel", {}); } catch {}
                      setShowResetPassword(false);
                    }
                  }}
                  className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                  data-testid="button-back-reset"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground">{t("auth.resetPassword")}</h2>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">{resetStep}/4</span>
              </div>

              <div className="flex gap-1.5 mb-6">
                {[1,2,3,4].map(s => (
                  <div key={s} className="h-1 flex-1 rounded-full overflow-hidden bg-muted">
                    <div className={`h-full rounded-full transition-all duration-500 ease-out ${s < resetStep ? "w-full bg-primary" : s === resetStep ? "w-full bg-gradient-to-r from-primary to-blue-500" : "w-0"}`} />
                  </div>
                ))}
              </div>

              <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                {resetStep === 1 && t("auth.resetStep1")}
                {resetStep === 2 && t("auth.resetStep2")}
                {resetStep === 3 && t("auth.resetStep3")}
                {resetStep === 4 && t("auth.resetStep4")}
              </p>

              {resetStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider block mb-2">{t("auth.phone")}</label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryListReset(!showCountryListReset)}
                          className="flex items-center gap-1.5 h-12 px-3.5 bg-muted/50 border border-border/50 rounded-xl text-sm font-medium text-foreground whitespace-nowrap hover:border-primary/40 transition-all"
                          data-testid="button-reset-country-code"
                        >
                          <span className="text-lg">{resetCountry.flag}</span>
                          <span className="text-sm font-semibold">{resetCountry.code}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${showCountryListReset ? "rotate-180" : ""}`} />
                        </button>
                        {showCountryListReset && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowCountryListReset(false)} />
                            <div className="absolute top-full left-0 mt-2 w-72 max-h-64 overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 py-1">
                              {countryCodes.map((c) => (
                                <button key={c.country + c.code} type="button" onClick={() => { setResetCountry(c); setShowCountryListReset(false); }} className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-primary/5 transition-colors ${resetCountry.country === c.country ? "bg-primary/10 text-primary" : ""}`}>
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
                        <Input value={resetPhone} onChange={e => setResetPhone(e.target.value)} placeholder="" autoComplete="tel" className="pl-11 h-12 bg-muted/50 border-border/50 text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl" data-testid="input-reset-phone" />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleResetStep1} className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all" disabled={resetLoading || resetPhone.length < 5} data-testid="button-reset-next-1">
                    {resetLoading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("auth.checking")}</div> : t("auth.next")}
                  </Button>
                </div>
              )}

              {resetStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                    <div className="flex items-start gap-2.5">
                      <KeyRound className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-muted-foreground text-xs leading-relaxed">{t("auth.fundPasswordHint")}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider block mb-2">{t("auth.fundPassword")}</label>
                    <div className="flex justify-center gap-2.5">
                      {[0,1,2,3,4,5].map(i => (
                        <Input key={i} type="password" inputMode="numeric" maxLength={1} value={resetPin[i] || ""} className="w-12 h-14 text-center text-lg font-bold bg-muted/50 border-border/50 text-foreground rounded-xl focus:border-primary/60 focus:ring-2 focus:ring-primary/15" data-testid={`input-reset-pin-${i}`}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 1) {
                              const newPin = resetPin.split(""); newPin[i] = val; setResetPin(newPin.join("").slice(0, 6));
                              if (val && i < 5) { const next = e.target.parentElement?.parentElement?.querySelector(`[data-testid="input-reset-pin-${i+1}"]`) as HTMLInputElement; next?.focus(); }
                            }
                          }}
                          onKeyDown={e => { if (e.key === "Backspace" && !resetPin[i] && i > 0) { const prev = (e.target as HTMLElement).parentElement?.parentElement?.querySelector(`[data-testid="input-reset-pin-${i-1}"]`) as HTMLInputElement; prev?.focus(); } }}
                          onPaste={e => { e.preventDefault(); const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); setResetPin(paste); }}
                        />
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleResetStep2} className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all" disabled={resetLoading || resetPin.length !== 6} data-testid="button-reset-next-2">
                    {resetLoading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("auth.checking")}</div> : t("auth.next")}
                  </Button>
                </div>
              )}

              {resetStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                    <div className="flex items-start gap-2.5">
                      <KeyRound className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {resetVerifyType === "card" && t("auth.verifyCardLast6")}
                        {resetVerifyType === "crypto" && t("auth.verifyCryptoFull")}
                        {resetVerifyType === "referrer" && (resetVerifyHint ? t("auth.verifyReferrerPhone") : t("auth.verifyRegDate"))}
                      </p>
                    </div>
                  </div>
                  {resetVerifyHint && (
                    <p className="text-xs text-muted-foreground text-center py-1">
                      {resetVerifyType === "card" && t("auth.verifyCardHint", { hint: resetVerifyHint })}
                      {resetVerifyType === "crypto" && t("auth.verifyCryptoHint", { hint: resetVerifyHint })}
                      {resetVerifyType === "referrer" && t("auth.verifyReferrerHint", { hint: resetVerifyHint })}
                    </p>
                  )}
                  <Input value={resetAnswer} onChange={e => setResetAnswer(e.target.value)} placeholder={resetVerifyType === "card" ? "XXXXXX" : resetVerifyType === "crypto" ? "T..." : resetVerifyType === "referrer" && resetVerifyHint ? "+998..." : "2026-01-15"} className="h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl text-center tracking-wider font-mono" data-testid="input-reset-verify" />
                  <Button onClick={handleResetStep3} className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all" disabled={resetLoading || !resetAnswer.trim()} data-testid="button-reset-next-3">
                    {resetLoading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("auth.checking")}</div> : t("auth.next")}
                  </Button>
                </div>
              )}

              {resetStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider block mb-2">{t("auth.newPassword")}</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input value={resetNewPass} onChange={e => setResetNewPass(e.target.value)} type={showPassword ? "text" : "password"} placeholder={t("auth.enterNewPassword")} className="pl-11 pr-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl" data-testid="input-reset-new-password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-toggle-reset-password">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-muted-foreground/60 text-[11px] mt-1.5 pl-1">{t("auth.minChars")}</p>
                  </div>
                  <Button onClick={handleResetStep4} className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all" disabled={resetLoading || resetNewPass.length < 6} data-testid="button-reset-password">
                    {resetLoading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("auth.resetting")}</div> : t("auth.resetPassword")}
                  </Button>
                </div>
              )}

              <div className="mt-5 text-center">
                <button onClick={() => setShowResetPassword(false)} className="text-muted-foreground text-sm hover:text-foreground transition-colors" data-testid="link-back-to-login">
                  {t("auth.backToLogin")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <button onClick={() => setShowTerms(false)} className="w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 shrink-0" data-testid="button-close-terms">
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
            <div ref={termsScrollRef} onScroll={handleTermsScroll} className="overflow-y-auto px-5 pb-5 pt-3 space-y-3 flex-1 overscroll-contain" style={{ WebkitOverflowScrolling: "touch" as any }} data-testid="terms-scroll-area">
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
                onClick={() => { if (!hasReadTerms) return; registerForm.setValue("ageConfirm", true); setShowTerms(false); }}
                disabled={!hasReadTerms}
                className={`w-full font-semibold h-[52px] rounded-xl text-sm transition-all duration-300 ${hasReadTerms ? "bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white shadow-xl shadow-primary/25 hover:shadow-primary/35 cursor-pointer active:scale-[0.98]" : "bg-muted/50 text-muted-foreground cursor-not-allowed opacity-50"}`}
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
