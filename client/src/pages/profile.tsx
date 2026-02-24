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

const UZS_RATE = 12100;

function formatUZS(usd: number): string {
  const uzs = usd * UZS_RATE;
  return uzs.toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
}

function DepositModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const { toast } = useToast();
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
      toast({ title: "Muvaffaqiyatli!", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      onClose();
      setPaymentType(null);
      setAmount("");
      setReceiptFile(null);
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
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
      <DialogContent className="bg-[#111] border-[#2a2a2a] max-w-md rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto" aria-describedby="deposit-desc">
        <div className="bg-gradient-to-r from-[#4ADE80]/20 to-[#22C55E]/10 px-5 py-4 border-b border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2.5 text-base">
              <div className="w-9 h-9 rounded-xl bg-[#4ADE80]/20 flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-[#4ADE80]" />
              </div>
              Depozit qilish
            </DialogTitle>
            <p id="deposit-desc" className="text-[#888] text-xs mt-1 ml-[46px]">Hisobingizga pul kiritish</p>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5">
          {!paymentType ? (
            <div className="space-y-3 pt-4">
              <p className="text-[#888] text-xs font-medium uppercase tracking-wider">To'lov turini tanlang</p>
              <button
                onClick={() => setPaymentType("crypto")}
                className="w-full bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] hover:border-[#FF6B35]/50 transition-colors flex items-center gap-3 text-left group"
                data-testid="button-deposit-crypto"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35]/20 to-[#E8453C]/10 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-[#FF6B35]" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Kripto (USDT)</p>
                  <p className="text-[#666] text-xs mt-0.5">TRC20 tarmoq orqali</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#444] group-hover:text-[#FF6B35] transition-colors" />
              </button>
              <button
                onClick={() => setPaymentType("local")}
                className="w-full bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] hover:border-[#4ADE80]/50 transition-colors flex items-center gap-3 text-left group"
                data-testid="button-deposit-local"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6]/20 to-[#3B82F6]/5 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#3B82F6]" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">Bank kartasi (UZS)</p>
                  <p className="text-[#666] text-xs mt-0.5">Uzcard / Humo orqali</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#444] group-hover:text-[#4ADE80] transition-colors" />
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <button onClick={() => setPaymentType(null)} className="text-[#888] text-xs flex items-center gap-1.5 hover:text-white transition-colors">
                <ChevronDown className="w-3.5 h-3.5 rotate-90" /> Orqaga
              </button>

              {paymentType === "crypto" && usdtRequisites.length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-[#aaa] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> To'lov rekvizitlari
                  </p>
                  {usdtRequisites.map((req) => (
                    <div key={req.id} className="bg-[#0a0a0a] rounded-xl border border-[#FF6B35]/20 overflow-hidden">
                      <div className="bg-[#FF6B35]/5 px-3.5 py-2 border-b border-[#FF6B35]/10 flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-[#FF6B35]" />
                        <span className="text-[#FF6B35] text-xs font-semibold">{req.exchangeName || "USDT"}</span>
                        <span className="text-[#555] text-[10px] ml-auto">{req.networkType || "TRC20"}</span>
                      </div>
                      <div className="px-3.5 py-3">
                        <p className="text-[#666] text-[10px] uppercase tracking-wider mb-1">Hamyon manzili</p>
                        <div className="flex items-center gap-2">
                          <code className="text-[#4ADE80] text-xs font-mono flex-1 break-all leading-relaxed">{req.walletAddress}</code>
                          <button
                            onClick={() => copyToClipboard(req.walletAddress || "", `wallet-${req.id}`)}
                            className="shrink-0 w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center hover:border-[#4ADE80] transition-colors"
                            data-testid={`button-copy-wallet-${req.id}`}
                          >
                            {copiedField === `wallet-${req.id}` ? (
                              <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-[#888]" />
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
                  <p className="text-[#aaa] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> To'lov rekvizitlari
                  </p>
                  {bankRequisites.map((req) => (
                    <div key={req.id} className="bg-[#0a0a0a] rounded-xl border border-[#3B82F6]/20 overflow-hidden">
                      <div className="bg-[#3B82F6]/5 px-3.5 py-2 border-b border-[#3B82F6]/10 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span className="text-[#3B82F6] text-xs font-semibold">{req.bankName}</span>
                      </div>
                      <div className="px-3.5 py-3 space-y-2.5">
                        <div>
                          <p className="text-[#666] text-[10px] uppercase tracking-wider mb-0.5">Karta egasi</p>
                          <p className="text-white text-sm font-medium">{req.holderName}</p>
                        </div>
                        <div>
                          <p className="text-[#666] text-[10px] uppercase tracking-wider mb-0.5">Karta raqami</p>
                          <div className="flex items-center gap-2">
                            <code className="text-white text-sm font-mono tracking-wider">{req.cardNumber}</code>
                            <button
                              onClick={() => copyToClipboard(req.cardNumber || "", `card-${req.id}`)}
                              className="shrink-0 w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center hover:border-[#3B82F6] transition-colors"
                              data-testid={`button-copy-card-${req.id}`}
                            >
                              {copiedField === `card-${req.id}` ? (
                                <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-[#888]" />
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
                <div className="bg-[#E8453C]/5 rounded-xl p-4 border border-[#E8453C]/20 text-center">
                  <Clock className="w-6 h-6 text-[#E8453C] mx-auto mb-2" />
                  <p className="text-white text-sm font-semibold">Rekvizitlar hali kiritilmagan</p>
                  <p className="text-[#888] text-xs mt-0.5">Admin rekvizitlarni qo'shgandan so'ng bu yerda ko'rinadi</p>
                </div>
              )}

              <div className="bg-[#1a1a1a] rounded-xl p-3.5 border border-[#2a2a2a]">
                <p className="text-[#FF6B35] text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <ScrollText className="w-3.5 h-3.5" /> Depozit qoidalari
                </p>
                <ul className="text-[#888] text-[11px] space-y-1.5 leading-relaxed">
                  <li className="flex items-start gap-1.5"><span className="text-[#FF6B35] mt-0.5">•</span> Minimal: {paymentType === "crypto" ? "10 USDT" : `${(10 * UZS_RATE).toLocaleString()} UZS`}</li>
                  <li className="flex items-start gap-1.5"><span className="text-[#FF6B35] mt-0.5">•</span> To'lov chekini yuklashni unutmang</li>
                  <li className="flex items-start gap-1.5"><span className="text-[#FF6B35] mt-0.5">•</span> Moliya departamenti tomonidan 24 soatgacha tekshiriladi</li>
                  <li className="flex items-start gap-1.5"><span className="text-[#FF6B35] mt-0.5">•</span> Tasdiqlangandan so'ng balansingizga qo'shiladi</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">
                  Miqdor ({paymentType === "crypto" ? "USDT" : "UZS"})
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={paymentType === "crypto" ? "Minimal: 10 USDT" : `Minimal: ${(10 * UZS_RATE).toLocaleString()} UZS`}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-[#444] rounded-xl h-12 text-base focus:border-[#FF6B35]"
                  data-testid="input-deposit-amount"
                />
                {paymentType === "local" && amount && Number(amount) > 0 && (
                  <p className="text-[#4ADE80] text-xs">≈ {(Number(amount) / UZS_RATE).toFixed(2)} USDT</p>
                )}
                {paymentType === "crypto" && amount && Number(amount) > 0 && (
                  <p className="text-[#4ADE80] text-xs">≈ {formatUZS(Number(amount))} UZS</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">To'lov cheki (skrinshot)</label>
                {receiptFile ? (
                  <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#4ADE80]/30 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#4ADE80]/20 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-[#4ADE80]" />
                    </div>
                    <span className="text-[#4ADE80] text-xs flex-1 truncate font-medium">{receiptFile.name}</span>
                    <button onClick={() => setReceiptFile(null)} className="text-[#888] hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full bg-[#0a0a0a] rounded-xl p-5 border-2 border-dashed border-[#2a2a2a] hover:border-[#FF6B35]/40 transition-colors flex flex-col items-center gap-2"
                    data-testid="button-upload-receipt"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
                      <Upload className="w-5 h-5 text-[#555]" />
                    </div>
                    <span className="text-[#888] text-xs">Chekni yuklash uchun bosing</span>
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
                className="w-full bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-white font-bold no-default-hover-elevate no-default-active-elevate rounded-xl h-12 text-sm disabled:opacity-40 shadow-lg shadow-[#4ADE80]/10"
                data-testid="button-submit-deposit"
              >
                {depositMutation.isPending ? "Yuborilmoqda..." : "Depozit so'rovini yuborish"}
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
  const exchanges = ["Binance", "Bybit", "Bitget", "OKX", "Huobi", "KuCoin", "Gate.io", "MEXC", "Boshqa"];

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
      toast({ title: "Saqlandi!", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      onClose();
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
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
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-md rounded-2xl" aria-describedby="payment-method-desc">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {type === "bank" ? <CreditCard className="w-5 h-5 text-[#3B82F6]" /> : <Wallet className="w-5 h-5 text-[#FF6B35]" />}
            {type === "bank" ? "Bank kartasi qo'shish" : "USDT hamyon qo'shish"}
          </DialogTitle>
          <p id="payment-method-desc" className="text-[#888] text-xs">
            {type === "bank" ? "Pul yechish uchun bank kartangizni kiriting" : "TRC20 USDT hamyoningizni kiriting"}
          </p>
        </DialogHeader>

        {!showConfirm ? (
          <div className="space-y-4 pt-2">
            {type === "usdt" && (
              <div className="bg-[#FF6B35]/10 rounded-xl p-3 border border-[#FF6B35]/20">
                <p className="text-[#FF6B35] text-xs font-semibold">Diqqat: Faqat TRC20 tarmog'idan foydalaning!</p>
              </div>
            )}

            {type === "bank" ? (
              <>
                <div>
                  <label className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">Ism Familya</label>
                  <Input
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value)}
                    placeholder="To'liq ismingiz"
                    className="mt-1.5 bg-[#111] border-[#333] text-white placeholder:text-[#555] rounded-xl h-11"
                    data-testid="input-holder-name"
                  />
                </div>
                <div>
                  <label className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">Bank nomi</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5 max-h-40 overflow-y-auto pr-1">
                    {uzbekBanks.map((bank) => (
                      <button
                        key={bank}
                        onClick={() => setBankName(bank)}
                        className={`text-xs py-2 px-2 rounded-lg border transition-colors ${
                          bankName === bank
                            ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]"
                            : "bg-[#111] border-[#333] text-[#aaa]"
                        }`}
                        data-testid={`button-bank-${bank}`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">Karta raqami</label>
                  <Input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    placeholder="8600 0000 0000 0000"
                    className="mt-1.5 bg-[#111] border-[#333] text-white placeholder:text-[#555] rounded-xl h-11 font-mono"
                    data-testid="input-card-number"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">Birja nomi</label>
                  <div className="grid grid-cols-3 gap-2 mt-1.5">
                    {exchanges.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => setExchangeName(ex)}
                        className={`text-xs py-2 px-3 rounded-lg border transition-colors ${
                          exchangeName === ex
                            ? "bg-[#FF6B35]/20 border-[#FF6B35] text-[#FF6B35]"
                            : "bg-[#111] border-[#333] text-[#aaa]"
                        }`}
                        data-testid={`button-exchange-${ex}`}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">TRC20 hamyon manzili</label>
                  <Input
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="T..."
                    className="mt-1.5 bg-[#111] border-[#333] text-white placeholder:text-[#555] rounded-xl h-11 font-mono text-xs"
                    data-testid="input-wallet-address"
                  />
                </div>
              </>
            )}

            <Button
              onClick={() => setShowConfirm(true)}
              disabled={!isValid}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 disabled:opacity-50"
              data-testid="button-confirm-method"
            >
              Davom etish
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="bg-[#111] rounded-xl p-3 border border-[#2a2a2a] space-y-2">
              <p className="text-[#FF6B35] text-xs font-semibold">Tasdiqlaysizmi?</p>
              {type === "bank" ? (
                <>
                  <div className="flex justify-between"><span className="text-[#888] text-xs">Ism:</span><span className="text-white text-xs">{holderName}</span></div>
                  <div className="flex justify-between"><span className="text-[#888] text-xs">Bank:</span><span className="text-white text-xs">{bankName}</span></div>
                  <div className="flex justify-between"><span className="text-[#888] text-xs">Karta:</span><span className="text-white text-xs font-mono">{cardNumber.replace(/(.{4})/g, "$1 ").trim()}</span></div>
                </>
              ) : (
                <>
                  <div className="flex justify-between"><span className="text-[#888] text-xs">Birja:</span><span className="text-white text-xs">{exchangeName}</span></div>
                  <div className="flex justify-between"><span className="text-[#888] text-xs">Hamyon:</span><span className="text-white text-xs font-mono truncate max-w-[200px]">{walletAddress}</span></div>
                </>
              )}
              <div className="bg-[#E8453C]/10 rounded-lg p-2 mt-2">
                <p className="text-[#E8453C] text-[10px]">Diqqat: Saqlangandan so'ng o'zgartirib bo'lmaydi. Faqat texnik yordam o'zgartira oladi.</p>
              </div>
            </div>

            <div>
              <label className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">Moliya paroli</label>
              <Input
                type="password"
                value={fundPassword}
                onChange={(e) => setFundPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6 xonali PIN"
                maxLength={6}
                className="mt-1.5 bg-[#111] border-[#333] text-white placeholder:text-[#555] rounded-xl h-11 text-center font-mono tracking-[0.5em]"
                data-testid="input-fund-password"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setShowConfirm(false)}
                variant="ghost"
                className="flex-1 text-[#888] border border-[#333] rounded-xl h-11"
              >
                Orqaga
              </Button>
              <Button
                onClick={() => mutation.mutate()}
                disabled={fundPassword.length !== 6 || mutation.isPending}
                className="flex-1 bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 disabled:opacity-50"
                data-testid="button-save-method"
              >
                {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
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
      toast({ title: "Muvaffaqiyatli!", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      onClose();
      setAmount("");
      setFundPassword("");
      setSelectedMethodId("");
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#111] border-[#2a2a2a] max-w-md rounded-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto" aria-describedby="withdraw-desc">
        <div className="bg-gradient-to-r from-[#E8453C]/20 to-[#FF6B35]/10 px-5 py-4 border-b border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2.5 text-base">
              <div className="w-9 h-9 rounded-xl bg-[#E8453C]/20 flex items-center justify-center">
                <ArrowUpCircle className="w-5 h-5 text-[#E8453C]" />
              </div>
              Pul yechish
            </DialogTitle>
            <p id="withdraw-desc" className="text-[#888] text-xs mt-1 ml-[46px]">Hisobingizdan pul yechish</p>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-4 pt-4">
          {isSundayNow && (
            <div className="bg-[#E8453C]/5 rounded-xl p-3.5 border border-[#E8453C]/20 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E8453C]/20 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-[#E8453C]" />
              </div>
              <div>
                <p className="text-[#E8453C] text-xs font-semibold">Yakshanba — dam olish kuni</p>
                <p className="text-[#E8453C]/60 text-[11px] mt-0.5">Pul yechish faqat Dushanba-Shanba kunlari mumkin</p>
              </div>
            </div>
          )}
          {!isSundayNow && !isWithdrawTime && (
            <div className="bg-[#E8453C]/5 rounded-xl p-3.5 border border-[#E8453C]/20 flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#E8453C]/20 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-[#E8453C]" />
              </div>
              <div>
                <p className="text-[#E8453C] text-xs font-semibold">Pul yechish vaqti emas!</p>
                <p className="text-[#E8453C]/60 text-[11px] mt-0.5">Dush-Shan, 11:00-17:00 orasida qayta urinib ko'ring</p>
              </div>
            </div>
          )}

          <div className="bg-[#0a0a0a] rounded-xl border border-[#2a2a2a] overflow-hidden">
            <div className="bg-[#4ADE80]/5 px-3.5 py-2.5 border-b border-[#2a2a2a]">
              <div className="flex items-center justify-between">
                <span className="text-[#888] text-xs">Mavjud balans</span>
                <span className="text-[#4ADE80] text-sm font-bold">{balance.toFixed(2)} USDT</span>
              </div>
              <p className="text-[#555] text-[10px] mt-0.5">≈ {formatUZS(balance)} UZS</p>
            </div>
            <div className="px-3.5 py-2.5 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#666] text-[11px]">Minimal yechish</span>
                <span className="text-[#aaa] text-[11px] font-medium">2.00 USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666] text-[11px]">Komissiya</span>
                <span className="text-[#E8453C] text-[11px] font-medium">10%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666] text-[11px]">Yechish vaqti</span>
                <span className="text-[#aaa] text-[11px] font-medium">Dush-Shan 11:00-17:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666] text-[11px]">Kunlik limit</span>
                <span className="text-[#aaa] text-[11px] font-medium">1 marta</span>
              </div>
            </div>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="bg-[#FF6B35]/5 rounded-xl p-5 border border-[#FF6B35]/20 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <p className="text-white text-sm font-semibold">Avval to'lov usulini qo'shing</p>
              <p className="text-[#888] text-xs mt-1">Bank kartasi yoki USDT hamyon kiritishingiz kerak</p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">To'lov usuli</label>
                <div className="space-y-2">
                  {paymentMethods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethodId(m.id)}
                      className={`w-full bg-[#0a0a0a] rounded-xl p-3.5 border text-left flex items-center gap-3 transition-colors ${
                        selectedMethodId === m.id ? "border-[#FF6B35] bg-[#FF6B35]/5" : "border-[#2a2a2a] hover:border-[#333]"
                      }`}
                      data-testid={`button-method-${m.id}`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        m.type === "bank" ? "bg-[#3B82F6]/15" : "bg-[#FF6B35]/15"
                      }`}>
                        {m.type === "bank" ? (
                          <CreditCard className="w-4 h-4 text-[#3B82F6]" />
                        ) : (
                          <Wallet className="w-4 h-4 text-[#FF6B35]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium">
                          {m.type === "bank" ? `${m.bankName} •••• ${m.cardNumber?.slice(-4)}` : `${m.exchangeName} • TRC20`}
                        </p>
                        <p className="text-[#666] text-[10px] truncate mt-0.5">
                          {m.type === "bank" ? m.holderName : m.walletAddress}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedMethodId === m.id ? "border-[#FF6B35] bg-[#FF6B35]" : "border-[#444]"
                      }`}>
                        {selectedMethodId === m.id && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">Miqdor (USDT)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Minimal: 2 USDT"
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-[#444] rounded-xl h-12 text-base focus:border-[#FF6B35]"
                  data-testid="input-withdraw-amount"
                />
                {numAmount >= 2 && (
                  <div className="bg-[#0a0a0a] rounded-xl p-3 border border-[#2a2a2a] space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[#666] text-[11px]">Yechish miqdori</span>
                      <span className="text-white text-[11px] font-medium">{numAmount.toFixed(2)} USDT</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#666] text-[11px]">Komissiya (10%)</span>
                      <span className="text-[#E8453C] text-[11px] font-medium">-{commission.toFixed(2)} USDT</span>
                    </div>
                    <div className="border-t border-[#1a1a1a] pt-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[#aaa] text-xs font-semibold">Siz olasiz</span>
                        <div className="text-right">
                          <span className="text-[#4ADE80] text-sm font-bold">{netAmount.toFixed(2)} USDT</span>
                          <p className="text-[#555] text-[10px]">≈ {formatUZS(netAmount)} UZS</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[#aaa] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> Moliya paroli
                </label>
                <Input
                  type="password"
                  value={fundPassword}
                  onChange={(e) => setFundPassword(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  className="bg-[#0a0a0a] border-[#2a2a2a] text-white placeholder:text-[#333] rounded-xl h-12 text-center font-mono tracking-[0.5em] text-lg focus:border-[#FF6B35]"
                  data-testid="input-withdraw-fund-password"
                />
              </div>

              <Button
                onClick={() => withdrawMutation.mutate()}
                disabled={!selectedMethodId || numAmount < 2 || numAmount > balance || fundPassword.length !== 6 || !isWithdrawTime || withdrawMutation.isPending}
                className="w-full bg-gradient-to-r from-[#E8453C] to-[#FF6B35] text-white font-bold no-default-hover-elevate no-default-active-elevate rounded-xl h-12 text-sm disabled:opacity-40 shadow-lg shadow-[#E8453C]/10"
                data-testid="button-submit-withdraw"
              >
                {withdrawMutation.isPending ? "Yuborilmoqda..." : "Yechish so'rovini yuborish"}
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
      if (!res.ok) throw new Error("Rasm yuklanmadi");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: "Rasm yangilandi" });
    },
    onError: () => {
      toast({ title: "Xatolik", description: "Rasm yuklab bo'lmadi", variant: "destructive" });
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
      toast({ title: "Muvaffaqiyatli!", description: data.message });
      setShowChangePassword(false);
      setCurrentPwd("");
      setNewPwd("");
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
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
      toast({ title: "Muvaffaqiyatli!", description: data.message });
      setShowChangeFundPwd(false);
      setCurrentFundPwd("");
      setNewFundPwd("");
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
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
      toast({ title: "Nusxalandi!", description: "ID nusxalandi" });
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
          <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
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
    rejected: "#E8453C",
    completed: "#4ADE80",
  };
  const statusLabels: Record<string, string> = {
    pending: "Kutilmoqda",
    approved: "Tasdiqlangan",
    rejected: "Rad etilgan",
    completed: "Bajarildi",
  };

  return (
    <AppLayout>
      <div className="p-4 space-y-4 pb-24">
        <div className="flex items-center gap-4 pt-2">
          <div className="relative" onClick={handleAvatarClick} data-testid="button-avatar-upload">
            <div className="w-[72px] h-[72px] rounded-full border-2 border-[#FF6B35] overflow-hidden bg-[#111] flex items-center justify-center cursor-pointer">
              {user.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" data-testid="img-avatar" />
              ) : (
                <UserIcon className="w-9 h-9 text-[#555]" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-gradient-to-r from-[#FF6B35] to-[#E8453C] rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
              <Camera className="w-3 h-3 text-white" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} data-testid="input-avatar-file" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-lg" data-testid="text-profile-name">{displayName}</h2>
              {(() => {
                const VipLevelIcon = vipIconMap[user.vipLevel] || Star;
                return (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FF6B35]/20 text-[#FF6B35] flex items-center gap-1">
                    {user.vipLevel >= 0 && <VipLevelIcon className="w-3 h-3" />}
                    {user.vipLevel < 0 ? "Rasmiy xodim emas" : (vipTierNames[user.vipLevel] || `M${user.vipLevel}`)}
                  </span>
                );
              })()}
            </div>
            <button onClick={copyId} className="flex items-center gap-1 mt-0.5 group" data-testid="button-copy-id">
              <span className="text-[#888] text-xs">ID: {user.numericId || "—"}</span>
              <Copy className="w-3 h-3 text-[#555] group-hover:text-[#FF6B35]" />
            </button>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <div className="text-center mb-3">
            <p className="text-[#888] text-[10px] uppercase tracking-wider">Umumiy balans</p>
            <p className="text-white font-bold text-2xl mt-1" data-testid="text-balance">{balance.toFixed(2)} <span className="text-[#4ADE80] text-sm">USDT</span></p>
            <p className="text-[#888] text-sm">{formatUZS(balance)} UZS</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => setShowDeposit(true)}
              className="bg-gradient-to-r from-[#4ADE80] to-[#22C55E] text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11"
              data-testid="button-deposit"
            >
              <ArrowDownCircle className="w-4 h-4 mr-1.5" />
              Depozit
            </Button>
            <Button
              onClick={() => setShowWithdraw(true)}
              className="bg-gradient-to-r from-[#E8453C] to-[#FF6B35] text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11"
              data-testid="button-withdraw"
            >
              <ArrowUpCircle className="w-4 h-4 mr-1.5" />
              Yechish
            </Button>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
          <div className="grid grid-cols-3 divide-x divide-[#222]">
            <div className="text-center px-2">
              <p className="text-[#FF6B35] font-bold text-sm" data-testid="text-balance-deposit">{Number(user.totalDeposit || 0).toFixed(2)}</p>
              <p className="text-[#666] text-[10px] mt-0.5">Kiritilgan USDT</p>
            </div>
            <div className="text-center px-2">
              <p className="text-[#4ADE80] font-bold text-sm" data-testid="text-balance-earnings">{Number(user.totalEarnings || 0).toFixed(2)}</p>
              <p className="text-[#666] text-[10px] mt-0.5">Daromad USDT</p>
            </div>
            <div className="text-center px-2">
              <p className="text-white font-bold text-sm">{totalReferrals}</p>
              <p className="text-[#666] text-[10px] mt-0.5">Referallar</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl shadow-sm border border-[#2a2a2a] overflow-hidden">
          <h3 className="text-white font-bold text-sm px-4 pt-4 pb-2">Mening xizmatlarim</h3>
          <div className="divide-y divide-[#222]">
            <div>
              <button onClick={() => setShowFinanceService(!showFinanceService)} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-finance-service">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
                    <Landmark className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                  <div>
                    <span className="text-[#ddd] text-sm">Moliya xizmati</span>
                    <p className="text-[#666] text-[10px]">{bankCard ? "Karta bog'langan" : "Karta bog'lanmagan"} · {usdtWallet ? "Hamyon bog'langan" : "Hamyon bog'lanmagan"}</p>
                  </div>
                </div>
                {showFinanceService ? <ChevronDown className="w-4 h-4 text-[#555]" /> : <ChevronRight className="w-4 h-4 text-[#555]" />}
              </button>
              {showFinanceService && (
                <div className="px-4 pb-4 space-y-3">
                  {bankCard ? (
                    <div className="bg-gradient-to-br from-[#1e3a5f] to-[#0f2440] rounded-xl p-4 border border-[#2a4a6f] relative overflow-hidden" data-testid="card-bank-linked">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#3B82F6]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#60A5FA]" />
                          <span className="text-[#60A5FA] text-xs font-semibold uppercase tracking-wider">{bankCard.bankName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                          <span className="text-[#4ADE80] text-[10px]">Faol</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-white font-mono text-sm tracking-widest" data-testid="text-card-number">
                          {showCardNumber
                            ? bankCard.cardNumber
                            : `${bankCard.cardNumber?.slice(0, 4)} •••• •••• ${bankCard.cardNumber?.slice(-4)}`}
                        </p>
                        <button onClick={() => setShowCardNumber(!showCardNumber)} className="text-[#60A5FA] hover:text-white transition-colors" data-testid="button-toggle-card">
                          {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[#8ab4f8] text-xs mt-2">{bankCard.holderName}</p>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddBankCard(true)} className="w-full bg-[#111] border border-dashed border-[#333] rounded-xl p-4 flex items-center justify-center gap-2 hover:border-[#3B82F6] transition-colors" data-testid="button-add-bank-card">
                      <CreditCard className="w-4 h-4 text-[#3B82F6]" />
                      <span className="text-[#888] text-sm">Bank kartasini bog'lash</span>
                    </button>
                  )}
                  {usdtWallet ? (
                    <div className="bg-gradient-to-br from-[#1a2e1a] to-[#0f1f0f] rounded-xl p-4 border border-[#2a4a2a] relative overflow-hidden" data-testid="card-usdt-linked">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#4ADE80]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-[#4ADE80]" />
                          <span className="text-[#4ADE80] text-xs font-semibold uppercase tracking-wider">{usdtWallet.exchangeName} · TRC20</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                          <span className="text-[#4ADE80] text-[10px]">Faol</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-white font-mono text-xs tracking-wider" data-testid="text-wallet-address">
                          {showWalletAddress
                            ? usdtWallet.walletAddress
                            : `${usdtWallet.walletAddress?.slice(0, 6)}••••••${usdtWallet.walletAddress?.slice(-6)}`}
                        </p>
                        <button onClick={() => setShowWalletAddress(!showWalletAddress)} className="text-[#4ADE80] hover:text-white transition-colors" data-testid="button-toggle-wallet">
                          {showWalletAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddUsdtWallet(true)} className="w-full bg-[#111] border border-dashed border-[#333] rounded-xl p-4 flex items-center justify-center gap-2 hover:border-[#4ADE80] transition-colors" data-testid="button-add-usdt-wallet">
                      <Wallet className="w-4 h-4 text-[#4ADE80]" />
                      <span className="text-[#888] text-sm">USDT hamyon qo'shish</span>
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
                    <span className="text-[#ddd] text-sm">Moliya tarixi</span>
                    <p className="text-[#666] text-[10px]">{balHistory.length} ta operatsiya</p>
                  </div>
                </div>
                {showFinanceHistory ? <ChevronDown className="w-4 h-4 text-[#555]" /> : <ChevronRight className="w-4 h-4 text-[#555]" />}
              </button>
              {showFinanceHistory && (
                <div className="pb-2">
                  <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
                    {([
                      { key: "all", label: "Barchasi" },
                      { key: "earning", label: "Daromad" },
                      { key: "deposit", label: "Depozit" },
                      { key: "withdrawal", label: "Yechish" },
                      { key: "vip_purchase", label: "VIP" },
                      { key: "fund_invest", label: "Fond" },
                      { key: "commission", label: "Komissiya" },
                      { key: "admin_adjust", label: "Texnik" },
                    ] as const).map(f => (
                      <button
                        key={f.key}
                        onClick={() => setHistoryFilter(f.key)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${historyFilter === f.key ? "bg-[#FF6B35] text-white" : "bg-[#222] text-[#888] hover:bg-[#333]"}`}
                        data-testid={`filter-history-${f.key}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="divide-y divide-[#222] max-h-80 overflow-y-auto">
                    {balHistory.filter(h => historyFilter === "all" || h.type === historyFilter).length === 0 ? (
                      <div className="px-4 py-8 text-center text-[#666] text-xs">Operatsiyalar topilmadi</div>
                    ) : (
                      balHistory.filter(h => historyFilter === "all" || h.type === historyFilter).map((h) => {
                        const isPositive = Number(h.amount) >= 0;
                        const typeIcons: Record<string, { icon: typeof TrendingUp; color: string }> = {
                          earning: { icon: TrendingUp, color: "#4ADE80" },
                          deposit: { icon: ArrowDownCircle, color: "#4ADE80" },
                          withdrawal: { icon: ArrowUpCircle, color: "#E8453C" },
                          vip_purchase: { icon: Crown, color: "#FFD700" },
                          fund_invest: { icon: Banknote, color: "#60A5FA" },
                          commission: { icon: Users, color: "#A78BFA" },
                          admin_adjust: { icon: Settings, color: "#888" },
                        };
                        const config = typeIcons[h.type] || { icon: ScrollText, color: "#888" };
                        const IconComp = config.icon;
                        return (
                          <div key={h.id} className="px-4 py-3 flex items-center justify-between" data-testid={`history-item-${h.id}`}>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: config.color + "15" }}>
                                <IconComp className="w-3.5 h-3.5" style={{ color: config.color }} />
                              </div>
                              <div>
                                <p className="text-white text-xs font-medium">{h.description}</p>
                                <p className="text-[#666] text-[10px]">{new Date(h.createdAt).toLocaleString("uz-UZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            </div>
                            <p className={`text-xs font-bold ${isPositive ? "text-[#4ADE80]" : "text-[#E8453C]"}`}>
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
                <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
                  <ListChecks className="w-4 h-4 text-[#FF6B35]" />
                </div>
                <span className="text-[#ddd] text-sm">Mening vazifalarim</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#555]" />
            </button>
            <button onClick={() => navigate("/referral")} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-my-referrals">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#4ADE80]/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#4CAF50]" />
                </div>
                <div>
                  <span className="text-[#ddd] text-sm">Mening referallarim</span>
                  <span className="ml-2 text-[10px] text-[#888]">{totalReferrals} ta</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#555]" />
            </button>
            <button onClick={() => navigate("/vip")} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-my-vip">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FFB300]/20 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-[#FFB300]" />
                </div>
                <span className="text-[#ddd] text-sm">VIP obunalarim</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#555]" />
            </button>
            <button onClick={() => setShowSecretInfo(true)} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-secret-info">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8453C]/20 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-[#E8453C]" />
                </div>
                <span className="text-[#ddd] text-sm">Mahfiy ma'lumotlar</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#555]" />
            </button>

            <div>
              <button onClick={() => setShowChangePassword(!showChangePassword)} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-change-password">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#FF6B35]" />
                  </div>
                  <span className="text-[#ddd] text-sm">Kirish parolini o'zgartirish</span>
                </div>
                {showChangePassword ? <ChevronDown className="w-4 h-4 text-[#555]" /> : <ChevronRight className="w-4 h-4 text-[#555]" />}
              </button>
              {showChangePassword && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="text-[#888] text-xs">Joriy parol</label>
                    <Input
                      type="password"
                      value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)}
                      placeholder="Hozirgi parolingiz"
                      className="mt-1 bg-[#111] border-[#333] text-white placeholder:text-[#555] rounded-xl h-11"
                      data-testid="input-current-password"
                    />
                  </div>
                  <div>
                    <label className="text-[#888] text-xs">Yangi parol</label>
                    <Input
                      type="password"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                      placeholder="Yangi parol (min 6 ta belgi)"
                      className="mt-1 bg-[#111] border-[#333] text-white placeholder:text-[#555] rounded-xl h-11"
                      data-testid="input-new-password"
                    />
                  </div>
                  <Button
                    onClick={() => changePasswordMutation.mutate()}
                    disabled={!currentPwd || newPwd.length < 6 || changePasswordMutation.isPending}
                    className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 disabled:opacity-50"
                    data-testid="button-save-password"
                  >
                    {changePasswordMutation.isPending ? "Saqlanmoqda..." : "Parolni o'zgartirish"}
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
                  <span className="text-[#ddd] text-sm">Moliya parolini o'zgartirish</span>
                </div>
                {showChangeFundPwd ? <ChevronDown className="w-4 h-4 text-[#555]" /> : <ChevronRight className="w-4 h-4 text-[#555]" />}
              </button>
              {showChangeFundPwd && (
                <div className="px-4 pb-4 space-y-3">
                  <div>
                    <label className="text-[#888] text-xs">Joriy moliya paroli</label>
                    <Input
                      type="password"
                      value={currentFundPwd}
                      onChange={(e) => setCurrentFundPwd(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Hozirgi 6 xonali PIN"
                      maxLength={6}
                      className="mt-1 bg-[#111] border-[#333] text-white placeholder:text-[#555] rounded-xl h-11 text-center font-mono tracking-[0.5em]"
                      data-testid="input-current-fund-password"
                    />
                  </div>
                  <div>
                    <label className="text-[#888] text-xs">Yangi moliya paroli</label>
                    <Input
                      type="password"
                      value={newFundPwd}
                      onChange={(e) => setNewFundPwd(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Yangi 6 xonali PIN"
                      maxLength={6}
                      className="mt-1 bg-[#111] border-[#333] text-white placeholder:text-[#555] rounded-xl h-11 text-center font-mono tracking-[0.5em]"
                      data-testid="input-new-fund-password"
                    />
                  </div>
                  <Button
                    onClick={() => changeFundPwdMutation.mutate()}
                    disabled={currentFundPwd.length !== 6 || newFundPwd.length !== 6 || changeFundPwdMutation.isPending}
                    className="w-full bg-gradient-to-r from-[#A78BFA] to-[#8B5CF6] text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 disabled:opacity-50"
                    data-testid="button-save-fund-password"
                  >
                    {changeFundPwdMutation.isPending ? "Saqlanmoqda..." : "Moliya parolini o'zgartirish"}
                  </Button>
                </div>
              )}
            </div>

            <button onClick={() => navigate("/help")} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-support">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-[#3b6db5]" />
                </div>
                <span className="text-[#ddd] text-sm">Mijozlarni qo'llab-quvvatlash</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#555]" />
            </button>
            {user.isAdmin && (
              <button onClick={() => navigate("/admin")} className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-admin">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#FF6B35]" />
                  </div>
                  <span className="text-[#FF6B35] text-sm font-semibold">Admin panel</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#FF6B35]" />
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
          {logoutMutation.isPending ? "Chiqilmoqda..." : "Hisobdan chiqish"}
        </Button>

        <Dialog open={showSecretInfo} onOpenChange={setShowSecretInfo}>
          <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-lg rounded-2xl" aria-describedby="secret-info-desc">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#E8453C]" />
                Mahfiy ma'lumotlar
              </DialogTitle>
              <p id="secret-info-desc" className="text-[#888] text-sm">Sizning shaxsiy va xavfsizlik ma'lumotlaringiz</p>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="bg-[#111] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Phone className="w-3.5 h-3.5 text-[#FF6B35]" />
                  <span className="text-[#888] text-xs">Telefon raqam</span>
                </div>
                <p className="text-white font-medium text-sm" data-testid="text-secret-phone">{user.phone}</p>
              </div>
              <div className="bg-[#111] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-[#4CAF50]" />
                  <span className="text-[#888] text-xs">Referal kod</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium text-sm font-mono" data-testid="text-secret-referral">{user.referralCode}</p>
                  <button
                    onClick={() => { navigator.clipboard.writeText(user.referralCode); toast({ title: "Nusxalandi!" }); }}
                    className="text-[#FF6B35]"
                    data-testid="button-copy-referral-secret"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-[#111] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#3b6db5]" />
                  <span className="text-[#888] text-xs">ID raqam</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium text-sm font-mono" data-testid="text-secret-id">{user.numericId || "—"}</p>
                  <button onClick={copyId} className="text-[#FF6B35]" data-testid="button-copy-id-secret">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="bg-[#111] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Lock className="w-3.5 h-3.5 text-[#E8453C]" />
                  <span className="text-[#888] text-xs">Moliyaviy parol</span>
                </div>
                <p className="text-white font-medium text-sm" data-testid="text-secret-fund-password">••••••</p>
              </div>
              <div className="bg-[#111] rounded-xl p-3.5">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-3.5 h-3.5 text-[#FFB300]" />
                  <span className="text-[#888] text-xs">Umumiy balans</span>
                </div>
                <p className="text-white font-bold text-sm" data-testid="text-secret-balance">{balance.toFixed(2)} USDT</p>
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
