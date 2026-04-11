import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard } from "@/lib/utils";
import {
  Shield, Lock, Phone, CreditCard, Copy, Wallet,
  CheckCircle, Eye, EyeOff, Landmark, Monitor, Headphones
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User, PaymentMethod } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { PinInput } from "./pin-input";

export function SecretInfoModal({ open, onClose, user, balance }: { open: boolean; onClose: (val: boolean) => void; user: User; balance: number }) {
  const { t } = useI18n();
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-lg rounded-2xl p-0 overflow-hidden" aria-describedby="secret-info-desc">
        <div className="bg-gradient-to-br from-primary/15 via-blue-600/10 to-transparent px-5 pt-5 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="block">{t("profile.secretInfo")}</span>
                <p id="secret-info-desc" className="text-muted-foreground text-xs font-normal mt-0.5">{t("profile.secretInfoDesc")}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>
        <div className="px-5 pb-5 pt-3 space-y-2.5">
          <div className="bg-card/80 rounded-xl p-3.5 border border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-muted-foreground text-xs">{t("profile.phoneNumber")}</span>
            </div>
            <p className="text-foreground font-semibold text-[15px] pl-9" data-testid="text-secret-phone">{user.phone}</p>
          </div>
          <div className="bg-card/80 rounded-xl p-3.5 border border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className="text-muted-foreground text-xs">{t("profile.referralCode")}</span>
            </div>
            <div className="flex items-center justify-between pl-9">
              <p className="text-foreground font-semibold text-[15px] font-mono tracking-wider" data-testid="text-secret-referral">{user.referralCode}</p>
              <button
                onClick={async () => { await copyToClipboard(user.referralCode); toast({ title: t("common.success") }); }}
                className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors active:scale-95"
                data-testid="button-copy-referral-secret"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="bg-card/80 rounded-xl p-3.5 border border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <span className="text-muted-foreground text-xs">{t("profile.idNumber")}</span>
            </div>
            <div className="flex items-center justify-between pl-9">
              <p className="text-foreground font-semibold text-[15px] font-mono tracking-wide" data-testid="text-secret-id">{user.numericId || "—"}</p>
            </div>
          </div>
          <div className="bg-card/80 rounded-xl p-3.5 border border-border/50">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-red-500" />
              </div>
              <span className="text-muted-foreground text-xs">{t("profile.fundPassword")}</span>
            </div>
            <p className="text-foreground font-semibold text-[15px] pl-9 tracking-[0.25em]" data-testid="text-secret-fund-password">••••••</p>
          </div>
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-3.5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <span className="text-muted-foreground text-xs">{t("profile.totalBalance")}</span>
            </div>
            <p className="text-foreground font-bold text-lg pl-9" data-testid="text-secret-balance">{balance.toFixed(2)} <span className="text-emerald-500 text-sm">USDT</span></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function FinanceServiceModal({
  open, onClose, bankCard, usdtWallet,
  onAddBankCard, onAddUsdtWallet, uzsEnabled = false
}: {
  open: boolean;
  onClose: (val: boolean) => void;
  bankCard: PaymentMethod | undefined;
  usdtWallet: PaymentMethod | undefined;
  onAddBankCard: () => void;
  onAddUsdtWallet: () => void;
  uzsEnabled?: boolean;
}) {
  const { t } = useI18n();
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showWalletAddress, setShowWalletAddress] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border p-0 max-w-md w-full rounded-2xl overflow-hidden" aria-describedby="finance-service-desc">
        <DialogTitle className="sr-only">{t("profile.financeService")}</DialogTitle>
        <div className="bg-gradient-to-br from-[#3B82F6]/20 via-card to-card px-4 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-base">{t("profile.financeService")}</h2>
              <p id="finance-service-desc" className="text-muted-foreground text-xs">{uzsEnabled ? (bankCard ? t("profile.cardLinked") : t("profile.cardNotLinked")) + " · " : ""}{usdtWallet ? t("profile.walletLinked") : t("profile.walletNotLinked")}</p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {uzsEnabled && (
            bankCard ? (
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
                    {showCardNumber ? bankCard.cardNumber : `${bankCard.cardNumber?.slice(0, 4)} •••• •••• ${bankCard.cardNumber?.slice(-4)}`}
                  </p>
                  <button onClick={() => setShowCardNumber(!showCardNumber)} className="text-[#2563eb] dark:text-[#60A5FA]" data-testid="button-toggle-card">
                    {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[#3b82f6] dark:text-[#8ab4f8] text-xs mt-2">{bankCard.holderName}</p>
              </div>
            ) : (
              <button onClick={onAddBankCard} className="w-full bg-card border border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 hover:border-[#3B82F6] transition-colors" data-testid="button-add-bank-card">
                <CreditCard className="w-4 h-4 text-[#3B82F6]" />
                <span className="text-muted-foreground text-sm">{t("profile.linkBankCard")}</span>
              </button>
            )
          )}
          {usdtWallet ? (
            <div className="bg-gradient-to-br from-[#dcfce7] to-[#bbf7d0] dark:from-[#1a2e1a] dark:to-[#0f1f0f] rounded-xl p-4 border border-[#86efac] dark:border-[#2a4a2a] relative overflow-hidden" data-testid="card-usdt-linked">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#4ADE80]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">{usdtWallet.exchangeName} · BEP20</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 text-[10px]">{t("common.active")}</span>
                </div>
              </div>
              {usdtWallet.exchangeUid && (
                <div className="mb-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700/70 dark:text-emerald-400/60 text-[10px] uppercase tracking-wider">UID</span>
                    <span className="text-[#14532d] dark:text-white font-mono text-xs" data-testid="text-exchange-uid">{usdtWallet.exchangeUid}</span>
                  </div>
                  {usdtWallet.exchangeEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700/70 dark:text-emerald-400/60 text-[10px] uppercase tracking-wider">{t("profile.emailLabel")}</span>
                      <span className="text-[#14532d] dark:text-white text-xs" data-testid="text-exchange-email">{usdtWallet.exchangeEmail}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-[#14532d] dark:text-white font-mono text-xs tracking-wider" data-testid="text-wallet-address">
                  {showWalletAddress ? usdtWallet.walletAddress : `${usdtWallet.walletAddress?.slice(0, 6)}••••••${usdtWallet.walletAddress?.slice(-6)}`}
                </p>
                <button onClick={() => setShowWalletAddress(!showWalletAddress)} className="text-emerald-600 dark:text-emerald-400" data-testid="button-toggle-wallet">
                  {showWalletAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={onAddUsdtWallet} className="w-full bg-card border border-dashed border-border rounded-xl p-4 flex items-center justify-center gap-2 hover:border-[#4ADE80] transition-colors" data-testid="button-add-usdt-wallet">
              <Wallet className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span className="text-muted-foreground text-sm">{t("profile.addWallet")}</span>
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: (val: boolean) => void }) {
  const { t, translateServerMessage } = useI18n();
  const { toast } = useToast();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/profile/change-password", {
        currentPassword: currentPwd,
        newPassword: newPwd,
      });
      return res.json();
    },
    onSuccess: (data: { message: string }) => {
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
      onClose(false);
      setCurrentPwd("");
      setNewPwd("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const handleOpenChange = (val: boolean) => {
    onClose(val);
    if (!val) { setCurrentPwd(""); setNewPwd(""); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-background border-border p-0 max-w-md w-full rounded-2xl overflow-hidden" aria-describedby="change-pwd-desc">
        <DialogTitle className="sr-only">{t("profile.changeLoginPassword")}</DialogTitle>
        <div className="bg-gradient-to-br from-[#F59E0B]/20 via-card to-card px-4 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#F59E0B]" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-base">{t("profile.changeLoginPassword")}</h2>
              <p id="change-pwd-desc" className="text-muted-foreground text-xs">{t("profile.changePasswordDesc")}</p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-muted-foreground text-xs">{t("profile.currentPassword")}</label>
            <Input type="password" autoComplete="current-password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder={t("profile.currentPasswordPlaceholder")} className="mt-1 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11" data-testid="input-current-password" />
          </div>
          <div>
            <label className="text-muted-foreground text-xs">{t("profile.newPassword")}</label>
            <Input type="password" autoComplete="new-password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder={t("profile.newPasswordPlaceholder")} className="mt-1 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11" data-testid="input-new-password" />
          </div>
          <Button onClick={() => changePasswordMutation.mutate()} disabled={!currentPwd || newPwd.length < 6 || changePasswordMutation.isPending} className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 disabled:opacity-50" data-testid="button-save-password">
            {changePasswordMutation.isPending ? t("profile.saving") : t("profile.changePassword")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ChangeFundPasswordModal({ open, onClose }: { open: boolean; onClose: (val: boolean) => void }) {
  const { t, translateServerMessage } = useI18n();
  const { toast } = useToast();
  const [currentFundPwd, setCurrentFundPwd] = useState("");
  const [newFundPwd, setNewFundPwd] = useState("");

  const changeFundPwdMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/profile/change-fund-password", {
        currentFundPassword: currentFundPwd,
        newFundPassword: newFundPwd,
      });
      return res.json();
    },
    onSuccess: (data: { message: string }) => {
      toast({ title: t("common.success"), description: translateServerMessage(data.message) });
      onClose(false);
      setCurrentFundPwd("");
      setNewFundPwd("");
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  const handleOpenChange = (val: boolean) => {
    onClose(val);
    if (!val) { setCurrentFundPwd(""); setNewFundPwd(""); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-background border-border p-0 max-w-md w-full rounded-2xl overflow-hidden !top-[5%] !translate-y-0" aria-describedby="change-fund-pwd-desc">
        <DialogTitle className="sr-only">{t("profile.changeFundPasswordMenu")}</DialogTitle>
        <div className="bg-gradient-to-br from-[#A78BFA]/20 via-card to-card px-4 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#A78BFA]/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#A78BFA]" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-base">{t("profile.changeFundPasswordMenu")}</h2>
              <p id="change-fund-pwd-desc" className="text-muted-foreground text-xs">{t("profile.fundPasswordDesc")}</p>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-muted-foreground text-xs block mb-2">{t("profile.currentFundPassword")}</label>
            <PinInput value={currentFundPwd} onChange={setCurrentFundPwd} testId="input-current-fund-password" />
          </div>
          <div>
            <label className="text-muted-foreground text-xs block mb-2">{t("profile.newFundPassword")}</label>
            <PinInput value={newFundPwd} onChange={setNewFundPwd} testId="input-new-fund-password" />
          </div>
          <Button onClick={() => changeFundPwdMutation.mutate()} disabled={currentFundPwd.length !== 6 || newFundPwd.length !== 6 || changeFundPwdMutation.isPending} className="w-full bg-gradient-to-r from-violet-400 to-violet-500 text-primary-foreground font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 disabled:opacity-50" data-testid="button-save-fund-password">
            {changeFundPwdMutation.isPending ? t("profile.saving") : t("profile.changeFundPasswordMenu")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
