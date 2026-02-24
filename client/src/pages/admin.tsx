import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Users, ArrowDownCircle, ArrowUpCircle, Settings, Crown, GitBranch,
  Shield, Ban, Trash2, Edit, Check, X, Eye, Search, AlertTriangle,
  Trophy, ChevronDown, ChevronRight, Wallet, CreditCard, Globe, Plus,
  RefreshCw, DollarSign, Activity, TrendingUp, UserPlus, MessageSquare, Mail, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User, PaymentMethod, DepositRequest, WithdrawalRequest, DepositSetting, StajyorRequest, VipPackage, PromoCode } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

const UZS_RATE = 12100;
const vipNames: Record<number, string> = { 0: "Stajyor", 1: "M1", 2: "M2", 3: "M3", 4: "M4", 5: "M5", 6: "M6", 7: "M7", 8: "M8", 9: "M9", 10: "M10" };

type Tab = "dashboard" | "users" | "deposits" | "withdrawals" | "settings" | "referrals" | "multi" | "stajyor" | "vip-manage" | "promo";

function AdminDashboard({ users: allUsers, deposits, withdrawals }: { users: User[]; deposits: DepositRequest[]; withdrawals: WithdrawalRequest[] }) {
  const { t } = useI18n();
  const totalBalance = allUsers.reduce((s, u) => s + Number(u.balance), 0);
  const totalDeposits = deposits.filter(d => d.status === "approved").reduce((s, d) => s + Number(d.amount), 0);
  const totalWithdrawals = withdrawals.filter(w => w.status === "approved").reduce((s, w) => s + Number(w.amount), 0);
  const pendingDeposits = deposits.filter(d => d.status === "pending").length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
  const bannedUsers = allUsers.filter(u => u.isBanned).length;
  const activeUsers = allUsers.filter(u => !u.isBanned).length;

  const stats = [
    { label: t("admin.totalUsers"), value: allUsers.length, icon: Users, color: "#3B82F6" },
    { label: t("admin.activeBlocked"), value: `${activeUsers} / ${bannedUsers}`, icon: Shield, color: "hsl(var(--emerald-500, 142 71% 45%))" },
    { label: t("admin.totalBalance"), value: `${totalBalance.toFixed(2)} USDT`, icon: DollarSign, color: "hsl(var(--primary))" },
    { label: t("admin.totalDeposits"), value: `${totalDeposits.toFixed(2)} USDT`, icon: ArrowDownCircle, color: "hsl(var(--emerald-500, 142 71% 45%))" },
    { label: t("admin.totalWithdrawals"), value: `${totalWithdrawals.toFixed(2)} USDT`, icon: ArrowUpCircle, color: "hsl(var(--primary))" },
    { label: t("admin.pendingDeposits"), value: pendingDeposits, icon: Activity, color: "#FFB300" },
    { label: t("admin.pendingWithdrawals"), value: pendingWithdrawals, icon: Activity, color: "#FFB300" },
    { label: t("admin.vipUsers"), value: allUsers.filter(u => u.vipLevel > 0).length, icon: Crown, color: "#FFB300" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s, i) => (
        <div key={i} className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <s.icon className="w-4 h-4" style={{ color: s.color }} />
            <span className="text-muted-foreground text-[10px] uppercase tracking-wider">{s.label}</span>
          </div>
          <p className="text-foreground font-bold text-lg" data-testid={`stat-${i}`}>{s.value}</p>
        </div>
      ))}
    </div>
  );
}

