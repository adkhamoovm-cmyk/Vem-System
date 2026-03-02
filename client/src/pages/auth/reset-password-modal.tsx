import { useState, useEffect } from "react";
import {
  Phone, Lock, Eye, EyeOff, ChevronDown,
  KeyRound, ArrowLeft, Shield, ArrowRight, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Locale } from "@/lib/i18n";
export interface CountryCode {
  code: string;
  country: string;
  flag: string;
}

interface ResetPasswordModalProps {
  countryCodes: CountryCode[];
  locale: Locale;
  t: (key: string, params?: Record<string, string | number>) => string;
  translateServerMessage: (msg: string) => string;
  onClose: () => void;
}

export function ResetPasswordModal({ countryCodes, locale, t, translateServerMessage, onClose }: ResetPasswordModalProps) {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [stepDir, setStepDir] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPass, setNewPass] = useState("");
  const [verifyType, setVerifyType] = useState<"card" | "crypto" | "referrer" | "">("");
  const [verifyHint, setVerifyHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCountryList, setShowCountryList] = useState(false);
  const [country, setCountry] = useState(countryCodes[0]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const goToStep = (s: number, dir: "forward" | "back" = "forward") => {
    setStepDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(s);
      setAnimating(false);
    }, 150);
  };

  const handleStep1 = async () => {
    if (!phone || phone.length < 5) return;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-step1", { phone: country.code + phone });
      const data = await res.json();
      if (data.success) goToStep(2, "forward");
    } catch (e: unknown) { toast({ title: t("common.error"), description: translateServerMessage(e instanceof Error ? e.message : "Error"), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleStep2 = async () => {
    if (pin.length !== 6) return;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-step2", { fundPassword: pin });
      const data = await res.json();
      if (data.success) { setVerifyType(data.verifyType); setVerifyHint(data.verifyHint || ""); goToStep(3, "forward"); }
    } catch (e: unknown) { toast({ title: t("common.error"), description: translateServerMessage(e instanceof Error ? e.message : "Error"), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleStep3 = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-step3", { answer: answer.trim() });
      const data = await res.json();
      if (data.success) goToStep(4, "forward");
    } catch (e: unknown) { toast({ title: t("common.error"), description: translateServerMessage(e instanceof Error ? e.message : "Error"), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleStep4 = async () => {
    if (newPass.length < 6) return;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/reset-password", { newPassword: newPass });
      const data = await res.json();
      toast({ title: t("auth.resetSuccess"), description: translateServerMessage(data.message) });
      onClose();
    } catch (e: unknown) { toast({ title: t("common.error"), description: translateServerMessage(e instanceof Error ? e.message : "Error"), variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ease-out ${mounted ? "bg-black/60 backdrop-blur-sm" : "bg-black/0 backdrop-blur-0"}`}
      onClick={onClose}
    >
      <div
        className={`relative w-full sm:max-w-md transition-all duration-300 ease-out ${mounted ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -inset-[1px] rounded-t-[22px] sm:rounded-[22px] bg-gradient-to-b from-primary/30 via-border/20 to-border/60 pointer-events-none" />
        <div className="relative bg-card/95 backdrop-blur-xl rounded-t-[22px] sm:rounded-[22px] p-7 shadow-2xl shadow-black/40">

          <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-5 sm:hidden" />

          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={async () => {
                if (step > 1) {
                  if (step === 2) { try { await apiRequest("POST", "/api/auth/reset-cancel", {}); } catch {} }
                  goToStep(step - 1, "back");
                } else {
                  try { await apiRequest("POST", "/api/auth/reset-cancel", {}); } catch {}
                  onClose();
                }
              }}
              className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted active:scale-90 transition-all duration-200"
              data-testid="button-back-reset"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{t("auth.resetPassword")}</h2>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-300 ${step === 4 ? "text-emerald-500 bg-emerald-500/10" : "text-primary bg-primary/10"}`}>{step}/4</span>
          </div>

          <div className="flex gap-1.5 mb-6">
            {[1,2,3,4].map(s => (
              <div key={s} className="h-1.5 flex-1 rounded-full overflow-hidden bg-muted/60">
                <div className={`h-full rounded-full transition-all duration-500 ease-out ${s < step ? "w-full bg-primary" : s === step ? "w-full bg-gradient-to-r from-primary to-blue-500 animate-pulse" : "w-0"}`} />
              </div>
            ))}
          </div>

          <div className={`transition-all duration-200 ease-out ${animating ? (stepDir === "forward" ? "opacity-0 -translate-x-4" : "opacity-0 translate-x-4") : "opacity-100 translate-x-0"}`}>

          <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
            {step === 1 && t("auth.resetStep1")}
            {step === 2 && t("auth.resetStep2")}
            {step === 3 && t("auth.resetStep3")}
            {step === 4 && t("auth.resetStep4")}
          </p>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider block mb-2">{t("auth.phone")}</label>
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCountryList(!showCountryList)}
                      className="flex items-center gap-1.5 h-12 px-3.5 bg-muted/50 border border-border/50 rounded-xl text-sm font-medium text-foreground whitespace-nowrap hover:border-primary/40 transition-all"
                      data-testid="button-reset-country-code"
                    >
                      <span className="text-lg">{country.flag}</span>
                      <span className="text-sm font-semibold">{country.code}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${showCountryList ? "rotate-180" : ""}`} />
                    </button>
                    {showCountryList && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowCountryList(false)} />
                        <div className="absolute top-full left-0 mt-2 w-72 max-h-64 overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 py-1">
                          {countryCodes.map((c) => (
                            <button key={c.country + c.code} type="button" onClick={() => { setCountry(c); setShowCountryList(false); }} className={`flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-primary/5 transition-colors ${country.country === c.country ? "bg-primary/10 text-primary" : ""}`}>
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
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="" autoComplete="tel" className="pl-11 h-12 bg-muted/50 border-border/50 text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl" data-testid="input-reset-phone" />
                  </div>
                </div>
              </div>
              <Button onClick={handleStep1} className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all hover:shadow-primary/40" disabled={loading || phone.length < 5} data-testid="button-reset-next-1">
                {loading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("auth.checking")}</div> : <span className="flex items-center gap-2">{t("auth.next")} <ArrowRight className="w-4 h-4" /></span>}
              </Button>
            </div>
          )}

          {step === 2 && (
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
                    <Input key={i} type="password" inputMode="numeric" maxLength={1} value={pin[i] || ""} className="w-12 h-14 text-center text-lg font-bold bg-muted/50 border-border/50 text-foreground rounded-xl focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all duration-200" data-testid={`input-reset-pin-${i}`}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 1) {
                          const newPin = pin.split(""); newPin[i] = val; setPin(newPin.join("").slice(0, 6));
                          if (val && i < 5) { const next = e.target.parentElement?.parentElement?.querySelector(`[data-testid="input-reset-pin-${i+1}"]`) as HTMLInputElement; next?.focus(); }
                        }
                      }}
                      onKeyDown={e => { if (e.key === "Backspace" && !pin[i] && i > 0) { const prev = (e.target as HTMLElement).parentElement?.parentElement?.querySelector(`[data-testid="input-reset-pin-${i-1}"]`) as HTMLInputElement; prev?.focus(); } }}
                      onPaste={e => { e.preventDefault(); const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); setPin(paste); }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleStep2} className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all hover:shadow-primary/40" disabled={loading || pin.length !== 6} data-testid="button-reset-next-2">
                {loading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("auth.checking")}</div> : <span className="flex items-center gap-2">{t("auth.next")} <ArrowRight className="w-4 h-4" /></span>}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {verifyType === "card" && t("auth.verifyCardLast6")}
                    {verifyType === "crypto" && t("auth.verifyCryptoFull")}
                    {verifyType === "referrer" && (verifyHint ? t("auth.verifyReferrerPhone") : t("auth.verifyRegDate"))}
                  </p>
                </div>
              </div>
              {verifyHint && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  {verifyType === "card" && t("auth.verifyCardHint", { hint: verifyHint })}
                  {verifyType === "crypto" && t("auth.verifyCryptoHint", { hint: verifyHint })}
                  {verifyType === "referrer" && t("auth.verifyReferrerHint", { hint: verifyHint })}
                </p>
              )}
              <Input value={answer} onChange={e => setAnswer(e.target.value)} placeholder={verifyType === "card" ? "XXXXXX" : verifyType === "crypto" ? "T..." : verifyType === "referrer" && verifyHint ? "+998..." : "2026-01-15"} className="h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl text-center tracking-wider font-mono" data-testid="input-reset-verify" />
              <Button onClick={handleStep3} className="w-full bg-gradient-to-r from-primary via-blue-500 to-blue-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-primary/25 text-[15px] active:scale-[0.98] transition-all hover:shadow-primary/40" disabled={loading || !answer.trim()} data-testid="button-reset-next-3">
                {loading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("auth.checking")}</div> : <span className="flex items-center gap-2">{t("auth.next")} <ArrowRight className="w-4 h-4" /></span>}
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <div>
                <label className="text-foreground/70 text-xs font-semibold uppercase tracking-wider block mb-2">{t("auth.newPassword")}</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input value={newPass} onChange={e => setNewPass(e.target.value)} type={showPassword ? "text" : "password"} placeholder={t("auth.enterNewPassword")} className="pl-11 pr-11 h-12 bg-muted/50 border-border/50 text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15 rounded-xl" data-testid="input-reset-new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-toggle-reset-password">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-muted-foreground/60 text-[11px] mt-1.5 pl-1">{t("auth.minChars")}</p>
              </div>
              <Button onClick={handleStep4} className="w-full bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white font-semibold h-[52px] rounded-xl shadow-xl shadow-emerald-500/25 text-[15px] active:scale-[0.98] transition-all hover:shadow-emerald-500/40" disabled={loading || newPass.length < 6} data-testid="button-reset-password">
                {loading ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t("auth.resetting")}</div> : <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t("auth.resetPassword")}</span>}
              </Button>
            </div>
          )}

          </div>

          <div className="mt-5 text-center">
            <button onClick={onClose} className="text-muted-foreground text-sm hover:text-foreground transition-colors" data-testid="link-back-to-login">
              {t("auth.backToLogin")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
