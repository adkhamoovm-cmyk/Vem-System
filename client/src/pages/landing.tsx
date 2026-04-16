import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Sun, Moon, LogIn, UserPlus, X, Play, TrendingUp, Users, ChevronDown, Shield, Zap, Gift, Star, ArrowRight, Sparkles, CircleDollarSign, Lock, Crown, CheckCircle2, Globe, Download, Smartphone, Monitor, ExternalLink, Share2 } from "lucide-react";
import { SiTelegram, SiNetflix, SiAmazonprime, SiHbo, SiAppletv, SiPrimevideo, SiMax } from "react-icons/si";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import vemLogo from "@assets/photo_2026-02-24_19-42-53-removebg-preview_1771944480591.png";
import { countryCodes } from "./auth/shared";
import { LoginForm } from "./auth/login-form";
import { RegisterForm } from "./auth/register-form";
import { ResetPasswordModal } from "./auth/reset-password-modal";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function useScrollToggle() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: "0px 0px -80px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal();

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isVisible, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }).map((_, i) => ({
      width: 2 + ((i * 7 + 3) % 5),
      left: (i * 17 + 5) % 100,
      top: (i * 23 + 7) % 100,
      duration: 10 + ((i * 3) % 10),
      delay: (i * 0.7) % 5,
      opacity: 0.2 + ((i * 0.03) % 0.4),
    })), []);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none floating-particles">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/20 will-change-transform"
          style={{
            width: `${p.width}px`,
            height: `${p.width}px`,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: `floatParticle ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

function DisneyPlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.056 6.834c-.04.218-.07.444-.07.685 0 2.022 2.115 3.66 4.724 3.66.556 0 1.09-.075 1.586-.213-.072.218-.112.45-.112.69 0 1.205.979 2.183 2.183 2.183 1.131 0 2.06-.863 2.17-1.965.455.347 1.008.568 1.612.568 1.468 0 2.658-1.19 2.658-2.657 0-.29-.047-.57-.133-.832.06.003.12.005.182.005 1.995 0 3.612-1.617 3.612-3.612S18.85 1.735 16.856 1.735c-.437 0-.856.078-1.244.22C14.872.78 13.653 0 12.266 0c-1.678 0-3.08 1.043-3.647 2.513A3.15 3.15 0 007.33 2.08c-1.74 0-3.15 1.41-3.15 3.15 0 .564.148 1.094.408 1.552-.936.038-1.768.21-2.532.052zM22.14 17.147c-1.164-.348-3.058-.563-5.198-.563-4.985 0-8.577 1.17-8.577 2.796 0 .458.287.884.793 1.258-.652.245-1.027.56-1.027.897 0 .95 2.48 1.72 5.54 1.72 2.143 0 3.98-.39 4.863-.954.37.09.81.14 1.296.14 2.13 0 3.858-.67 3.858-1.497 0-.42-.416-.8-1.09-1.076.67-.336 1.067-.73 1.067-1.155 0-.208-.128-.404-.357-.583.352.007.612-.067.832-.167z"/>
    </svg>
  );
}

function HuluIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M1.8 4.8h3.6v6.6c0 .48.12.84.36 1.08.24.24.6.36 1.08.36h1.8c.48 0 .84-.12 1.08-.36.24-.24.36-.6.36-1.08V4.8h3.6v6.6c0 .48.12.84.36 1.08.24.24.6.36 1.08.36h1.8c.48 0 .84-.12 1.08-.36.24-.24.36-.6.36-1.08V4.8h3.6v8.4c0 1.44-.36 2.52-1.08 3.24-.72.72-1.8 1.08-3.24 1.08h-3c-1.08 0-1.98-.24-2.7-.72-.72.48-1.62.72-2.7.72h-3c-1.44 0-2.52-.36-3.24-1.08-.72-.72-1.08-1.8-1.08-3.24V4.8z"/>
    </svg>
  );
}

function AuthModal({ activeTab, onTabChange, onClose, onForgotPassword, showResetPassword, setShowResetPassword }: {
  activeTab: "login" | "register";
  onTabChange: (tab: "login" | "register") => void;
  onClose: () => void;
  onForgotPassword: () => void;
  showResetPassword: boolean;
  setShowResetPassword: (v: boolean) => void;
}) {
  const { t, locale, translateServerMessage } = useI18n();
  const [animating, setAnimating] = useState(false);
  const [showBannedAlert, setShowBannedAlert] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("vem-banned") === "1") {
      setShowBannedAlert(true);
      localStorage.removeItem("vem-banned");
    }
  }, []);

  const switchTab = (tab: "login" | "register") => {
    if (tab === activeTab || animating) return;
    setAnimating(true);
    setTimeout(() => {
      onTabChange(tab);
      setTimeout(() => setAnimating(false), 20);
    }, 200);
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.inset = "0";
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.inset = "";
      document.body.style.width = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" style={{ touchAction: "none" }} data-testid="auth-modal">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-[440px] max-h-[92vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300" style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
        <div className="absolute -inset-[1px] rounded-t-[24px] sm:rounded-[24px] bg-gradient-to-b from-primary/30 via-border/20 to-border/60 pointer-events-none" />
        <div className="relative bg-card rounded-t-[24px] sm:rounded-[24px] px-4 py-6 sm:p-7 shadow-2xl shadow-black/40">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-4 sm:hidden" />
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all z-10" data-testid="button-close-auth">
            <X className="w-4 h-4" />
          </button>
          <div className="text-center mb-5">
            <img src={vemLogo} alt="VEM" className="h-14 mx-auto" style={{ imageRendering: "auto", filter: "contrast(1.05) brightness(1.02)" }} />
          </div>
          <div className="relative flex bg-muted/30 rounded-2xl p-1.5 border border-border/30 mb-5" data-testid="auth-tabs">
            <div className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 shadow-lg shadow-primary/20 transition-all duration-300 ease-in-out" style={{ left: activeTab === "login" ? "6px" : "calc(50% + 3px)", right: activeTab === "login" ? "calc(50% + 3px)" : "6px" }} />
            <button onClick={() => switchTab("login")} className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors duration-300 z-10 ${activeTab === "login" ? "text-white" : "text-muted-foreground hover:text-foreground"}`} data-testid="tab-login">
              <LogIn className="w-4 h-4" />{t("auth.login")}
            </button>
            <button onClick={() => switchTab("register")} className={`relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors duration-300 z-10 ${activeTab === "register" ? "text-white" : "text-muted-foreground hover:text-foreground"}`} data-testid="tab-register">
              <UserPlus className="w-4 h-4" />{t("auth.register")}
            </button>
          </div>
          <div className={`transition-all duration-200 ease-in-out ${animating ? "opacity-0 scale-[0.98] translate-y-1" : "opacity-100 scale-100 translate-y-0"}`}>
            {activeTab === "login" && (
              <LoginForm countryCodes={countryCodes} locale={locale} t={t} translateServerMessage={translateServerMessage} showBannedAlert={showBannedAlert} setShowBannedAlert={setShowBannedAlert} onForgotPassword={onForgotPassword} />
            )}
            {activeTab === "register" && (
              <RegisterForm countryCodes={countryCodes} locale={locale} t={t} translateServerMessage={translateServerMessage} />
            )}
          </div>
        </div>
      </div>
      {showResetPassword && (
        <ResetPasswordModal countryCodes={countryCodes} locale={locale} t={t} translateServerMessage={translateServerMessage} onClose={() => setShowResetPassword(false)} />
      )}
    </div>
  );
}

