import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import {
  TrendingUp, Star, Eye, Flame, Tv, Film, Play,
  Search, Clock, ChevronDown, X
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Video, User } from "@shared/schema";
import { useI18n } from "@/lib/i18n";

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const COUNTRY_FLAGS: Record<string, string> = {
  "AQSH": "🇺🇸",
  "Amerika": "🇺🇸",
  "USA": "🇺🇸",
  "Janubiy Koreya": "🇰🇷",
  "Koreya": "🇰🇷",
  "Korea": "🇰🇷",
  "Ispaniya": "🇪🇸",
  "Spain": "🇪🇸",
  "Yaponiya": "🇯🇵",
  "Japan": "🇯🇵",
  "Fransiya": "🇫🇷",
  "France": "🇫🇷",
  "Britaniya": "🇬🇧",
  "UK": "🇬🇧",
  "Germaniya": "🇩🇪",
  "Germany": "🇩🇪",
  "Italiya": "🇮🇹",
  "Italy": "🇮🇹",
  "Hindiston": "🇮🇳",
  "India": "🇮🇳",
  "Xitoy": "🇨🇳",
  "China": "🇨🇳",
  "Rossiya": "🇷🇺",
  "Russia": "🇷🇺",
  "O'zbekiston": "🇺🇿",
  "Uzbekistan": "🇺🇿",
  "Turkiya": "🇹🇷",
  "Turkey": "🇹🇷",
  "Kanada": "🇨🇦",
  "Canada": "🇨🇦",
  "Braziliya": "🇧🇷",
  "Brazil": "🇧🇷",
  "Daniya": "🇩🇰",
  "Denmark": "🇩🇰",
  "Shvetsiya": "🇸🇪",
  "Sweden": "🇸🇪",
  "Norvegiya": "🇳🇴",
  "Norway": "🇳🇴",
  "Tailand": "🇹🇭",
  "Thailand": "🇹🇭",
};

function getFlag(country: string | null | undefined): string {
  if (!country) return "🌍";
  for (const key of Object.keys(COUNTRY_FLAGS)) {
    if (country.toLowerCase().includes(key.toLowerCase())) return COUNTRY_FLAGS[key];
  }
  return "🌍";
}

function CardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border animate-pulse">
      <div className="aspect-[3/4] bg-muted" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-2 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

function HorizontalCardSkeleton() {
  return (
    <div className="w-36 shrink-0 animate-pulse">
      <div className="w-36 h-52 rounded-2xl bg-muted" />
    </div>
  );
}

