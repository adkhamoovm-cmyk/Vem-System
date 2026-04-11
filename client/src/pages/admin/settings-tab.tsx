import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Check, Edit, Trash2, Plus, CreditCard, Globe, Lock, Unlock, Percent, Clock, DollarSign, ArrowUpDown, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { DepositSetting } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

interface PlatformSettings {
  withdrawalCommissionPercent: number;
  minWithdrawalUsdt: number;
  minWithdrawalBank: number;
  withdrawalStartHour: number;
  withdrawalEndHour: number;
  maxDailyWithdrawals: number;
  withdrawalEnabled: boolean;
  uzsEnabled: boolean;
  minDepositUsdt?: number;
  minDepositBank?: number;
  [key: string]: string | number | boolean | undefined;
}

function WithdrawalSettingsPanel() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [commission, setCommission] = useState("");
  const [minUsdt, setMinUsdt] = useState("");
  const [minBank, setMinBank] = useState("");
  const [startHour, setStartHour] = useState("");
  const [endHour, setEndHour] = useState("");
  const [maxDaily, setMaxDaily] = useState("");
  const [withdrawalEnabled, setWithdrawalEnabled] = useState(true);
  const [uzsEnabled, setUzsEnabled] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: settings, isLoading } = useQuery<PlatformSettings>({
    queryKey: ["/api/admin/platform-settings"],
  });

  useEffect(() => {
    if (settings && !initialized) {
      setCommission(String(settings.withdrawalCommissionPercent));
      setMinUsdt(String(settings.minWithdrawalUsdt));
      setMinBank(String(settings.minWithdrawalBank));
      setStartHour(String(settings.withdrawalStartHour));
      setEndHour(String(settings.withdrawalEndHour));
      setMaxDaily(String(settings.maxDailyWithdrawals));
      setWithdrawalEnabled(settings.withdrawalEnabled !== false);
      setUzsEnabled(settings.uzsEnabled === true);
      setInitialized(true);
    }
  }, [settings, initialized]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/platform-settings", {
        withdrawalCommissionPercent: Number(commission),
        minWithdrawalUsdt: Number(minUsdt),
        minWithdrawalBank: Number(minBank),
        withdrawalStartHour: Number(startHour),
        withdrawalEndHour: Number(endHour),
        maxDailyWithdrawals: Number(maxDaily),
        withdrawalEnabled,
        uzsEnabled,
      });
    },
    onSuccess: () => {
      toast({ title: t("admin.saved") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-settings"] });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  if (isLoading) return <div className="h-20 flex items-center justify-center"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden mb-4">
      <div className="flex items-center gap-2.5 p-4 border-b border-border bg-primary/5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <ArrowUpDown className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-foreground font-bold text-sm">{t("admin.withdrawalSettings")}</h3>
          <p className="text-muted-foreground text-[11px]">{t("admin.withdrawalSettingsDesc")}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className={`flex items-center justify-between p-3.5 rounded-xl border ${withdrawalEnabled ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${withdrawalEnabled ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
              {withdrawalEnabled ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-red-500" />}
            </div>
            <div>
              <p className={`text-sm font-bold ${withdrawalEnabled ? "text-emerald-500" : "text-red-500"}`}>
                {withdrawalEnabled ? t("admin.withdrawalEnabled") : t("admin.withdrawalDisabled")}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {withdrawalEnabled ? t("admin.withdrawalEnabledDesc") : t("admin.withdrawalDisabledDesc")}
              </p>
            </div>
          </div>
          <Switch
            checked={withdrawalEnabled}
            onCheckedChange={setWithdrawalEnabled}
            data-testid="toggle-withdrawal-enabled"
          />
        </div>

        <div className={`flex items-center justify-between p-3.5 rounded-xl border ${uzsEnabled ? "bg-emerald-500/10 border-emerald-500/30" : "bg-orange-500/10 border-orange-500/30"}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${uzsEnabled ? "bg-emerald-500/20" : "bg-orange-500/20"}`}>
              <CreditCard className={`w-4 h-4 ${uzsEnabled ? "text-emerald-500" : "text-orange-500"}`} />
            </div>
            <div>
              <p className={`text-sm font-bold ${uzsEnabled ? "text-emerald-500" : "text-orange-500"}`}>
                {uzsEnabled ? t("admin.uzsEnabled") : t("admin.uzsDisabled")}
              </p>
              <p className="text-muted-foreground text-[11px]">
                {uzsEnabled ? t("admin.uzsEnabledDesc") : t("admin.uzsDisabledDesc")}
              </p>
            </div>
          </div>
          <Switch
            checked={uzsEnabled}
            onCheckedChange={(val) => {
              setUzsEnabled(val);
              apiRequest("POST", "/api/admin/platform-settings", {
                withdrawalCommissionPercent: Number(commission),
                minWithdrawalUsdt: Number(minUsdt),
                minWithdrawalBank: Number(minBank),
                withdrawalStartHour: Number(startHour),
                withdrawalEndHour: Number(endHour),
                maxDailyWithdrawals: Number(maxDaily),
                withdrawalEnabled,
                uzsEnabled: val,
              }).then(() => {
                queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-settings"] });
                queryClient.invalidateQueries({ queryKey: ["/api/platform-settings"] });
                toast({ title: val ? t("admin.uzsEnabled") : t("admin.uzsDisabled") });
              });
            }}
            data-testid="toggle-uzs-enabled"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Percent className="w-3 h-3" /> {t("admin.commissionPercent")}
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={commission}
                onChange={e => setCommission(e.target.value)}
                className="bg-muted border-border text-foreground h-10 text-sm pr-8"
                data-testid="input-withdrawal-commission"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">%</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("admin.currentValue")}: {settings?.withdrawalCommissionPercent}%</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3 h-3" /> {t("admin.maxDailyWithdrawals")}
            </label>
            <Input
              type="number"
              min="1"
              max="10"
              value={maxDaily}
              onChange={e => setMaxDaily(e.target.value)}
              className="bg-muted border-border text-foreground h-10 text-sm"
              data-testid="input-max-daily-withdrawals"
            />
            <p className="text-[10px] text-muted-foreground">{t("admin.currentValue")}: {settings?.maxDailyWithdrawals} {t("admin.perDay")}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-yellow-500" /> {t("admin.minUsdtWithdrawal")}
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={minUsdt}
                onChange={e => setMinUsdt(e.target.value)}
                className="bg-muted border-border text-foreground h-10 text-sm pr-14"
                data-testid="input-min-withdrawal-usdt"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">USDT</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("admin.currentValue")}: {settings?.minWithdrawalUsdt} USDT</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="w-3 h-3 text-blue-500" /> {t("admin.minBankWithdrawal")}
            </label>
            <div className="relative">
              <Input
                type="number"
                min="0"
                step="0.5"
                value={minBank}
                onChange={e => setMinBank(e.target.value)}
                className="bg-muted border-border text-foreground h-10 text-sm pr-14"
                data-testid="input-min-withdrawal-bank"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">USDT</span>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("admin.currentValue")}: {settings?.minWithdrawalBank} USDT</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> {t("admin.withdrawalWorkHours")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">{t("admin.startHour")}</p>
              <Input
                type="number"
                min="0"
                max="23"
                value={startHour}
                onChange={e => setStartHour(e.target.value)}
                className="bg-muted border-border text-foreground h-10 text-sm"
                data-testid="input-withdrawal-start-hour"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">{t("admin.endHour")}</p>
              <Input
                type="number"
                min="0"
                max="23"
                value={endHour}
                onChange={e => setEndHour(e.target.value)}
                className="bg-muted border-border text-foreground h-10 text-sm"
                data-testid="input-withdrawal-end-hour"
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">{t("admin.currentValue")}: {settings?.withdrawalStartHour}:00 — {settings?.withdrawalEndHour}:00</p>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-[11px] text-amber-600 dark:text-amber-400">
          {t("admin.settingsNote")}
        </div>

        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full bg-primary text-white h-10 text-sm font-semibold"
          data-testid="button-save-withdrawal-settings"
        >
          {saveMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <><Check className="w-4 h-4 mr-2" /> {t("admin.saveSettings")}</>
          )}
        </Button>
      </div>
    </div>
  );
}

function PinChangeSection() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const changePinMutation = useMutation({
    mutationFn: async () => {
      if (newPin !== confirmPin) {
        throw new Error(t("admin.pinMismatch"));
      }
      await apiRequest("POST", "/api/admin/change-pin", { currentPin, newPin });
    },
    onSuccess: () => {
      toast({ title: t("admin.pinChanged") });
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    },
    onError: (err: Error) => {
      toast({ title: err.message || t("common.error"), variant: "destructive" });
    },
  });

  return (
    <div className="bg-card rounded-xl p-4 border border-border space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-4 h-4 text-primary" />
        <h3 className="text-foreground font-bold text-sm">{t("admin.changePin")}</h3>
      </div>
      <Input
        type="password"
        maxLength={6}
        inputMode="numeric"
        value={currentPin}
        onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder={t("admin.currentPin")}
        className="bg-card border-border text-foreground h-9 text-sm font-mono"
        data-testid="input-current-pin"
      />
      <Input
        type="password"
        maxLength={6}
        inputMode="numeric"
        value={newPin}
        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder={t("admin.newPin")}
        className="bg-card border-border text-foreground h-9 text-sm font-mono"
        data-testid="input-new-pin"
      />
      <Input
        type="password"
        maxLength={6}
        inputMode="numeric"
        value={confirmPin}
        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder={t("admin.confirmNewPin")}
        className="bg-card border-border text-foreground h-9 text-sm font-mono"
        data-testid="input-confirm-pin"
      />
      <Button
        size="sm"
        onClick={() => changePinMutation.mutate()}
        disabled={changePinMutation.isPending || currentPin.length !== 6 || newPin.length !== 6 || confirmPin.length !== 6}
        className="bg-primary text-foreground h-8 text-xs w-full"
        data-testid="button-change-pin"
      >
        {changePinMutation.isPending ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <Lock className="w-3 h-3 mr-1" />}
        {t("admin.changePin")}
      </Button>
    </div>
  );
}

export function SettingsTab() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formType, setFormType] = useState<"bank" | "usdt">("bank");
  const [bankName, setBankName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [exchangeName, setExchangeName] = useState("");
  const [networkType, setNetworkType] = useState("BEP20");

  const { data: settings = [] } = useQuery<DepositSetting[]>({ queryKey: ["/api/admin/deposit-settings"] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/deposit-settings", {
        ...(editingId ? { id: editingId } : {}),
        type: formType,
        ...(formType === "bank" ? { bankName, cardNumber, holderName } : { walletAddress, exchangeName, networkType }),
        isActive: true,
      });
    },
    onSuccess: () => {
      toast({ title: t("admin.saved") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposit-settings"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/deposit-settings/${id}`); },
    onSuccess: () => { toast({ title: t("admin.deleted") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/deposit-settings"] }); },
  });

  const resetForm = () => { setShowForm(false); setEditingId(null); setBankName(""); setCardNumber(""); setHolderName(""); setWalletAddress(""); setExchangeName(""); setNetworkType("BEP20"); };

  const startEdit = (s: DepositSetting) => {
    setEditingId(s.id);
    setFormType(s.type as "bank" | "usdt");
    setBankName(s.bankName || "");
    setCardNumber(s.cardNumber || "");
    setHolderName(s.holderName || "");
    setWalletAddress(s.walletAddress || "");
    setExchangeName(s.exchangeName || "");
    setNetworkType(s.networkType || "BEP20");
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <PinChangeSection />

      <WithdrawalSettingsPanel />

      <div className="flex items-center justify-between">
        <h3 className="text-foreground font-bold text-sm">{t("admin.depositRequisites")}</h3>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} className="bg-primary text-foreground text-xs rounded-lg h-8" data-testid="button-add-deposit-setting">
          <Plus className="w-3 h-3 mr-1" /> {t("admin.add")}
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl p-4 border border-primary/30 space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setFormType("bank")}
              className={`px-3 py-1.5 rounded-lg text-xs border ${formType === "bank" ? "bg-[#3B82F6]/20 border-[#3B82F6] text-[#3B82F6]" : "bg-card border-border text-muted-foreground"}`}
            >
              <CreditCard className="w-3 h-3 inline mr-1" /> {t("admin.bankCard")}
            </button>
            <button onClick={() => setFormType("usdt")}
              className={`px-3 py-1.5 rounded-lg text-xs border ${formType === "usdt" ? "bg-primary/20 border-primary text-primary" : "bg-card border-border text-muted-foreground"}`}
            >
              <Globe className="w-3 h-3 inline mr-1" /> USDT
            </button>
          </div>

          {formType === "bank" ? (
            <>
              <Input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder={t("admin.cardHolderName")}
                className="bg-card border-border text-foreground h-9 text-sm" data-testid="input-setting-holder" />
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder={t("admin.bankNamePlaceholder")}
                className="bg-card border-border text-foreground h-9 text-sm" data-testid="input-setting-bank" />
              <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder={t("admin.cardNumberPlaceholder")}
                className="bg-card border-border text-foreground h-9 text-sm font-mono" data-testid="input-setting-card" />
            </>
          ) : (
            <>
              <Input value={exchangeName} onChange={(e) => setExchangeName(e.target.value)} placeholder={t("admin.exchangeNamePlaceholder")}
                className="bg-card border-border text-foreground h-9 text-sm" data-testid="input-setting-exchange" />
              <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} placeholder={t("admin.walletAddressPlaceholder")}
                className="bg-card border-border text-foreground h-9 text-sm font-mono" data-testid="input-setting-wallet" />
              <div className="flex gap-2">
                <button
                  onClick={() => setNetworkType("BEP20")}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${networkType === "BEP20" ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" : "bg-card border-border text-muted-foreground hover:border-muted-foreground"}`}
                  data-testid="button-network-bep20"
                >
                  BSC (BEP20)
                </button>
              </div>
            </>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveMutation.mutate()} className="bg-[#4ADE80] text-black h-8 text-xs" data-testid="button-save-setting">
              <Check className="w-3 h-3 mr-1" /> {t("common.save")}
            </Button>
            <Button size="sm" onClick={resetForm} variant="ghost" className="text-muted-foreground h-8 text-xs">{t("common.cancel")}</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {settings.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">{t("admin.noRequisitesAdded")}</p>}
        {settings.map(s => (
          <div key={s.id} className="bg-card rounded-xl p-3 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              {s.type === "bank" ? <CreditCard className="w-4 h-4 text-[#3B82F6]" /> : <Globe className="w-4 h-4 text-primary" />}
              <div>
                <p className="text-foreground text-sm font-medium">
                  {s.type === "bank" ? `${s.bankName} - ${s.cardNumber}` : `${s.exchangeName} - ${s.networkType}`}
                </p>
                <p className="text-muted-foreground text-xs">
                  {s.type === "bank" ? s.holderName : s.walletAddress?.slice(0, 30)}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" onClick={() => startEdit(s)} variant="ghost" className="text-[#3B82F6] h-7 px-2" data-testid={`button-edit-setting-${s.id}`}>
                <Edit className="w-3 h-3" />
              </Button>
              <Button size="sm" onClick={() => deleteMutation.mutate(s.id)} variant="ghost" className="text-primary h-7 px-2" data-testid={`button-delete-setting-${s.id}`}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
