import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Sun, Moon, LogIn, UserPlus, X, Play, Eye, TrendingUp, Users, ChevronDown, Shield, Zap, Gift, Star, Monitor } from "lucide-react";
import { SiTelegram } from "react-icons/si";
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
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" data-testid="auth-modal">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-[440px] max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        <div className="absolute -inset-[1px] rounded-t-[24px] sm:rounded-[24px] bg-gradient-to-b from-primary/30 via-border/20 to-border/60 pointer-events-none" />
        <div className="relative bg-card/95 backdrop-blur-xl rounded-t-[24px] sm:rounded-[24px] p-6 sm:p-7 shadow-2xl shadow-black/40">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-4 sm:hidden" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all z-10"
            data-testid="button-close-auth"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="text-center mb-5">
            <img src={vemLogo} alt="VEM" className="h-14 mx-auto" style={{ imageRendering: "auto", filter: "contrast(1.05) brightness(1.02)" }} />
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

          <div className={`transition-all duration-200 ease-in-out ${animating ? "opacity-0 scale-[0.98] translate-y-1" : "opacity-100 scale-100 translate-y-0"}`}>
            {activeTab === "login" && (
              <LoginForm
                countryCodes={countryCodes}
                locale={locale}
                t={t}
                translateServerMessage={translateServerMessage}
                showBannedAlert={showBannedAlert}
                setShowBannedAlert={setShowBannedAlert}
                onForgotPassword={onForgotPassword}
              />
            )}
            {activeTab === "register" && (
              <RegisterForm
                countryCodes={countryCodes}
                locale={locale}
                t={t}
                translateServerMessage={translateServerMessage}
              />
            )}
          </div>
        </div>
      </div>

      {showResetPassword && (
        <ResetPasswordModal
          countryCodes={countryCodes}
          locale={locale}
          t={t}
          translateServerMessage={translateServerMessage}
          onClose={() => setShowResetPassword(false)}
        />
      )}
    </div>
  );
}

