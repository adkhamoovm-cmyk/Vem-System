import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Eye, Edit, Check, X, Ban, Trash2, Crown, Shield, CreditCard, Wallet, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { PaymentMethod } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";
import { InfoRow } from "./shared";

export function UserDetailModal({ userId, open, onClose }: { userId: string | null; open: boolean; onClose: () => void }) {
  const { t, locale, translateServerMessage } = useI18n();
  const { toast } = useToast();
  const [editBalance, setEditBalance] = useState(false);
  const [newBalance, setNewBalance] = useState("");
  const [balanceMode, setBalanceMode] = useState<"add" | "subtract">("add");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [editVip, setEditVip] = useState(false);
  const [newVipLevel, setNewVipLevel] = useState(0);
  const [editPassword, setEditPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newFundPassword, setNewFundPassword] = useState("");

  const { data: detail } = useQuery<any>({
    queryKey: ["/api/admin/users", userId],
    enabled: !!userId && open,
  });

  const balanceMutation = useMutation({
    mutationFn: async (finalBalance: string) => {
      await apiRequest("POST", `/api/admin/users/${userId}/balance`, { balance: finalBalance });
    },
    onSuccess: () => {
      toast({ title: t("admin.balanceUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditBalance(false);
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: translateServerMessage(e.message), variant: "destructive" }),
  });

  const vipMutation = useMutation({
    mutationFn: async () => {
      const limits: Record<number, number> = { 0: 3, 1: 5, 2: 6, 3: 10, 4: 14, 5: 18, 6: 20, 7: 25, 8: 30, 9: 40, 10: 50 };
      await apiRequest("POST", `/api/admin/users/${userId}/vip`, { level: newVipLevel, dailyLimit: limits[newVipLevel] || 3 });
    },
    onSuccess: () => {
      toast({ title: t("admin.vipLevelUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditVip(false);
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: translateServerMessage(e.message), variant: "destructive" }),
  });

  const banMutation = useMutation({
    mutationFn: async (isBanned: boolean) => {
      await apiRequest("POST", `/api/admin/users/${userId}/ban`, { isBanned });
    },
    onSuccess: () => {
      toast({ title: t("admin.statusUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const withdrawBanMutation = useMutation({
    mutationFn: async (banned: boolean) => {
      await apiRequest("POST", `/api/admin/users/${userId}/withdrawal-ban`, { banned });
    },
    onSuccess: () => {
      toast({ title: t("admin.withdrawStatusUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const body: any = {};
      if (newPassword) body.password = newPassword;
      if (newFundPassword) body.fundPassword = newFundPassword;
      await apiRequest("POST", `/api/admin/users/${userId}/password`, body);
    },
    onSuccess: () => {
      toast({ title: t("admin.passwordUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] });
      setEditPassword(false);
      setNewPassword("");
      setNewFundPassword("");
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: translateServerMessage(e.message), variant: "destructive" }),
  });

  const deleteMethodMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/payment-methods/${id}`);
    },
    onSuccess: () => {
      toast({ title: t("admin.paymentMethodDeleted") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", userId] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({ title: t("admin.userDeleted") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      onClose();
    },
  });

  if (!open || !detail) return null;

  const user = detail.user;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" aria-describedby="user-detail-desc">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#3B82F6]" />
            {t("admin.userDetails")}
          </DialogTitle>
          <p id="user-detail-desc" className="text-muted-foreground text-xs">{t("admin.fullProfileInfo")}</p>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label={t("admin.phone")} value={user.phone} />
            <InfoRow label="UID" value={user.numericId || "—"} />
            <InfoRow label="VIP" value={getVipName(user.vipLevel, locale)} />
            <InfoRow label={t("admin.vipPurchasedAt")} value={user.vipPurchasedAt ? new Date(user.vipPurchasedAt).toLocaleDateString() : "—"} />
            <InfoRow label={t("admin.vipExpiresAt")} value={user.vipExpiresAt ? new Date(user.vipExpiresAt).toLocaleDateString() : "—"} />
            <InfoRow label={t("common.balance")} value={`${Number(user.balance).toFixed(2)} USDT`} />
            <InfoRow label={t("admin.earnings")} value={`${Number(user.totalEarnings).toFixed(2)} USDT`} />
            <InfoRow label={t("common.deposit")} value={`${Number(user.totalDeposit).toFixed(2)} USDT`} />
            <InfoRow label={t("admin.ipAddress")} value={user.lastLoginIp || t("admin.unknown")} />
            <InfoRow label={t("admin.device")} value={user.lastUserAgent ? user.lastUserAgent.slice(0, 40) + "..." : t("admin.unknown")} />
            <InfoRow label={t("admin.status")} value={user.isBanned ? t("admin.blocked") : t("common.active")} color={user.isBanned ? "hsl(var(--primary))" : "hsl(var(--emerald-500, 142 71% 45%))"} />
            <InfoRow label={t("admin.withdrawal")} value={user.withdrawalBanned ? t("admin.banned") : t("admin.allowed") } color={user.withdrawalBanned ? "hsl(var(--primary))" : "hsl(var(--emerald-500, 142 71% 45%))"} />
            <InfoRow label={t("admin.registeredAt")} value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"} />
            <InfoRow label={t("admin.referralCode")} value={user.referralCode} />
            <InfoRow label={t("admin.invitedBy")} value={detail.invitedBy ? `${detail.invitedBy.phone} (UID: ${detail.invitedBy.numericId || "—"})` : t("admin.noInviter")} color={detail.invitedBy ? "hsl(var(--emerald-500, 142 71% 45%))" : "hsl(var(--muted-foreground))"} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { setEditBalance(true); setBalanceAmount(""); setBalanceMode("add"); }} className="bg-primary text-foreground text-xs rounded-lg h-8" data-testid="button-edit-balance">
              <Edit className="w-3 h-3 mr-1" /> {t("common.balance")}
            </Button>
            <Button size="sm" onClick={() => { setEditVip(true); setNewVipLevel(user.vipLevel); }} className="bg-[#FFB300] text-black text-xs rounded-lg h-8" data-testid="button-edit-vip">
              <Crown className="w-3 h-3 mr-1" /> VIP
            </Button>
            <Button size="sm" onClick={() => banMutation.mutate(!user.isBanned)}
              className={`text-xs rounded-lg h-8 ${user.isBanned ? "bg-[#4ADE80] text-black" : "bg-primary text-foreground"}`}
              data-testid="button-toggle-ban"
            >
              <Ban className="w-3 h-3 mr-1" /> {user.isBanned ? t("admin.unban") : t("admin.ban")}
            </Button>
            <Button size="sm" onClick={() => withdrawBanMutation.mutate(!user.withdrawalBanned)}
              className={`text-xs rounded-lg h-8 ${user.withdrawalBanned ? "bg-[#4ADE80] text-black" : "bg-primary text-foreground"}`}
              data-testid="button-toggle-withdraw-ban"
            >
              <Shield className="w-3 h-3 mr-1" /> {user.withdrawalBanned ? t("admin.allowWithdraw") : t("admin.banWithdraw")}
            </Button>
            <Button size="sm" onClick={() => { setEditPassword(true); setNewPassword(""); setNewFundPassword(""); }}
              className="bg-[#3B82F6] text-foreground text-xs rounded-lg h-8" data-testid="button-edit-password"
            >
              <Edit className="w-3 h-3 mr-1" /> {t("admin.password")}
            </Button>
            <Button size="sm" onClick={() => { if (confirm(t("admin.confirmDeleteUser"))) deleteUserMutation.mutate(); }}
              className="bg-red-700 text-foreground text-xs rounded-lg h-8" data-testid="button-delete-user"
            >
              <Trash2 className="w-3 h-3 mr-1" /> {t("common.delete")}
            </Button>
          </div>

          {editBalance && (
            <div className="bg-card rounded-xl p-3 border border-primary/30 space-y-3">
              <p className="text-muted-foreground text-xs">{t("admin.currentBalance")}: <span className="text-foreground font-bold">{Number(user.balance).toFixed(2)} USDT</span></p>
              <div className="flex gap-2">
                <button onClick={() => setBalanceMode("add")}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${balanceMode === "add" ? "bg-[#4ADE80]/20 border-[#4ADE80] text-emerald-500 dark:text-emerald-400" : "bg-background border-border text-muted-foreground"}`}
                  data-testid="button-balance-add"
                >
                  + {t("admin.addBalance")}
                </button>
                <button onClick={() => setBalanceMode("subtract")}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${balanceMode === "subtract" ? "bg-primary/20 border-primary text-primary" : "bg-background border-border text-muted-foreground"}`}
                  data-testid="button-balance-subtract"
                >
                  − {t("admin.subtractBalance")}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" min="0" step="0.01" value={balanceAmount} onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder={t("admin.amountUsdt")} className="bg-background border-border text-foreground h-9 text-sm flex-1" data-testid="input-balance-amount" />
              </div>
              {balanceAmount && Number(balanceAmount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  {t("admin.newBalance")}: <span className="text-foreground font-bold">
                    {balanceMode === "add"
                      ? (Number(user.balance) + Number(balanceAmount)).toFixed(2)
                      : Math.max(0, Number(user.balance) - Number(balanceAmount)).toFixed(2)
                    } USDT
                  </span>
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" disabled={!balanceAmount || Number(balanceAmount) <= 0}
                  onClick={() => {
                    const current = Number(user.balance);
                    const amt = Number(balanceAmount);
                    const final_ = balanceMode === "add" ? current + amt : Math.max(0, current - amt);
                    balanceMutation.mutate(final_.toFixed(2));
                  }}
                  className={`h-8 text-xs ${balanceMode === "add" ? "bg-[#4ADE80] text-black" : "bg-primary text-foreground"}`}
                  data-testid="button-balance-confirm"
                >
                  <Check className="w-3 h-3 mr-1" /> {balanceMode === "add" ? t("admin.addBalance") : t("admin.subtractBalance")}
                </Button>
                <Button size="sm" onClick={() => setEditBalance(false)} variant="ghost" className="text-muted-foreground h-8 text-xs">{t("common.cancel")}</Button>
              </div>
            </div>
          )}

          {editVip && (
            <div className="bg-card rounded-xl p-3 border border-[#FFB300]/30">
              <p className="text-muted-foreground text-xs mb-2">{t("admin.selectVipLevel")}</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: 11 }, (_, i) => i).map((lvl) => (
                  <button key={lvl} onClick={() => setNewVipLevel(lvl)}
                    className={`px-3 py-1.5 rounded-lg text-xs border ${lvl === newVipLevel ? "bg-[#FFB300]/20 border-[#FFB300] text-[#FFB300]" : "bg-background border-border text-muted-foreground"}`}
                    data-testid={`button-vip-${lvl}`}
                  >
                    {getVipName(lvl, locale)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={() => vipMutation.mutate()} className="bg-[#FFB300] text-black h-8 text-xs">{t("common.save")}</Button>
                <Button size="sm" onClick={() => setEditVip(false)} variant="ghost" className="text-muted-foreground h-8 text-xs">{t("common.cancel")}</Button>
              </div>
            </div>
          )}

          {editPassword && (
            <div className="bg-card rounded-xl p-3 border border-[#3B82F6]/30 space-y-2">
              <p className="text-muted-foreground text-xs mb-1">{t("admin.changePassword")}</p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-24 shrink-0">{t("admin.newPasswordLabel")}</span>
                <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("admin.newLoginPassword")} className="bg-background border-border text-foreground h-8 text-sm flex-1" data-testid="input-new-admin-password" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-24 shrink-0">{t("admin.fundPasswordLabel")}</span>
                <Input type="text" value={newFundPassword} onChange={(e) => setNewFundPassword(e.target.value)}
                  placeholder={t("admin.newFundPin")} className="bg-background border-border text-foreground h-8 text-sm flex-1" data-testid="input-new-admin-fund-password" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => passwordMutation.mutate()} disabled={!newPassword && !newFundPassword} className="bg-[#3B82F6] text-foreground h-8 text-xs">
                  <Check className="w-3 h-3 mr-1" /> {t("common.save")}
                </Button>
                <Button size="sm" onClick={() => setEditPassword(false)} variant="ghost" className="text-muted-foreground h-8 text-xs">{t("common.cancel")}</Button>
              </div>
            </div>
          )}

          {detail.investments?.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs font-semibold mb-2">{t("admin.fundInvestments")}</p>
              {detail.investments.map((inv: any) => (
                <div key={inv.id} className="bg-card rounded-lg p-2.5 border border-border mb-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      <div>
                        <p className="text-foreground text-xs font-semibold">{Number(inv.investedAmount).toFixed(2)} USDT</p>
                        <p className="text-muted-foreground text-[10px]">{t("admin.dailyProfit")}: {Number(inv.dailyProfit).toFixed(2)} USDT</p>
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${inv.status === "active" ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                      {inv.status === "active" ? t("common.active") : t("admin.completed")}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-1.5 text-[10px] text-muted-foreground">
                    <span>{t("admin.startDate")}: {inv.startDate ? new Date(inv.startDate).toLocaleDateString() : "—"}</span>
                    <span>{t("admin.endDate")}: {inv.endDate ? new Date(inv.endDate).toLocaleDateString() : "∞"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {detail.paymentMethods?.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs font-semibold mb-2">{t("admin.paymentMethods")}</p>
              {detail.paymentMethods.map((m: PaymentMethod) => (
                <div key={m.id} className="bg-card rounded-lg p-2.5 border border-border flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {m.type === "bank" ? <CreditCard className="w-3.5 h-3.5 text-[#3B82F6]" /> : <Wallet className="w-3.5 h-3.5 text-primary" />}
                    <div>
                      <p className="text-foreground text-xs">{m.type === "bank" ? `${m.bankName} - ${m.cardNumber}` : `${m.exchangeName} - ${m.walletAddress?.slice(0, 20)}...`}</p>
                      <p className="text-muted-foreground text-[10px]">{m.type === "bank" ? m.holderName : "BEP20"}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => deleteMethodMutation.mutate(m.id)} variant="ghost" className="text-primary h-6 px-2" data-testid={`button-delete-method-${m.id}`}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {detail.referralStats && (
            <div>
              <p className="text-muted-foreground text-xs font-semibold mb-2">{t("admin.referralStats")}</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-card rounded-lg p-2.5 text-center border border-border">
                  <p className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">{detail.referralStats.level1.count}</p>
                  <p className="text-muted-foreground text-[10px]">{t("admin.level", { level: "1" })}</p>
                </div>
                <div className="bg-card rounded-lg p-2.5 text-center border border-border">
                  <p className="text-[#3B82F6] font-bold text-sm">{detail.referralStats.level2.count}</p>
                  <p className="text-muted-foreground text-[10px]">{t("admin.level", { level: "2" })}</p>
                </div>
                <div className="bg-card rounded-lg p-2.5 text-center border border-border">
                  <p className="text-primary font-bold text-sm">{detail.referralStats.level3.count}</p>
                  <p className="text-muted-foreground text-[10px]">{t("admin.level", { level: "3" })}</p>
                </div>
              </div>
            </div>
          )}

          {detail.referralTree?.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs font-semibold mb-2">{t("admin.allReferrals", { count: String(detail.referralTree.length) })}</p>
              {[1, 2, 3].map((lvl) => {
                const levelRefs = detail.referralTree.filter((r: any) => r.level === lvl);
                if (levelRefs.length === 0) return null;
                
                const levelColors = { 1: { bg: "bg-[#4ADE80]/10", border: "border-[#4ADE80]/20", text: "text-emerald-500 dark:text-emerald-400", badge: "bg-[#4ADE80]/20 text-emerald-500 dark:text-emerald-400" }, 2: { bg: "bg-[#3B82F6]/10", border: "border-[#3B82F6]/20", text: "text-[#3B82F6]", badge: "bg-[#3B82F6]/20 text-[#3B82F6]" }, 3: { bg: "bg-primary/10", border: "border-primary/20", text: "text-primary", badge: "bg-primary/20 text-primary" } };
                const colors = levelColors[lvl as 1 | 2 | 3];
                return (
                  <div key={lvl} className="mb-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>{t("admin.level", { level: String(lvl) })}</span>
                      <span className="text-muted-foreground text-[10px]">{t("admin.count", { count: String(levelRefs.length) })}</span>
                    </div>
                    <div className={`${colors.bg} rounded-lg border ${colors.border} max-h-48 overflow-y-auto`}>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left text-muted-foreground font-medium py-1.5 px-2.5 text-[10px]">ID</th>
                            <th className="text-left text-muted-foreground font-medium py-1.5 px-2.5 text-[10px]">{t("admin.phone")}</th>
                            <th className="text-center text-muted-foreground font-medium py-1.5 px-2.5 text-[10px]">VIP</th>
                            <th className="text-right text-muted-foreground font-medium py-1.5 px-2.5 text-[10px]">{t("common.balance")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {levelRefs.map((r: any) => (
                            <tr key={r.id} className="border-b border-border/50 last:border-0">
                              <td className="py-1.5 px-2.5 text-foreground font-mono text-[11px]">{r.referredNumericId || "—"}</td>
                              <td className="py-1.5 px-2.5 text-foreground text-[11px]">{r.referredPhone}</td>
                              <td className="py-1.5 px-2.5 text-center">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${r.referredVipLevel >= 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                                  {getVipName(r.referredVipLevel, locale)}
                                </span>
                              </td>
                              <td className="py-1.5 px-2.5 text-right text-emerald-500 dark:text-emerald-400 text-[11px] font-medium">${Number(r.referredBalance).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
