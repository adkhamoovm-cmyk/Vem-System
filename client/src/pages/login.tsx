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
import { Phone, Lock, Eye, EyeOff, ChevronDown, Sun, Moon } from "lucide-react";
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

  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <LanguageSwitcher />
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-foreground hover:bg-accent transition-all duration-300 shadow-sm"
          data-testid="button-theme-toggle-login"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 transition-transform duration-300 rotate-0" /> : <Moon className="w-5 h-5 transition-transform duration-300 rotate-0" />}
        </button>
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={vemLogo} alt="VEM" className="pro-logo h-16 mx-auto" />
          <p className="text-muted-foreground mt-1 text-sm">{t("auth.welcome")}</p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-5 bg-primary rounded-full" />
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
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-white font-semibold no-default-hover-elevate no-default-active-elevate h-12 rounded-xl shadow-lg text-base"
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

        <p className="text-center text-muted-foreground text-[10px] mt-4">
          {t("common.copyright")}
        </p>
      </div>
      <SupportWidget />
    </div>
  );
}
