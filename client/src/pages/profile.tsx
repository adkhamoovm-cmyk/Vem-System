import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  User as UserIcon, Crown, Copy, LogOut, ChevronRight, ChevronDown,
  Wallet, ListChecks, Users, Camera, Shield, Lock,
  Phone, CreditCard, Headphones, ScrollText, Settings,
  ArrowDownCircle, ArrowUpCircle, Upload, CheckCircle, Clock, X, Building, Globe,
  History, TrendingUp, Banknote, Eye, EyeOff, Landmark,
  GraduationCap, Star, Gem, Flame, Trophy, Rocket, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User, PaymentMethod, DepositRequest, WithdrawalRequest, DepositSetting, BalanceHistory } from "@shared/schema";
import AppLayout from "@/components/app-layout";
import { useI18n } from "@/lib/i18n";

const UZS_RATE = 12100;

function formatUZS(usd: number): string {
  const uzs = usd * UZS_RATE;
  return uzs.toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
}

function DepositModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const { toast } = useToast();
  const { t, translateServerMessage } = useI18n();
  const [paymentType, setPaymentType] = useState<"crypto" | "local" | null>(null);
  const [amount, setAmount] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: depositRequisites = [] } = useQuery<DepositSetting[]>({
    queryKey: ["/api/deposit-settings/active"],
    enabled: open,
  });

  const bankRequisites = depositRequisites.filter(r => r.type === "bank");
  const usdtRequisites = depositRequisites.filter(r => r.type === "usdt");

  const copyToClipboard = (text: string, field: string) => {
    try {
      navigator.clipboard.writeText(text);
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
    onSuccess: (data: any) => {
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      onClose();
      setPaymentType(null);
      setAmount("");
      setReceiptFile(null);
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const handleClose = () => {
    onClose();
    setPaymentType(null);
    setAmount("");
    setReceiptFile(null);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-md rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto" aria-describedby="deposit-desc">
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
                onClick={() => setPaymentType("crypto")}
                className="w-full bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-colors flex items-center gap-3 text-left group"
                data-testid="button-deposit-crypto"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-foreground font-semibold text-sm">{t("profile.cryptoUsdt")}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{t("profile.trc20Network")}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
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
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <button onClick={() => setPaymentType(null)} className="text-muted-foreground text-xs flex items-center gap-1.5 hover:text-foreground transition-colors">
                <ChevronDown className="w-3.5 h-3.5 rotate-90" /> {t("profile.back")}
              </button>

              {paymentType === "crypto" && usdtRequisites.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> {t("profile.paymentRequisites")}
                  </p>
                  {usdtRequisites.map((req) => (
                    <div key={req.id} className="bg-background rounded-xl border border-primary/20 overflow-hidden">
                      <div className="bg-primary/5 px-3.5 py-2 border-b border-primary/10 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-primary" />
                        <span className="text-primary text-xs font-semibold">{req.exchangeName || "USDT"}</span>
                        <span className="text-muted-foreground text-[10px] ml-auto">{req.networkType || "TRC20"}</span>
                      </div>
                      <div className="px-3.5 py-3">
                        <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">{t("profile.walletAddressLabel")}</p>
                        <div className="flex items-center gap-2">
                          <code className="text-emerald-500 dark:text-emerald-400 text-xs font-mono flex-1 break-all leading-relaxed">{req.walletAddress}</code>
                          <button
                            onClick={() => copyToClipboard(req.walletAddress || "", `wallet-${req.id}`)}
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
                  ))}
                </div>
              )}

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
                              onClick={() => copyToClipboard(req.cardNumber || "", `card-${req.id}`)}
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

              {((paymentType === "crypto" && usdtRequisites.length === 0) || (paymentType === "local" && bankRequisites.length === 0)) && (
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 text-center">
                  <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-foreground text-sm font-semibold">{t("profile.requisitesNotAdded")}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{t("profile.requisitesWillAppear")}</p>
                </div>
              )}

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

              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  {t("profile.amountLabel")} ({paymentType === "crypto" ? "USDT" : "UZS"})
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={paymentType === "crypto" ? t("profile.depositMinCrypto") : t("profile.depositMinLocal").replace("{amount}", (10 * UZS_RATE).toLocaleString())}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 text-base focus:border-primary"
                  data-testid="input-deposit-amount"
                />
                {paymentType === "local" && amount && Number(amount) > 0 && (
                  <p className="text-emerald-500 dark:text-emerald-400 text-xs">≈ {(Number(amount) / UZS_RATE).toFixed(2)} USDT</p>
                )}
                {paymentType === "crypto" && amount && Number(amount) > 0 && (
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddPaymentMethodModal({ open, onClose, type }: { open: boolean; onClose: () => void; type: "bank" | "usdt" }) {
  const { toast } = useToast();
  const { t, translateServerMessage } = useI18n();
  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [exchangeName, setExchangeName] = useState("");
  const [fundPassword, setFundPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  const uzbekBanks = [
    "Uzcard", "Humo", "Kapitalbank", "Hamkorbank", "Ipoteka-bank",
    "Milliy bank", "Agrobank", "Asaka bank", "Xalq banki", "Davr bank",
    "Infinbank", "Orient Finans", "Trastbank", "Aloqa bank", "Turon bank",
    "Universalbank", "Ravnaq-bank", "Ziraat bank", "TBC bank", "Anor bank",
    "Uzum bank", "Apelsin", "Click", "Payme",
  ];
  const exchanges = ["Binance", "Bybit", "Bitget", "OKX", "Huobi", "KuCoin", "Gate.io", "MEXC", t("profile.otherExchange")];

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/payment-methods", {
        type,
        ...(type === "bank" ? { bankName, cardNumber, holderName } : { exchangeName, walletAddress }),
        fundPassword,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const resetForm = () => {
    setHolderName("");
    setBankName("");
    setCardNumber("");
    setWalletAddress("");
    setExchangeName("");
    setFundPassword("");
    setShowConfirm(false);
  };

  const isValid = type === "bank"
    ? holderName && bankName && cardNumber.length >= 16
    : walletAddress && exchangeName;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => { onClose(); resetForm(); }}>
      <DialogContent className="bg-card border-border max-w-md rounded-2xl" aria-describedby="payment-method-desc">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            {type === "bank" ? <CreditCard className="w-5 h-5 text-[#3B82F6]" /> : <Wallet className="w-5 h-5 text-primary" />}
            {type === "bank" ? t("profile.addBankCardTitle") : t("profile.addUsdtWalletTitle")}
          </DialogTitle>
          <p id="payment-method-desc" className="text-muted-foreground text-xs">
            {type === "bank" ? t("profile.addBankCardDesc") : t("profile.addUsdtWalletDesc")}
          </p>
        </DialogHeader>

        {!showConfirm ? (
          <div className="space-y-4 pt-2">
            {type === "usdt" && (
              <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                <p className="text-primary text-xs font-semibold">{t("profile.attentionTrc20")}</p>
              </div>
            )}

            {type === "bank" ? (
              <>
                <div>
                  <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("profile.fullName")}</label>
                  <Input
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder={t("profile.fullNamePlaceholder")}
                    className="mt-1.5 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11"
                    data-testid="input-holder-name"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("profile.bankName")}</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5 max-h-40 overflow-y-auto pr-1">
                    {uzbekBanks.map((bank) => (
                      <button
                        key={bank}
                        onClick={() => setBankName(bank)}
                        className={`text-xs py-2 px-2 rounded-lg border transition-colors ${
                          bankName === bank
                            ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]"
                            : "bg-card border-border text-muted-foreground"
                        }`}
                        data-testid={`button-bank-${bank}`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("profile.cardNumber")}</label>
                  <Input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    placeholder="8600 0000 0000 0000"
                    className="mt-1.5 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11 font-mono"
                    data-testid="input-card-number"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("profile.exchangeName")}</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {exchanges.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setExchangeName(ex)}
                        className={`text-xs py-2 px-3 rounded-lg border transition-colors ${
                          exchangeName === ex
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-card border-border text-muted-foreground"
                        }`}
                        data-testid={`button-exchange-${ex}`}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("profile.trc20WalletAddress")}</label>
                  <Input
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="T..."
                    className="mt-1.5 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11 font-mono text-xs"
                    data-testid="input-wallet-address"
                  />
                </div>
              </>
            )}

            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!isValid}
              className="w-full bg-primary text-primary-foreground font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 disabled:opacity-50"
              data-testid="button-confirm-method"
            >
              {t("profile.continue")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="bg-card rounded-xl p-3 border border-border space-y-2">
              <p className="text-primary text-xs font-semibold">{t("profile.confirmQuestion")}</p>
              {type === "bank" ? (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground text-xs">{t("profile.name")}:</span><span className="text-foreground text-xs">{holderName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground text-xs">{t("profile.bank")}:</span><span className="text-foreground text-xs">{bankName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground text-xs">{t("profile.card")}:</span><span className="text-foreground text-xs font-mono">{cardNumber.replace(/(.{4})/g, "$1 ").trim()}</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-muted-foreground text-xs">{t("profile.exchange")}:</span><span className="text-foreground text-xs">{exchangeName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground text-xs">{t("profile.wallet")}:</span><span className="text-foreground text-xs font-mono truncate max-w-[200px]">{walletAddress}</span></div>
                </>
              )}
              <div className="bg-primary/10 rounded-lg p-2 mt-2">
                <p className="text-primary text-[10px]">{t("profile.attentionSaved")}</p>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">{t("profile.fundPassword")}</label>
              <Input
                type="password"
                value={fundPassword}
                onChange={(e) => setFundPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={t("profile.sixDigitPin")}
                maxLength={6}
                className="mt-1.5 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11 text-center font-mono tracking-[0.5em]"
                data-testid="input-fund-password"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="ghost"
                className="flex-1 text-muted-foreground border border-border rounded-xl h-11"
              >
                {t("profile.back")}
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={fundPassword.length !== 6 || mutation.isPending}
                className="flex-1 bg-primary text-primary-foreground font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 disabled:opacity-50"
                data-testid="button-save-method"
              >
                {mutation.isPending ? t("profile.saving") : t("profile.save")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WithdrawModal({ open, onClose, user, paymentMethods }: { open: boolean; onClose: () => void; user: User; paymentMethods: PaymentMethod[] }) {
  const { toast } = useToast();
  const { t, translateServerMessage } = useI18n();
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [amount, setAmount] = useState("");
  const [fundPassword, setFundPassword] = useState("");

  const balance = Number(user.balance);
  const numAmount = Number(amount) || 0;
  const commission = numAmount * 0.10;
  const netAmount = numAmount - commission;

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const isSundayNow = day === 0;
  const isWithdrawTime = day >= 1 && day <= 6 && hour >= 11 && hour < 17;

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/withdraw", {
        paymentMethodId: selectedMethodId,
        amount: amount,
        fundPassword,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      onClose();
      setAmount("");
      setFundPassword("");
      setSelectedMethodId("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto" aria-describedby="withdraw-desc">
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
                <span className="text-muted-foreground text-[11px] font-medium">2.00 USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-[11px]">{t("profile.commissionLabel")}</span>
                <span className="text-primary text-[11px] font-medium">10%</span>
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

          {paymentMethods.length === 0 ? (
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
                  {paymentMethods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethodId(m.id)}
                      className={`w-full bg-background rounded-xl p-3.5 border text-left flex items-center gap-3 transition-colors ${
                        selectedMethodId === m.id ? "border-primary bg-primary/5" : "border-border hover:border-border"
                      }`}
                      data-testid={`button-method-${m.id}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        m.type === "bank" ? "bg-[#3B82F6]/15" : "bg-primary/15"
                      }`}>
                        {m.type === "bank" ? (
                          <CreditCard className="w-4 h-4 text-[#3B82F6]" />
                        ) : (
                          <Wallet className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-xs font-medium">
                          {m.type === "bank" ? `${m.bankName} •••• ${m.cardNumber?.slice(-4)}` : `${m.exchangeName} • TRC20`}
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
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t("profile.minWithdrawal")}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 text-base focus:border-primary"
                  data-testid="input-withdraw-amount"
                />
                {numAmount >= 2 && (
                  <div className="bg-background rounded-xl p-3 border border-border space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">{t("profile.withdrawAmount")}</span>
                      <span className="text-foreground text-[11px] font-medium">{numAmount.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-[11px]">{t("profile.commissionPercent")}</span>
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

              <div className="space-y-1.5">
                <label className="text-muted-foreground text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> {t("profile.fundPassword")}
                </label>
                <Input
                  type="password"
                  value={fundPassword}
                  onChange={(e) => setFundPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-12 text-center font-mono tracking-[0.5em] text-lg focus:border-primary"
                  data-testid="input-withdraw-fund-password"
                />
              </div>

              <Button
                onClick={() => withdrawMutation.mutate()}
                disabled={!selectedMethodId || numAmount < 2 || numAmount > balance || fundPassword.length !== 6 || !isWithdrawTime || withdrawMutation.isPending}
                className="w-full bg-primary text-primary-foreground font-bold no-default-hover-elevate no-default-active-elevate rounded-xl h-12 text-sm disabled:opacity-40 shadow-lg shadow-primary/10"
                data-testid="button-submit-withdraw"
              >
                {withdrawMutation.isPending ? t("profile.sending") : t("profile.submitWithdrawRequest")}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const { toast } = useToast();
  const { t, translateServerMessage } = useI18n();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSecretInfo, setShowSecretInfo] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showAddBankCard, setShowAddBankCard] = useState(false);
  const [showAddUsdtWallet, setShowAddUsdtWallet] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "deposit" | "withdrawal" | "earning" | "fund_invest" | "vip_purchase" | "admin_adjust" | "commission">("all");
  const [showFinanceHistory, setShowFinanceHistory] = useState(false);
  const [showFinanceService, setShowFinanceService] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showWalletAddress, setShowWalletAddress] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [showChangeFundPwd, setShowChangeFundPwd] = useState(false);
  const [currentFundPwd, setCurrentFundPwd] = useState("");
  const [newFundPwd, setNewFundPwd] = useState("");

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: referralStats } = useQuery<{
    level1: { count: number; commission: string };
    level2: { count: number; commission: string };
    level3: { count: number; commission: string };
  }>({
    queryKey: ["/api/referrals/stats"],
  });

  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: deposits = [] } = useQuery<DepositRequest[]>({
    queryKey: ["/api/deposits"],
  });

  const { data: withdrawals = [] } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawals"],
  });

  const { data: balHistory = [] } = useQuery<BalanceHistory[]>({
    queryKey: ["/api/balance-history"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/login";
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error(t("profile.imageUploadFailed"));
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: t("common.success") });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/profile/change-password", {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
      setShowChangePassword(false);
      setCurrentPwd("");
      setNewPwd("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const changeFundPwdMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/profile/change-fund-password", {
        currentFundPassword: currentFundPwd,
        newFundPassword: newFundPwd,
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
      setShowChangeFundPwd(false);
      setCurrentFundPwd("");
      setNewFundPwd("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const handleAvatarClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
  };

  const copyId = () => {
    if (user?.numericId) {
      navigator.clipboard.writeText(user.numericId);
      toast({ title: t("common.success") });
    }
  };

  const vipTierNames: Record<number, string> = { 0: "Stajyor", 1: "M1", 2: "M2", 3: "M3", 4: "M4", 5: "M5", 6: "M6", 7: "M7", 8: "M8", 9: "M9", 10: "M10" };

  const vipIconMap: Record<number, any> = {
    0: GraduationCap, 1: Star, 2: Star, 3: Star, 4: Flame,
    5: Gem, 6: Crown, 7: Trophy, 8: Rocket, 9: Zap, 10: Globe,
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  const totalReferrals = (referralStats?.level1?.count || 0) + (referralStats?.level2?.count || 0) + (referralStats?.level3?.count || 0);
  const displayName = `vem_${user.phone.replace(/[^0-9]/g, "").slice(-10)}`;
  const balance = Number(user.balance);
  const bankCard = paymentMethods.find(m => m.type === "bank");
  const usdtWallet = paymentMethods.find(m => m.type === "usdt");

  const statusColors: Record<string, string> = {
    pending: "#FFB300",
    approved: "#4ADE80",
    rejected: "hsl(var(--primary))",
    completed: "#4ADE80",
  };
  const statusLabels: Record<string, string> = {
    pending: t("common.pending"),
    approved: t("common.approved"),
    rejected: t("common.rejected"),
    completed: t("common.completed"),
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4 pb-24">
        <div className="flex items-center gap-4 pt-2">
          <div className="relative" onClick={handleAvatarClick} data-testid="button-avatar-upload">
            <div className="w-[72px] h-[72px] rounded-full border-2 border-primary overflow-hidden bg-card flex items-center justify-center cursor-pointer">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" data-testid="img-avatar" />
              ) : (
                <UserIcon className="w-9 h-9 text-muted-foreground" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-r from-primary to-primary rounded-full flex items-center justify-center border-2 border-background">
              <Camera className="w-3 h-3 text-foreground" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="input-avatar-file" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-foreground font-bold text-lg" data-testid="text-profile-name">{displayName}</h2>
              {(() => {
                const VipLevelIcon = vipIconMap[user.vipLevel] || Star;
                return (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary flex items-center gap-1">
                    {user.vipLevel >= 0 && <VipLevelIcon className="w-3 h-3" />}
                    {user.vipLevel < 0 ? t("profile.notEmployee") : (vipTierNames[user.vipLevel] || `M${user.vipLevel}`)}
                  </span>
                );
              })()}
            </div>
            <button onClick={copyId} className="flex items-center gap-1 mt-0.5 group" data-testid="button-copy-id">
              <span className="text-muted-foreground text-xs">ID: {user.numericId || "—"}</span>
              <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="text-center mb-3">
            <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{t("profile.totalBalance")}</p>
            <p className="text-foreground font-bold text-2xl mt-1" data-testid="text-balance">{balance.toFixed(2)} <span className="text-emerald-500 dark:text-emerald-400 text-sm">USDT</span></p>
            <p className="text-muted-foreground text-sm">{formatUZS(balance)} UZS</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setShowDeposit(true)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-primary-foreground font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11"
              data-testid="button-deposit"
            >
              <ArrowDownCircle className="w-4 h-4 mr-1.5" />
              {t("common.deposit")}
            </Button>
            <Button
              onClick={() => setShowWithdraw(true)}
              className="bg-primary text-primary-foreground font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11"
              data-testid="button-withdraw"
            >
              <ArrowUpCircle className="w-4 h-4 mr-1.5" />
              {t("common.withdrawal")}
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="text-center px-2">
              <p className="text-primary font-bold text-sm" data-testid="text-balance-deposit">{Number(user.totalDeposit || 0).toFixed(2)}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5">{t("profile.depositedUsdt")}</p>
            </div>
            <div className="text-center px-2">
              <p className="text-emerald-500 dark:text-emerald-400 font-bold text-sm" data-testid="text-balance-earnings">{Number(user.totalEarnings || 0).toFixed(2)}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5">{t("profile.earningsUsdt")}</p>
            </div>
            <div className="text-center px-2">
              <p className="text-foreground font-bold text-sm">{totalReferrals}</p>
              <p className="text-muted-foreground text-[10px] mt-0.5">{t("profile.referrals")}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <h3 className="text-foreground font-bold text-sm px-4 pt-4 pb-2">{t("profile.myServices")}</h3>
          <div className="divide-y divide-border">
            <div>
              <button onClick={() => setShowFinanceService(!showFinanceService)} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-finance-service">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
                    <Landmark className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                  <div>
                    <span className="text-foreground text-sm">{t("profile.financeService")}</span>
                    <p className="text-muted-foreground text-[10px]">{bankCard ? t("profile.cardLinked") : t("profile.cardNotLinked")} · {usdtWallet ? t("profile.walletLinked") : t("profile.walletNotLinked")}</p>
                  </div>
                </div>
                {showFinanceService ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
              {showFinanceService && (
                <div className="px-4 pb-4 space-y-3">
                  {bankCard ? (
                    <div className="bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] dark:from-[#1e3a5f] dark:to-[#0f2440] rounded-xl p-4 border border-[#93c5fd] dark:border-[#2a4a6f] relative overflow-hidden" data-testid="card-bank-linked">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#3B82F6]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#2563eb] dark:text-[#60A5FA]" />
                          <span className="text-[#2563eb] dark:text-[#60A5FA] text-xs font-semibold uppercase tracking-wider">{bankCard.bankName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">{t("common.active")}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[#1e3a5f] dark:text-white font-mono text-sm tracking-widest" data-testid="text-card-number">
                          {showCardNumber
                            ? bankCard.cardNumber
                            : `${bankCard.cardNumber?.slice(0, 4)} •••• •••• ${bankCard.cardNumber?.slice(-4)}`}
                        </p>
                        <button onClick={() => setShowCardNumber(!showCardNumber)} className="text-[#2563eb] dark:text-[#60A5FA] hover:text-foreground transition-colors" data-testid="button-toggle-card">
                          {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[#3b82f6] dark:text-[#8ab4f8] text-xs mt-2">{bankCard.holderName}</p>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddBankCard(true)} className="w-full bg-card border border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 hover:border-[#3B82F6] transition-colors" data-testid="button-add-bank-card">
                      <CreditCard className="w-4 h-4 text-[#3B82F6]" />
                      <span className="text-muted-foreground text-sm">{t("profile.linkBankCard")}</span>
                    </button>
                  )}
                  {usdtWallet ? (
                    <div className="bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] dark:from-[#1a2e1a] dark:to-[#0f1f0f] rounded-xl p-4 border border-[#86efac] dark:border-[#2a4a2a] relative overflow-hidden" data-testid="card-usdt-linked">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#4ADE80]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">{usdtWallet.exchangeName} · TRC20</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">{t("common.active")}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[#14532d] dark:text-white font-mono text-xs tracking-wider" data-testid="text-wallet-address">
                          {showWalletAddress
                            ? usdtWallet.walletAddress
                            : `${usdtWallet.walletAddress?.slice(0, 6)}••••••${usdtWallet.walletAddress?.slice(-6)}`}
                        </p>
                        <button onClick={() => setShowWalletAddress(!showWalletAddress)} className="text-emerald-600 dark:text-emerald-400 hover:text-foreground transition-colors" data-testid="button-toggle-wallet">
                          {showWalletAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddUsdtWallet(true)} className="w-full bg-card border border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 hover:border-[#4ADE80] transition-colors" data-testid="button-add-usdt-wallet">
                      <Wallet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <span className="text-muted-foreground text-sm">{t("profile.addWallet")}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <button onClick={() => setShowFinanceHistory(!showFinanceHistory)} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-finance-history">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#A78BFA]/20 flex items-center justify-center">
                    <History className="w-4 h-4 text-[#A78BFA]" />
                  </div>
                  <div>
                    <span className="text-foreground text-sm">{t("profile.financialHistory")}</span>
                    <p className="text-muted-foreground text-[10px]">{balHistory.length} {t("profile.operations")}</p>
                  </div>
                </div>
                {showFinanceHistory ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
              {showFinanceHistory && (
                <div className="pb-2">
                  <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
                    {([
                      { key: "all", label: t("profile.filterAll") },
                      { key: "earning", label: t("profile.filterEarning") },
                      { key: "deposit", label: t("profile.filterDeposit") },
                      { key: "withdrawal", label: t("profile.filterWithdrawal") },
                      { key: "vip_purchase", label: t("profile.filterVip") },
                      { key: "fund_invest", label: t("profile.filterFund") },
                      { key: "commission", label: t("profile.filterCommission") },
                      { key: "admin_adjust", label: t("profile.filterTech") },
                    ] as const).map(f => (
                      <button
                        key={f.key}
                        onClick={() => setHistoryFilter(f.key)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${historyFilter === f.key ? "bg-primary text-foreground" : "bg-muted text-muted-foreground hover:bg-muted"}`}
                        data-testid={`filter-history-${f.key}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="divide-y divide-border max-h-80 overflow-y-auto">
                    {balHistory.filter(h => historyFilter === "all" || h.type === historyFilter).length === 0 ? (
                      <div className="px-4 py-8 text-center text-muted-foreground text-xs">{t("profile.noOperations")}</div>
                    ) : (
                      balHistory.filter(h => historyFilter === "all" || h.type === historyFilter).map((h) => {
                        const isPositive = Number(h.amount) >= 0;
                        const typeIcons: Record<string, { icon: typeof TrendingUp; color: string }> = {
                          earning: { icon: TrendingUp, color: "#4ADE80" },
                          deposit: { icon: ArrowDownCircle, color: "#4ADE80" },
                          withdrawal: { icon: ArrowUpCircle, color: "hsl(var(--primary))" },
                          vip_purchase: { icon: Crown, color: "hsl(var(--yellow-500, 234 179 8))" },
                          fund_invest: { icon: Banknote, color: "#60A5FA" },
                          commission: { icon: Users, color: "#A78BFA" },
                          admin_adjust: { icon: Settings, color: "hsl(var(--muted-foreground))" },
                        };
                        const config = typeIcons[h.type] || { icon: ScrollText, color: "hsl(var(--muted-foreground))" };
                        const IconComp = config.icon;
                        return (
                          <div key={h.id} className="px-4 py-3 flex items-center justify-between" data-testid={`history-item-${h.id}`}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: config.color + "15" }}>
                                <IconComp className="w-3.5 h-3.5" style={{ color: config.color }} />
                              </div>
                              <div>
                                <p className="text-foreground text-xs font-medium">{(() => {
                                  const desc = h.description || "";
                                  const extractName = (d: string) => {
                                    const m = d.match(/^(\w+)\s/);
                                    return m ? m[1] : "VIP";
                                  };
                                  const typeMap: Record<string, () => string> = {
                                    earning: () => {
                                      if (desc.includes("Fond") || desc.includes("fond")) return t("vip.historyFundProfit");
                                      if (desc.includes("Promokod") || desc.includes("promokod")) return desc;
                                      return t("vip.historyEarning", { name: extractName(desc) || "VIP" });
                                    },
                                    deposit: () => {
                                      if (desc.includes("qaytarildi") || desc.includes("fond")) return t("vip.historyFundReturn");
                                      return t("vip.historyDeposit");
                                    },
                                    withdrawal: () => t("vip.historyWithdrawal", { commission: "10%" }),
                                    vip_purchase: () => {
                                      const name = extractName(desc);
                                      if (desc.includes("uzaytirildi")) return t("vip.historyVipExtend", { name });
                                      return t("vip.historyVipPurchase", { name });
                                    },
                                    fund_invest: () => t("vip.historyFundInvest"),
                                    commission: () => t("vip.historyCommission"),
                                    admin_adjust: () => t("vip.historyAdminAdjust"),
                                    fund_profit: () => t("vip.historyFundProfit"),
                                    fund_return: () => t("vip.historyFundReturn"),
                                  };
                                  const fn = typeMap[h.type];
                                  return fn ? fn() : h.description;
                                })()}</p>
                                <p className="text-muted-foreground text-[10px]">{new Date(h.createdAt).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            </div>
                            <p className={`text-xs font-bold ${isPositive ? "text-emerald-500 dark:text-emerald-400" : "text-primary"}`}>
                              {isPositive ? "+" : ""}{Number(h.amount).toFixed(2)} USDT
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => navigate("/tasks")} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-my-tasks">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
                  <ListChecks className="w-4 h-4 text-[#3B82F6]" />
                </div>
                <span className="text-foreground text-sm">{t("profile.myTasks")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => navigate("/referral")} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-my-referrals">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#4ADE80]/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#4CAF50]" />
                </div>
                <div>
                  <span className="text-foreground text-sm">{t("profile.myReferrals")}</span>
                  <span className="ml-2 text-[10px] text-muted-foreground">{t("profile.referralCount", { count: totalReferrals })}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => navigate("/vip")} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-my-vip">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFB300]/20 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-[#FFB300]" />
                </div>
                <span className="text-foreground text-sm">{t("profile.myVipSubs")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={() => setShowSecretInfo(true)} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-secret-info">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#6B7280]/20 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-[#6B7280]" />
                </div>
                <span className="text-foreground text-sm">{t("profile.secretInfo")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            <div>
              <button onClick={() => setShowChangePassword(!showChangePassword)} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-change-password">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <span className="text-foreground text-sm">{t("profile.changeLoginPassword")}</span>
                </div>
                {showChangePassword ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
              {showChangePassword && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="text-muted-foreground text-xs">{t("profile.currentPassword")}</label>
                    <Input
                      type="password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder={t("profile.currentPasswordPlaceholder")}
                      className="mt-1 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11"
                      data-testid="input-current-password"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">{t("profile.newPassword")}</label>
                    <Input
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder={t("profile.newPasswordPlaceholder")}
                      className="mt-1 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11"
                      data-testid="input-new-password"
                    />
                  </div>
                  <Button
                    onClick={() => changePasswordMutation.mutate()}
                    disabled={!currentPwd || newPwd.length < 6 || changePasswordMutation.isPending}
                    className="w-full bg-primary text-primary-foreground font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 disabled:opacity-50"
                    data-testid="button-save-password"
                  >
                    {changePasswordMutation.isPending ? t("profile.saving") : t("profile.changePassword")}
                  </Button>
                </div>
              )}
            </div>

            <div>
              <button onClick={() => setShowChangeFundPwd(!showChangeFundPwd)} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-change-fund-password">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#A78BFA]/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#A78BFA]" />
                  </div>
                  <span className="text-foreground text-sm">{t("profile.changeFundPasswordMenu")}</span>
                </div>
                {showChangeFundPwd ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>
              {showChangeFundPwd && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="text-muted-foreground text-xs">{t("profile.currentFundPassword")}</label>
                    <Input
                      type="password"
                      value={currentFundPwd}
                      onChange={(e) => setCurrentFundPwd(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder={t("profile.currentFundPwdPlaceholder")}
                      maxLength={6}
                      className="mt-1 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11 text-center font-mono tracking-[0.5em]"
                      data-testid="input-current-fund-password"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs">{t("profile.newFundPassword")}</label>
                    <Input
                      type="password"
                      value={newFundPwd}
                      onChange={(e) => setNewFundPwd(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder={t("profile.newFundPwdPlaceholder")}
                      maxLength={6}
                      className="mt-1 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11 text-center font-mono tracking-[0.5em]"
                      data-testid="input-new-fund-password"
                    />
                  </div>
                  <Button
                    onClick={() => changeFundPwdMutation.mutate()}
                    disabled={currentFundPwd.length !== 6 || newFundPwd.length !== 6 || changeFundPwdMutation.isPending}
                    className="w-full bg-gradient-to-r from-violet-400 to-violet-500 text-primary-foreground font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 disabled:opacity-50"
                    data-testid="button-save-fund-password"
                  >
                    {changeFundPwdMutation.isPending ? t("profile.saving") : t("profile.changeFundPasswordMenu")}
                  </Button>
                </div>
              )}
            </div>

            <button onClick={() => navigate("/help")} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-support">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-[#3b6db5]" />
                </div>
                <span className="text-foreground text-sm">{t("profile.customerSupport")}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            {user.isAdmin && (
              <button onClick={() => navigate("/admin")} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-admin">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EF4444]/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#EF4444]" />
                  </div>
                  <span className="text-[#EF4444] text-sm font-semibold">{t("admin.title")}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#EF4444]" />
              </button>
            )}
          </div>
        </div>

        <Button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          variant="outline"
          className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-xl h-12 font-semibold gap-2"
          data-testid="button-profile-logout"
        >
          <LogOut className="w-4 h-4" />
          {logoutMutation.isPending ? t("profile.loggingOut") : t("profile.logout")}
        </Button>

        <Dialog open={showSecretInfo} onOpenChange={setShowSecretInfo}>
          <DialogContent className="bg-card border-border max-w-lg rounded-2xl" aria-describedby="secret-info-desc">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {t("profile.secretInfo")}
              </DialogTitle>
              <p id="secret-info-desc" className="text-muted-foreground text-sm">{t("profile.secretInfoDesc")}</p>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="bg-card rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground text-xs">{t("profile.phoneNumber")}</span>
                </div>
                <p className="text-foreground font-medium text-sm" data-testid="text-secret-phone">{user.phone}</p>
              </div>
              <div className="bg-card rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-[#4CAF50]" />
                  <span className="text-muted-foreground text-xs">{t("profile.referralCode")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-foreground font-medium text-sm font-mono" data-testid="text-secret-referral">{user.referralCode}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(user.referralCode); toast({ title: t("common.success") }); }}
                    className="text-primary"
                    data-testid="button-copy-referral-secret"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-card rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#3b6db5]" />
                  <span className="text-muted-foreground text-xs">{t("profile.idNumber")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-foreground font-medium text-sm font-mono" data-testid="text-secret-id">{user.numericId || "—"}</p>
                  <button onClick={copyId} className="text-primary" data-testid="button-copy-id-secret">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-card rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground text-xs">{t("profile.financialPassword")}</span>
                </div>
                <p className="text-foreground font-medium text-sm" data-testid="text-secret-fund-password">••••••</p>
              </div>
              <div className="bg-card rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-[#FFB300]" />
                  <span className="text-muted-foreground text-xs">{t("profile.totalBalance")}</span>
                </div>
                <p className="text-foreground font-bold text-sm" data-testid="text-secret-balance">{balance.toFixed(2)} USDT</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {user && <DepositModal open={showDeposit} onClose={() => setShowDeposit(false)} user={user} />}
        {user && <WithdrawModal open={showWithdraw} onClose={() => setShowWithdraw(false)} user={user} paymentMethods={paymentMethods} />}
        <AddPaymentMethodModal open={showAddBankCard} onClose={() => setShowAddBankCard(false)} type="bank" />
        <AddPaymentMethodModal open={showAddUsdtWallet} onClose={() => setShowAddUsdtWallet(false)} type="usdt" />
      </div>
    </AppLayout>
  );
}
