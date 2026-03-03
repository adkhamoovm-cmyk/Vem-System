import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export type Tab = "dashboard" | "users" | "deposits" | "withdrawals" | "settings" | "referrals" | "multi" | "stajyor" | "vip-manage" | "promo" | "broadcasts";

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const styles: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-500 border-amber-500/20",
    approved: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
    rejected: "bg-red-500/15 text-red-500 border-red-500/20",
    completed: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  };
  const labels: Record<string, string> = { pending: t("common.pending"), approved: t("common.approved"), rejected: t("common.rejected"), completed: t("common.completed") };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${styles[status] || "bg-muted text-muted-foreground border-border"}`}>
      {labels[status] || status}
    </span>
  );
}

export function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-card rounded-lg p-2.5 border border-border">
      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium mt-0.5 truncate ${!color ? "text-foreground" : ""}`} style={color ? { color } : undefined}>{value}</p>
    </div>
  );
}

export function AdminPinGate({ onVerified }: { onVerified: () => void }) {
  const { t, translateServerMessage } = useI18n();
  const { toast } = useToast();
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const verifyMutation = useMutation({
    mutationFn: async (pinCode: string) => {
      const res = await apiRequest("POST", "/api/admin/verify-pin", { pin: pinCode });
      return res.json();
    },
    onSuccess: () => {
      onVerified();
    },
    onError: (err: Error) => {
      setError(translateServerMessage(err.message));
      setPin(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    },
  });

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.every(d => d !== "") && index === 5) {
      verifyMutation.mutate(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newPin = pasted.split("");
      setPin(newPin);
      inputRefs.current[5]?.focus();
      verifyMutation.mutate(pasted);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white rounded-full" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-2xl">
            <KeyRound className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">{t("admin.pinTitle")}</h1>
          <p className="text-white/50 text-sm mt-2">{t("admin.pinDesc")}</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 sm:p-6 border border-white/10 shadow-2xl">
          <div className="flex justify-center gap-2 sm:gap-3 mb-4">
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border-2 bg-white/5 text-white outline-none transition-all ${
                  error ? "border-red-500" : digit ? "border-primary shadow-sm shadow-primary/20" : "border-white/15"
                } focus:border-primary focus:shadow-sm focus:shadow-primary/20`}
                data-testid={`input-admin-pin-${i}`}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
              <p className="text-red-400 text-xs text-center" data-testid="text-pin-error">{error}</p>
            </div>
          )}

          <Button
            onClick={() => {
              const code = pin.join("");
              if (code.length === 6) verifyMutation.mutate(code);
            }}
            disabled={pin.some(d => d === "") || verifyMutation.isPending}
            className="w-full h-12 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg shadow-primary/20"
            data-testid="button-verify-pin"
          >
            {verifyMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>{t("admin.pinVerify")}</>
            )}
          </Button>
        </div>

        <div className="text-center mt-4">
          <a href="/dashboard" className="text-white/40 text-xs hover:text-white/70 transition-colors" data-testid="link-back-from-pin">
            {t("admin.backToSite")}
          </a>
        </div>
      </div>
    </div>
  );
}
