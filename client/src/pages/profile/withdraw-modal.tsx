import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Globe, ChevronRight, ChevronDown, Wallet, CreditCard,
  ArrowUpCircle, CheckCircle, Clock, Lock, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User, PaymentMethod } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { formatUZS } from "@/lib/utils";
import { PinInput } from "@/components/pin-input";

export function WithdrawModal({ open, onClose, user, paymentMethods }: { open: boolean; onClose: () => void; user: User; paymentMethods: PaymentMethod[] }) {
  const { toast } = useToast();
  const { t, locale, translateServerMessage } = useI18n();
  const [, setLocation] = useLocation();
  const [withdrawType, setWithdrawType] = useState<"card" | "crypto" | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [amount, setAmount] = useState("");
  const [fundPassword, setFundPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data: platformSettings } = useQuery<{
    withdrawalCommissionPercent: number;
    minWithdrawalUsdt: number;
    minWithdrawalBank: number;
    withdrawalStartHour: number;
    withdrawalEndHour: number;
    maxDailyWithdrawals: number;
    withdrawalEnabled: boolean;
  }>({ queryKey: ["/api/platform-settings"] });

  const commissionPercent = platformSettings?.withdrawalCommissionPercent ?? 10;
  const minWithdrawalUsdt = platformSettings?.minWithdrawalUsdt ?? 3;
  const minWithdrawalBank = platformSettings?.minWithdrawalBank ?? 2;
  const withdrawalStartHour = platformSettings?.withdrawalStartHour ?? 11;
  const withdrawalEndHour = platformSettings?.withdrawalEndHour ?? 17;
  const withdrawalEnabled = platformSettings?.withdrawalEnabled !== false;

  const balance = Number(user.balance);
  const numAmount = Number(amount) || 0;
  const commission = numAmount * (commissionPercent / 100);
  const netAmount = numAmount - commission;

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const isSundayNow = day === 0;
  const isWithdrawTime = day >= 1 && day <= 6 && hour >= withdrawalStartHour && hour < withdrawalEndHour;

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/withdraw", {
        paymentMethodId: selectedMethodId,
        amount: amount,
        fundPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance-history"] });
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const handleWithdrawClose = () => {
    onClose();
    setSubmitted(false);
    setAmount("");
    setFundPassword("");
    setSelectedMethodId("");
    setWithdrawType(null);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleWithdrawClose}>
      <DialogContent className="bg-card border-border max-w-md rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto" aria-describedby="withdraw-desc">
        {submitted ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">{t("profile.withdrawSuccessTitle")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("profile.withdrawSuccessMsg")}</p>
            </div>
            <div className="w-full rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-xs text-emerald-600 dark:text-emerald-400 text-left leading-relaxed">
                {t("profile.withdrawProcessingInfo")}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleWithdrawClose}
                data-testid="button-withdraw-success-close"
              >
                {t("common.close")}
              </Button>
              <Button
                className="flex-1"
                onClick={() => { handleWithdrawClose(); setLocation("/profile?tab=history"); }}
                data-testid="button-withdraw-success-history"
              >
                <History className="w-4 h-4 mr-1.5" />
                {t("profile.viewFinanceHistory")}
              </Button>
            </div>
          </div>
        ) : (
        <>
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 px-5 py-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2.5 text-base">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-primary" />
              </div>
              {t("profile.withdrawTitle")}
            </DialogTitle>
            <p id="withdraw-desc" className="text-muted-foreground text-xs mt-1 ml-[46px]">{t("profile.withdrawFromAccount")}</p>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-4 pt-4">
          {!withdrawalEnabled && (
            <div className="bg-red-500/10 rounded-xl p-3.5 border border-red-500/30 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-red-500 text-xs font-semibold">
                  {t("profile.withdrawSuspended")}
                </p>
                <p className="text-red-400/70 text-[11px] mt-0.5">
                  {t("profile.withdrawSuspendedSub")}
                </p>
              </div>
            </div>
          )}
          {isSundayNow && (
            <div className="bg-primary/5 rounded-xl p-3.5 border border-primary/20 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-primary text-xs font-semibold">{t("profile.sundayRestDay")}</p>
                <p className="text-primary/60 text-[11px] mt-0.5">{t("profile.sundayWithdrawNote")}</p>
              </div>
            </div>
          )}
          {!isSundayNow && !isWithdrawTime && (
            <div className="bg-primary/5 rounded-xl p-3.5 border border-primary/20 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-primary text-xs font-semibold">{t("profile.notWithdrawTime")}</p>
                <p className="text-primary/60 text-[11px] mt-0.5">{t("profile.tryAgainTime")}</p>
              </div>
            </div>
          )}

          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="bg-[#4ADE80]/5 px-3.5 py-2.5 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs">{t("profile.availableBalance")}</span>
                <span className="text-emerald-500 dark:text-emerald-400 text-sm font-bold">{balance.toFixed(2)} USDT</span>
              </div>
              <p className="text-muted-foreground text-[10px] mt-0.5">≈ {formatUZS(balance)} UZS</p>
            </div>
            <div className="px-3.5 py-2.5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-[11px]">{t("profile.minWithdrawAmount")}</span>
                <span className="text-muted-foreground text-[11px] font-medium">
                  {withdrawType === "crypto" ? minWithdrawalUsdt.toFixed(2) : minWithdrawalBank.toFixed(2)} USDT
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-[11px]">{t("profile.commissionLabel")}</span>
                <span className="text-primary text-[11px] font-medium">{commissionPercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-[11px]">{t("profile.withdrawTime")}</span>
                <span className="text-muted-foreground text-[11px] font-medium">{t("profile.workingHours")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-[11px]">{t("profile.dailyLimit")}</span>
                <span className="text-muted-foreground text-[11px] font-medium">{t("profile.dailyLimitOnce")}</span>
              </div>
            </div>
          </div>

          {!withdrawType ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("profile.selectWithdrawType")}</p>
              <button
                onClick={() => setWithdrawType("card")}
                className="w-full bg-card rounded-xl p-4 border border-border hover:border-[#3B82F6]/50 transition-colors flex items-center gap-3 text-left group"
                data-testid="button-withdraw-card"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6]/20 to-[#3B82F6]/5 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-semibold text-sm">{t("profile.bankCardUzs")}</p>
                  <p className="text-muted-foreground text-[10px] mt-0.5">{t("profile.minWithdrawalLabel", { amount: String(minWithdrawalBank) })}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-[#3B82F6] transition-colors" />
              </button>
              <button
                onClick={() => setWithdrawType("crypto")}
                className="w-full bg-card rounded-xl p-4 border border-border hover:border-yellow-500/50 transition-colors flex items-center gap-3 text-left group"
                data-testid="button-withdraw-crypto"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-semibold text-sm">BSC (BEP20)</p>
                  <p className="text-muted-foreground text-[10px] mt-0.5">{t("profile.minWithdrawalLabel", { amount: String(minWithdrawalUsdt) })}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
              </button>
            </div>
          ) : (() => {
            const filteredMethods = paymentMethods.filter(m => withdrawType === "card" ? m.type === "bank" : m.type === "usdt");
            const minAmount = withdrawType === "crypto" ? minWithdrawalUsdt : minWithdrawalBank;
            return (
            <>
              <button onClick={() => { setWithdrawType(null); setSelectedMethodId(""); setAmount(""); setFundPassword(""); }} className="text-muted-foreground text-xs flex items-center gap-1.5 hover:text-foreground transition-colors">
                <ChevronDown className="w-3.5 h-3.5 rotate-90" /> {t("profile.back")}
              </button>

              {withdrawType === "crypto" && (
                <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/30">
                  <p className="text-amber-500 text-xs font-semibold">
                    {t("profile.attentionBep20Withdrawal")}
                  </p>
                </div>
              )}

              {filteredMethods.length === 0 ? (
                <div className="bg-primary/5 rounded-xl p-5 border border-primary/20 text-center">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-foreground text-sm font-semibold">{t("profile.addPaymentFirst")}</p>
                  <p className="text-muted-foreground text-xs mt-1">{t("profile.addPaymentFirstDesc")}</p>
                </div>
              ) : (
              <>
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("profile.paymentMethod")}</label>
                <div className="space-y-2">
                  {filteredMethods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethodId(m.id)}
                      className={`w-full bg-background rounded-xl p-3.5 border text-left flex items-center gap-3 transition-colors ${
                        selectedMethodId === m.id ? "border-primary bg-primary/5" : "border-border hover:border-border"
                      }`}
                      data-testid={`button-method-${m.id}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        m.type === "bank" ? "bg-[#3B82F6]/15" : "bg-yellow-500/15"
                      }`}>
                        {m.type === "bank" ? (
                          <CreditCard className="w-4 h-4 text-[#3B82F6]" />
                        ) : (
                          <Wallet className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-xs font-medium">
                          {m.type === "bank" ? `${m.bankName} •••• ${m.cardNumber?.slice(-4)}` : `${m.exchangeName} • BEP20`}
                        </p>
                        <p className="text-muted-foreground text-[10px] truncate mt-0.5">
                          {m.type === "bank" ? m.holderName : m.walletAddress}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMethodId === m.id ? "border-primary bg-primary" : "border-border"
                      }`}>
                        {selectedMethodId === m.id && <CheckCircle className="w-3 h-3 text-foreground" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("profile.amountUsdt")}</label>
                <Input
                  type="number"
                  autoComplete="off"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t("profile.withdrawMinPlaceholder", { amount: String(minAmount) })}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 text-base focus:border-primary"
                  data-testid="input-withdraw-amount"
                />
                {numAmount >= minAmount && (
                  <div className="bg-background rounded-xl p-3 border border-border space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">{t("profile.withdrawAmount")}</span>
                      <span className="text-foreground text-[11px] font-medium">{numAmount.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">{t("profile.commissionPercent")} ({commissionPercent}%)</span>
                      <span className="text-primary text-[11px] font-medium">-{commission.toFixed(2)} USDT</span>
                    </div>
                    <div className="border-t border-border pt-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-xs font-semibold">{t("profile.youReceive")}</span>
                        <div className="text-right">
                          <span className="text-emerald-500 dark:text-emerald-400 text-sm font-bold">{netAmount.toFixed(2)} USDT</span>
                          <p className="text-muted-foreground text-[10px]">≈ {formatUZS(netAmount)} UZS</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <PinInput
                value={fundPassword}
                onChange={setFundPassword}
                label={t("profile.fundPassword")}
                variant="withdraw"
                testId="input-withdraw-fund-password"
              />

              <Button
                onClick={() => withdrawMutation.mutate()}
                disabled={!withdrawalEnabled || !selectedMethodId || numAmount < minAmount || numAmount > balance || fundPassword.length !== 6 || !isWithdrawTime || withdrawMutation.isPending}
                className="w-full bg-primary text-primary-foreground font-bold no-default-hover-elevate no-default-active-elevate rounded-xl h-12 text-sm disabled:opacity-40 shadow-lg shadow-primary/10"
                data-testid="button-submit-withdraw"
              >
                {withdrawMutation.isPending ? t("profile.sending") : t("profile.submitWithdrawRequest")}
              </Button>
              </>
              )}
            </>
            );
          })()}
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
