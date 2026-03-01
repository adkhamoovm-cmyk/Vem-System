import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Mail, Gift, CheckCircle, Clock, ArrowLeft, Sparkles, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import type { User } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

export default function PromoPage() {
  const { toast } = useToast();
  const { t, translateServerMessage } = useI18n();
  const [code, setCode] = useState("");
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string; amount?: string } | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ["/api/promo/history"],
  });

  const useMutation_ = useMutation({
    mutationFn: async (promoCode: string) => {
      const res = await apiRequest("POST", "/api/promo/use", { code: promoCode });
      return res.json();
    },
    onSuccess: (data: any) => {
      setLastResult({ success: true, message: translateServerMessage(data.message), amount: data.amount });
      setCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/promo/history"] });
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
    },
    onError: (error: any) => {
      setLastResult({ success: false, message: translateServerMessage(error.message) });
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!code.trim()) return;
    setLastResult(null);
    useMutation_.mutate(code.trim());
  };

  return (
    <div className="p-4 space-y-5">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-5 shadow-xl shadow-primary/20">
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
          </div>
          <div className="relative">
            <Link href="/dashboard">
              <button className="text-white/60 hover:text-white transition-colors mb-3" data-testid="button-back-promo">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">{t("promo.enterCode")}</h2>
                <p className="text-white/60 text-xs">{t("promo.codeDescription")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={t("promo.placeholder")}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 text-center font-mono tracking-widest text-lg uppercase"
              data-testid="input-promo-code"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!code.trim() || useMutation_.isPending}
            className="w-full bg-gradient-to-r from-[#EF4444] to-[#F97316] text-white font-semibold rounded-xl h-12 disabled:opacity-50"
            data-testid="button-use-promo"
          >
            {useMutation_.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("promo.checking")}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                {t("promo.activate")}
              </div>
            )}
          </Button>

          {lastResult && (
            <div className={`rounded-xl p-3 flex items-center gap-2 ${
              lastResult.success
                ? "bg-emerald-500/10 border border-emerald-500/20"
                : "bg-red-500/10 border border-red-500/20"
            }`}>
              {lastResult.success ? (
                <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <Mail className="w-5 h-5 text-red-500 shrink-0" />
              )}
              <p className={`text-sm font-medium ${lastResult.success ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {lastResult.message}
              </p>
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#EF4444]" />
              <h3 className="text-foreground font-bold text-sm">{t("promo.usedCodes")}</h3>
            </div>
            <div className="divide-y divide-border">
              {history.map((item: any, i: number) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between" data-testid={`promo-history-${i}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-foreground font-mono font-semibold text-sm">{item.code}</p>
                      <p className="text-muted-foreground text-[10px]">
                        {item.usedAt ? new Date(item.usedAt).toLocaleDateString("uz-UZ") : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">+{Number(item.amount).toFixed(2)} USDT</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl p-4 border border-border">
          <h3 className="text-foreground font-bold text-sm mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            {t("promo.howItWorks")}
          </h3>
          <div className="space-y-2">
            {[
              t("promo.step1"),
              t("promo.step2"),
              t("promo.step3"),
              t("promo.step4"),
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#EF4444] font-bold text-xs mt-0.5">{i + 1}.</span>
                <p className="text-muted-foreground text-xs">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
