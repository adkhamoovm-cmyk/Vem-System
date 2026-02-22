import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, Star, PlayCircle, Users, Crown } from "lucide-react";
import type { User } from "@shared/schema";
import AppLayout from "@/components/app-layout";

const vipNames: Record<number, string> = {
  0: "Bepul",
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Platinum",
  5: "Diamond",
};

export default function DashboardPage() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  const tasksProgress = user.dailyTasksLimit > 0
    ? (user.dailyTasksCompleted / user.dailyTasksLimit) * 100
    : 0;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-[#1e1b14] to-[#1a1a1a] rounded-lg p-6 border border-[#2a2510]" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 text-[#c9a84c]" />
            <span className="text-[#888] text-sm">Umumiy balans</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-[#c9a84c] tracking-tight" data-testid="text-balance">
              {Number(user.balance).toLocaleString("uz-UZ")}
            </span>
            <span className="text-[#c9a84c]/60 text-lg">so'm</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-[#c9a84c]" />
              <span className="text-[#888] text-xs uppercase tracking-wider">VIP Daraja</span>
            </div>
            <span className="text-lg font-semibold text-[#e0e0e0]" data-testid="text-vip-level">
              {vipNames[user.vipLevel] || `VIP ${user.vipLevel}`}
            </span>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#3b6db5]" />
              <span className="text-[#888] text-xs uppercase tracking-wider">Kunlik limit</span>
            </div>
            <span className="text-lg font-semibold text-[#e0e0e0]" data-testid="text-daily-limit">
              {user.dailyTasksLimit} ta video
            </span>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-5 border border-[#2a2a2a]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-[#3b6db5]" />
              <span className="text-[#999] text-sm">Kunlik vazifalar</span>
            </div>
            <span className="text-[#e0e0e0] text-sm font-medium" data-testid="text-tasks-progress">
              {user.dailyTasksCompleted} / {user.dailyTasksLimit}
            </span>
          </div>
          <Progress
            value={tasksProgress}
            className="h-2 bg-[#222]"
            data-testid="progress-tasks"
          />
          <p className="text-[#666] text-xs mt-2">
            Bugun {user.dailyTasksLimit} ta videodan {user.dailyTasksCompleted} tasini ko'rdingiz
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/tasks">
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a] hover-elevate cursor-pointer transition-all">
              <PlayCircle className="w-8 h-8 text-[#c9a84c] mb-2" />
              <h3 className="text-[#e0e0e0] font-medium text-sm">Vazifalar</h3>
              <p className="text-[#666] text-xs mt-1">Video ko'rib pul ishlang</p>
            </div>
          </Link>
          <Link href="/referral">
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a] hover-elevate cursor-pointer transition-all">
              <Users className="w-8 h-8 text-[#3b6db5] mb-2" />
              <h3 className="text-[#e0e0e0] font-medium text-sm">Referal</h3>
              <p className="text-[#666] text-xs mt-1">Do'stlaringizni taklif qiling</p>
            </div>
          </Link>
          <Link href="/vip">
            <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a] hover-elevate cursor-pointer transition-all">
              <Star className="w-8 h-8 text-[#c9a84c] mb-2" />
              <h3 className="text-[#e0e0e0] font-medium text-sm">VIP Paketlar</h3>
              <p className="text-[#666] text-xs mt-1">Darajangizni oshiring</p>
            </div>
          </Link>
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
            <Wallet className="w-8 h-8 text-[#3b6db5] mb-2" />
            <h3 className="text-[#e0e0e0] font-medium text-sm">Pul yechish</h3>
            <p className="text-[#666] text-xs mt-1">Tez orada</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
