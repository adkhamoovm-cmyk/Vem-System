import { useState, useRef, useCallback } from "react";
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
import { Lock, Shield, Eye, EyeOff, UserPlus, ChevronDown, CheckCircle, ArrowRight, Phone, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/lib/i18n";
import vemLogo from "@assets/photo_2026-02-24_19-03-39_1771941846491.jpg";
import { LanguageSwitcher } from "@/components/language-switcher";

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

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, translateServerMessage } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryList, setShowCountryList] = useState(false);

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground hover:bg-accent transition-all duration-300 shadow-sm"
          data-testid="button-theme-toggle-register"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 transition-transform duration-300 rotate-0" /> : <Moon className="w-5 h-5 transition-transform duration-300 rotate-0" />}
        </button>
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-5">
          <div className="inline-block rounded-2xl overflow-hidden bg-[#0d1033] px-4 py-2">
            <img src={vemLogo} alt="VEM" className="h-12 object-contain" />
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">Video Earning Platform</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-5 bg-primary rounded-full" />
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
                            placeholder="90 123 45 67"
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
                      <div className="bg-muted rounded-xl p-3 border border-border">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            data-testid="checkbox-age-confirm"
                          />
                          <span className="text-muted-foreground text-xs leading-relaxed">
                            <strong>{t("auth.ageConfirm")}</strong>. {t("auth.ageResponsibility")}
                            <Link href="#" className="text-primary font-semibold ml-1">{t("auth.termsOfUse")}</Link> {" "}
                            <Link href="#" className="text-primary font-semibold">{t("auth.privacyPolicy")}</Link>{t("auth.readAndAccept")}
                          </span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-primary text-white font-semibold no-default-hover-elevate no-default-active-elevate h-12 rounded-xl shadow-lg text-base mt-1"
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
    </div>
  );
}
