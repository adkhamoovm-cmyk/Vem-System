import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";

export function AddPaymentMethodModal({ open, onClose, type }: { open: boolean; onClose: () => void; type: "bank" | "usdt" }) {
  const { toast } = useToast();
  const { t, locale, translateServerMessage } = useI18n();
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
    onSuccess: (data: { message: string }) => {
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
                    autoComplete="name"
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
                    autoComplete="cc-number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                    placeholder=""
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
                    autoComplete="off"
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
                autoComplete="off"
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
