import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, PlayCircle, Users, Crown, Star, DollarSign, Zap, Film, Tv, ChevronRight, Play, ArrowRightLeft, HelpCircle } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { User, Video, VipPackage } from "@shared/schema";
import AppLayout from "@/components/app-layout";

const UZS_RATE = 12850;

const vipNames: Record<number, string> = {
  0: "Stajyor",
  1: "M1", 2: "M2", 3: "M3", 4: "M4", 5: "M5",
  6: "M6", 7: "M7", 8: "M8", 9: "M9", 10: "M10",
};

function formatUZS(usd: number): string {
  const uzs = usd * UZS_RATE;
  return uzs.toLocaleString("uz-UZ", { maximumFractionDigits: 0 });
}

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
  const balance = Number(user.balance);

  const tvShows = videos?.filter(v => v.category === "Tele-shou") || [];
  const trailers = videos?.filter(v => v.category === "Treyler") || [];
  const allVideos = videos || [];

  const [heroIndex, setHeroIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (allVideos.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setHeroIndex((prev) => (prev + 1) % allVideos.length);
      setIsTransitioning(false);
    }, 500);
  }, [allVideos.length]);

  useEffect(() => {
    if (allVideos.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [allVideos.length, nextSlide]);

  const heroVideo = allVideos[heroIndex];

  return (
    <AppLayout>
      <div className="bg-[#0a0a0a] min-h-screen -mt-0">
        {heroVideo && (
          <div className="relative w-full h-[280px] overflow-hidden">
            <img
              src={heroVideo.thumbnail}
              alt={heroVideo.title}
              className={`w-full h-full object-cover transition-all duration-500 ${isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"}`}
              data-testid="hero-poster"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/70 to-transparent" />
            <div className={`absolute bottom-6 left-4 right-4 z-10 transition-all duration-500 ${isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#FF6B35] text-white text-[9px] font-bold px-2 py-0.5 rounded">{heroVideo.category}</span>
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700]" />
                  <span className="text-white/90 text-xs">{heroVideo.rating}</span>
                </div>
              </div>
              <h2 className="text-white font-bold text-xl leading-tight mb-2">{heroVideo.title}</h2>
              <p className="text-white/60 text-xs mb-3">{heroVideo.actors}</p>
              <div className="flex gap-2">
                <Link href="/tasks">
                  <button className="flex items-center gap-1.5 bg-white text-black font-bold text-xs px-5 py-2.5 rounded-md cursor-pointer" data-testid="button-hero-play">
                    <Play className="w-4 h-4 fill-black" />
                    Ko'rish
                  </button>
                </Link>
                <Link href="/trends">
                  <button className="flex items-center gap-1.5 bg-white/20 text-white font-medium text-xs px-4 py-2.5 rounded-md backdrop-blur-sm cursor-pointer" data-testid="button-hero-info">
                    Batafsil
                  </button>
                </Link>
              </div>
            </div>
            {allVideos.length > 1 && (
              <div className="absolute bottom-2 right-4 z-10 flex gap-1">
                {allVideos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setIsTransitioning(true); setTimeout(() => { setHeroIndex(i); setIsTransitioning(false); }, 300); }}
                    className={`h-1 rounded-full transition-all duration-300 ${i === heroIndex ? "w-5 bg-[#FF6B35]" : "w-1.5 bg-white/30"}`}
                    data-testid={`hero-dot-${i}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-4 -mt-1 space-y-5 pb-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B35] to-[#E8453C] rounded-lg flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[#888] text-[9px] uppercase tracking-wider">{vipNames[user.vipLevel] || `VIP ${user.vipLevel}`}</span>
                  <p className="text-white text-xs font-medium">ID: {user.numericId || "—"}</p>
                </div>
              </div>
              <Link href="/vip">
                <span className="bg-[#FF6B35]/20 text-[#FF6B35] text-[10px] px-3 py-1 rounded-full font-semibold cursor-pointer" data-testid="link-upgrade-vip">
                  Yangilash
                </span>
              </Link>
            </div>

            <div className="bg-[#111] rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#888] text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" />
                  Balans
                </span>
                <span className="text-[#888] text-[9px]">1 USDT = {UZS_RATE.toLocaleString()} UZS</span>
              </div>
              <div className="flex items-end justify-between" data-testid="text-balance">
                <div>
                  <p className="text-white font-bold text-2xl tracking-tight">{balance.toFixed(2)} <span className="text-[#4ADE80] text-sm font-semibold">USDT</span></p>
                  <p className="text-[#888] text-sm mt-0.5">{formatUZS(balance)} <span className="text-xs">UZS</span></p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-[#4ADE80] text-xs">
                    <TrendingUp className="w-3 h-3" />
                    <span>+{dailyPotential.toFixed(2)}/kun</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#111] rounded-xl p-3">
                <span className="text-[#888] text-[9px] uppercase tracking-wider">Daromad</span>
                <p className="text-white font-bold text-sm mt-1" data-testid="text-total-earnings">{Number(user.totalEarnings).toFixed(2)} USDT</p>
                <p className="text-[#666] text-[10px]">{formatUZS(Number(user.totalEarnings))} UZS</p>
              </div>
              <div className="bg-[#111] rounded-xl p-3">
                <span className="text-[#888] text-[9px] uppercase tracking-wider">Depozit</span>
                <p className="text-white font-bold text-sm mt-1" data-testid="text-total-deposit">{Number(user.totalDeposit).toFixed(2)} USDT</p>
                <p className="text-[#666] text-[10px]">{formatUZS(Number(user.totalDeposit))} UZS</p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-white text-sm font-semibold">Bugungi vazifalar</span>
              </div>
              <span className="text-[#FF6B35] text-sm font-bold" data-testid="text-tasks-progress">
                {user.dailyTasksCompleted} / {user.dailyTasksLimit}
              </span>
            </div>
            <Progress
              value={tasksProgress}
              className="h-2 bg-[#2a2a2a] rounded-full"
              data-testid="progress-tasks"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[#666] text-xs">
                {user.vipLevel < 0
                  ? "Imtiyoz mavjud emas"
                  : user.dailyTasksCompleted < user.dailyTasksLimit
                    ? `Yana ${user.dailyTasksLimit - user.dailyTasksCompleted} ta video qoldi`
                    : "Bugungi limitga yetdingiz!"}
              </p>
              <Link href="/tasks">
                <span className="text-[#FF6B35] text-xs font-semibold flex items-center gap-0.5 cursor-pointer" data-testid="link-start-tasks">
                  Boshlash <ChevronRight className="w-3 h-3" />
                </span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[
              { title: "Vazifalar", href: "/tasks", icon: PlayCircle, color: "#FF6B35", bg: "#FF6B35" },
              { title: "Fund", href: "/fund", icon: Wallet, color: "#E8453C", bg: "#E8453C" },
              { title: "Taklif", href: "/referral", icon: Users, color: "#4ADE80", bg: "#4ADE80" },
              { title: "VIP", href: "/vip", icon: Crown, color: "#A855F7", bg: "#A855F7" },
              { title: "Yordam", href: "/help", icon: HelpCircle, color: "#3B82F6", bg: "#3B82F6" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <div className="flex flex-col items-center gap-1.5 cursor-pointer" data-testid={`quick-${item.title.toLowerCase()}`}>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: item.bg + "20" }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="text-[#aaa] text-[10px] font-medium text-center leading-tight">{item.title}</span>
                </div>
              </Link>
            ))}
          </div>

          {tvShows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Tv className="w-4 h-4 text-[#FF6B35]" />
                  TV Showlar
                </h3>
                <Link href="/trends" className="text-[#888] text-xs">
                  Barchasi <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {tvShows.map((video) => (
                  <Link key={video.id} href="/tasks">
                    <div className="relative w-32 shrink-0 cursor-pointer group" data-testid={`tv-show-${video.id}`}>
                      <div className="w-32 h-48 rounded-lg overflow-hidden bg-[#1a1a1a] shadow-lg">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-lg" />
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="bg-[#E50914] text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                          TOP
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h4 className="text-white font-bold text-[11px] leading-tight line-clamp-2">{video.title}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-2.5 h-2.5 fill-[#FFD700] text-[#FFD700]" />
                          <span className="text-white/70 text-[9px]">{video.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {trailers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#FF6B35]" />
                  Traylerlar
                </h3>
                <Link href="/trends" className="text-[#888] text-xs">
                  Barchasi <ChevronRight className="w-3 h-3 inline" />
                </Link>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {trailers.map((video) => (
                  <Link key={video.id} href="/tasks">
                    <div className="relative w-56 shrink-0 cursor-pointer group" data-testid={`trailer-${video.id}`}>
                      <div className="w-56 h-32 rounded-lg overflow-hidden bg-[#1a1a1a] shadow-lg">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-lg" />
                      </div>
                      <div className="absolute top-2 right-2">
                        <div className="bg-black/60 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h4 className="text-white font-bold text-xs leading-tight">{video.title}</h4>
                        <p className="text-white/50 text-[9px] mt-0.5">{video.actors?.split(",")[0]}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {currentPkg && (
            <div className="bg-gradient-to-r from-[#FF6B35]/10 to-[#E8453C]/10 rounded-2xl p-4 border border-[#FF6B35]/20">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-white/80 text-xs font-bold">VIP imkoniyatlaringiz</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-[#FF6B35] font-bold text-sm">{currentPkg.dailyTasks}</p>
                  <p className="text-[#666] text-[9px]">Kunlik video</p>
                </div>
                <div className="text-center">
                  <p className="text-[#FF6B35] font-bold text-sm">${Number(currentPkg.perVideoReward).toFixed(2)}</p>
                  <p className="text-[#666] text-[9px]">Har video</p>
                </div>
                <div className="text-center">
                  <p className="text-[#FF6B35] font-bold text-sm">${Number(currentPkg.dailyEarning).toFixed(2)}</p>
                  <p className="text-[#666] text-[9px]">Kunlik daromad</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
