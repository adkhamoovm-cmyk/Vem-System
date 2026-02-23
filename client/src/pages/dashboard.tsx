import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, PlayCircle, Users, Crown, Star, DollarSign, Zap, Film, Tv, ChevronRight } from "lucide-react";
import type { User, Video, VipPackage } from "@shared/schema";
import AppLayout from "@/components/app-layout";

const vipNames: Record<number, string> = {
  0: "Stajyor",
  1: "M1", 2: "M2", 3: "M3", 4: "M4", 5: "M5",
  6: "M6", 7: "M7", 8: "M8", 9: "M9", 10: "M10",
};

export default function DashboardPage() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: videos } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: vipPackages } = useQuery<VipPackage[]>({
    queryKey: ["/api/vip-packages"],
  });

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

  const tasksProgress = user.dailyTasksLimit > 0
    ? (user.dailyTasksCompleted / user.dailyTasksLimit) * 100
    : 0;

  const currentPkg = vipPackages?.find(p => p.level === user.vipLevel);
  const perVideo = currentPkg ? Number(currentPkg.perVideoReward) : 0;
  const dailyPotential = currentPkg ? Number(currentPkg.dailyEarning) : 0;

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-[#FF6B35] via-[#E8553C] to-[#D63A3A] rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-white/70 text-[10px] font-medium uppercase tracking-wider">Joriy daraja</span>
                  <p className="font-bold text-sm leading-tight">{vipNames[user.vipLevel] || `VIP ${user.vipLevel}`}</p>
                </div>
              </div>
              <Link href="/vip">
                <span className="bg-white/20 text-[10px] px-3 py-1.5 rounded-full backdrop-blur-sm font-medium cursor-pointer">
                  Yangilash
                </span>
              </Link>
            </div>
            <div className="text-3xl font-bold tracking-tight" data-testid="text-balance">
              ${Number(user.balance).toFixed(2)}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>Kunlik: ${dailyPotential.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1 text-white/70 text-xs">
                <Film className="w-3 h-3" />
                <span>${perVideo.toFixed(2)} / video</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f0f0f0]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-[#1a1a2e] text-sm font-semibold">Bugungi vazifalar</span>
            </div>
            <span className="text-[#FF6B35] text-sm font-bold" data-testid="text-tasks-progress">
              {user.dailyTasksCompleted} / {user.dailyTasksLimit}
            </span>
          </div>
          <Progress
            value={tasksProgress}
            className="h-2.5 bg-[#f0f0f0] rounded-full"
            data-testid="progress-tasks"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-[#999] text-xs">
              {user.dailyTasksCompleted < user.dailyTasksLimit
                ? `Yana ${user.dailyTasksLimit - user.dailyTasksCompleted} ta video qoldi`
                : "Bugungi limitga yetdingiz!"}
            </p>
            <Link href="/tasks">
              <span className="text-[#FF6B35] text-xs font-semibold flex items-center gap-0.5 cursor-pointer">
                Boshlash <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f0f0f0]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#E8F5E9] rounded-xl flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-[#4CAF50]" />
              </div>
              <span className="text-[#999] text-[10px] uppercase tracking-wider font-medium">Umumiy daromad</span>
            </div>
            <p className="text-[#1a1a2e] font-bold text-lg" data-testid="text-total-earnings">
              ${Number(user.totalEarnings).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f0f0f0]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#E3F2FD] rounded-xl flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#2196F3]" />
              </div>
              <span className="text-[#999] text-[10px] uppercase tracking-wider font-medium">Depozit</span>
            </div>
            <p className="text-[#1a1a2e] font-bold text-lg" data-testid="text-total-deposit">
              ${Number(user.totalDeposit).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { title: "Vazifalar", href: "/tasks", icon: PlayCircle, color: "#FF6B35", bg: "#FFF0EB" },
            { title: "Taklif", href: "/referral", icon: Users, color: "#4CAF50", bg: "#E8F5E9" },
            { title: "VIP", href: "/vip", icon: Crown, color: "#9C27B0", bg: "#F3E5F5" },
            { title: "Trendlar", href: "/trends", icon: Tv, color: "#2196F3", bg: "#E3F2FD" },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center gap-1.5 cursor-pointer" data-testid={`quick-${item.title.toLowerCase()}`}>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: item.bg }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <span className="text-[#555] text-[10px] font-medium text-center leading-tight">{item.title}</span>
              </div>
            </Link>
          ))}
        </div>

        {currentPkg && (
          <div className="bg-gradient-to-r from-[#FFF8E1] to-[#FFF3E0] rounded-2xl p-4 border border-[#FFE082]">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-[#FF8F00]" />
              <span className="text-[#7B6B3A] text-xs font-bold">Sizning VIP imkoniyatlaringiz</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-[#FF6B35] font-bold text-sm">{currentPkg.dailyTasks}</p>
                <p className="text-[#999] text-[9px]">Kunlik video</p>
              </div>
              <div className="text-center">
                <p className="text-[#FF6B35] font-bold text-sm">${Number(currentPkg.perVideoReward).toFixed(2)}</p>
                <p className="text-[#999] text-[9px]">Har video</p>
              </div>
              <div className="text-center">
                <p className="text-[#FF6B35] font-bold text-sm">${Number(currentPkg.dailyEarning).toFixed(2)}</p>
                <p className="text-[#999] text-[9px]">Kunlik daromad</p>
              </div>
            </div>
          </div>
        )}

        {videos && videos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#1a1a2e] font-bold text-sm">Yangi kontentlar</h3>
              <Link href="/trends" className="text-[#FF6B35] text-xs font-semibold">
                Barchasi &rarr;
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {videos.slice(0, 5).map((video) => (
                <Link key={video.id} href="/tasks">
                  <div className="relative w-28 shrink-0 cursor-pointer" data-testid={`rec-video-${video.id}`}>
                    <div className="w-28 h-40 rounded-xl overflow-hidden bg-[#f0f0f0] shadow-md">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-xl" />
                    </div>
                    <div className="absolute top-1.5 right-1.5">
                      <span className="bg-[#FF6B35]/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">
                        {video.category}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h4 className="text-white font-bold text-[10px] leading-tight line-clamp-2">{video.title}</h4>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <Star className="w-2.5 h-2.5 fill-[#FFD700] text-[#FFD700]" />
                        <span className="text-white/80 text-[9px]">{video.rating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
