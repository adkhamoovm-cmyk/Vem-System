import { useState } from "react";
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
import { Phone, Lock, Eye, EyeOff, ChevronDown, Sun, Moon, KeyRound, ArrowLeft } from "lucide-react";
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
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("vem_remember") === "true");
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-60 h-60 bg-blue-500/3 rounded-full blur-3xl" />
      </div>
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 flex items-center justify-center text-foreground hover:bg-accent transition-all duration-300 shadow-sm"
          data-testid="button-theme-toggle-login"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 transition-transform duration-300 rotate-0" /> : <Moon className="w-5 h-5 transition-transform duration-300 rotate-0" />}
        </button>
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img src={vemLogo} alt="VEM" className="pro-logo h-16 mx-auto" />
          <p className="text-muted-foreground mt-2 text-sm">{t("auth.welcome")}</p>
        </div>

        <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-border/50">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-1.5 h-5 bg-gradient-to-b from-primary to-blue-600 rounded-full" />
            <h2 className="text-lg font-bold text-foreground">{t("auth.login")}</h2>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
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
                    <FormLabel className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("auth.password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder={t("auth.enterPassword")}
                          className="pl-10 pr-10 h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(val) => setRememberMe(val === true)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    data-testid="checkbox-remember-me"
                  />
                  <span className="text-muted-foreground text-sm">{t("auth.rememberMe")}</span>
                </label>
                <button
                  type="button"
                  onClick={openResetModal}
                  className="text-primary text-sm font-medium hover:underline"
                  data-testid="link-forgot-password"
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate h-12 rounded-xl shadow-lg shadow-primary/20 text-base active:scale-[0.98] transition-transform"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? t("auth.loggingIn") : t("auth.loginButton")}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {t("auth.noAccount")}{" "}
              <Link href="/register" className="text-primary font-semibold" data-testid="link-register">
                {t("auth.registerLink")}
              </Link>
            </p>
          </div>
        </div>

        {showResetPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowResetPassword(false)}>
            <div className="bg-card rounded-2xl p-6 shadow-xl border border-border w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
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
                  className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-back-reset"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 flex-1">
                  <div className="w-1 h-5 bg-primary rounded-full" />
                  <h2 className="text-lg font-bold text-foreground">{t("auth.resetPassword")}</h2>
                </div>
                <span className="text-muted-foreground text-xs font-medium bg-muted px-2 py-1 rounded-lg">
                  {t("auth.stepOf", { current: String(resetStep), total: "4" })}
                </span>
              </div>

              <div className="flex gap-1 mb-5">
                {[1,2,3,4].map(s => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= resetStep ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>

              <p className="text-muted-foreground text-sm mb-4">
                {resetStep === 1 && t("auth.resetStep1")}
                {resetStep === 2 && t("auth.resetStep2")}
                {resetStep === 3 && t("auth.resetStep3")}
                {resetStep === 4 && t("auth.resetStep4")}
              </p>

              {resetStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block mb-1.5">{t("auth.phone")}</label>
                    <div className="flex gap-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowCountryListReset(!showCountryListReset)}
                          className="flex items-center gap-1.5 h-11 px-3 bg-card border border-border rounded-xl text-sm font-medium text-foreground whitespace-nowrap hover:border-primary/40 transition-colors"
                          data-testid="button-reset-country-code"
                        >
                          <span className="text-lg">{resetCountry.flag}</span>
                          <span className="text-sm">{resetCountry.code}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showCountryListReset ? "rotate-180" : ""}`} />
                        </button>
                        {showCountryListReset && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setShowCountryListReset(false)} />
                            <div className="absolute top-full left-0 mt-1 w-72 max-h-60 overflow-y-auto bg-card border border-border rounded-xl shadow-xl z-50">
                              {countryCodes.map((c) => (
                                <button
                                  key={c.country + c.code}
                                  type="button"
                                  onClick={() => { setResetCountry(c); setShowCountryListReset(false); }}
                                  className={`flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-muted transition-colors ${
                                    resetCountry.country === c.country ? "bg-muted" : ""
                                  }`}
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
                          value={resetPhone}
                          onChange={e => setResetPhone(e.target.value)}
                          placeholder=""
                          autoComplete="tel"
                          className="pl-10 h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                          data-testid="input-reset-phone"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleResetStep1}
                    className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold h-12 rounded-xl shadow-lg shadow-primary/20 text-base active:scale-[0.98] transition-transform"
                    disabled={resetLoading || resetPhone.length < 5}
                    data-testid="button-reset-next-1"
                  >
                    {resetLoading ? t("auth.checking") : t("auth.next")}
                  </Button>
                </div>
              )}

              {resetStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-3 mb-2 border border-border">
                    <div className="flex items-start gap-2">
                      <KeyRound className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-muted-foreground text-xs leading-relaxed">{t("auth.fundPasswordHint")}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block mb-1.5">{t("auth.fundPassword")}</label>
                    <div className="flex justify-center gap-2">
                      {[0,1,2,3,4,5].map(i => (
                        <Input
                          key={i}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={resetPin[i] || ""}
                          className="w-11 h-12 text-center text-lg font-bold bg-muted border-border text-foreground rounded-xl focus:border-primary/50 focus:ring-primary/20"
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
                    className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold h-12 rounded-xl shadow-lg shadow-primary/20 text-base active:scale-[0.98] transition-transform"
                    disabled={resetLoading || resetPin.length !== 6}
                    data-testid="button-reset-next-2"
                  >
                    {resetLoading ? t("auth.checking") : t("auth.next")}
                  </Button>
                </div>
              )}

              {resetStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-xl p-3 mb-2 border border-border">
                    <div className="flex items-start gap-2">
                      <KeyRound className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {resetVerifyType === "card" && t("auth.verifyCardLast6")}
                        {resetVerifyType === "crypto" && t("auth.verifyCryptoFull")}
                        {resetVerifyType === "referrer" && (resetVerifyHint ? t("auth.verifyReferrerPhone") : t("auth.verifyRegDate"))}
                      </p>
                    </div>
                  </div>
                  {resetVerifyHint && (
                    <p className="text-xs text-muted-foreground text-center">
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
                      className="h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-xl text-center tracking-wider"
                      data-testid="input-reset-verify"
                    />
                  </div>
                  <Button
                    onClick={handleResetStep3}
                    className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold h-12 rounded-xl shadow-lg shadow-primary/20 text-base active:scale-[0.98] transition-transform"
                    disabled={resetLoading || !resetAnswer.trim()}
                    data-testid="button-reset-next-3"
                  >
                    {resetLoading ? t("auth.checking") : t("auth.next")}
                  </Button>
                </div>
              )}

              {resetStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider block mb-1.5">{t("auth.newPassword")}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={resetNewPass}
                        onChange={e => setResetNewPass(e.target.value)}
                        type={showPassword ? "text" : "password"}
                        placeholder={t("auth.enterNewPassword")}
                        className="pl-10 pr-10 h-11 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20 rounded-xl"
                        data-testid="input-reset-new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-muted-foreground text-[10px] mt-1">{t("auth.minChars")}</p>
                  </div>
                  <Button
                    onClick={handleResetStep4}
                    className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold h-12 rounded-xl shadow-lg shadow-primary/20 text-base active:scale-[0.98] transition-transform"
                    disabled={resetLoading || resetNewPass.length < 6}
                    data-testid="button-reset-password"
                  >
                    {resetLoading ? t("auth.resetting") : t("auth.resetPassword")}
                  </Button>
                </div>
              )}

              <div className="mt-4 text-center">
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
        )}

        <p className="text-center text-muted-foreground text-[10px] mt-4">
          {t("common.copyright")}
        </p>
      </div>
      <SupportWidget />
    </div>
  );
}
