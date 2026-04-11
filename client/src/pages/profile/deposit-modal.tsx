import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Globe, ChevronRight, ChevronDown, Wallet, CreditCard,
  ArrowDownCircle, Upload, CheckCircle, Clock, X, Building,
  ScrollText, Copy, History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User, DepositSetting } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { copyToClipboard } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { UZS_RATE, formatUZS } from "@/lib/utils";

export function DepositModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const { toast } = useToast();
  const { t, locale, translateServerMessage } = useI18n();
  const [, setLocation] = useLocation();
  const [paymentType, setPaymentType] = useState<"crypto" | "local" | null>(null);
  const [cryptoNetwork, setCryptoNetwork] = useState<"BEP20" | null>(null);
  const [amount, setAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: depositRequisites = [] } = useQuery<DepositSetting[]>({
    queryKey: ["/api/deposit-settings/active"],
    enabled: open,
  });

  const { data: platformSettings } = useQuery<{ uzsEnabled: boolean }>({
    queryKey: ["/api/platform-settings"],
  });

  const uzsEnabled = platformSettings?.uzsEnabled ?? false;

  const bankRequisites = depositRequisites.filter(r => r.type === "bank");
  const usdtRequisites = depositRequisites.filter(r => r.type === "usdt");

  const handleCopy = async (text: string, field: string) => {
    try {
      await copyToClipboard(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const depositMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("currency", paymentType === "crypto" ? "USDT" : "UZS");
      formData.append("paymentType", paymentType!);
      if (receiptFile) formData.append("receipt", receiptFile);
      const res = await fetch("/api/deposit", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance-history"] });
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const handleClose = () => {
    onClose();
    setSubmitted(false);
    setPaymentType(null);
    setCryptoNetwork(null);
    setAmount("");
    setReceiptFile(null);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto" aria-describedby="deposit-desc">
        {submitted ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-foreground">{t("profile.depositSuccessTitle")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("profile.depositSuccessMsg")}</p>
            </div>
            <div className="w-full rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-600 dark:text-amber-400 text-left leading-relaxed">
                {t("profile.depositReviewTime")}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                data-testid="button-deposit-success-close"
              >
                {t("common.close")}
              </Button>
              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => { handleClose(); setLocation("/profile?tab=history"); }}
                data-testid="button-deposit-success-history"
              >
                <History className="w-4 h-4 mr-1.5" />
                {t("profile.viewFinanceHistory")}
              </Button>
            </div>
          </div>
        ) : (
        <>
        <div className="bg-gradient-to-r from-[#4ADE80]/20 to-[#22C55E]/10 px-5 py-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2.5 text-base">
              <div className="w-9 h-9 rounded-xl bg-[#4ADE80]/20 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              </div>
              {t("profile.depositMake")}
            </DialogTitle>
            <p id="deposit-desc" className="text-muted-foreground text-xs mt-1 ml-[46px]">{t("profile.depositDesc")}</p>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5">
          {!paymentType ? (
            <div className="space-y-3 pt-4">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{t("profile.selectPaymentType")}</p>
              <button
                onClick={() => { setPaymentType("crypto"); setCryptoNetwork("BEP20"); }}
                className="w-full bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-colors flex items-center gap-3 text-left group"
                data-testid="button-deposit-crypto"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-semibold text-sm">{t("profile.cryptoUsdt")}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">via BSC (BEP20)</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
              {uzsEnabled && (
              <button
                onClick={() => setPaymentType("local")}
                className="w-full bg-card rounded-xl p-4 border border-border hover:border-[#4ADE80]/50 transition-colors flex items-center gap-3 text-left group"
                data-testid="button-deposit-local"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6]/20 to-[#3B82F6]/5 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-semibold text-sm">{t("profile.bankCardUzs")}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{t("profile.uzcardHumo")}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-500 dark:text-emerald-400 transition-colors" />
              </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <button onClick={() => { setPaymentType(null); setCryptoNetwork(null); }} className="text-muted-foreground text-xs flex items-center gap-1.5 hover:text-foreground transition-colors">
                <ChevronDown className="w-3.5 h-3.5 rotate-90" /> {t("profile.back")}
              </button>

              {paymentType === "crypto" && cryptoNetwork && (() => {
                const filteredReqs = usdtRequisites.filter(r => (r.networkType || "BEP20") === cryptoNetwork);
                return filteredReqs.length > 0 ? (
                  <div className="space-y-2.5">
                    <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5" /> {t("profile.paymentRequisites")} · {cryptoNetwork}
                    </p>
                    <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/30">
                      <p className="text-amber-500 text-xs font-semibold">{t("profile.attentionTrc20Deposit")}</p>
                    </div>
                    {filteredReqs.map((req) => (
                      <div key={req.id} className="bg-background rounded-xl border border-primary/20 overflow-hidden">
                        <div className="bg-primary/5 px-3.5 py-2 border-b border-primary/10 flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-primary" />
                          <span className="text-primary text-xs font-semibold">{req.exchangeName || "USDT"}</span>
                          <span className="text-muted-foreground text-[10px] ml-auto">{req.networkType || "BEP20"}</span>
                        </div>
                        <div className="px-3.5 py-3 space-y-3">
                          {req.walletAddress && (
                            <div className="flex flex-col items-center gap-3">
                              <div className="bg-white p-3 rounded-xl shadow-sm" data-testid={`qr-code-${req.id}`}>
                                <QRCodeSVG
                                  value={req.walletAddress}
                                  size={160}
                                  bgColor="#ffffff"
                                  fgColor="#000000"
                                  level="H"
                                  includeMargin={false}
                                />
                              </div>
                              <p className="text-muted-foreground text-[10px]" data-testid={`text-qr-instruction-${req.id}`}>{t("profile.scanQrCode")}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">{t("profile.walletAddressLabel")}</p>
                            <div className="flex items-center gap-2">
                              <code className="text-emerald-500 dark:text-emerald-400 text-xs font-mono flex-1 break-all leading-relaxed">{req.walletAddress}</code>
                              <button
                                onClick={() => handleCopy(req.walletAddress || "", `wallet-${req.id}`)}
                                className="shrink-0 w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center hover:border-[#4ADE80] transition-colors"
                                data-testid={`button-copy-wallet-${req.id}`}
                              >
                                {copiedField === `wallet-${req.id}` ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-primary/5 rounded-xl p-5 border border-primary/20 text-center">
                    <p className="text-muted-foreground text-sm">{t("profile.noRequisites")} ({cryptoNetwork})</p>
                  </div>
                );
              })()}

              {paymentType === "local" && bankRequisites.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> {t("profile.paymentRequisites")}
                  </p>
                  {bankRequisites.map((req) => (
                    <div key={req.id} className="bg-background rounded-xl border border-[#3B82F6]/20 overflow-hidden">
                      <div className="bg-[#3B82F6]/5 px-3.5 py-2 border-b border-[#3B82F6]/10 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span className="text-[#3B82F6] text-xs font-semibold">{req.bankName}</span>
                      </div>
                      <div className="px-3.5 py-3 space-y-2.5">
                        <div>
                          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">{t("profile.cardHolderLabel")}</p>
                          <p className="text-foreground text-sm font-medium">{req.holderName}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">{t("profile.cardNumberLabel")}</p>
                          <div className="flex items-center gap-2">
                            <code className="text-foreground text-sm font-mono tracking-wider">{req.cardNumber}</code>
                            <button
                              onClick={() => handleCopy(req.cardNumber || "", `card-${req.id}`)}
                              className="shrink-0 w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center hover:border-[#3B82F6] transition-colors"
                              data-testid={`button-copy-card-${req.id}`}
                            >
                              {copiedField === `card-${req.id}` ? (
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {paymentType === "local" && bankRequisites.length === 0 && (
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 text-center">
                  <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-foreground text-sm font-semibold">{t("profile.requisitesNotAdded")}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{t("profile.requisitesWillAppear")}</p>
                </div>
              )}

              {(paymentType === "local" || (paymentType === "crypto" && cryptoNetwork)) && (
              <div className="bg-card rounded-xl p-3.5 border border-border">
                <p className="text-primary text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <ScrollText className="w-3.5 h-3.5" /> {t("profile.depositRules")}
                </p>
                <ul className="text-muted-foreground text-[11px] space-y-1.5 leading-relaxed">
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span> {paymentType === "crypto" ? t("profile.depositMinCrypto") : t("profile.depositMinLocal").replace("{amount}", (10 * UZS_RATE).toLocaleString())}</li>
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span> {t("profile.dontForgetReceipt")}</li>
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span> {t("profile.financeDeptCheck")}</li>
                  <li className="flex items-start gap-1.5"><span className="text-primary mt-0.5">•</span> {t("profile.afterApproval")}</li>
                </ul>
              </div>
              )}

              {(paymentType === "local" || (paymentType === "crypto" && cryptoNetwork)) && (
              <>
              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  {t("profile.amountLabel")} ({paymentType === "crypto" ? "USDT" : "UZS"})
                </label>
                <Input
                  type="number"
                  autoComplete="off"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={paymentType === "crypto" ? t("profile.depositMinCrypto") : t("profile.depositMinLocal").replace("{amount}", (10 * UZS_RATE).toLocaleString())}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 text-base focus:border-primary"
                  data-testid="input-deposit-amount"
                />
                {paymentType === "local" && amount && Number(amount) > 0 && (
                  <p className="text-emerald-500 dark:text-emerald-400 text-xs">≈ {(Number(amount) / UZS_RATE).toFixed(2)} USDT</p>
                )}
                {paymentType === "crypto" && amount && Number(amount) > 0 && uzsEnabled && (
                  <p className="text-emerald-500 dark:text-emerald-400 text-xs">≈ {formatUZS(Number(amount))} UZS</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("profile.receiptScreenshot")}</label>
                {receiptFile ? (
                  <div className="bg-background rounded-xl p-3 border border-[#4ADE80]/30 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#4ADE80]/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <span className="text-emerald-500 dark:text-emerald-400 text-xs flex-1 truncate font-medium">{receiptFile.name}</span>
                    <button onClick={() => setReceiptFile(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full bg-background rounded-xl p-5 border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center gap-2"
                    data-testid="button-upload-receipt"
                  >
                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-muted-foreground text-xs">{t("profile.clickToUpload")}</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  data-testid="input-receipt-file"
                />
              </div>

              <Button
                onClick={() => depositMutation.mutate()}
                disabled={!amount || Number(amount) <= 0 || !receiptFile || depositMutation.isPending}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-primary-foreground font-bold no-default-hover-elevate no-default-active-elevate rounded-xl h-12 text-sm disabled:opacity-40 shadow-lg shadow-emerald-500/10"
                data-testid="button-submit-deposit"
              >
                {depositMutation.isPending ? t("profile.sending") : t("profile.submitDepositRequest")}
              </Button>
              </>
              )}
            </div>
          )}
        </div>
        </>
        )}
      </DialogContent>
    </Dialog>
  );
}
