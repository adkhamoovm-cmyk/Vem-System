import { useState, useEffect } from "react";
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
  Phone, Lock, Eye, EyeOff, ChevronDown, ChevronRight,
  Shield, UserPlus, ArrowLeft, ArrowRight, CheckCircle,
  AlertTriangle, Bot, FileText,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { type CountryCode, PinInput } from "./shared";
import { SliderCaptcha } from "./slider-captcha";
import { TermsModal } from "./terms-modal";

interface RegisterFormProps {
  countryCodes: CountryCode[];
  locale: Locale;
  t: (key: string) => string;
  translateServerMessage: (msg: string) => string;
}

export function RegisterForm({ countryCodes, locale, t, translateServerMessage }: RegisterFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [regCountry, setRegCountry] = useState(countryCodes[0]);
  const [showRegCountryList, setShowRegCountryList] = useState(false);
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [showReferral, setShowReferral] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const refCode = params.get("ref") || "";
  useEffect(() => { if (refCode) setShowReferral(true); }, [refCode]);

  const registerSchema = z.object({
    phone: z.string().min(5, t("auth.phoneValidation")).regex(/^\d+$/, t("auth.phoneOnlyDigits")),
    password: z.string().min(6, t("auth.passwordValidation")),
    fundPassword: z.string().length(6, t("auth.fundPasswordValidation")).regex(/^\d{6}$/, t("auth.onlyNumbers")),
    captcha: z.boolean().refine(val => val === true, t("auth.captchaValidation")),
    ageConfirm: z.boolean().refine(val => val === true, t("auth.termsValidation")),
    referralCode: z.string().optional(),
  });
  type RegisterFormData = z.infer<typeof registerSchema>;

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: "", password: "", fundPassword: "", captcha: false, ageConfirm: false, referralCode: refCode },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const fullPhone = regCountry.code + data.phone;
      const res = await apiRequest("POST", "/api/auth/register", { ...data, phone: fullPhone, captchaVerified: data.captcha });
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

  const resetToStep1 = () => setRegStep(1);

  return (
    <div>
      <div className="flex items-center justify-center mb-5">
        <div className="flex items-center gap-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${regStep === 1 ? "bg-gradient-to-br from-primary to-blue-600 text-white shadow-md shadow-primary/30" : "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"}`}>
            {regStep > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
          </div>
          <div className="flex gap-0.5 mx-1">
            {[0,1,2].map(i => (
              <div key={i} className={`w-5 h-0.5 rounded-full transition-all duration-500 ${regStep === 2 ? "bg-primary" : "bg-border/40"}`} style={{ transitionDelay: `${i * 60}ms` }} />
            ))}
          </div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${regStep === 2 ? "bg-gradient-to-br from-primary to-blue-600 text-white shadow-md shadow-primary/30" : "bg-muted border-2 border-border/40 text-muted-foreground"}`}>
            2
          </div>
        </div>
        <div className="ml-3 text-xs text-muted-foreground font-medium">
          {regStep === 1 ? (
            <span className="text-foreground/70">{t("auth.phone")} & {t("auth.password")}</span>
          ) : (
            <span className="text-foreground/70">{t("auth.fundPassword")} & {t("auth.captchaSlide")}</span>
          )}
        </div>
      </div>

      <Form {...registerForm}>
        <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))}>

          {regStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Phone className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("auth.phone")}</span>
                <div className="flex-1 h-px bg-border/30" />
              </div>

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
                          <Input {...field} placeholder="" autoComplete="tel" inputMode="numeric" pattern="[0-9]*" onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} className="pl-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl transition-all duration-200" data-testid="input-phone-reg" />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-2 pt-1">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Lock className="w-3 h-3 text-primary" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("auth.password")}</span>
                <div className="flex-1 h-px bg-border/30" />
              </div>

              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => {
                  const pw = field.value || "";
                  const hasNum = /\d/.test(pw);
                  const hasSpec = /[^a-zA-Z0-9]/.test(pw);
                  const strength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 8 || !hasNum ? 2 : pw.length >= 10 && hasNum && hasSpec ? 4 : 3;
                  const strengthColors = ["", "bg-red-500", "bg-red-400", "bg-amber-400", "bg-emerald-500"];
                  const strengthLabels = ["", t("common.strengthVeryWeak"), t("common.strengthWeak"), t("common.strengthMedium"), t("common.strengthStrong")];
                  return (
                    <FormItem>
                      <FormLabel className="text-foreground/70 text-xs font-semibold uppercase tracking-wider">{t("auth.loginPassword")}</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="relative group">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input {...field} type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder={t("auth.minChars")} className="pl-11 pr-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl transition-all duration-200" data-testid="input-password-reg" />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5" data-testid="button-toggle-password-reg">
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {pw.length > 0 && (
                            <div className="space-y-1.5" data-testid="password-strength-indicator">
                              <div className="flex gap-1">
                                {[1,2,3,4].map(lvl => (
                                  <div key={lvl} className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength >= lvl ? strengthColors[strength] : "bg-muted/60"}`} />
                                ))}
                              </div>
                              <p className={`text-[11px] font-semibold transition-colors ${strength <= 2 ? "text-red-400" : strength === 3 ? "text-amber-400" : "text-emerald-500"}`}>
                                {strengthLabels[strength]}
                              </p>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <button
                type="button"
                onClick={async () => {
                  const valid = await registerForm.trigger(["phone", "password"]);
                  if (valid) setRegStep(2);
                }}
                className="w-full h-[52px] rounded-xl bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold text-[15px] shadow-xl shadow-primary/25 hover:brightness-110 hover:shadow-primary/35 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-1"
                data-testid="button-reg-next"
              >
                {t("common.next")}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {regStep === 2 && (
            <div className="space-y-4">

              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Shield className="w-3 h-3 text-amber-500" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t("auth.fundPassword")}</span>
                <div className="flex-1 h-px bg-border/30" />
              </div>

              <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/25 rounded-xl px-3.5 py-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-400/90 leading-snug">
                  {t("common.pinWarning")}
                </p>
              </div>

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

              <div>
                <button
                  type="button"
                  onClick={() => setShowReferral(!showReferral)}
                  className="flex items-center gap-2 text-sm text-primary/80 hover:text-primary transition-colors font-medium py-0.5"
                  data-testid="button-toggle-referral"
                >
                  <div className={`w-4 h-4 rounded-full border-2 border-primary/40 flex items-center justify-center transition-all duration-200 ${showReferral ? "bg-primary border-primary" : ""}`}>
                    {showReferral ? <CheckCircle className="w-2.5 h-2.5 text-white" /> : <ArrowRight className="w-2 h-2 text-primary/60" />}
                  </div>
                  {t("common.haveReferral")}
                </button>
                {showReferral && (
                  <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <FormField
                      control={registerForm.control}
                      name="referralCode"
                      render={({ field }) => (
                        <FormItem>
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
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t("common.confirmNotRobot")}
                  </span>
                </div>
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
              </div>

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

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={resetToStep1}
                  className="h-[52px] px-5 rounded-xl border border-border/50 bg-muted/40 text-foreground/70 hover:bg-muted/70 hover:text-foreground transition-all duration-200 flex items-center gap-1.5 text-sm font-medium shrink-0"
                  data-testid="button-reg-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("common.back")}
                </button>
                <Button type="submit" className="flex-1 bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all duration-200 hover:shadow-primary/35 hover:brightness-110" disabled={registerMutation.isPending} data-testid="button-register">
                  {registerMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("auth.registering")}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      {t("auth.register")}
                    </div>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60 pt-0.5">
                <Shield className="w-3 h-3 text-emerald-500/60" />
                <span>{t("common.dataProtected")}</span>
              </div>
            </div>
          )}
        </form>
      </Form>

      {showTerms && (
        <TermsModal
          locale={locale}
          t={t}
          onClose={() => setShowTerms(false)}
          onAccept={() => {
            setHasReadTerms(true);
            registerForm.setValue("ageConfirm", true);
            setShowTerms(false);
          }}
        />
      )}
    </div>
  );
}
