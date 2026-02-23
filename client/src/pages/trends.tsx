import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Link } from "wouter";
import { TrendingUp, Star, Eye, Clock, Flame } from "lucide-react";
import type { Video, User } from "@shared/schema";
import AppLayout from "@/components/app-layout";

export default function TrendsPage() {
  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
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

  const sortedByRating = [...(videos || [])].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  const topVideos = sortedByRating.slice(0, 3);
  const otherVideos = sortedByRating.slice(3);

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#FF6B35]" />
          <h1 className="text-[#1a1a2e] font-bold text-lg">Trendlar</h1>
        </div>

        {topVideos.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-4 h-4 text-[#E8453C]" />
              <span className="text-[#1a1a2e] font-semibold text-sm">Top reytinglar</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {topVideos.map((video, index) => (
                <Link key={video.id} href="/tasks">
                  <div className="relative w-36 shrink-0 cursor-pointer" data-testid={`trend-top-${video.id}`}>
                    <div className="w-36 h-52 rounded-2xl overflow-hidden bg-[#f0f0f0] shadow-md">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-2xl" />
                    </div>
                    <div className="absolute top-2 left-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                        index === 0 ? "bg-gradient-to-br from-[#FFD700] to-[#FFA000]" :
                        index === 1 ? "bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0]" :
                        "bg-gradient-to-br from-[#CD7F32] to-[#A0522D]"
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <h4 className="text-white font-bold text-xs truncate">{video.title}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700]" />
                        <span className="text-white/90 text-[10px] font-medium">{video.rating}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#f0f0f0]">
            <Eye className="w-5 h-5 text-[#FF6B35] mx-auto mb-1" />
            <p className="text-[#1a1a2e] font-bold text-sm">{videos?.length || 0}</p>
            <p className="text-[#999] text-[10px]">Jami videolar</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#f0f0f0]">
            <TrendingUp className="w-5 h-5 text-[#4CAF50] mx-auto mb-1" />
            <p className="text-[#1a1a2e] font-bold text-sm">{user?.dailyTasksCompleted || 0}</p>
            <p className="text-[#999] text-[10px]">Ko'rilgan</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#f0f0f0]">
            <Clock className="w-5 h-5 text-[#3b6db5] mx-auto mb-1" />
            <p className="text-[#1a1a2e] font-bold text-sm">
              {videos?.reduce((sum, v) => sum + (v.duration || 0), 0) || 0}s
            </p>
            <p className="text-[#999] text-[10px]">Umumiy vaqt</p>
          </div>
        </div>

        <div>
          <h3 className="text-[#1a1a2e] font-bold text-sm mb-3">Barcha trendlar</h3>
          <div className="grid grid-cols-2 gap-3">
            {(otherVideos.length > 0 ? otherVideos : sortedByRating).map((video) => (
              <Link key={video.id} href="/tasks">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#f0f0f0] cursor-pointer" data-testid={`trend-card-${video.id}`}>
                  <div className="relative aspect-[3/4] bg-[#f0f0f0]">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700]" />
                        <span className="text-white text-[10px] font-medium">{video.rating}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="bg-[#FF6B35]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        +{Number(video.reward).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-[#1a1a2e] font-semibold text-xs truncate">{video.title}</h4>
                    {video.actors && (
                      <p className="text-[#999] text-[10px] mt-0.5 truncate">{video.actors}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[#bbb] text-[9px]">{video.country}</span>
                      {video.releaseDate && (
                        <>
                          <span className="text-[#ddd] text-[9px]">·</span>
                          <span className="text-[#bbb] text-[9px]">{video.releaseDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
