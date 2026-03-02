import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Star, Play } from "lucide-react";
import type { Video } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

interface HeroSectionProps {
  heroVideos: Video[];
}

export function HeroSection({ heroVideos }: HeroSectionProps) {
  const { t } = useI18n();
  const [heroIndex, setHeroIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (heroVideos.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setHeroIndex((prev) => (prev + 1) % heroVideos.length);
      setIsTransitioning(false);
    }, 500);
  }, [heroVideos.length]);

  useEffect(() => {
    if (heroVideos.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [heroVideos.length, nextSlide]);

  const heroVideo = heroVideos[heroIndex];
  if (!heroVideo) return null;

  return (
    <div className="relative w-[calc(100%-16px)] mx-auto mt-2 h-[300px] overflow-hidden rounded-2xl">
      <img
        src={heroVideo.thumbnail}
        alt={heroVideo.title}
        className={`w-full h-full object-cover transition-all duration-700 ${isTransitioning ? "opacity-0 scale-110" : "opacity-100 scale-100"}`}
        data-testid="hero-poster"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/20 to-transparent rounded-2xl" />
      <div className={`absolute bottom-6 left-4 right-4 z-10 transition-all duration-700 ${isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-gradient-to-r from-primary to-blue-600 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-md shadow-sm">{heroVideo.category === "Tele-shou" ? t("trends.teleShow") : t("trends.trailer")}</span>
          <div className="flex items-center gap-0.5 bg-black/30 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-white/90 text-[10px] font-medium">{heroVideo.rating}</span>
          </div>
        </div>
        <h2 className="text-white font-bold text-xl leading-tight mb-1.5 drop-shadow-lg">{heroVideo.title}</h2>
        <p className="text-white/50 text-xs mb-3">{heroVideo.actors}</p>
        <div className="flex gap-2.5">
          <Link href="/tasks">
            <button className="flex items-center gap-2 bg-white text-black font-bold text-xs px-5 py-2.5 rounded-lg cursor-pointer shadow-lg shadow-white/10 active:scale-95 transition-transform" data-testid="button-hero-play">
              <Play className="w-4 h-4 fill-black" />
              {t("dashboard.watch")}
            </button>
          </Link>
          <Link href="/trends">
            <button className="flex items-center gap-1.5 bg-white/15 text-white font-medium text-xs px-4 py-2.5 rounded-lg backdrop-blur-md cursor-pointer border border-white/10 active:scale-95 transition-transform" data-testid="button-hero-info">
              {t("dashboard.details")}
            </button>
          </Link>
        </div>
      </div>
      {heroVideos.length > 1 && (
        <div className="absolute bottom-2.5 right-4 z-10 flex gap-1.5">
          {heroVideos.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIsTransitioning(true); setTimeout(() => { setHeroIndex(i); setIsTransitioning(false); }, 300); }}
              className={`h-1 rounded-full transition-all duration-500 ${i === heroIndex ? "w-6 bg-primary shadow-sm shadow-primary/30" : "w-1.5 bg-white/30"}`}
              data-testid={`hero-dot-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
