import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { TrendingUp, Star, Eye, Flame, Tv, Film, Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Video, User } from "@shared/schema";
import AppLayout from "@/components/app-layout";
import { useI18n } from "@/lib/i18n";

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function PreviewModal({ video, open, onClose }: { video: Video; open: boolean; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const { t } = useI18n();
  const videoId = video.videoUrl ? getYouTubeId(video.videoUrl) : null;

  useEffect(() => {
    if (!open) setPlaying(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="bg-card border-border max-w-lg rounded-2xl p-0 overflow-hidden" aria-describedby="preview-desc">
        <DialogTitle className="sr-only">{video.title}</DialogTitle>
        <div className="relative aspect-video bg-black">
          {!playing ? (
            <div className="relative w-full h-full">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                <button
                  onClick={() => setPlaying(true)}
                  className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/30"
                  data-testid="button-play-trend"
                >
                  <Play className="w-7 h-7 text-primary-foreground ml-1" />
                </button>
              </div>
            </div>
          ) : videoId ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-muted-foreground text-sm">{t("trends.videoNotLoaded")}</p>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-foreground font-bold">{video.title}</h3>
          <p id="preview-desc" className="text-muted-foreground text-xs mt-1">{video.actors}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              <span className="text-muted-foreground text-xs font-medium">{video.rating}</span>
            </div>
            <span className="text-[#444]">&middot;</span>
            <span className="text-muted-foreground text-xs">{video.country}</span>
            <span className="text-[#444]">&middot;</span>
            <span className="text-muted-foreground text-xs">{video.releaseDate}</span>
          </div>
          <div className="mt-3 bg-primary/10 rounded-xl p-3 border border-primary/20">
            <p className="text-primary text-xs">
              {t("trends.viewOnly")} <strong>{t("trends.goToTasks")}</strong> {t("trends.section")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TrendsPage() {
  const { t } = useI18n();

  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const filterConfig = [
    { key: "all", label: t("trends.all"), category: null },
    { key: "tele-shou", label: t("trends.teleShow"), category: "Tele-shou" },
    { key: "treyler", label: t("trends.trailer"), category: "Treyler" },
  ];

  const activeFilterConfig = filterConfig.find(f => f.key === activeFilter);
  const filteredVideos = activeFilter === "all"
    ? videos || []
    : (videos || []).filter(v => v.category === activeFilterConfig?.category);

  const sortedByRating = [...filteredVideos].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  const topVideos = sortedByRating.slice(0, 3);

  const teleshowCount = (videos || []).filter(v => v.category === "Tele-shou").length;
  const treylerCount = (videos || []).filter(v => v.category === "Treyler").length;

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <h1 className="text-foreground font-bold text-lg">{t("trends.title")}</h1>
          </div>
        </div>

        <div className="flex gap-2">
          {filterConfig.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                activeFilter === f.key
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-muted-foreground border border-border"
              }`}
              data-testid={`filter-${f.key}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {topVideos.length > 0 && activeFilter === "all" && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-foreground font-semibold text-sm">{t("trends.topRatings")}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {topVideos.map((video, index) => (
                <div key={video.id} onClick={() => setPreviewVideo(video)} className="cursor-pointer">
                  <div className="relative w-36 shrink-0" data-testid={`trend-top-${video.id}`}>
                    <div className="w-36 h-52 rounded-2xl overflow-hidden bg-card shadow-md">
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
                      <span className="bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded">
                        {video.category === "Tele-shou" ? "TV" : "Film"}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-bold text-xs truncate max-w-[90px]">{video.title}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
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
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <Eye className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-foreground font-bold text-sm">{videos?.length || 0}</p>
            <p className="text-muted-foreground text-[10px]">{t("trends.totalContent")}</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <Tv className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mx-auto mb-1" />
            <p className="text-foreground font-bold text-sm">{teleshowCount}</p>
            <p className="text-muted-foreground text-[10px]">{t("trends.tvShows")}</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <Film className="w-5 h-5 text-[#3B82F6] mx-auto mb-1" />
            <p className="text-foreground font-bold text-sm">{treylerCount}</p>
            <p className="text-muted-foreground text-[10px]">{t("trends.trailers")}</p>
          </div>
        </div>

        <div>
          <h3 className="text-foreground font-bold text-sm mb-3">
            {activeFilter === "all" ? t("trends.allTrends") : activeFilterConfig?.label}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {sortedByRating.map((video) => (
              <div key={video.id} onClick={() => setPreviewVideo(video)} className="cursor-pointer">
                <div className="bg-card rounded-2xl overflow-hidden border border-border" data-testid={`trend-card-${video.id}`}>
                  <div className="relative aspect-[3/4] bg-card">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-white text-[10px] font-medium">{video.rating}</span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded">
                        {video.category === "Tele-shou" ? "TV" : "Film"}
                      </span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <div className="w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-3 h-3 text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-foreground font-semibold text-xs truncate">{video.title}</h4>
                    {video.actors && (
                      <p className="text-muted-foreground text-[10px] mt-0.5 truncate">{video.actors}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-muted-foreground text-[9px]">{video.country}</span>
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
