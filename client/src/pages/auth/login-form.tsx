import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Phone, Lock, Eye, EyeOff, ChevronDown, Ban } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { type CountryCode } from "./shared";

interface LoginFormProps {
  countryCodes: CountryCode[];
  locale: Locale;
  t: (key: string) => string;
  translateServerMessage: (msg: string) => string;
  showBannedAlert: boolean;
  setShowBannedAlert: (v: boolean) => void;
  onForgotPassword: () => void;
}

export function LoginForm({ countryCodes, locale, t, translateServerMessage, showBannedAlert, setShowBannedAlert, onForgotPassword }: LoginFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("vem_remember") === "true");
  const [loginShake, setLoginShake] = useState(false);
  const [loginCountry, setLoginCountry] = useState<CountryCode>(() => {
    const saved = localStorage.getItem("vem_country");
    if (saved) { const found = countryCodes.find(c => c.country === saved); if (found) return found; }
    return countryCodes[0];
  });
  const [showLoginCountryList, setShowLoginCountryList] = useState(false);

  const triggerShake = () => {
    setLoginShake(true);
    setTimeout(() => setLoginShake(false), 600);
  };

  const savedPhone = rememberMe ? (localStorage.getItem("vem_phone") || "") : "";

  const loginSchema = z.object({
    phone: z.string().min(5, t("auth.phoneValidation")),
    password: z.string().min(4, t("auth.passwordRequired")),
  });
  type LoginFormData = z.infer<typeof loginSchema>;

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: savedPhone, password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const fullPhone = loginCountry.code + data.phone;
      const res = await apiRequest("POST", "/api/auth/login", { ...data, phone: fullPhone, rememberMe });
      return res.json();
    },
    onSuccess: (_data: unknown, variables: LoginFormData) => {
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
      triggerShake();
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  return (
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
        <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className={`space-y-5 ${loginShake ? "shake" : ""}`}>
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
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2.5 cursor-pointer group"
              data-testid="toggle-remember-me"
            >
              <div className={`relative w-10 h-[22px] rounded-full transition-all duration-300 ${rememberMe ? "bg-primary shadow-md shadow-primary/30" : "bg-muted border border-border/50"}`}>
                <div className={`absolute top-[3px] w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${rememberMe ? "left-[22px] bg-white" : "left-[3px] bg-muted-foreground/40"}`} />
              </div>
              <span className={`text-sm transition-colors duration-200 ${rememberMe ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}>
                {t("auth.rememberMe")}
              </span>
            </button>
            <button type="button" onClick={onForgotPassword} className="text-primary/80 text-sm font-medium hover:text-primary transition-colors" data-testid="link-forgot-password">
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
  );
}
