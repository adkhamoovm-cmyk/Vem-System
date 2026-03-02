import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Lock, Eye, EyeOff, ChevronDown, Sun, Moon, KeyRound, ArrowLeft, LogIn, Shield, Ban } from "lucide-react";
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

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, translateServerMessage } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetPhone, setResetPhone] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [resetAnswer, setResetAnswer] = useState("");
  const [resetNewPass, setResetNewPass] = useState("");
  const [resetVerifyType, setResetVerifyType] = useState<"card" | "crypto" | "referrer" | "">("");
  const [resetVerifyHint, setResetVerifyHint] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showBannedAlert, setShowBannedAlert] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("vem_remember") === "true");

  useEffect(() => {
    if (localStorage.getItem("vem-banned") === "1") {
      setShowBannedAlert(true);
      localStorage.removeItem("vem-banned");
    }
  }, []);
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const saved = localStorage.getItem("vem_country");
    if (saved) {
      const found = countryCodes.find(c => c.country === saved);
      if (found) return found;
    }
    return countryCodes[0];
  });
  const [showCountryList, setShowCountryList] = useState(false);
  const [showCountryListReset, setShowCountryListReset] = useState(false);
  const [resetCountry, setResetCountry] = useState(countryCodes[0]);

  const savedPhone = rememberMe ? (localStorage.getItem("vem_phone") || "") : "";

  const loginSchema = z.object({
    phone: z.string().min(5, t("auth.phoneValidation")),
    password: z.string().min(4, t("auth.passwordRequired")),
  });

  type LoginForm = z.infer<typeof loginSchema>;

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: savedPhone, password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const fullPhone = selectedCountry.code + data.phone;
      const res = await apiRequest("POST", "/api/auth/login", { ...data, phone: fullPhone, rememberMe });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      if (rememberMe) {
        localStorage.setItem("vem_remember", "true");
        localStorage.setItem("vem_phone", variables.phone);
        localStorage.setItem("vem_country", selectedCountry.country);
      } else {
        localStorage.removeItem("vem_remember");
        localStorage.removeItem("vem_phone");
        localStorage.removeItem("vem_country");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      if (error.message === "ACCOUNT_BANNED") {
        setShowBannedAlert(true);
        return;
      }
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const openResetModal = async () => {
    try { await apiRequest("POST", "/api/auth/reset-cancel", {}); } catch {}
    setShowResetPassword(true);
    setResetStep(1);
    setResetPhone("");
    setResetPin("");
    setResetAnswer("");
    setResetNewPass("");
    setResetVerifyType("");
    setResetVerifyHint("");
  };

  const handleResetStep1 = async () => {
    if (!resetPhone || resetPhone.length < 5) return;
    setResetLoading(true);
    try {
      const fullPhone = resetCountry.code + resetPhone;
      const res = await apiRequest("POST", "/api/auth/reset-step1", { phone: fullPhone });
      const data = await res.json();
      if (data.success) setResetStep(2);
    } catch (error: any) {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetStep2 = async () => {
    if (resetPin.length !== 6) return;
    setResetLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-step2", { fundPassword: resetPin });
      const data = await res.json();
      if (data.success) {
        setResetVerifyType(data.verifyType);
        setResetVerifyHint(data.verifyHint || "");
        setResetStep(3);
      }
    } catch (error: any) {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetStep3 = async () => {
    if (!resetAnswer.trim()) return;
    setResetLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-step3", { answer: resetAnswer.trim() });
      const data = await res.json();
      if (data.success) setResetStep(4);
    } catch (error: any) {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetStep4 = async () => {
    if (resetNewPass.length < 6) return;
    setResetLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", { newPassword: resetNewPass });
      const data = await res.json();
      toast({ title: t("auth.resetSuccess"), description: translateServerMessage(data.message) });
      setShowResetPassword(false);
    } catch (error: any) {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    } finally {
      setResetLoading(false);
    }
  };

  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 bg-gradient-to-br from-blue-500 to-purple-600 animate-[float_8s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20 bg-gradient-to-tr from-primary to-cyan-500 animate-[float_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[160px] opacity-[0.07] bg-primary" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground) / 0.03) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-2 z-50">
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-card/60 backdrop-blur-xl border border-border/30 flex items-center justify-center text-foreground hover:bg-card/80 transition-all duration-300 shadow-lg shadow-black/5"
          data-testid="button-theme-toggle-login"
        >
          {theme === "dark" ? <Sun className="w-4.5 h-4.5 transition-transform duration-500 rotate-0 hover:rotate-90" /> : <Moon className="w-4.5 h-4.5 transition-transform duration-500 rotate-0 hover:-rotate-12" />}
        </button>
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-10">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl opacity-60" />
            <img src={vemLogo} alt="VEM" className="pro-logo h-20 mx-auto relative" style={{imageRendering: "auto", filter: "contrast(1.05) brightness(1.02)"}} />
          </div>
          <p className="text-muted-foreground mt-3 text-sm font-medium tracking-wide">{t("auth.welcome")}</p>
        </div>

        <div className="relative">
          <div className="absolute -inset-[1px] rounded-[20px] bg-gradient-to-b from-border/60 via-border/20 to-border/60 pointer-events-none" />
          <div className="relative bg-card/70 backdrop-blur-md rounded-[20px] p-7 shadow-2xl shadow-black/10">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/25">
                <LogIn className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">{t("auth.login")}</h2>
              </div>
            </div>

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

            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
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
                      <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">{t("auth.password")}</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder={t("auth.enterPassword")}
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

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <Checkbox
                      checked={rememberMe}
                      onCheckedChange={(val) => setRememberMe(val === true)}
                      className="border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md"
                      data-testid="checkbox-remember-me"
                    />
                    <span className="text-muted-foreground text-sm group-hover:text-foreground transition-colors">{t("auth.rememberMe")}</span>
                  </label>
                  <button
                    type="button"
                    onClick={openResetModal}
                    className="text-primary/80 text-sm font-medium hover:text-primary transition-colors"
                    data-testid="link-forgot-password"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all duration-200 hover:shadow-primary/35 hover:brightness-110 mt-1"
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("auth.loggingIn")}
                    </div>
                  ) : t("auth.loginButton")}
                </Button>
              </form>
            </Form>

            <div className="mt-7 pt-6 border-t border-border/30 text-center">
              <p className="text-muted-foreground text-sm">
                {t("auth.noAccount")}{" "}
                <Link href="/register" className="text-primary font-semibold hover:text-primary/80 transition-colors" data-testid="link-register">
                  {t("auth.registerLink")}
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Shield className="w-3.5 h-3.5 text-muted-foreground/50" />
          <p className="text-muted-foreground/50 text-[10px] tracking-wide">
            {t("common.copyright")}
          </p>
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
                      if (resetStep === 2) {
                        try { await apiRequest("POST", "/api/auth/reset-cancel", {}); } catch {}
                      }
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
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  {resetStep}/4
                </span>
              </div>

              <div className="flex gap-1.5 mb-6">
                {[1,2,3,4].map(s => (
                  <div key={s} className="h-1 flex-1 rounded-full overflow-hidden bg-muted">
                    <div className={`h-full rounded-full transition-all duration-500 ease-out ${
                      s < resetStep ? "w-full bg-primary" :
                      s === resetStep ? "w-full bg-gradient-to-r from-primary to-blue-500" :
                      "w-0"
                    }`} />
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
                                <button
                                  key={c.country + c.code}
                                  type="button"
                                  onClick={() => { setResetCountry(c); setShowCountryListReset(false); }}
                                  className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-primary/5 transition-colors ${
                                    resetCountry.country === c.country ? "bg-primary/10 text-primary" : ""
                                  }`}
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
                          value={resetPhone}
                          onChange={e => setResetPhone(e.target.value)}
                          placeholder=""
                          autoComplete="tel"
                          className="pl-11 h-12 bg-muted/50 border-border/50 text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl"
                          data-testid="input-reset-phone"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleResetStep1}
                    className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all"
                    disabled={resetLoading || resetPhone.length < 5}
                    data-testid="button-reset-next-1"
                  >
                    {resetLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("auth.checking")}
                      </div>
                    ) : t("auth.next")}
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
                        <Input
                          key={i}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={resetPin[i] || ""}
                          className="w-12 h-14 text-center text-lg font-bold bg-muted/50 border-border/50 text-foreground rounded-xl focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
                          data-testid={`input-reset-pin-${i}`}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, "");
                            if (val.length <= 1) {
                              const newPin = resetPin.split("");
                              newPin[i] = val;
                              setResetPin(newPin.join("").slice(0, 6));
                              if (val && i < 5) {
                                const next = e.target.parentElement?.parentElement?.querySelector(`[data-testid="input-reset-pin-${i+1}"]`) as HTMLInputElement;
                                next?.focus();
                              }
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === "Backspace" && !resetPin[i] && i > 0) {
                              const prev = (e.target as HTMLElement).parentElement?.parentElement?.querySelector(`[data-testid="input-reset-pin-${i-1}"]`) as HTMLInputElement;
                              prev?.focus();
                            }
                          }}
                          onPaste={e => {
                            e.preventDefault();
                            const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                            setResetPin(paste);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleResetStep2}
                    className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all"
                    disabled={resetLoading || resetPin.length !== 6}
                    data-testid="button-reset-next-2"
                  >
                    {resetLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("auth.checking")}
                      </div>
                    ) : t("auth.next")}
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
                  <div>
                    <Input
                      value={resetAnswer}
                      onChange={e => setResetAnswer(e.target.value)}
                      placeholder={
                        resetVerifyType === "card" ? "XXXXXX" :
                        resetVerifyType === "crypto" ? "T..." :
                        resetVerifyType === "referrer" && resetVerifyHint ? "+998..." :
                        "2026-01-15"
                      }
                      className="h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl text-center tracking-wider font-mono"
                      data-testid="input-reset-verify"
                    />
                  </div>
                  <Button
                    onClick={handleResetStep3}
                    className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all"
                    disabled={resetLoading || !resetAnswer.trim()}
                    data-testid="button-reset-next-3"
                  >
                    {resetLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("auth.checking")}
                      </div>
                    ) : t("auth.next")}
                  </Button>
                </div>
              )}

              {resetStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider block mb-2">{t("auth.newPassword")}</label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        value={resetNewPass}
                        onChange={e => setResetNewPass(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.enterNewPassword")}
                        className="pl-11 pr-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl"
                        data-testid="input-reset-new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-toggle-reset-password"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-muted-foreground/60 text-[11px] mt-1.5 pl-1">{t("auth.minChars")}</p>
                  </div>
                  <Button
                    onClick={handleResetStep4}
                    className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all"
                    disabled={resetLoading || resetNewPass.length < 6}
                    data-testid="button-reset-password"
                  >
                    {resetLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("auth.resetting")}
                      </div>
                    ) : t("auth.resetPassword")}
                  </Button>
                </div>
              )}

              <div className="mt-5 text-center">
                <button
                  onClick={() => setShowResetPassword(false)}
                  className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                  data-testid="link-back-to-login"
                >
                  {t("auth.backToLogin")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SupportWidget />
    </div>
  );
}
