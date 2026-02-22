import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, PlayCircle, Users, Crown, Star, Volume2 } from "lucide-react";
import type { User, Video } from "@shared/schema";
import AppLayout from "@/components/app-layout";

const vipNames: Record<number, string> = {
  0: "Bepul",
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Platinum",
  5: "Diamond",
};

const quickLinks = [
  { title: "Vazifalar", href: "/tasks", icon: PlayCircle, color: "#FF6B35", bg: "#FFF0EB" },
  { title: "Taklif qilish", href: "/referral", icon: Users, color: "#4CAF50", bg: "#E8F5E9" },
  { title: "VIP Paketlar", href: "/vip", icon: Crown, color: "#9C27B0", bg: "#F3E5F5" },
  { title: "Balans", href: "/dashboard", icon: Wallet, color: "#2196F3", bg: "#E3F2FD" },
];

export default function DashboardPage() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: videos } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
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

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white/80 text-xs font-medium uppercase tracking-wider">
                  {vipNames[user.vipLevel] || `VIP ${user.vipLevel}`}
                </span>
                <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full">
                  V{user.vipLevel}
                </span>
              </div>
              <div className="text-3xl font-bold tracking-tight" data-testid="text-balance">
                {Number(user.balance).toLocaleString("uz-UZ")} so'm
              </div>
              <div className="flex items-center gap-1 mt-1 text-white/70 text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>Kunlik daromad: {user.dailyTasksCompleted} / {user.dailyTasksLimit} vazifa</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white/90" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#f0f0f0]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[#1a1a2e] text-sm font-semibold">Kunlik vazifalar</span>
            <span className="text-[#FF6B35] text-sm font-bold" data-testid="text-tasks-progress">
              {user.dailyTasksCompleted} / {user.dailyTasksLimit}
            </span>
          </div>
          <Progress
            value={tasksProgress}
            className="h-2.5 bg-[#f0f0f0] rounded-full"
            data-testid="progress-tasks"
          />
          <p className="text-[#999] text-xs mt-2">
            Bugun {user.dailyTasksLimit} ta videodan {user.dailyTasksCompleted} tasini ko'rdingiz
          </p>
        </div>

        <div className="bg-[#FFF8E1] rounded-2xl p-3.5 flex items-center gap-3 border border-[#FFE082]">
          <div className="w-9 h-9 bg-[#FF6B35] rounded-xl flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 text-white" />
          </div>
          <p className="text-[#7B6B3A] text-xs font-medium leading-relaxed">
            Yangilik: Premium VIP paketlar mavjud! Darajangizni oshiring va ko'proq ishlang.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center gap-1.5 cursor-pointer" data-testid={`quick-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
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

        {videos && videos.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#1a1a2e] font-bold text-sm">Tavsiya etilgan videolar</h3>
              <Link href="/tasks" className="text-[#FF6B35] text-xs font-semibold">
                Barchasi &rarr;
              </Link>
            </div>
            <div className="space-y-3">
              {videos.slice(0, 3).map((video) => (
                <Link key={video.id} href="/tasks">
                  <div className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm border border-[#f0f0f0] cursor-pointer" data-testid={`rec-video-${video.id}`}>
                    <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 bg-[#f0f0f0]">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="text-[#1a1a2e] font-semibold text-sm">{video.title}</h4>
                      <p className="text-[#999] text-xs mt-1 line-clamp-2">{video.category}</p>
                      <div className="flex items-center gap-0.5 mt-2">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className="w-3 h-3 fill-[#FFB300] text-[#FFB300]" />
                        ))}
                      </div>
                      <div className="mt-2">
                        <span className="text-[#FF6B35] text-xs font-bold">
                          +{Number(video.reward).toLocaleString()} so'm
                        </span>
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