function PreviewModal({ video, open, onClose }: { video: Video; open: boolean; onClose: () => void }) {
  const [playing, setPlaying] = useState(false);
  const { t } = useI18n();
  const videoId = video.videoUrl ? getYouTubeId(video.videoUrl) : null;
  const flag = getFlag(video.country);

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
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <button
                  onClick={() => setPlaying(true)}
                  className="w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
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
          <h3 className="text-foreground font-bold text-base">{video.title}</h3>
          <p id="preview-desc" className="text-muted-foreground text-xs mt-1">{video.actors}</p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="flex items-center gap-1 bg-yellow-500/10 rounded-full px-2.5 py-1">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              <span className="text-yellow-600 dark:text-yellow-400 text-xs font-bold">{video.rating}</span>
            </div>
            {video.country && (
              <div className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-1">
                <span className="text-sm">{flag}</span>
                <span className="text-muted-foreground text-xs">{video.country}</span>
              </div>
            )}
            {video.releaseDate && (
              <div className="bg-muted rounded-full px-2.5 py-1">
                <span className="text-muted-foreground text-xs">{video.releaseDate}</span>
              </div>
            )}
            {video.duration > 0 && (
              <div className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground text-xs">{video.duration} {t("trends.minutes")}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SortKey = "rating" | "newest" | "duration";

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
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeCountry, setActiveCountry] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSort, setShowSort] = useState(false);

  const categoryConfig = [
    { key: "all", label: t("trends.all"), category: null },
    { key: "tele-shou", label: t("trends.teleShow"), category: "Tele-shou" },
    { key: "treyler", label: t("trends.trailer"), category: "Treyler" },
  ];

  const countries = useMemo(() => {
    if (!videos) return [];
    const seen = new Set<string>();
    const list: string[] = [];
    for (const v of videos) {
      if (v.country && !seen.has(v.country)) {
        seen.add(v.country);
        list.push(v.country);
      }
    }
    return list;
  }, [videos]);

  const filteredVideos = useMemo(() => {
    if (!videos) return [];
    let result = [...videos];

    if (activeCategory !== "all") {
      const catConf = categoryConfig.find(f => f.key === activeCategory);
      result = result.filter(v => v.category === catConf?.category);
    }

    if (activeCountry !== "all") {
      result = result.filter(v => v.country === activeCountry);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(v =>
        v.title?.toLowerCase().includes(q) ||
        v.actors?.toLowerCase().includes(q) ||
        v.country?.toLowerCase().includes(q)
      );
    }

    if (sortKey === "rating") {
      result.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else if (sortKey === "newest") {
      result.sort((a, b) => {
        const ay = Number((a.releaseDate || "").split(/[-\/]/).pop() || 0);
        const by = Number((b.releaseDate || "").split(/[-\/]/).pop() || 0);
        return by - ay;
      });
    } else if (sortKey === "duration") {
      result.sort((a, b) => Number(b.duration || 0) - Number(a.duration || 0));
    }

    return result;
  }, [videos, activeCategory, activeCountry, searchQuery, sortKey]);

  const topVideos = useMemo(() => {
    if (!videos) return [];
    return [...videos].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 5);
  }, [videos]);

  const newReleases = useMemo(() => {
    if (!videos) return [];
    return [...videos]
      .sort((a, b) => {
        const ay = Number((a.releaseDate || "").split(/[-\/]/).pop() || 0);
        const by = Number((b.releaseDate || "").split(/[-\/]/).pop() || 0);
        return by - ay;
      })
      .slice(0, 8);
  }, [videos]);

  const teleshowCount = (videos || []).filter(v => v.category === "Tele-shou").length;
  const treylerCount = (videos || []).filter(v => v.category === "Treyler").length;

  const isFiltered = activeCategory !== "all" || activeCountry !== "all" || searchQuery.trim() !== "";

  const sortLabels: Record<SortKey, string> = {
    rating: t("trends.sortRating"),
    newest: t("trends.sortNewest"),
    duration: t("trends.sortDuration"),
  };

  return (
    <div className="p-4 space-y-4 pb-6">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          <h1 className="text-foreground font-bold text-lg">{t("trends.title")}</h1>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowSort(s => !s)}
            className="flex items-center gap-1 text-xs text-muted-foreground bg-card border border-border rounded-full px-3 py-1.5 hover:border-primary transition-colors"
            data-testid="button-sort-trends"
          >
            <span>{sortLabels[sortKey]}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {showSort && (
            <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[130px]">
              {(["rating", "newest", "duration"] as SortKey[]).map(key => (
                <button
                  key={key}
                  onClick={() => { setSortKey(key); setShowSort(false); }}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors hover:bg-muted ${
                    sortKey === key ? "text-primary font-semibold" : "text-foreground"
                  }`}
                  data-testid={`sort-option-${key}`}
                >
                  {sortLabels[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t("trends.searchPlaceholder")}
          className="w-full bg-card border border-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          data-testid="input-search-trends"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            data-testid="button-clear-search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {categoryConfig.map(f => (
          <button
            key={f.key}
            onClick={() => setActiveCategory(f.key)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
              activeCategory === f.key
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground border border-border"
            }`}
            data-testid={`filter-category-${f.key}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {countries.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          <button
            onClick={() => setActiveCountry("all")}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeCountry === "all"
                ? "bg-primary/15 text-primary border border-primary/30"
                : "bg-card text-muted-foreground border border-border"
            }`}
            data-testid="filter-country-all"
          >
            🌍 {t("trends.allCountries")}
          </button>
          {countries.map(country => (
            <button
              key={country}
              onClick={() => setActiveCountry(activeCountry === country ? "all" : country)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeCountry === country
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-card text-muted-foreground border border-border"
              }`}
              data-testid={`filter-country-${country}`}
            >
              {getFlag(country)} {country}
            </button>
          ))}
        </div>
      )}

      {!isFiltered && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <Eye className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-foreground font-bold text-sm">{isLoading ? "—" : videos?.length || 0}</p>
            <p className="text-muted-foreground text-[10px]">{t("trends.totalContent")}</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <Tv className="w-5 h-5 text-emerald-500 dark:text-emerald-400 mx-auto mb-1" />
            <p className="text-foreground font-bold text-sm">{isLoading ? "—" : teleshowCount}</p>
            <p className="text-muted-foreground text-[10px]">{t("trends.tvShows")}</p>
          </div>
          <div className="bg-card rounded-xl p-3 text-center border border-border">
            <Film className="w-5 h-5 text-[#3B82F6] mx-auto mb-1" />
            <p className="text-foreground font-bold text-sm">{isLoading ? "—" : treylerCount}</p>
            <p className="text-muted-foreground text-[10px]">{t("trends.trailers")}</p>
          </div>
        </div>
      )}

      {!isFiltered && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-foreground font-semibold text-sm">{t("trends.topRatings")}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <HorizontalCardSkeleton key={i} />)
              : topVideos.map((video, index) => (
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
                        index === 2 ? "bg-gradient-to-br from-[#CD7F32] to-[#A0522D]" :
                        "bg-black/50"
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className="bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded">
                        {video.category === "Tele-shou" ? "TV" : "Film"}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <h4 className="text-white font-bold text-xs truncate">{video.title}</h4>
                      <div className="flex items-center justify-between mt-0.5">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-white/90 text-[10px] font-medium">{video.rating}</span>
                        </div>
                        {video.duration > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 text-white/70" />
                            <span className="text-white/70 text-[9px]">{video.duration}{t("trends.minutes")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {!isFiltered && newReleases.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-base">🆕</span>
            <span className="text-foreground font-semibold text-sm">{t("trends.newReleases")}</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {newReleases.map(video => (
              <div key={video.id} onClick={() => setPreviewVideo(video)} className="cursor-pointer">
                <div className="relative w-28 shrink-0" data-testid={`trend-new-${video.id}`}>
                  <div className="w-28 h-40 rounded-xl overflow-hidden bg-card shadow-md">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-xl" />
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className="bg-primary text-primary-foreground text-[8px] font-bold px-2 py-0.5 rounded-full">
                      {video.releaseDate?.split(/[-\/]/).pop()}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <h4 className="text-white font-bold text-[10px] truncate">{video.title}</h4>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <span className="text-white/80 text-[9px]">{getFlag(video.country)}</span>
                      <span className="text-white/70 text-[9px] truncate">{video.country}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-foreground font-bold text-sm mb-3">
          {isFiltered
            ? `${filteredVideos.length} ta natija`
            : t("trends.allTrends")}
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-foreground font-semibold text-sm">{t("trends.noResults")}</p>
            <button
              onClick={() => { setSearchQuery(""); setActiveCategory("all"); setActiveCountry("all"); }}
              className="mt-3 text-primary text-xs underline"
            >
              Filterni tozalash
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredVideos.map(video => (
              <div key={video.id} onClick={() => setPreviewVideo(video)} className="cursor-pointer">
                <div className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/40 transition-colors" data-testid={`trend-card-${video.id}`}>
                  <div className="relative aspect-[3/4] bg-card">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                    <div className="absolute top-2 right-2">
                      <span className="bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 rounded">
                        {video.category === "Tele-shou" ? "TV" : "Film"}
                      </span>
                    </div>
                    <div className="absolute top-2 left-2">
                      <div className="w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-2.5 h-2.5 text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-white text-[10px] font-medium">{video.rating}</span>
                        </div>
                        {video.duration > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5 text-white/70" />
                            <span className="text-white/70 text-[9px]">{video.duration}{t("trends.minutes")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-2.5">
                    <h4 className="text-foreground font-semibold text-xs truncate">{video.title}</h4>
                    {video.actors && (
                      <p className="text-muted-foreground text-[10px] mt-0.5 truncate">{video.actors}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px]">{getFlag(video.country)}</span>
                      <span className="text-muted-foreground text-[9px] truncate">{video.country}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewVideo && (
        <PreviewModal
          video={previewVideo}
          open={!!previewVideo}
          onClose={() => setPreviewVideo(null)}
        />
      )}
    </div>
  );
}
