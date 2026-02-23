import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { TrendingUp, Star, Eye, Clock, Flame, Tv, Film, Play } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ReactPlayer from "react-player";
import type { Video, User } from "@shared/schema";
import AppLayout from "@/components/app-layout";

function PreviewModal({ video, open, onClose }: { video: Video; open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="bg-white border-[#eee] max-w-lg rounded-2xl p-0 overflow-hidden" aria-describedby="preview-desc">
        <div className="relative aspect-video bg-black">
          <ReactPlayer
            url={video.videoUrl || undefined}
            light={video.thumbnail}
            playing={false}
            controls={true}
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
            playIcon={
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B35] to-[#E8453C] rounded-full flex items-center justify-center shadow-xl shadow-[#FF6B35]/30">
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </div>
              </div>
            }
            config={{
              youtube: {
                playerVars: {
                  modestbranding: 1,
                  rel: 0,
                },
              },
            }}
          />
        </div>
        <div className="p-4">
          <h3 className="text-[#1a1a2e] font-bold">{video.title}</h3>
          <p id="preview-desc" className="text-[#999] text-xs mt-1">{video.actors}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-[#FFD700] text-[#FFD700]" />
              <span className="text-[#666] text-xs font-medium">{video.rating}</span>
            </div>
            <span className="text-[#ddd]">&middot;</span>
            <span className="text-[#999] text-xs">{video.country}</span>
            <span className="text-[#ddd]">&middot;</span>
            <span className="text-[#999] text-xs">{video.releaseDate}</span>
          </div>
          <div className="mt-3 bg-[#FFF3E0] rounded-xl p-3 border border-[#FFE082]">
            <p className="text-[#7B6B3A] text-xs">
              Bu yerda faqat ko'rish mumkin. Daromad olish uchun <strong>Vazifalar</strong> bo'limiga o'ting.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TrendsPage() {
  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("Barchasi");

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const filters = ["Barchasi", "Tele-shou", "Treyler"];
  const filteredVideos = activeFilter === "Barchasi"
    ? videos || []
    : (videos || []).filter(v => v.category === activeFilter);

  const sortedByRating = [...filteredVideos].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  const topVideos = sortedByRating.slice(0, 3);

  const teleshowCount = (videos || []).filter(v => v.category === "Tele-shou").length;
  const treylerCount = (videos || []).filter(v => v.category === "Treyler").length;

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#FF6B35]" />
            <h1 className="text-[#1a1a2e] font-bold text-lg">Trendlar</h1>
          </div>
        </div>

        <div className="flex gap-2">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === f
                  ? "bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white shadow-md"
                  : "bg-white text-[#666] border border-[#e8e8e8]"
              }`}
              data-testid={`filter-${f.toLowerCase()}`}
            >
              {f}
            </button>
          ))}
        </div>

        {topVideos.length > 0 && activeFilter === "Barchasi" && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-4 h-4 text-[#E8453C]" />
              <span className="text-[#1a1a2e] font-semibold text-sm">Top reytinglar</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {topVideos.map((video, index) => (
                <div key={video.id} onClick={() => setPreviewVideo(video)} className="cursor-pointer">
                  <div className="relative w-36 shrink-0" data-testid={`trend-top-${video.id}`}>
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
                    <div className="absolute top-2 right-2">
                      <span className="bg-black/50 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                        {video.category === "Tele-shou" ? "TV" : "Film"}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-bold text-xs truncate max-w-[90px]">{video.title}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-[#FFD700] text-[#FFD700]" />
                          <span className="text-white/90 text-[10px] font-medium">{video.rating}</span>
                        </div>
                      </div>
                      <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-3 h-3 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#f0f0f0]">
            <Eye className="w-5 h-5 text-[#FF6B35] mx-auto mb-1" />
            <p className="text-[#1a1a2e] font-bold text-sm">{videos?.length || 0}</p>
            <p className="text-[#999] text-[10px]">Jami kontent</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#f0f0f0]">
            <Tv className="w-5 h-5 text-[#4CAF50] mx-auto mb-1" />
            <p className="text-[#1a1a2e] font-bold text-sm">{teleshowCount}</p>
            <p className="text-[#999] text-[10px]">Tele-shoular</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-[#f0f0f0]">
            <Film className="w-5 h-5 text-[#3b6db5] mx-auto mb-1" />
            <p className="text-[#1a1a2e] font-bold text-sm">{treylerCount}</p>
            <p className="text-[#999] text-[10px]">Treylerlar</p>
          </div>
        </div>

        <div>
          <h3 className="text-[#1a1a2e] font-bold text-sm mb-3">
            {activeFilter === "Barchasi" ? "Barcha trendlar" : activeFilter}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {sortedByRating.map((video) => (
              <div key={video.id} onClick={() => setPreviewVideo(video)} className="cursor-pointer">
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#f0f0f0]" data-testid={`trend-card-${video.id}`}>
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
                      <span className="bg-black/50 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                        {video.category === "Tele-shou" ? "TV" : "Film"}
                      </span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <div className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-3 h-3 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-[#1a1a2e] font-semibold text-xs truncate">{video.title}</h4>
                    {video.actors && (
                      <p className="text-[#999] text-[10px] mt-0.5 truncate">{video.actors}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[#bbb] text-[9px]">{video.country}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {previewVideo && (
          <PreviewModal
            video={previewVideo}
            open={!!previewVideo}
            onClose={() => setPreviewVideo(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