function UserDetailModal({ userId, open, onClose }: { userId: string | null; open: boolean; onClose: () => void }) {
  const { t } = useI18n();
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
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const vipMutation = useMutation({
    mutationFn: async () => {
      const limits: Record<number, number> = { 0: 3, 1: 8, 2: 10, 3: 15, 4: 20, 5: 25, 6: 30, 7: 40, 8: 50, 9: 65, 10: 80 };
      await apiRequest("POST", `/api/admin/users/${userId}/vip`, { level: newVipLevel, dailyLimit: limits[newVipLevel] || 3 });
    },
    onSuccess: () => {
      toast({ title: t("admin.vipLevelUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditVip(false);
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
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
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
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
            <InfoRow label="ID" value={user.numericId || "—"} />
            <InfoRow label="VIP" value={vipNames[user.vipLevel] || `M${user.vipLevel}`} />
            <InfoRow label={t("common.balance")} value={`${Number(user.balance).toFixed(2)} USDT`} />
            <InfoRow label={t("admin.earnings")} value={`${Number(user.totalEarnings).toFixed(2)} USDT`} />
            <InfoRow label={t("common.deposit")} value={`${Number(user.totalDeposit).toFixed(2)} USDT`} />
            <InfoRow label={t("admin.ipAddress")} value={user.lastLoginIp || t("admin.unknown")} />
            <InfoRow label={t("admin.device")} value={user.lastUserAgent ? user.lastUserAgent.slice(0, 40) + "..." : t("admin.unknown")} />
            <InfoRow label={t("admin.status")} value={user.isBanned ? t("admin.blocked") : t("common.active")} color={user.isBanned ? "hsl(var(--primary))" : "hsl(var(--emerald-500, 142 71% 45%))"} />
            <InfoRow label={t("admin.withdrawal")} value={user.withdrawalBanned ? t("admin.banned") : t("admin.allowed") } color={user.withdrawalBanned ? "hsl(var(--primary))" : "hsl(var(--emerald-500, 142 71% 45%))"} />
            <InfoRow label={t("admin.registeredAt")} value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"} />
            <InfoRow label={t("admin.referralCode")} value={user.referralCode} />
            <InfoRow label={t("admin.invitedBy")} value={detail.invitedBy ? `${detail.invitedBy.phone} (ID: ${detail.invitedBy.numericId || "—"})` : t("admin.noInviter")} color={detail.invitedBy ? "hsl(var(--emerald-500, 142 71% 45%))" : "hsl(var(--muted-foreground))"} />
            <InfoRow label={t("admin.loginPassword")} value={user.plainPassword || t("admin.notLoggedYet")} />
            <InfoRow label={t("admin.fundPassword")} value={user.plainFundPassword || t("admin.notUsedYet")} />
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
                {Object.entries(vipNames).map(([lvl, name]) => (
                  <button key={lvl} onClick={() => setNewVipLevel(Number(lvl))}
                    className={`px-3 py-1.5 rounded-lg text-xs border ${Number(lvl) === newVipLevel ? "bg-[#FFB300]/20 border-[#FFB300] text-[#FFB300]" : "bg-background border-border text-muted-foreground"}`}
                    data-testid={`button-vip-${lvl}`}
                  >
                    {name}
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

          {detail.paymentMethods?.length > 0 && (
            <div>
              <p className="text-muted-foreground text-xs font-semibold mb-2">{t("admin.paymentMethods")}</p>
              {detail.paymentMethods.map((m: PaymentMethod) => (
                <div key={m.id} className="bg-card rounded-lg p-2.5 border border-border flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {m.type === "bank" ? <CreditCard className="w-3.5 h-3.5 text-[#3B82F6]" /> : <Wallet className="w-3.5 h-3.5 text-primary" />}
                    <div>
                      <p className="text-foreground text-xs">{m.type === "bank" ? `${m.bankName} - ${m.cardNumber}` : `${m.exchangeName} - ${m.walletAddress?.slice(0, 20)}...`}</p>
                      <p className="text-muted-foreground text-[10px]">{m.type === "bank" ? m.holderName : "TRC20"}</p>
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
                const vipNames: Record<number, string> = { 0: "Stajyor", 1: "M1", 2: "M2", 3: "M3", 4: "M4", 5: "M5", 6: "M6", 7: "M7", 8: "M8", 9: "M9", 10: "M10" };
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
                                  {r.referredVipLevel >= 0 ? (vipNames[r.referredVipLevel] || `M${r.referredVipLevel}`) : "—"}
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

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-card rounded-lg p-2.5 border border-border">
      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-medium mt-0.5 truncate ${!color ? "text-foreground" : ""}`} style={color ? { color } : undefined}>{value}</p>
    </div>
  );
}

function UsersTab({ users: allUsers }: { users: User[] }) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const filtered = allUsers.filter(u => {
    const q = search.toLowerCase();
    return u.phone.toLowerCase().includes(q) ||
      (u.numericId || "").toLowerCase().includes(q) ||
      (u.lastLoginIp || "").includes(q) ||
      (u.referralCode || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("admin.searchPlaceholder")}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10 text-sm"
            data-testid="input-search-users"
          />
        </div>
        <span className="text-muted-foreground text-xs whitespace-nowrap">{t("admin.count", { count: String(filtered.length) })}</span>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="text-left text-muted-foreground font-medium py-2.5 px-3">{t("admin.phone")}</th>
                <th className="text-left text-muted-foreground font-medium py-2.5 px-3">VIP</th>
                <th className="text-left text-muted-foreground font-medium py-2.5 px-3">{t("common.balance")}</th>
                <th className="text-left text-muted-foreground font-medium py-2.5 px-3">IP</th>
                <th className="text-left text-muted-foreground font-medium py-2.5 px-3">{t("admin.status")}</th>
                <th className="text-right text-muted-foreground font-medium py-2.5 px-3">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-2.5 px-3">
                    <p className="text-foreground font-medium">{u.phone}</p>
                    <p className="text-muted-foreground text-[10px]">ID: {u.numericId?.slice(0, 8) || "—"}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary">
                      {vipNames[u.vipLevel] || `M${u.vipLevel}`}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-emerald-500 dark:text-emerald-400 font-mono">{Number(u.balance).toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-muted-foreground font-mono text-[10px]">{u.lastLoginIp || "—"}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex gap-1">
                      {u.isBanned && <span className="px-1.5 py-0.5 rounded text-[9px] bg-primary/20 text-primary">BAN</span>}
                      {u.withdrawalBanned && <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#FFB300]/20 text-[#FFB300]">W-BAN</span>}
                      {!u.isBanned && !u.withdrawalBanned && <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#4ADE80]/20 text-emerald-500 dark:text-emerald-400">OK</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Button size="sm" onClick={() => setSelectedUserId(u.id)} variant="ghost"
                      className="text-[#3B82F6] h-7 px-2 text-xs" data-testid={`button-view-user-${u.id}`}
                    >
                      <Eye className="w-3 h-3 mr-1" /> {t("admin.view")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <UserDetailModal userId={selectedUserId} open={!!selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  );
}

function DepositsTab({ deposits, users: allUsers }: { deposits: DepositRequest[]; users: User[] }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [viewReceipt, setViewReceipt] = useState<string | null>(null);
  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

  const approveMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/deposits/${id}/approve`); },
    onSuccess: () => { toast({ title: t("admin.approved") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits"] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/deposits/${id}/reject`); },
    onSuccess: () => { toast({ title: t("admin.rejected") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/deposits"] }); },
  });

  const filtered = deposits.filter(d => filter === "all" || d.status === filter);

  const filterLabels: Record<string, string> = {
    all: t("common.all"),
    pending: t("common.pending"),
    approved: t("common.approved"),
    rejected: t("common.rejected"),
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${filter === f ? "bg-primary/20 border-primary text-primary" : "bg-card border-border text-muted-foreground"}`}
            data-testid={`button-filter-${f}`}
          >
            {filterLabels[f]}
            <span className="ml-1 opacity-60">({deposits.filter(d => f === "all" || d.status === f).length})</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{t("admin.nothingFound")}</p>}
        {filtered.map(d => {
          const user = userMap[d.userId];
          return (
            <div key={d.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowDownCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-foreground font-semibold text-sm">{Number(d.amount).toFixed(2)} {d.currency}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="text-muted-foreground text-xs">{t("admin.user")}: {user?.phone || d.userId.slice(0, 8)}</p>
                  <p className="text-muted-foreground text-xs">{t("admin.paymentType")}: {d.paymentType === "crypto" ? t("admin.crypto") : t("admin.local")}</p>
                  <p className="text-muted-foreground text-xs">{t("admin.date")}: {new Date(d.createdAt).toLocaleString()}</p>
                  {d.receiptUrl && (
                    <div className="mt-2 cursor-pointer" onClick={() => setViewReceipt(d.receiptUrl)} data-testid={`receipt-thumbnail-${d.id}`}>
                      <img
                        src={d.receiptUrl}
                        alt={t("admin.viewReceipt")}
                        className="w-full max-w-[200px] h-auto rounded-lg border border-border object-cover hover:opacity-80 transition-opacity"
                      />
                      <p className="text-primary text-[10px] mt-1">{t("admin.viewReceipt")}</p>
                    </div>
                  )}
                </div>
                {d.status === "pending" && (
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => approveMutation.mutate(d.id)} className="bg-[#4ADE80] text-black h-8 text-xs rounded-lg" data-testid={`button-approve-deposit-${d.id}`}>
                      <Check className="w-3 h-3 mr-1" /> {t("common.confirm")}
                    </Button>
                    <Button size="sm" onClick={() => rejectMutation.mutate(d.id)} className="bg-primary text-foreground h-8 text-xs rounded-lg" data-testid={`button-reject-deposit-${d.id}`}>
                      <X className="w-3 h-3 mr-1" /> {t("admin.reject")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!viewReceipt} onOpenChange={() => setViewReceipt(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle>{t("admin.viewReceipt")}</DialogTitle>
          </DialogHeader>
          {viewReceipt && (
            <div className="flex items-center justify-center overflow-auto max-h-[80vh]">
              <img
                src={viewReceipt}
                alt={t("admin.viewReceipt")}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WithdrawalsTab({ withdrawals, users: allUsers }: { withdrawals: (WithdrawalRequest & { paymentMethod?: PaymentMethod | null })[]; users: User[] }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

  const approveMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/withdrawals/${id}/approve`); },
    onSuccess: () => { toast({ title: t("admin.approved") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] }); },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/withdrawals/${id}/reject`); },
    onSuccess: () => { toast({ title: t("admin.rejected") }); queryClient.invalidateQueries({ queryKey: ["/api/admin/withdrawals"] }); },
  });

  const filtered = withdrawals.filter(w => filter === "all" || w.status === filter);

  const filterLabels: Record<string, string> = {
    all: t("common.all"),
    pending: t("common.pending"),
    approved: t("common.approved"),
    rejected: t("common.rejected"),
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${filter === f ? "bg-primary/20 border-primary text-primary" : "bg-card border-border text-muted-foreground"}`}
            data-testid={`button-filter-w-${f}`}
          >
            {filterLabels[f]}
            <span className="ml-1 opacity-60">({withdrawals.filter(w => f === "all" || w.status === f).length})</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{t("admin.nothingFound")}</p>}
        {filtered.map(w => {
          const user = userMap[w.userId];
          const pm = w.paymentMethod;
          return (
            <div key={w.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpCircle className="w-4 h-4 text-primary" />
                    <span className="text-foreground font-semibold text-sm">{Number(w.amount).toFixed(2)} USDT</span>
                    <StatusBadge status={w.status} />
                  </div>
                  <p className="text-muted-foreground text-xs">{t("admin.user")}: {user?.phone || w.userId.slice(0, 8)}</p>
                  <p className="text-muted-foreground text-xs">{t("admin.commission")}: {Number(w.commission).toFixed(2)} USDT | {t("admin.net")}: {Number(w.netAmount).toFixed(2)} USDT</p>
                  {pm && (
                    <div className="mt-2 p-2.5 bg-card rounded-lg border border-border">
                      <div className="flex items-center gap-1.5 mb-1">
                        {pm.type === "bank" ? <CreditCard className="w-3.5 h-3.5 text-[#3B82F6]" /> : <Wallet className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />}
                        <span className="text-foreground text-xs font-medium">{pm.type === "bank" ? t("admin.bankCard") : t("admin.usdtWallet")}</span>
                      </div>
                      {pm.type === "bank" ? (
                        <>
                          <p className="text-foreground text-xs">{t("admin.card")}: <span className="text-foreground font-mono">{pm.cardNumber}</span></p>
                          <p className="text-foreground text-xs">{t("admin.owner")}: <span className="text-foreground">{pm.holderName}</span></p>
                          <p className="text-foreground text-xs">{t("admin.bankLabel")}: <span className="text-foreground">{pm.bankName}</span></p>
                        </>
                      ) : (
                        <>
                          <p className="text-foreground text-xs">{t("admin.address")}: <span className="text-foreground font-mono text-[10px]">{pm.walletAddress}</span></p>
                          <p className="text-foreground text-xs">{t("admin.exchange")}: <span className="text-foreground">{pm.exchangeName}</span></p>
                        </>
                      )}
                    </div>
                  )}
                  {!pm && <p className="text-primary text-xs mt-1">{t("admin.noRequisites")}</p>}
                  <p className="text-muted-foreground text-xs mt-1">{t("admin.date")}: {new Date(w.createdAt).toLocaleString()}</p>
                </div>
                {w.status === "pending" && (
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => approveMutation.mutate(w.id)} className="bg-[#4ADE80] text-black h-8 text-xs rounded-lg" data-testid={`button-approve-withdrawal-${w.id}`}>
                      <Check className="w-3 h-3 mr-1" /> {t("common.confirm")}
                    </Button>
                    <Button size="sm" onClick={() => rejectMutation.mutate(w.id)} className="bg-primary text-foreground h-8 text-xs rounded-lg" data-testid={`button-reject-withdrawal-${w.id}`}>
                      <X className="w-3 h-3 mr-1" /> {t("admin.reject")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsTab() {
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
  const [networkType, setNetworkType] = useState("TRC20");

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

  const resetForm = () => { setShowForm(false); setEditingId(null); setBankName(""); setCardNumber(""); setHolderName(""); setWalletAddress(""); setExchangeName(""); setNetworkType("TRC20"); };

  const startEdit = (s: DepositSetting) => {
    setEditingId(s.id);
    setFormType(s.type as "bank" | "usdt");
    setBankName(s.bankName || "");
    setCardNumber(s.cardNumber || "");
    setHolderName(s.holderName || "");
    setWalletAddress(s.walletAddress || "");
    setExchangeName(s.exchangeName || "");
    setNetworkType(s.networkType || "TRC20");
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
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
              <Input value={networkType} onChange={(e) => setNetworkType(e.target.value)} placeholder={t("admin.networkPlaceholder")}
                className="bg-card border-border text-foreground h-9 text-sm" data-testid="input-setting-network" />
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

function TopReferrersTab() {
  const { t } = useI18n();
  const { data: topReferrers = [] } = useQuery<any[]>({ queryKey: ["/api/admin/top-referrers"] });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Trophy className="w-5 h-5 text-[#FFB300]" />
        <h3 className="text-foreground font-bold text-sm">{t("admin.topReferrers")}</h3>
        <span className="text-muted-foreground text-xs">{t("admin.byLevel1Invites")}</span>
      </div>

      {topReferrers.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{t("admin.noDataFound")}</p>}

      <div className="space-y-2">
        {topReferrers.map((r: any, i: number) => (
          <div key={r.referrerId} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i < 3 ? "bg-[#FFB300]/20 text-[#FFB300]" : "bg-muted text-muted-foreground"}`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-foreground text-sm font-medium">{r.phone || r.referrerId.slice(0, 8)}</p>
              <p className="text-muted-foreground text-xs">VIP: {vipNames[r.vipLevel] || "—"} | ID: {r.numericId?.slice(0, 8) || "—"}</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-500 dark:text-emerald-400 font-bold text-sm">{t("admin.count", { count: String(r.count) })}</p>
              <p className="text-muted-foreground text-[10px]">{Number(r.totalCommission).toFixed(2)} USDT</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MultiAccountsTab() {
  const { t } = useI18n();
  const { data: groups = [] } = useQuery<any[]>({ queryKey: ["/api/admin/multi-accounts"] });
  const [expandedIp, setExpandedIp] = useState<string | null>(null);
  const { data: ipUsers } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: false,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-5 h-5 text-primary" />
        <h3 className="text-foreground font-bold text-sm">{t("admin.multiAccounts")}</h3>
      </div>

      {groups.length === 0 && (
        <div className="bg-card rounded-xl p-8 border border-border text-center">
          <Shield className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2" />
          <p className="text-emerald-500 dark:text-emerald-400 text-sm font-semibold">{t("admin.noMultiAccounts")}</p>
          <p className="text-muted-foreground text-xs mt-1">{t("admin.noSameIpUsers")}</p>
        </div>
      )}

      {groups.map((g: any) => (
        <div key={g.ip} className="bg-card rounded-xl border border-primary/20 overflow-hidden">
          <button
            onClick={() => setExpandedIp(expandedIp === g.ip ? null : g.ip)}
            className="w-full p-3 flex items-center justify-between"
            data-testid={`button-expand-ip-${g.ip}`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-primary" />
              <span className="text-foreground text-sm font-mono">{g.ip || "null"}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-primary/20 text-primary font-bold">{g.count} {t("admin.accounts")}</span>
            </div>
            {expandedIp === g.ip ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </button>
          {expandedIp === g.ip && (
            <div className="border-t border-border p-3 space-y-1.5">
              {(g.userIds || []).map((uid: string) => (
                <div key={uid} className="bg-card rounded-lg p-2 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs font-mono">{uid.slice(0, 12)}...</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function StajyorTab({ users: allUsers }: { users: User[] }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const userMap = Object.fromEntries(allUsers.map(u => [u.id, u]));

  const { data: requests = [] } = useQuery<StajyorRequest[]>({ queryKey: ["/api/admin/stajyor-requests"] });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/stajyor-requests/${id}/approve`); },
    onSuccess: () => {
      toast({ title: t("admin.stajyorActivated") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stajyor-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/stajyor-requests/${id}/reject`); },
    onSuccess: () => {
      toast({ title: t("admin.requestRejected") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stajyor-requests"] });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const filtered = requests.filter(r => filter === "all" || r.status === filter);

  const filterLabels: Record<string, string> = {
    all: t("common.all"),
    pending: t("common.pending"),
    approved: t("common.approved"),
    rejected: t("common.rejected"),
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <UserPlus className="w-5 h-5 text-[#78909C]" />
        <h3 className="text-foreground font-bold text-sm">{t("admin.stajyorRequests")}</h3>
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${filter === f ? "bg-primary/20 border-primary text-primary" : "bg-card border-border text-muted-foreground"}`}
            data-testid={`button-filter-stajyor-${f}`}
          >
            {filterLabels[f]}
            <span className="ml-1 opacity-60">({requests.filter(r => f === "all" || r.status === f).length})</span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">{t("admin.nothingFound")}</p>}
        {filtered.map(r => {
          const user = userMap[r.userId];
          return (
            <div key={r.id} className="bg-card rounded-xl p-4 border border-border" data-testid={`stajyor-request-${r.id}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="w-4 h-4 text-[#78909C]" />
                    <span className="text-foreground font-semibold text-sm">{user?.phone || r.userId.slice(0, 8)}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  {r.message && (
                    <div className="flex items-start gap-1.5 mt-1.5 bg-card rounded-lg p-2 border border-border">
                      <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-foreground text-xs">{r.message}</p>
                    </div>
                  )}
                  <p className="text-muted-foreground text-xs mt-1">ID: {user?.numericId?.slice(0, 10) || "—"}</p>
                  <p className="text-muted-foreground text-xs">{t("admin.date")}: {new Date(r.createdAt).toLocaleString()}</p>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => approveMutation.mutate(r.id)}
                      className="bg-[#4ADE80] text-black h-8 text-xs rounded-lg" data-testid={`button-approve-stajyor-${r.id}`}
                    >
                      <Check className="w-3 h-3 mr-1" /> {t("admin.activate")}
                    </Button>
                    <Button size="sm" onClick={() => rejectMutation.mutate(r.id)}
                      className="bg-primary text-foreground h-8 text-xs rounded-lg" data-testid={`button-reject-stajyor-${r.id}`}
                    >
                      <X className="w-3 h-3 mr-1" /> {t("admin.reject")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VipManageTab() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { data: packages = [] } = useQuery<VipPackage[]>({ queryKey: ["/api/vip-packages"] });

  const toggleLockMutation = useMutation({
    mutationFn: async ({ id, locked }: { id: string; locked: boolean }) => {
      await apiRequest("POST", `/api/admin/vip-packages/${id}/toggle-lock`, { locked });
    },
    onSuccess: () => {
      toast({ title: t("admin.vipLevelUpdated") });
      queryClient.invalidateQueries({ queryKey: ["/api/vip-packages"] });
    },
    onError: (e: Error) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const sorted = [...packages].sort((a, b) => a.level - b.level);

  return (
    <div>
      <h3 className="text-foreground font-bold text-sm mb-3">{t("admin.manageVipLevels")}</h3>
      <p className="text-muted-foreground text-xs mb-4">{t("admin.vipManageDesc")}</p>
      <div className="space-y-2">
        {sorted.map((pkg) => (
          <div key={pkg.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pkg.isLocked ? "bg-primary/20" : "bg-[#4ADE80]/20"}`}>
                <Crown className={`w-5 h-5 ${pkg.isLocked ? "text-primary" : "text-emerald-500 dark:text-emerald-400"}`} />
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">{pkg.name}</p>
                <p className="text-muted-foreground text-xs">
                  {t("admin.price")}: ${Number(pkg.price).toFixed(0)} | {t("admin.dailyLabel")}: {pkg.dailyTasks} {t("admin.tasksLabel")} | {t("admin.perVideo")}: ${Number(pkg.perVideoReward).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${pkg.isLocked ? "text-primary" : "text-emerald-500 dark:text-emerald-400"}`}>
                {pkg.isLocked ? t("admin.closed") : t("common.open")}
              </span>
              <Button
                size="sm"
                onClick={() => toggleLockMutation.mutate({ id: pkg.id, locked: !pkg.isLocked })}
                className={`text-xs rounded-lg h-8 px-3 ${pkg.isLocked ? "bg-[#4ADE80] text-black" : "bg-primary text-foreground"}`}
                data-testid={`button-toggle-vip-${pkg.level}`}
              >
                {pkg.isLocked ? t("admin.unlock") : t("admin.lock")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PromoCodesTab() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [newCode, setNewCode] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isOneTime, setIsOneTime] = useState(true);
  const [maxUses, setMaxUses] = useState("");
  const [viewUsagesId, setViewUsagesId] = useState<string | null>(null);

  const { data: promoCodes = [] } = useQuery<PromoCode[]>({ queryKey: ["/api/admin/promo-codes"] });
  const { data: usages = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/promo-codes", viewUsagesId, "usages"],
    queryFn: async () => {
      if (!viewUsagesId) return [];
      const res = await fetch(`/api/admin/promo-codes/${viewUsagesId}/usages`, { credentials: "include" });
      return res.json();
    },
    enabled: !!viewUsagesId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/promo-codes", {
        code: newCode.trim(),
        amount: newAmount,
        isOneTime,
        maxUses: !isOneTime && maxUses ? Number(maxUses) : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: t("admin.promoCreated") });
      setNewCode(""); setNewAmount(""); setMaxUses("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
    },
    onError: (e: any) => toast({ title: t("common.error"), description: e.message, variant: "destructive" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("POST", `/api/admin/promo-codes/${id}/deactivate`); },
    onSuccess: () => {
      toast({ title: t("admin.deleted") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/admin/promo-codes/${id}`); },
    onSuccess: () => {
      toast({ title: t("admin.deleted") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <h3 className="text-foreground font-bold text-sm flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#EF4444]" />
          {t("admin.createPromoCode")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder={t("admin.codeExample")}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10 font-mono uppercase"
            data-testid="input-admin-promo-code"
          />
          <Input
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder={t("admin.amountUsdt")}
            type="number"
            step="0.01"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-10"
            data-testid="input-admin-promo-amount"
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={isOneTime} onChange={() => setIsOneTime(true)} className="accent-[#EF4444]" />
            <span className="text-foreground text-xs">{t("admin.oneTime")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={!isOneTime} onChange={() => setIsOneTime(false)} className="accent-[#EF4444]" />
            <span className="text-foreground text-xs">{t("admin.multiUse")}</span>
          </label>
          {!isOneTime && (
            <Input
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder={t("admin.maxUses")}
              type="number"
              className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-8 w-28 text-xs"
              data-testid="input-admin-promo-max-uses"
            />
          )}
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!newCode.trim() || !newAmount || createMutation.isPending}
          className="w-full bg-gradient-to-r from-[#EF4444] to-[#F97316] text-white font-semibold rounded-xl h-10 disabled:opacity-50"
          data-testid="button-admin-create-promo"
        >
          {createMutation.isPending ? t("admin.creating") : t("admin.createPromo")}
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-foreground font-bold text-sm flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#EF4444]" />
            {t("admin.allPromoCodes")} ({promoCodes.length})
          </h3>
        </div>
        <div className="divide-y divide-border">
          {promoCodes.length === 0 && (
            <p className="text-muted-foreground text-xs text-center py-6">{t("admin.noPromoCodes")}</p>
          )}
          {promoCodes.map((promo) => (
            <div key={promo.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground text-sm">{promo.code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${promo.isActive ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"}`}>
                    {promo.isActive ? t("common.active") : t("admin.inactive")}
                  </span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">{Number(promo.amount).toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-muted-foreground text-[10px]">
                  <span>{promo.isOneTime ? t("admin.oneTime") : `${t("admin.multiUse")}${promo.maxUses ? ` (max: ${promo.maxUses})` : ""}`}</span>
                  <span>{t("admin.used")}: {promo.currentUses}</span>
                  <span>{promo.createdAt ? new Date(promo.createdAt).toLocaleDateString("uz-UZ") : ""}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewUsagesId(viewUsagesId === promo.id ? null : promo.id)}
                    className="text-[#3B82F6] hover:text-foreground transition-colors p-1"
                    data-testid={`button-view-usages-${promo.id}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {promo.isActive && (
                    <button
                      onClick={() => deactivateMutation.mutate(promo.id)}
                      className="text-[#FFB300] hover:text-foreground transition-colors p-1"
                      data-testid={`button-deactivate-${promo.id}`}
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm(t("admin.confirmDeletePromo"))) deleteMutation.mutate(promo.id); }}
                    className="text-red-500 hover:text-foreground transition-colors p-1"
                    data-testid={`button-delete-promo-${promo.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {viewUsagesId === promo.id && (
                <div className="mt-2 bg-background rounded-xl border border-border overflow-hidden">
                  <div className="px-3 py-2 border-b border-border">
                    <span className="text-foreground text-xs font-semibold">{t("admin.usedByUsers")}</span>
                  </div>
                  {usages.length === 0 ? (
                    <p className="text-muted-foreground text-xs text-center py-3">{t("admin.noUsersUsed")}</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {usages.map((u: any, i: number) => (
                        <div key={i} className="px-3 py-2 flex items-center justify-between text-xs">
                          <span className="text-foreground">{u.userPhone || u.userId}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{Number(u.amount).toFixed(2)} USDT</span>
                            <span className="text-muted-foreground text-[10px]">{u.usedAt ? new Date(u.usedAt).toLocaleDateString("uz-UZ") : ""}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const colors: Record<string, string> = { pending: "#FFB300", approved: "hsl(var(--emerald-500, 142 71% 45%))", rejected: "hsl(var(--primary))", completed: "hsl(var(--emerald-500, 142 71% 45%))" };
  const labels: Record<string, string> = { pending: t("common.pending"), approved: t("common.approved"), rejected: t("common.rejected"), completed: t("common.completed") };
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${colors[status]}20`, color: colors[status] }}>
      {labels[status] || status}
    </span>
  );
}

export default function AdminPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("dashboard");

  const { data: allUsers = [], isLoading: usersLoading } = useQuery<User[]>({ queryKey: ["/api/admin/users"] });
  const { data: deposits = [], isLoading: depositsLoading } = useQuery<DepositRequest[]>({ queryKey: ["/api/admin/deposits"] });
  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<(WithdrawalRequest & { paymentMethod?: PaymentMethod | null })[]>({ queryKey: ["/api/admin/withdrawals"] });

  const pendingDeposits = deposits.filter(d => d.status === "pending").length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === "pending").length;
  const { data: stajyorRequests = [] } = useQuery<StajyorRequest[]>({ queryKey: ["/api/admin/stajyor-requests"] });
  const pendingStajyor = stajyorRequests.filter(r => r.status === "pending").length;

  const techTabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "dashboard", label: t("admin.dashboard"), icon: Activity },
    { id: "stajyor", label: t("admin.stajyor"), icon: UserPlus, badge: pendingStajyor || undefined },
    { id: "users", label: t("admin.users"), icon: Users, badge: allUsers.length },
    { id: "referrals", label: t("admin.topReferrals"), icon: Trophy },
    { id: "multi", label: t("admin.multiAccount"), icon: AlertTriangle },
    { id: "settings", label: t("admin.settings"), icon: Settings },
    { id: "vip-manage", label: t("admin.vipManagement"), icon: Crown },
    { id: "promo", label: t("admin.promoCodes"), icon: Mail },
  ];
  const financeTabs: { id: Tab; label: string; icon: any; badge?: number }[] = [
    { id: "deposits", label: t("admin.deposits"), icon: ArrowDownCircle, badge: pendingDeposits || undefined },
    { id: "withdrawals", label: t("admin.withdrawals"), icon: ArrowUpCircle, badge: pendingWithdrawals || undefined },
  ];

  if (usersLoading || depositsLoading || withdrawalsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-foreground font-bold text-lg">{t("admin.title")}</h1>
          </div>
          <a href="/dashboard" className="text-muted-foreground text-xs hover:text-foreground transition-colors" data-testid="link-back-to-site">
            {t("admin.backToSite")}
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        <div className="space-y-2 pb-3 mb-4">
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1.5 px-1">{t("admin.techSection")}</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {techTabs.map(tb => (
                <button key={tb.id} onClick={() => setTab(tb.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-colors ${
                    tab === tb.id ? "bg-primary/20 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`tab-${tb.id}`}
                >
                  <tb.icon className="w-3.5 h-3.5" />
                  {tb.label}
                  {tb.badge !== undefined && tb.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-primary text-foreground font-bold">{tb.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] uppercase tracking-widest mb-1.5 px-1">{t("admin.financeSection")}</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {financeTabs.map(tb => (
                <button key={tb.id} onClick={() => setTab(tb.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap border transition-colors ${
                    tab === tb.id ? "bg-primary/20 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`tab-${tb.id}`}
                >
                  <tb.icon className="w-3.5 h-3.5" />
                  {tb.label}
                  {tb.badge !== undefined && tb.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-primary text-foreground font-bold">{tb.badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {tab === "dashboard" && <AdminDashboard users={allUsers} deposits={deposits} withdrawals={withdrawals} />}
        {tab === "stajyor" && <StajyorTab users={allUsers} />}
        {tab === "users" && <UsersTab users={allUsers} />}
        {tab === "deposits" && <DepositsTab deposits={deposits} users={allUsers} />}
        {tab === "withdrawals" && <WithdrawalsTab withdrawals={withdrawals} users={allUsers} />}
        {tab === "referrals" && <TopReferrersTab />}
        {tab === "multi" && <MultiAccountsTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "vip-manage" && <VipManageTab />}
        {tab === "promo" && <PromoCodesTab />}
      </div>
    </div>
  );
}