function useIsSafari() {
  useEffect(() => {
    const ua = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    if (isSafari) {
      document.documentElement.classList.add("is-safari");
    }
    return () => {
      document.documentElement.classList.remove("is-safari");
    };
  }, []);
}

export default function LandingPage({ initialAuth }: { initialAuth?: "login" | "register" }) {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [authModal, setAuthModal] = useState<null | "login" | "register">(initialAuth || null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const deferredPromptRef = useRef<any>(null);

  useIsSafari();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: platformSettings } = useQuery<{ uzsEnabled: boolean }>({
    queryKey: ["/api/platform-settings"],
  });
  const uzsEnabled = platformSettings?.uzsEnabled ?? false;

  useEffect(() => {
    if (user && !isLoading) navigate("/dashboard");
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openAuth = (tab: "login" | "register") => {
    setAuthModal(tab);
    navigate(tab === "login" ? "/login" : "/register");
  };

  const closeAuth = () => {
    setAuthModal(null);
    navigate("/");
  };

  const openResetModal = async () => {
    try { await apiRequest("POST", "/api/auth/reset-cancel", {}); } catch {}
    setShowResetPassword(true);
  };

  const heroReveal = useScrollReveal();
  const partnersReveal = useScrollReveal();
  const featuresReveal = useScrollReveal();
  const stepsReveal = useScrollReveal();
  const faqReveal = useScrollReveal();
  const downloadReveal = useScrollReveal();
  const ctaReveal = useScrollReveal();
  const orbitToggle = useScrollToggle();

  const handleDownload = useCallback(async () => {
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIos) {
      setShowIosGuide(true);
      return;
    }
    if (deferredPromptRef.current) {
      try {
        deferredPromptRef.current.prompt();
        const result = await deferredPromptRef.current.userChoice;
        if (result.outcome === "accepted") {
          deferredPromptRef.current = null;
        }
        return;
      } catch (e) {}
    }
    setShowAndroidGuide(true);
  }, []);

  const features = [
    { icon: Play, titleKey: "landing.featureWatchTitle", descKey: "landing.featureWatchDesc", gradient: "from-red-500 to-orange-500", glow: "shadow-red-500/20" },
    { icon: CircleDollarSign, titleKey: "landing.featureEarnTitle", descKey: "landing.featureEarnDesc", gradient: "from-emerald-500 to-green-400", glow: "shadow-emerald-500/20" },
    { icon: Users, titleKey: "landing.featureReferralTitle", descKey: "landing.featureReferralDesc", gradient: "from-blue-500 to-cyan-400", glow: "shadow-blue-500/20" },
    { icon: Lock, titleKey: "landing.featureSecureTitle", descKey: "landing.featureSecureDesc", gradient: "from-purple-500 to-violet-400", glow: "shadow-purple-500/20" },
  ];

  const steps = [
    { num: "01", titleKey: "landing.step1Title", descKey: "landing.step1Desc", icon: UserPlus, color: "from-blue-500 to-cyan-500" },
    { num: "02", titleKey: "landing.step2Title", descKey: "landing.step2Desc", icon: Play, color: "from-purple-500 to-pink-500" },
    { num: "03", titleKey: "landing.step3Title", descKey: uzsEnabled ? "landing.step3Desc" : "landing.step3DescCrypto", icon: Gift, color: "from-amber-500 to-orange-500" },
  ];

  const faqs = [
    { qKey: "landing.faq1Q", aKey: "landing.faq1A" },
    { qKey: "landing.faq2Q", aKey: "landing.faq2A" },
    { qKey: "landing.faq3Q", aKey: "landing.faq3A" },
    { qKey: "landing.faq4Q", aKey: "landing.faq4A" },
    { qKey: "landing.faq5Q", aKey: "landing.faq5A" },
    { qKey: "landing.faq6Q", aKey: "landing.faq6A" },
  ];

  const partners = [
    { name: "Netflix", icon: SiNetflix, color: "#E50914", glow: "hover:shadow-[#E50914]/15" },
    { name: "Amazon Prime", icon: SiAmazonprime, color: "#00A8E1", glow: "hover:shadow-[#00A8E1]/15" },
    { name: "HBO Max", icon: SiHbo, color: "#B535F6", glow: "hover:shadow-[#B535F6]/15" },
    { name: "Disney+", icon: DisneyPlusIcon, color: "#113CCF", glow: "hover:shadow-[#113CCF]/15" },
    { name: "Apple TV+", icon: SiAppletv, color: "#A3AAAE", glow: "hover:shadow-[#A3AAAE]/15" },
    { name: "Hulu", icon: HuluIcon, color: "#1CE783", glow: "hover:shadow-[#1CE783]/15" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <style>{`
        @keyframes floatParticle {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(20px, -30px) scale(1.2); opacity: 0.6; }
          50% { transform: translate(-10px, -60px) scale(0.8); opacity: 0.4; }
          75% { transform: translate(30px, -20px) scale(1.1); opacity: 0.5; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-scale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-scale { animation: fade-in-scale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        .stagger-6 { animation-delay: 0.6s; }
        .shimmer-text {
          background: linear-gradient(90deg, currentColor 40%, hsl(var(--primary)) 50%, currentColor 60%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${headerScrolled ? "bg-background/90 backdrop-blur-xl border-b border-border/40 shadow-lg shadow-black/5" : "bg-transparent"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={vemLogo} alt="VEM" className="h-14 transition-transform duration-300 hover:scale-105" style={{ imageRendering: "auto", filter: "contrast(1.05) brightness(1.02)" }} />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button onClick={toggleTheme} className="w-9 h-9 rounded-xl bg-muted/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:scale-105 active:scale-95 transition-all duration-200" data-testid="button-theme-toggle">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={() => openAuth("login")} className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-all duration-200" data-testid="button-header-login">
              <LogIn className="w-4 h-4" />{t("auth.login")}
            </button>
            <button onClick={() => openAuth("register")} className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:shadow-xl hover:scale-[1.02] active:scale-[0.97] transition-all duration-200" data-testid="button-header-register">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auth.register")}</span>
              <span className="sm:hidden">{t("landing.startNow")}</span>
            </button>
          </div>
        </div>
      </header>

      <section className="relative pt-28 pb-24 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="hero-blur absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full blur-[180px] opacity-15 bg-gradient-to-br from-blue-500 to-purple-600" style={{ animation: "pulse-glow 6s ease-in-out infinite" }} />
          <div className="hero-blur absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full blur-[150px] opacity-10 bg-gradient-to-tr from-primary to-cyan-500" style={{ animation: "pulse-glow 8s ease-in-out infinite 2s" }} />
          <div className="hero-blur absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-[120px] opacity-[0.07] bg-gradient-to-br from-emerald-500 to-blue-500" style={{ animation: "pulse-glow 10s ease-in-out infinite 4s" }} />
          <div className="safari-blur-fallback absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-blue-500/5" />
          <div className="safari-blur-fallback absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-primary/5" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.03) 1px, transparent 0)", backgroundSize: "48px 48px" }} />
        </div>
        <FloatingParticles />

        <div ref={heroReveal.ref} className={`relative max-w-6xl mx-auto px-4 sm:px-6 text-center transition-all duration-1000 ${heroReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/8 border border-primary/20 rounded-full text-primary text-sm font-medium mb-8 backdrop-blur-sm hover:bg-primary/12 hover:border-primary/30 transition-all duration-300 cursor-default" data-testid="badge-hero">
            <Sparkles className="w-4 h-4 animate-pulse" />
            {t("landing.heroBadge")}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.05] mb-7 tracking-tight" data-testid="text-hero-title">
            <span className="text-foreground block">{t("landing.heroTitle1")}</span>
            <span className="bg-gradient-to-r from-primary via-blue-400 to-purple-500 bg-clip-text text-transparent bg-[length:200%_auto]" style={{ animation: "gradient-x 4s ease infinite" }}>{t("landing.heroTitle2")}</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-12 leading-relaxed" data-testid="text-hero-desc">
            {t("landing.heroDesc")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16">
            <button
              onClick={() => openAuth("register")}
              className="group w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-bold text-base rounded-2xl shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/35 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 relative overflow-hidden"
              data-testid="button-hero-register"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              <UserPlus className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{t("landing.getStarted")}</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            <button
              onClick={() => openAuth("login")}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-white/5 border border-white/15 text-white font-semibold text-base rounded-2xl hover:bg-white/10 hover:border-white/25 hover:scale-[1.02] active:scale-[0.97] backdrop-blur-sm transition-all duration-300"
              data-testid="button-hero-login"
            >
              <LogIn className="w-5 h-5" />
              {t("landing.alreadyHaveAccount")}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5" data-testid="stats-row">
            {[
              { display: "6+", labelKey: "landing.statPlatforms", icon: Globe },
              { display: "10+", labelKey: "landing.statCountries", icon: Users },
              { display: "500+", labelKey: "landing.statPartners", icon: TrendingUp },
              { display: "24/7", labelKey: "landing.statSupport", icon: Shield },
            ].map((stat, i) => (
              <div key={stat.labelKey} className={`group flex items-center gap-2.5 px-4 py-2.5 bg-card/40 border border-border/30 rounded-xl backdrop-blur-sm hover:bg-card/60 hover:border-border/50 hover:shadow-lg transition-all duration-300 opacity-0 ${heroReveal.isVisible ? "animate-fade-scale" : ""}`} style={{ animationDelay: `${0.6 + i * 0.12}s`, animationFillMode: "forwards" }}>
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <stat.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-left">
                  <span className="text-base font-extrabold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent block leading-tight">{stat.display}</span>
                  <span className="text-muted-foreground text-[10px] sm:text-xs">{t(stat.labelKey)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 border-t border-border/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/30 pointer-events-none" />
        <div ref={partnersReveal.ref} className={`relative max-w-6xl mx-auto px-4 sm:px-6 transition-all duration-800 ${partnersReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-10">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-[0.2em]" data-testid="text-partners-label">
              {t("landing.partnersTitle")}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5" data-testid="partners-row">
            {partners.map((p, i) => (
              <div
                key={p.name}
                className={`group relative flex flex-col items-center justify-center gap-3 px-5 py-6 sm:py-8 bg-card/30 border border-border/15 rounded-3xl backdrop-blur-sm hover:bg-card/60 hover:border-border/40 hover:shadow-2xl ${p.glow} hover:scale-[1.05] active:scale-[0.97] transition-all duration-500 cursor-default opacity-0 ${partnersReveal.isVisible ? "animate-fade-scale" : ""}`}
                style={{ animationDelay: `${i * 0.1}s`, animationFillMode: "forwards" }}
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/5 group-hover:border-white/10 transition-all duration-500 group-hover:scale-110">
                  <p.icon className="w-8 h-8 sm:w-10 sm:h-10 transition-all duration-500 group-hover:scale-110" style={{ color: p.color }} />
                </div>
                <span className="text-foreground/60 font-bold text-sm group-hover:text-foreground transition-colors duration-300">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 relative" id="features">
        <div className="absolute inset-0 pointer-events-none">
          <div className="section-blur absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[150px] opacity-[0.06] bg-gradient-to-bl from-emerald-500 to-blue-500" />
        </div>
        <div ref={featuresReveal.ref} className={`relative max-w-6xl mx-auto px-4 sm:px-6 transition-all duration-800 ${featuresReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/8 border border-emerald-500/15 rounded-full text-emerald-500 text-xs font-semibold uppercase tracking-wider mb-5">
              <Zap className="w-3.5 h-3.5" />
              {t("landing.featuresTitle")}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight" data-testid="text-features-title">{t("landing.featuresTitle")}</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">{t("landing.featuresDesc")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className={`group relative bg-card/50 border border-border/20 rounded-3xl p-7 hover:bg-card/80 hover:border-border/40 hover:shadow-2xl ${f.glow} hover:-translate-y-1 transition-all duration-500 opacity-0 ${featuresReveal.isVisible ? "animate-slide-up" : ""}`}
                style={{ animationDelay: `${i * 0.12}s`, animationFillMode: "forwards" }}
                data-testid={`card-feature-${i}`}
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
                <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg ${f.glow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-foreground font-bold text-lg mb-2.5">{t(f.titleKey)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 sm:py-36 relative overflow-hidden" id="how-it-works">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/5 to-background" />
          <div className="section-blur absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[180px] opacity-[0.07] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        </div>
        <div ref={stepsReveal.ref} className={`relative max-w-6xl mx-auto px-4 sm:px-6 transition-all duration-800 ${stepsReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/15 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-[0.15em] mb-6 backdrop-blur-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("landing.stepsTitle")}
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight leading-[1.1]" data-testid="text-steps-title">
              {t("landing.stepsTitle")}
            </h2>
            <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">{t("landing.stepsDesc")}</p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-[72px] left-[20%] right-[20%] h-px">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-border/50 to-transparent" />
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-pulse" style={{ animationDuration: "3s" }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={`relative group opacity-0 ${stepsReveal.isVisible ? "animate-slide-up" : ""}`}
                  style={{ animationDelay: `${i * 0.15}s`, animationFillMode: "forwards" }}
                  data-testid={`card-step-${i}`}
                >
                  <div className="relative bg-card/30 backdrop-blur-sm border border-border/10 rounded-3xl p-8 sm:p-10 text-center hover:bg-card/50 hover:border-border/25 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 h-full">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                    <div className="relative inline-flex items-center justify-center mb-8">
                      <div className="absolute inset-0 w-[90px] h-[90px] -m-[9px] rounded-[26px] bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl" style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }} />
                      <div className={`relative w-[72px] h-[72px] rounded-[22px] bg-gradient-to-br ${s.color} flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500`}>
                        <s.icon className="w-8 h-8 text-white drop-shadow-lg" />
                        <div className={`absolute inset-0 rounded-[22px] bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`} />
                      </div>
                      <div className="absolute -top-3 -right-3 w-9 h-9 rounded-xl bg-background/90 backdrop-blur-sm border border-border/30 text-foreground text-xs font-black flex items-center justify-center shadow-lg">
                        {s.num}
                      </div>
                    </div>

                    <h3 className="text-foreground font-bold text-xl mb-3 tracking-tight">{t(s.titleKey)}</h3>
                    <p className="text-muted-foreground text-[15px] leading-[1.7] max-w-[280px] mx-auto">{t(s.descKey)}</p>

                    <div className={`mt-6 mx-auto w-12 h-1 rounded-full bg-gradient-to-r ${s.color} opacity-40 group-hover:opacity-80 group-hover:w-20 transition-all duration-500`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 relative" id="faq">
        <div ref={faqReveal.ref} className={`max-w-3xl mx-auto px-4 sm:px-6 transition-all duration-800 ${faqReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/8 border border-purple-500/15 rounded-full text-purple-500 text-xs font-semibold uppercase tracking-wider mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight" data-testid="text-faq-title">{t("landing.faqTitle")}</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">{t("landing.faqDesc")}</p>
          </div>
          <div className="space-y-3" data-testid="faq-list">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className={`group bg-card/40 border rounded-2xl overflow-hidden transition-all duration-500 hover:bg-card/60 opacity-0 ${faqReveal.isVisible ? "animate-slide-up" : ""} ${openFaq === i ? "border-primary/30 shadow-lg shadow-primary/5" : "border-border/20 hover:border-border/40"}`}
                style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "forwards" }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                  data-testid={`button-faq-${i}`}
                >
                  <span className={`font-semibold text-sm sm:text-base pr-4 transition-colors duration-300 ${openFaq === i ? "text-primary" : "text-foreground"}`}>{t(faq.qKey)}</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${openFaq === i ? "bg-primary/10 rotate-180" : "bg-muted/50"}`}>
                    <ChevronDown className={`w-4 h-4 transition-colors duration-300 ${openFaq === i ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                </button>
                <div className={`grid transition-all duration-500 ease-out ${openFaq === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed">{t(faq.aKey)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 relative overflow-hidden" id="download">
        <div className="absolute inset-0 pointer-events-none">
          <div className="section-blur absolute top-1/4 left-0 w-[400px] h-[400px] rounded-full blur-[150px] opacity-[0.08] bg-gradient-to-br from-green-500 to-emerald-500" />
          <div className="section-blur absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full blur-[120px] opacity-[0.06] bg-gradient-to-br from-blue-500 to-cyan-500" />
        </div>
        <div ref={downloadReveal.ref} className={`relative max-w-5xl mx-auto px-4 sm:px-6 transition-all duration-800 ${downloadReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/8 border border-green-500/15 rounded-full text-green-500 text-xs font-semibold uppercase tracking-wider mb-5">
              <Download className="w-3.5 h-3.5" />
              {t("landing.downloadBadge")}
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight" data-testid="text-download-title">{t("landing.downloadTitle")}</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">{t("landing.downloadDesc")}</p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative bg-card/50 border border-border/20 rounded-3xl p-6 sm:p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-green-500/5 blur-[60px] pointer-events-none" />

              <div className="flex items-center gap-5 mb-8 relative">
                <div className="w-[72px] h-[72px] rounded-[20px] overflow-hidden shadow-xl shadow-primary/25 shrink-0">
                  <img src="/icons/icon-192.png" alt="VEM" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-foreground mb-1">VEM App</h3>
                  <p className="text-muted-foreground text-sm mb-2">{t("landing.downloadDesc")}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                      <span className="font-semibold text-foreground">4.8</span>
                    </span>
                    <span>{t("landing.downloadVersion")}: 1.1.7</span>
                    <span>{t("landing.downloadSize")}: 21.6 MB</span>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 relative">
                <button
                  onClick={handleDownload}
                  className="group flex items-center gap-4 px-5 py-4 bg-black dark:bg-white/10 border border-white/10 dark:border-white/15 rounded-2xl text-white hover:shadow-xl hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  data-testid="button-download-android"
                >
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <svg className="w-9 h-9" viewBox="0 0 24 24" fill="#3DDC84">
                      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0012 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.983 5.983 0 006 7h12c0-2.12-1.1-3.98-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="text-white/60 text-[10px] uppercase tracking-wider block">Android</span>
                    <span className="font-bold text-base leading-tight">{t("landing.downloadAndroid")}</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowIosGuide(true)}
                  className="group flex items-center gap-4 px-5 py-4 bg-black dark:bg-white/10 border border-white/10 dark:border-white/15 rounded-2xl text-white hover:shadow-xl hover:shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                  data-testid="button-download-ios"
                >
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="text-white/60 text-[10px] uppercase tracking-wider block">App Store</span>
                    <span className="font-bold text-base leading-tight">{t("landing.downloadIos")}</span>
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-border/15">
                <div className="flex items-center gap-1.5 text-sm">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-muted-foreground">{t("landing.downloadSecurity")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-muted-foreground">4.8 {t("landing.downloadRating")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  <Download className="w-4 h-4 text-blue-500" />
                  <span className="text-muted-foreground">{t("landing.downloadFree")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-blue-500/5 to-purple-600/8" />
          <div className="section-blur absolute -top-20 left-1/4 w-[400px] h-[400px] rounded-full blur-[160px] opacity-20 bg-gradient-to-br from-primary to-blue-500" />
          <div className="section-blur absolute -bottom-20 right-1/4 w-[350px] h-[350px] rounded-full blur-[140px] opacity-20 bg-gradient-to-br from-purple-600 to-pink-500" />
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        </div>
        <FloatingParticles />
        <div
          ref={ctaReveal.ref}
          className={`relative max-w-3xl mx-auto px-4 sm:px-6 transition-all duration-700 ${ctaReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="relative rounded-[28px] overflow-hidden shadow-2xl shadow-primary/15">
            <div className="absolute inset-0 bg-gradient-to-br from-card/80 via-card/60 to-card/80 backdrop-blur-2xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-purple-600/[0.08]" />
            <div className="absolute inset-0 rounded-[28px] border border-white/[0.08]" />
            <div className="absolute -top-px left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <div className="absolute -bottom-px left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

            <div className="relative px-6 py-14 sm:px-14 sm:py-20 text-center">
              <div ref={orbitToggle.ref} className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] mx-auto mb-8">
                <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-br from-primary/25 via-blue-500/20 to-purple-600/25 blur-3xl opacity-80 animate-pulse" style={{ animationDuration: "3.5s" }} />

                <div className="absolute inset-[8%] rounded-full border border-white/[0.06]" />
                <div className="absolute inset-[22%] rounded-full border border-white/[0.04]" />

                {[
                  { key: "netflix", node: <SiNetflix className="w-8 h-8 sm:w-9 sm:h-9" style={{ color: "#E50914" }} /> },
                  { key: "disneyplus", node: (
                    <div className="flex items-baseline gap-[2px] font-bold text-white" style={{ fontFamily: "Georgia, serif", letterSpacing: "-0.5px" }}>
                      <span className="text-[15px] sm:text-[17px] italic">Disney</span>
                      <span className="text-[14px] sm:text-[16px] font-light">+</span>
                    </div>
                  ) },
                  { key: "appletv", node: <SiAppletv className="w-9 h-9 sm:w-10 sm:h-10 text-white" /> },
                  { key: "primevideo", node: <SiPrimevideo className="w-9 h-9 sm:w-10 sm:h-10" style={{ color: "#1399FF" }} /> },
                  { key: "max", node: <SiMax className="w-9 h-9 sm:w-10 sm:h-10 text-white" /> },
                  { key: "hulu", node: (
                    <span className="font-black text-[18px] sm:text-[20px] tracking-tight" style={{ color: "#1CE783", fontFamily: "system-ui, -apple-system, sans-serif" }}>hulu</span>
                  ) },
                ].map((p, i) => {
                  const angle = (i * 60 - 90) * Math.PI / 180;
                  const radiusPercent = 42;
                  const x = Math.cos(angle) * radiusPercent;
                  const y = Math.sin(angle) * radiusPercent;
                  return (
                    <div
                      key={p.key}
                      className="absolute top-1/2 left-1/2 w-[64px] h-[64px] sm:w-[76px] sm:h-[76px] z-20"
                      style={{
                        transform: orbitToggle.isVisible
                          ? `translate(calc(-50% + ${x}%), calc(-50% + ${y}%)) scale(1)`
                          : `translate(-50%, -50%) scale(0.3)`,
                        opacity: orbitToggle.isVisible ? 1 : 0,
                        transition: `transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.08 + 0.15}s, opacity 0.45s ease-out ${i * 0.08 + 0.15}s`,
                      }}
                      data-testid={`partner-orbit-${p.key}`}
                    >
                      <div
                        className="relative w-full h-full rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/15 flex items-center justify-center shadow-xl shadow-black/40 hover:scale-110 hover:border-white/25 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                        style={{ animation: orbitToggle.isVisible ? `float ${3.5 + (i % 3) * 0.5}s ease-in-out infinite` : "none", animationDelay: `${i * 0.25 + 1}s` }}
                      >
                        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />
                        {p.node}
                      </div>
                    </div>
                  );
                })}

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                  <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-primary/50 to-purple-600/50 blur-2xl opacity-75" />
                  <img
                    src={vemLogo}
                    alt="VEM"
                    className="relative w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] object-contain drop-shadow-[0_8px_32px_rgba(99,102,241,0.6)]"
                    style={{ animation: "float 4s ease-in-out infinite" }}
                  />
                </div>
              </div>

              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-5 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground via-primary to-purple-500 leading-[1.15]"
                data-testid="text-cta-title"
              >
                {t("landing.ctaTitle")}
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto mb-10 leading-relaxed">
                {t("landing.ctaDesc")}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-11 max-w-xl mx-auto">
                <div className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/[0.08] border border-primary/20 backdrop-blur-sm hover:bg-primary/[0.12] hover:border-primary/30 transition-all" data-testid="chip-cta-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                    <Zap className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground/90">{t("landing.ctaChip1")}</span>
                </div>
                <div className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-500/[0.08] border border-blue-500/20 backdrop-blur-sm hover:bg-blue-500/[0.12] hover:border-blue-500/30 transition-all" data-testid="chip-cta-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                    <CircleDollarSign className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground/90">{t("landing.ctaChip2")}</span>
                </div>
                <div className="group flex items-center gap-2 px-4 py-2.5 rounded-full bg-purple-500/[0.08] border border-purple-500/20 backdrop-blur-sm hover:bg-purple-500/[0.12] hover:border-purple-500/30 transition-all" data-testid="chip-cta-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground/90">{t("landing.ctaChip3")}</span>
                </div>
              </div>

              <div className="relative inline-block">
                <div className="absolute inset-0 rounded-2xl blur-xl bg-gradient-to-r from-primary via-blue-500 to-purple-600 opacity-50 scale-110 animate-pulse" style={{ animationDuration: "2.5s" }} />
                <button
                  onClick={() => openAuth("register")}
                  className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-primary via-blue-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-[1.04] active:scale-[0.97] transition-all duration-300 overflow-hidden ring-1 ring-white/20"
                  data-testid="button-cta-register"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                  <UserPlus className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{t("landing.getStarted")}</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showAndroidGuide && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" style={{ touchAction: "none" }} data-testid="android-guide-modal">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAndroidGuide(false)} />
          <div className="relative w-full sm:max-w-[420px] max-h-[85vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300" style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
            <div className="relative bg-card rounded-t-[24px] sm:rounded-[24px] px-5 py-7 sm:p-8 shadow-2xl shadow-black/40">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-5 sm:hidden" />
              <button onClick={() => setShowAndroidGuide(false)} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all z-10" data-testid="button-close-android-guide">
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-7">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
                  <svg className="w-9 h-9" viewBox="0 0 24 24" fill="white">
                    <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0012 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.983 5.983 0 006 7h12c0-2.12-1.1-3.98-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">{t("landing.downloadAndroidGuide")}</h3>
                <p className="text-muted-foreground text-sm">{t("landing.downloadAndroidGuideDesc")}</p>
              </div>

              <div className="space-y-3">
                {[
                  { step: 1, icon: Globe, text: t("landing.downloadAndroidStep1"), color: "from-blue-500 to-cyan-500" },
                  { step: 2, icon: Smartphone, text: t("landing.downloadAndroidStep2"), color: "from-green-500 to-emerald-500" },
                  { step: 3, icon: Monitor, text: t("landing.downloadAndroidStep3"), color: "from-purple-500 to-violet-500" },
                  { step: 4, icon: CheckCircle2, text: t("landing.downloadAndroidStep4"), color: "from-amber-500 to-orange-500" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-4 p-4 bg-muted/30 border border-border/20 rounded-2xl" data-testid={`android-step-${item.step}`}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 shadow-md`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Step {item.step}</span>
                      <p className="text-sm font-medium text-foreground">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAndroidGuide(false)}
                className="w-full mt-6 py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all duration-200"
                data-testid="button-android-guide-close"
              >
                {t("landing.downloadClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showIosGuide && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" style={{ touchAction: "none" }} data-testid="ios-guide-modal">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowIosGuide(false)} />
          <div className="relative w-full sm:max-w-[420px] max-h-[85vh] overflow-y-auto overscroll-contain animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300" style={{ touchAction: "pan-y", WebkitOverflowScrolling: "touch" }}>
            <div className="relative bg-card rounded-t-[24px] sm:rounded-[24px] px-5 py-7 sm:p-8 shadow-2xl shadow-black/40">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-5 sm:hidden" />
              <button onClick={() => setShowIosGuide(false)} className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all z-10" data-testid="button-close-ios-guide">
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-7">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-200 dark:to-white flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-9 h-9 text-white dark:text-gray-900" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">{t("landing.downloadIosGuide")}</h3>
                <p className="text-muted-foreground text-sm">{t("landing.downloadIosDesc")}</p>
              </div>

              <div className="space-y-3">
                {[
                  { step: 1, icon: Globe, text: t("landing.downloadStep1"), color: "from-blue-500 to-cyan-500" },
                  { step: 2, icon: Share2, text: t("landing.downloadStep2"), color: "from-green-500 to-emerald-500" },
                  { step: 3, icon: Monitor, text: t("landing.downloadStep3"), color: "from-purple-500 to-violet-500" },
                  { step: 4, icon: CheckCircle2, text: t("landing.downloadStep4"), color: "from-amber-500 to-orange-500" },
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-4 p-4 bg-muted/30 border border-border/20 rounded-2xl" data-testid={`ios-step-${item.step}`}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0 shadow-md`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Step {item.step}</span>
                      <p className="text-sm font-medium text-foreground">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full mt-6 py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary/90 active:scale-[0.98] transition-all duration-200"
                data-testid="button-ios-guide-close"
              >
                {t("landing.downloadClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-12 border-t border-border/20 bg-muted/5 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={vemLogo} alt="VEM" className="h-8 opacity-80" style={{ imageRendering: "auto", filter: "contrast(1.05) brightness(1.02)" }} />
              <span className="text-muted-foreground/60 text-sm">{t("common.copyright")}</span>
            </div>
            <div className="flex items-center gap-2.5">
              {[
                { href: "https://t.me/vem_ms", label: t("landing.support"), testId: "link-footer-support" },
                { href: "https://t.me/Vem_Official", label: t("landing.channel"), testId: "link-footer-channel" },
                { href: "https://t.me/+rO6-eoMDl0EyYWNh", label: t("landing.community"), testId: "link-footer-community" },
              ].map((link) => (
                <a
                  key={link.testId}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 px-4 py-2.5 bg-card/40 border border-border/20 rounded-xl text-muted-foreground hover:text-[#229ED9] hover:border-[#229ED9]/30 hover:bg-[#229ED9]/5 transition-all duration-300 text-sm"
                  data-testid={link.testId}
                >
                  <SiTelegram className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  <span className="hidden sm:inline">{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {authModal && (
        <AuthModal
          activeTab={authModal}
          onTabChange={(tab) => openAuth(tab)}
          onClose={closeAuth}
          onForgotPassword={openResetModal}
          showResetPassword={showResetPassword}
          setShowResetPassword={setShowResetPassword}
        />
      )}
    </div>
  );
}
