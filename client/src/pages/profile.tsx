import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User as UserIcon, Phone, Shield, Crown, Copy, LogOut, ChevronRight, Wallet, ListChecks, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";
import AppLayout from "@/components/app-layout";

export default function ProfilePage() {
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: referralStats } = useQuery<{ level1: number; level2: number; level3: number; totalEarnings: string }>({
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

  const copyReferralCode = () => {
    if (user?.referralCode) {
      navigator.clipboard.writeText(user.referralCode);
      toast({ title: "Nusxalandi!", description: "Referal kod nusxalandi" });
    }
  };

  const vipNames = ["Bepul", "Bronze", "Silver", "Gold", "Platinum", "Diamond"];

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

  const totalReferrals = (referralStats?.level1 || 0) + (referralStats?.level2 || 0) + (referralStats?.level3 || 0);

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold" data-testid="text-profile-phone">{user.phone}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Crown className="w-3.5 h-3.5 text-white/80" />
                <span className="text-white/80 text-sm" data-testid="text-profile-vip">
                  {vipNames[user.vipLevel] || `VIP ${user.vipLevel}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#f0f0f0]">
            <Wallet className="w-5 h-5 text-[#FF6B35] mx-auto mb-1" />
            <p className="text-[#1a1a2e] font-bold text-sm" data-testid="text-profile-balance">
              {Number(user.balance).toLocaleString()}
            </p>
            <p className="text-[#999] text-[10px]">Balans (so'm)</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#f0f0f0]">
            <ListChecks className="w-5 h-5 text-[#4CAF50] mx-auto mb-1" />
            <p className="text-[#1a1a2e] font-bold text-sm" data-testid="text-profile-tasks">
              {user.dailyTasksCompleted} / {user.dailyTasksLimit}
            </p>
            <p className="text-[#999] text-[10px]">Kunlik vazifa</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#f0f0f0]">
            <Users className="w-5 h-5 text-[#3b6db5] mx-auto mb-1" />
            <p className="text-[#1a1a2e] font-bold text-sm" data-testid="text-profile-referrals">
              {totalReferrals}
            </p>
            <p className="text-[#999] text-[10px]">Referallar</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#f0f0f0] overflow-hidden">
          <h3 className="text-[#1a1a2e] font-bold text-sm px-4 pt-4 pb-2">Ma'lumotlar</h3>

          <div className="divide-y divide-[#f5f5f5]">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-[#666] text-sm">Telefon raqam</span>
              </div>
              <span className="text-[#1a1a2e] text-sm font-medium">{user.phone}</span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Crown className="w-4 h-4 text-[#FFB300]" />
                <span className="text-[#666] text-sm">VIP daraja</span>
              </div>
              <span className="text-[#1a1a2e] text-sm font-medium">
                {vipNames[user.vipLevel] || `VIP ${user.vipLevel}`}
              </span>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-[#4CAF50]" />
                <span className="text-[#666] text-sm">Referal kod</span>
              </div>
              <button
                onClick={copyReferralCode}
                className="flex items-center gap-1.5 text-[#FF6B35] text-sm font-medium"
                data-testid="button-copy-referral-code"
              >
                {user.referralCode}
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Wallet className="w-4 h-4 text-[#3b6db5]" />
                <span className="text-[#666] text-sm">Umumiy balans</span>
              </div>
              <span className="text-[#1a1a2e] text-sm font-medium">
                {Number(user.balance).toLocaleString()} so'm
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          variant="outline"
          className="w-full border-red-200 text-red-500 hover:bg-red-50 rounded-xl h-12 font-semibold gap-2"
          data-testid="button-profile-logout"
        >
          <LogOut className="w-4 h-4" />
          {logoutMutation.isPending ? "Chiqilmoqda..." : "Hisobdan chiqish"}
        </Button>
      </div>
    </AppLayout>
  );
}
