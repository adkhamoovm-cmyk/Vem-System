import { Link } from "wouter";
import { Tv, Film, ChevronRight, Star, Play } from "lucide-react";
import type { Video } from "@shared/schema";
import { useI18n } from "@/lib/i18n";
import { AutoScrollCarousel } from "./auto-scroll-carousel";

interface VideoGridsProps {
  tvShows: Video[];
  trailers: Video[];
}

export function VideoGrids({ tvShows, trailers }: VideoGridsProps) {
  const { t } = useI18n();

  return (
    <>
      {tvShows.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground font-bold text-sm flex items-center gap-2">
              <div className="w-6 h-6 bg-red-500/10 rounded-md flex items-center justify-center">
                <Tv className="w-3.5 h-3.5 text-red-500" />
              </div>
              {t("dashboard.tvShows")}
            </h3>
            <Link href="/trends" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
              {t("dashboard.viewAll")} <ChevronRight className="w-3 h-3 inline" />
            </Link>
          </div>
          <AutoScrollCarousel speed={0.4}>
            {tvShows.map((video) => (
              <Link key={video.id} href="/tasks">
                <div className="relative w-32 shrink-0 cursor-pointer group" data-testid={`tv-show-${video.id}`}>
                  <div className="w-32 h-48 rounded-xl overflow-hidden bg-card shadow-md">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent rounded-xl" />
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className="bg-gradient-to-r from-red-500 to-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                      TOP
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <h4 className="text-white font-bold text-[11px] leading-tight line-clamp-2">{video.title}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-white/70 text-[9px]">{video.rating}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </AutoScrollCarousel>
        </div>
      )}

      {trailers.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground font-bold text-sm flex items-center gap-2">
              <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                <Film className="w-3.5 h-3.5 text-primary" />
              </div>
              {t("dashboard.trailers")}
            </h3>
            <Link href="/trends" className="text-muted-foreground text-xs hover:text-foreground transition-colors">
              {t("dashboard.viewAll")} <ChevronRight className="w-3 h-3 inline" />
            </Link>
          </div>
          <AutoScrollCarousel speed={0.3}>
            {trailers.map((video) => (
              <Link key={video.id} href="/tasks">
                <div className="relative w-56 shrink-0 cursor-pointer group" data-testid={`trailer-${video.id}`}>
                  <div className="w-56 h-32 rounded-xl overflow-hidden bg-card shadow-md">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent rounded-xl" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="bg-black/50 backdrop-blur-md rounded-full w-8 h-8 flex items-center justify-center border border-white/10 group-hover:bg-primary/80 transition-colors">
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <h4 className="text-white font-bold text-xs leading-tight">{video.title}</h4>
                    <p className="text-white/50 text-[9px] mt-0.5">{video.actors?.split(",")[0]}</p>
                  </div>
                </div>
              </Link>
            ))}
          </AutoScrollCarousel>
        </div>
      )}
    </>
  );
}
