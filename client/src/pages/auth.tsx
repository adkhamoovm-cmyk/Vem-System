import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sun, Moon, LogIn, UserPlus, Shield } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/lib/i18n";
import vemLogo from "@assets/photo_2026-02-24_19-42-53-removebg-preview_1771944480591.png";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SupportWidget } from "@/components/support-widget";
import { apiRequest } from "@/lib/queryClient";
import { countryCodes } from "./auth/shared";
import { LoginForm } from "./auth/login-form";
import { RegisterForm } from "./auth/register-form";
import { ResetPasswordModal } from "./auth/reset-password-modal";

export default function AuthPage() {
  const [location, navigate] = useLocation();
  const { t, locale, translateServerMessage } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const isRegister = location === "/register";
  const [activeTab, setActiveTab] = useState<"login" | "register">(isRegister ? "register" : "login");
  const [animating, setAnimating] = useState(false);
  const [showBannedAlert, setShowBannedAlert] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const switchTab = (tab: "login" | "register") => {
    if (tab === activeTab || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveTab(tab);
      navigate(tab === "login" ? "/login" : "/register");
      setTimeout(() => setAnimating(false), 20);
    }, 200);
  };

  useEffect(() => {
    const tab = location === "/register" ? "register" : "login";
    if (tab !== activeTab) setActiveTab(tab);
  }, [location]);

  useEffect(() => {
    if (localStorage.getItem("vem-banned") === "1") {
      setShowBannedAlert(true);
      localStorage.removeItem("vem-banned");
    }
  }, []);

  const openResetModal = async () => {
    try { await apiRequest("POST", "/api/auth/reset-cancel", {}); } catch {}
    setShowResetPassword(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 bg-gradient-to-br from-blue-500 to-purple-600 animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 bg-gradient-to-tr from-primary to-cyan-500 animate-[float_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-[140px] opacity-[0.06] bg-primary" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      </div>

      <div className="absolute right-4 flex items-center gap-2 z-50" style={{ top: "calc(1rem + var(--sat, 0px))" }}>
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
            className={`relative bg-card/70 backdrop-blur-md rounded-[20px] p-7 shadow-2xl shadow-black/10 transition-all duration-200 ease-in-out ${animating ? "opacity-0 scale-[0.98] translate-y-1" : "opacity-100 scale-100 translate-y-0"}`}
          >
            {activeTab === "login" && (
              <LoginForm
                countryCodes={countryCodes}
                locale={locale}
                t={t}
                translateServerMessage={translateServerMessage}
                showBannedAlert={showBannedAlert}
                setShowBannedAlert={setShowBannedAlert}
                onForgotPassword={openResetModal}
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

        <div className="flex items-center justify-center gap-2 mt-6">
          <Shield className="w-3.5 h-3.5 text-muted-foreground/50" />
          <p className="text-muted-foreground/50 text-[10px] tracking-wide">{t("common.copyright")}</p>
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

      <SupportWidget />
    </div>
  );
}