const partnerBrands = [
  { name: "Netflix", color: "#E50914" },
  { name: "Amazon Prime", color: "#00A8E1" },
  { name: "HBO Max", color: "#B535F6" },
  { name: "Disney+", color: "#113CCF" },
  { name: "Apple TV+", color: "#A3AAAE" },
  { name: "Hulu", color: "#1CE783" },
];

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const [authModal, setAuthModal] = useState<null | "login" | "register">(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  useEffect(() => {
    if (user && !isLoading) navigate("/dashboard");
  }, [user, isLoading, navigate]);

  const openResetModal = async () => {
    try { await apiRequest("POST", "/api/auth/reset-cancel", {}); } catch {}
    setShowResetPassword(true);
  };

  const features = [
    { icon: Play, titleKey: "landing.featureWatchTitle", descKey: "landing.featureWatchDesc", gradient: "from-red-500 to-orange-500" },
    { icon: TrendingUp, titleKey: "landing.featureEarnTitle", descKey: "landing.featureEarnDesc", gradient: "from-emerald-500 to-green-500" },
    { icon: Users, titleKey: "landing.featureReferralTitle", descKey: "landing.featureReferralDesc", gradient: "from-blue-500 to-cyan-500" },
    { icon: Shield, titleKey: "landing.featureSecureTitle", descKey: "landing.featureSecureDesc", gradient: "from-purple-500 to-violet-500" },
  ];

  const steps = [
    { num: "01", titleKey: "landing.step1Title", descKey: "landing.step1Desc", icon: UserPlus },
    { num: "02", titleKey: "landing.step2Title", descKey: "landing.step2Desc", icon: Eye },
    { num: "03", titleKey: "landing.step3Title", descKey: "landing.step3Desc", icon: Gift },
  ];

  const faqs = [
    { qKey: "landing.faq1Q", aKey: "landing.faq1A" },
    { qKey: "landing.faq2Q", aKey: "landing.faq2A" },
    { qKey: "landing.faq3Q", aKey: "landing.faq3A" },
    { qKey: "landing.faq4Q", aKey: "landing.faq4A" },
    { qKey: "landing.faq5Q", aKey: "landing.faq5A" },
    { qKey: "landing.faq6Q", aKey: "landing.faq6A" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={vemLogo} alt="VEM" className="h-9" style={{ imageRendering: "auto", filter: "contrast(1.05) brightness(1.02)" }} />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-muted/50 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setAuthModal("login")}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
              data-testid="button-header-login"
            >
              <LogIn className="w-4 h-4" />
              {t("auth.login")}
            </button>
            <button
              onClick={() => setAuthModal("register")}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-blue-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97] transition-all"
              data-testid="button-header-register"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("auth.register")}</span>
              <span className="sm:hidden">{t("landing.startNow")}</span>
            </button>
          </div>
        </div>
      </header>

      <section ref={heroRef} className="relative pt-28 pb-20 sm:pt-36 sm:pb-28 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 bg-gradient-to-br from-blue-500 to-purple-600 animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15 bg-gradient-to-tr from-primary to-cyan-500 animate-[float_10s_ease-in-out_infinite_reverse]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-8" data-testid="badge-hero">
            <Zap className="w-4 h-4" />
            {t("landing.heroBadge")}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight" data-testid="text-hero-title">
            <span className="text-foreground">{t("landing.heroTitle1")}</span>
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">{t("landing.heroTitle2")}</span>
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed" data-testid="text-hero-desc">
            {t("landing.heroDesc")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-14">
            <button
              onClick={() => setAuthModal("register")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-bold text-base rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97] transition-all"
              data-testid="button-hero-register"
            >
              <UserPlus className="w-5 h-5" />
              {t("landing.getStarted")}
            </button>
            <button
              onClick={() => setAuthModal("login")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-muted/50 border border-border/50 text-foreground font-semibold text-base rounded-2xl hover:bg-muted/80 transition-all"
              data-testid="button-hero-login"
            >
              <LogIn className="w-5 h-5" />
              {t("landing.alreadyHaveAccount")}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6" data-testid="stats-row">
            {[
              { value: "50K+", labelKey: "landing.statUsers" },
              { value: "11", labelKey: "landing.statVipLevels" },
              { value: "24/7", labelKey: "landing.statSupport" },
            ].map((stat) => (
              <div key={stat.labelKey} className="flex items-center gap-2.5 px-4 py-2.5 bg-card/50 border border-border/30 rounded-xl backdrop-blur-sm">
                <span className="text-lg font-extrabold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">{stat.value}</span>
                <span className="text-muted-foreground text-sm">{t(stat.labelKey)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 border-t border-border/20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-muted-foreground text-sm font-medium uppercase tracking-widest mb-10" data-testid="text-partners-label">
            {t("landing.partnersTitle")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10" data-testid="partners-row">
            {partnerBrands.map((brand) => (
              <div
                key={brand.name}
                className="flex items-center gap-2.5 px-5 py-3 bg-card/60 border border-border/30 rounded-2xl backdrop-blur-sm hover:border-border/60 transition-all group"
              >
                <Monitor className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" style={{ color: brand.color }} />
                <span className="text-foreground/80 font-semibold text-sm group-hover:text-foreground transition-colors">{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28" id="features">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-4" data-testid="text-features-title">{t("landing.featuresTitle")}</h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">{t("landing.featuresDesc")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="group relative bg-card/60 border border-border/30 rounded-2xl p-6 hover:border-border/60 hover:shadow-xl hover:shadow-black/5 transition-all duration-300"
                data-testid={`card-feature-${i}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-foreground font-bold text-base mb-2">{t(f.titleKey)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28 bg-muted/20 border-t border-b border-border/20" id="how-it-works">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-4" data-testid="text-steps-title">{t("landing.stepsTitle")}</h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">{t("landing.stepsDesc")}</p>
          </div>
          <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative text-center group" data-testid={`card-step-${i}`}>
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-blue-500/10 border border-primary/20 mb-5 group-hover:scale-110 transition-transform">
                  <s.icon className="w-7 h-7 text-primary" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-white text-xs font-extrabold flex items-center justify-center shadow-lg">{s.num}</span>
                </div>
                <h3 className="text-foreground font-bold text-base mb-2">{t(s.titleKey)}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{t(s.descKey)}</p>
                {i < steps.length - 1 && (
                  <div className="hidden sm:block absolute top-8 -right-4 w-8 text-border/40">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-4-4 4 4-4 4" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-extrabold mb-4" data-testid="text-faq-title">{t("landing.faqTitle")}</h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">{t("landing.faqDesc")}</p>
          </div>
          <div className="space-y-3" data-testid="faq-list">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-card/60 border border-border/30 rounded-2xl overflow-hidden transition-all hover:border-border/50"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left group"
                  data-testid={`button-faq-${i}`}
                >
                  <span className="text-foreground font-semibold text-sm sm:text-base pr-4">{t(faq.qKey)}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-primary" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                  <p className="px-5 pb-4 text-muted-foreground text-sm leading-relaxed">{t(faq.aKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-600/10 border-t border-border/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 mb-6 shadow-xl shadow-primary/25">
            <Star className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4" data-testid="text-cta-title">{t("landing.ctaTitle")}</h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto mb-8">{t("landing.ctaDesc")}</p>
          <button
            onClick={() => setAuthModal("register")}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-bold text-base rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:brightness-110 active:scale-[0.97] transition-all"
            data-testid="button-cta-register"
          >
            <UserPlus className="w-5 h-5" />
            {t("landing.getStarted")}
          </button>
        </div>
      </section>

      <footer className="py-10 border-t border-border/30 bg-muted/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={vemLogo} alt="VEM" className="h-8" style={{ imageRendering: "auto", filter: "contrast(1.05) brightness(1.02)" }} />
              <span className="text-muted-foreground text-sm">{t("common.copyright")}</span>
            </div>
            <div className="flex items-center gap-3">
              <a href="https://t.me/vem_ms" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3.5 py-2 bg-card/60 border border-border/30 rounded-xl text-muted-foreground hover:text-primary hover:border-primary/30 transition-all text-sm" data-testid="link-footer-support">
                <SiTelegram className="w-4 h-4" />
                {t("landing.support")}
              </a>
              <a href="https://t.me/Vem_Official" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3.5 py-2 bg-card/60 border border-border/30 rounded-xl text-muted-foreground hover:text-primary hover:border-primary/30 transition-all text-sm" data-testid="link-footer-channel">
                <SiTelegram className="w-4 h-4" />
                {t("landing.channel")}
              </a>
              <a href="https://t.me/+rO6-eoMDl0EyYWNh" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3.5 py-2 bg-card/60 border border-border/30 rounded-xl text-muted-foreground hover:text-primary hover:border-primary/30 transition-all text-sm" data-testid="link-footer-community">
                <SiTelegram className="w-4 h-4" />
                {t("landing.community")}
              </a>
            </div>
          </div>
        </div>
      </footer>

      {authModal && (
        <AuthModal
          activeTab={authModal}
          onTabChange={setAuthModal}
          onClose={() => setAuthModal(null)}
          onForgotPassword={openResetModal}
          showResetPassword={showResetPassword}
          setShowResetPassword={setShowResetPassword}
        />
      )}
    </div>
  );
}
