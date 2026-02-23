import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  User as UserIcon, Crown, Copy, LogOut, ChevronRight,
  Wallet, ListChecks, Users, Camera, Shield, Lock,
  Phone, CreditCard, Headphones, ScrollText, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User } from "@shared/schema";
import AppLayout from "@/components/app-layout";

export default function ProfilePage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSecretInfo, setShowSecretInfo] = useState(false);

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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      avatarMutation.mutate(file);
    }
  };

  const copyId = () => {
    if (user?.numericId) {
      navigator.clipboard.writeText(user.numericId);
      toast({ title: "Nusxalandi!", description: "ID nusxalandi" });
    }
  };

  const vipNames = ["Bepul", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];
  const vipColors = ["#999", "#CD7F32", "#C0C0C0", "#FFD700", "#E5E4E2", "#B9F2FF"];

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

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              data-testid="input-avatar-file"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-bold text-lg" data-testid="text-profile-name">{displayName}</h2>
              {user.vipLevel > 0 && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: vipColors[user.vipLevel] + "30", color: vipColors[user.vipLevel] }}
                >
                  {vipNames[user.vipLevel]}
                </span>
              )}
            </div>
            <button onClick={copyId} className="flex items-center gap-1 mt-0.5 group" data-testid="button-copy-id">
              <span className="text-[#888] text-xs">ID: {user.numericId || "—"}</span>
              <Copy className="w-3 h-3 text-[#555] group-hover:text-[#FF6B35]" />
            </button>
          </div>
          <button onClick={() => navigate("/vip")} data-testid="button-settings">
            <Settings className="w-5 h-5 text-[#888]" />
          </button>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl p-4 shadow-sm border border-[#2a2a2a]">
          <div className="grid grid-cols-3 divide-x divide-[#222]">
            <div className="text-center px-2">
              <p className="text-[#FF6B35] font-bold text-base" data-testid="text-balance-deposit">
                {Number(user.totalDeposit || 0).toFixed(2)} USDT
              </p>
              <p className="text-[#666] text-[10px] mt-0.5">Kiritilgan</p>
            </div>
            <div className="text-center px-2">
              <p className="text-[#4CAF50] font-bold text-base" data-testid="text-balance-work">
                {Number(user.balance).toFixed(2)} USDT
              </p>
              <p className="text-[#666] text-[10px] mt-0.5">Balans</p>
            </div>
            <div className="text-center px-2">
              <p className="text-[#E8453C] font-bold text-base" data-testid="text-balance-income">
                {Number(user.totalEarnings || 0).toFixed(2)} USDT
              </p>
              <p className="text-[#666] text-[10px] mt-0.5">Daromad</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#FF6B35]/10 to-[#FF6B35]/20 rounded-2xl p-3.5 flex items-center justify-between border border-[#FF6B35]/20">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-[#FFD700] to-[#FFA000] rounded-lg px-2 py-1">
              <span className="text-white text-xs font-bold">VIP</span>
            </div>
            <span className="text-[#aaa] text-sm" data-testid="text-vip-status">
              {user.vipLevel > 0
                ? `${vipNames[user.vipLevel]} a'zo`
                : "VIP a'zo emassiz"}
            </span>
          </div>
          <button
            onClick={() => navigate("/vip")}
            className="text-[#FF6B35] text-sm font-semibold flex items-center gap-1"
            data-testid="button-vip-extend"
          >
            {user.vipLevel > 0 ? "Yangilash" : "Sotib olish"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl shadow-sm border border-[#2a2a2a] overflow-hidden">
          <h3 className="text-white font-bold text-sm px-4 pt-4 pb-2">Mening xizmatlarim</h3>
          <div className="divide-y divide-[#222]">
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
            <button className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-support">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/20 flex items-center justify-center">
                  <Headphones className="w-4 h-4 text-[#3b6db5]" />
                </div>
                <span className="text-[#ddd] text-sm">Mijozlarni qo'llab-quvvatlash</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#555]" />
            </button>
            <button className="flex items-center justify-between px-4 py-3.5 w-full text-left" data-testid="menu-history">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#9C27B0]/20 flex items-center justify-center">
                  <ScrollText className="w-4 h-4 text-[#9C27B0]" />
                </div>
                <span className="text-[#ddd] text-sm">To'lov tarixi</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#555]" />
            </button>
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
                    onClick={() => {
                      navigator.clipboard.writeText(user.referralCode);
                      toast({ title: "Nusxalandi!" });
                    }}
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
                  <button
                    onClick={copyId}
                    className="text-[#FF6B35]"
                    data-testid="button-copy-id-secret"
                  >
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
                <p className="text-white font-bold text-sm" data-testid="text-secret-balance">
                  {Number(user.balance).toFixed(2)} USDT
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
