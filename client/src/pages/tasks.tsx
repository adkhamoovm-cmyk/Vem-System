import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Clock, CheckCircle, Crown, Lock, X, Coffee } from "lucide-react";
import type { User, VipPackage } from "@shared/schema";
import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { getVipName } from "@/lib/vip-utils";

function isSunday() {
  return new Date().getDay() === 0;
}

function YouTubePlayer({ videoId, allVideos }: { videoId: string; allVideos?: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [currentId, setCurrentId] = useState(videoId);
  const [attempt, setAttempt] = useState(0);
  const triedRef = useRef<Set<string>>(new Set());
  const [showFallback, setShowFallback] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setCurrentId(videoId);
    setAttempt(0);
    setShowFallback(false);
    triedRef.current = new Set();
  }, [videoId]);

  const tryNextVideo = useCallback(() => {
    if (!mountedRef.current) return;
    triedRef.current.add(currentId);
    const pool = allVideos?.length ? allVideos : youtubeVideos;
    const remaining = pool.filter(id => !triedRef.current.has(id));
    if (remaining.length > 0 && attempt < 10) {
      const next = remaining[Math.floor(Math.random() * remaining.length)];
      setCurrentId(next);
      setAttempt(a => a + 1);
    } else {
      setShowFallback(true);
    }
  }, [currentId, allVideos, attempt]);

  useEffect(() => {
    if (showFallback || !containerRef.current) return;

    const containerId = `yt-player-${Date.now()}-${attempt}`;
    const div = document.createElement("div");
    div.id = containerId;
    div.style.width = "100%";
    div.style.height = "100%";
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(div);

    let destroyed = false;

    const createPlayer = () => {
      if (destroyed) return;
      try {
        if (playerRef.current) {
          try { playerRef.current.destroy(); } catch {}
        }
        playerRef.current = new (window as any).YT.Player(containerId, {
          videoId: currentId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            mute: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: () => {},
            onError: (e: any) => {
              if (!destroyed) tryNextVideo();
            },
            onStateChange: (e: any) => {
              if (e.data === -1) {
                setTimeout(() => {
                  if (!destroyed && playerRef.current) {
                    try {
                      const state = playerRef.current.getPlayerState?.();
                      if (state === -1 || state === undefined) tryNextVideo();
                    } catch { tryNextVideo(); }
                  }
                }, 3000);
              }
            },
          },
        });
      } catch { if (!destroyed) tryNextVideo(); }
    };

    if ((window as any).YT?.Player) {
      createPlayer();
    } else {
      if (!document.querySelector('script[src*=\"youtube.com/iframe_api\"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
      const prev = (window as any).onYouTubeIframeAPIReady;
      (window as any).onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        createPlayer();
      };
    }

    return () => {
      destroyed = true;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [currentId, attempt, showFallback, tryNextVideo]);

  if (showFallback) {
    return (
      <div className="w-full h-full absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Play className="w-8 h-8 text-primary animate-pulse" fill="currentColor" />
          </div>
          <p className="text-white/60 text-xs">Video streaming...</p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-full absolute inset-0" />;
}

const youtubeVideos = [
  "dQw4w9WgXcQ", "kJQP7kiw5Fk", "JGwWNGJdvx8", "RgKAFK5djSk", "OPf0YbXqDm0",
  "fJ9rUzIMcZQ", "9bZkp7q19f0", "hT_nvWreIhg", "CevxZvSJLk8", "e-ORhEE9VVg",
  "PT2_F-1esPk", "IcrbM1l_BoI", "2Vv-BfVoq4g", "lp-EO5I60KA", "7wtfhZwyrcc",
  "eVTXPUF4Oz4", "kXYiU_JCYtU", "YlUKcNNmywk", "Zi_XLOBDo_Y", "RBumgq5yVrA",
  "sY1S34973zA", "UqyT8IEBkvY", "TcMBFSGVi1c", "LXb3EKWsInQ", "TnGl01FkMMo",
  "uxpDa-c-4Mc", "RFinNxS5KN4", "V1bFr2SWP1I", "EXeTwQWrcwY", "8Qn_spdM5Zg",
  "Way9Dexny3w", "sGbxmsDFVnE", "KlyXNRrsk4A", "n1WpP7iowLc", "YR12Z8f1Dh8",
  "pRpeEdMmmQ0", "HhHwnrlZRus", "qSqVVswa420", "avz06PDqDbM", "n9xhJrPXop4",
  "JfVOs4VSpmA", "u34gHaRiBIU", "LDG9bisJEaI", "PHzOOQfhPFg", "oyEuk8j8imI",
  "vKA4w2O61Xo", "oU4Rk0NATNs", "kOHB85vDuow", "DYYtuKyMtY8", "3cqU1pFRqYE",
  "Ed1sGgHUo88", "_zHPsmXCjB0", "ueCc-AYUMRs", "YN2H_sKcmGw", "nW948Va-l10",
  "shW9i6k8cB0", "d9MyW72ELq0", "mqqft2x_Aa4", "Rt_UqUm38BI", "YoHD9XEInc0",
  "giXco2jaZ_4", "wxN1T1uxQ2g", "vKQi3bBA1y8", "s7EdQ4FqbhY", "u3V5KDHRQvk",
  "pBk4NYhWNMM", "EXeTwQWrcwY", "5xH0HfJHsaY", "bK6ldnjE3Y0", "5PSNL1qE6VY",
  "szby7ZHLnkA", "Q0CbN8sfihY", "Z1BCujX3pw8", "zAGVQLHvwOY", "6ZfuNTqbHE8",
  "gn5QmllRCn4", "PLLQK9la6Go", "L0MK7qz13bU", "fsQgc9pCyDU", "xxEt9fnILgQ",
  "8g18jFHCLXk", "cqGjhVJWtEg", "KK8FHdFluOQ", "6COmYeLsz4c", "ByXuk9QqQkk",
  "nyc6RJEEe0U", "xLCn88bfW1o", "VYOjWnS4cMY",
];

const TIMER_DURATION = 30;

function VideoPlayerModal({
  videoId,
  perVideoReward,
  open,
  onClose,
}: {
  videoId: string;
  perVideoReward: number;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { t, locale, translateServerMessage } = useI18n();
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [completed, setCompleted] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const hqThumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tasks/complete", { youtubeVideoId: videoId });
      return res.json();
    },
    onSuccess: () => {
      setCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: Error) => {
      toast({ title: t("common.error"), description: translateServerMessage(error.message), variant: "destructive" });
    },
  });

  useEffect(() => {
    if (open) {
      setStarted(false);
      setTimeLeft(TIMER_DURATION);
      setCompleted(false);
    }
  }, [open]);

  useEffect(() => {
    if (!started || completed) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          completeMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, completed]);

  const progress = started ? ((TIMER_DURATION - timeLeft) / TIMER_DURATION) * 100 : 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4" data-testid="modal-video">
      <div className="w-full max-w-lg bg-card rounded-2xl overflow-hidden border border-border/50 shadow-2xl shadow-black/40">
        <div className="relative aspect-video bg-black">
          {!started ? (
            <div className="relative w-full h-full">
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = hqThumbnail; }}
                data-testid="img-thumbnail"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10 flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
                  <Button
                    onClick={() => setStarted(true)}
                    className="relative w-18 h-18 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 no-default-hover-elevate no-default-active-elevate cursor-pointer active:scale-95 transition-transform"
                    style={{ width: "72px", height: "72px" }}
                    data-testid="button-play"
                  >
                    <Play className="w-8 h-8 text-white ml-1" fill="white" fillOpacity={0.9} />
                  </Button>
                </div>
                <span className="text-white text-xs mt-4 font-medium drop-shadow-lg bg-black/40 backdrop-blur-sm px-4 py-1.5 rounded-full">
                  {t("tasks.pressToStart")}
                </span>
              </div>
            </div>
          ) : !completed ? (
            <>
              <div className="w-full h-full relative overflow-hidden" data-testid="video-player">
                <YouTubePlayer videoId={videoId} allVideos={youtubeVideos} />
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md rounded-full px-3.5 py-2 flex items-center gap-2 border border-white/10">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-white text-xs font-mono font-bold tracking-wide">
                      {t("tasks.timeLeft", { time: timeLeft })}
                    </span>
                  </div>
                  <div className="bg-black/60 backdrop-blur-md rounded-full px-3.5 py-2 border border-white/10">
                    <span className="text-emerald-400 font-bold text-xs">+${perVideoReward.toFixed(2)}</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                  <div className="h-1.5 bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-1000 shadow-sm shadow-primary/50"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-emerald-500/10 via-card to-card gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: "1.5s" }} />
                <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="text-center">
                <span className="text-foreground font-bold text-lg">{t("tasks.completed")}</span>
                <p className="text-emerald-500 dark:text-emerald-400 font-bold text-2xl mt-1">+${perVideoReward.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {started && !completed && (
            <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl p-3.5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-muted-foreground text-xs">{t("tasks.dontClose")}</span>
                </div>
                <span className="text-primary font-bold text-sm">+${perVideoReward.toFixed(2)}</span>
              </div>
            </div>
          )}

          {completed && (
            <>
              <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 rounded-xl p-4 border border-emerald-500/20 text-center">
                <p className="text-emerald-500 dark:text-emerald-400 text-xs font-medium">{t("tasks.taskDoneBalance")}</p>
              </div>
              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                data-testid="button-close-video"
              >
                {t("tasks.continue")}
              </Button>
            </>
          )}

          {!completed && (
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-muted-foreground text-xs h-9 rounded-xl"
              data-testid="button-cancel-video"
              disabled={started && timeLeft > 0}
            >
              {started && timeLeft > 0 ? t("tasks.waitTimer") : t("common.close")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { t, locale } = useI18n();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: vipPackages, isLoading: packagesLoading } = useQuery<VipPackage[]>({
    queryKey: ["/api/vip-packages"],
  });

  const watchedTodayRef = useRef<Set<string>>(new Set());
  const [shuffledVideos] = useState<string[]>(() => {
    const arr = [...youtubeVideos];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });
  const videoIndexRef = useRef(0);

  const getNextUnwatched = (excludeId?: string): string => {
    const watched = watchedTodayRef.current;
    for (let i = 0; i < shuffledVideos.length; i++) {
      const idx = (videoIndexRef.current + i) % shuffledVideos.length;
      const vid = shuffledVideos[idx];
      if (!watched.has(vid) && vid !== excludeId) {
        videoIndexRef.current = idx + 1;
        return vid;
      }
    }
    watchedTodayRef.current = new Set();
    const randomIdx = Math.floor(Math.random() * shuffledVideos.length);
    videoIndexRef.current = randomIdx + 1;
    return shuffledVideos[randomIdx];
  };

  const [nextVideoId, setNextVideoId] = useState(() =>
    shuffledVideos[0]
  );
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const currentPkg = vipPackages?.find((p) => p.level === user?.vipLevel);
  const perVideoReward = currentPkg ? Number(currentPkg.perVideoReward) : 0;
  const hasVip = user && user.vipLevel >= 0 && perVideoReward > 0;
  const noPrivilege = user && user.vipLevel < 0;
  const hasNoVipPackage = user && !noPrivilege && !hasVip;
  const isLimitReached = user && user.dailyTasksLimit > 0 ? user.dailyTasksCompleted >= user.dailyTasksLimit : false;

  const handleStartTask = () => {
    if (!hasVip || isLimitReached) return;
    setActiveVideoId(nextVideoId);
  };

  const handleCloseVideo = () => {
    const justWatched = activeVideoId;
    if (justWatched) {
      watchedTodayRef.current.add(justWatched);
    }
    setActiveVideoId(null);
    const next = getNextUnwatched(justWatched || undefined);
    setNextVideoId(next);
  };

  if (userLoading || packagesLoading || !vipPackages) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-4 shadow-xl shadow-primary/20 animate-pulse">
          <div className="h-20" />
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4" />
          <div className="h-8 bg-muted rounded w-full mb-3" />
          <div className="h-48 bg-muted rounded w-full mb-3" />
          <div className="h-12 bg-muted rounded w-full" />
        </div>
      </div>
    );
  }

  if (isSunday()) {
    return (
      <div className="p-4 flex flex-col gap-4">
        {user && (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-4 shadow-xl shadow-primary/20 animate-fade-up" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
            <div className="absolute inset-0 opacity-[0.07]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
            </div>
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Crown className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-white/70 text-xs font-medium">
                    {user.vipLevel < 0 ? t("common.notEmployee") : getVipName(user.vipLevel, locale)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{t("tasks.sunday")}</p>
              </div>
            </div>
          </div>
        )}
        <div className="bg-card rounded-2xl p-8 border border-border text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500/15 to-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/10">
              <Coffee className="w-10 h-10 text-amber-500" />
            </div>
            <h3 className="text-foreground font-bold text-xl mb-2">{t("tasks.sunday")}</h3>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{t("tasks.sundayDesc")}</p>
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl px-4 py-3 inline-block border border-amber-500/20">
              <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold">{t("tasks.sundayNote")}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = user && user.dailyTasksLimit > 0 ? (user.dailyTasksCompleted / user.dailyTasksLimit) * 100 : 0;

  if (noPrivilege) {
    return (
      <div className="p-4 flex flex-col gap-4">
        {user && (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-4 shadow-xl shadow-primary/20 animate-fade-up" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
            <div className="absolute inset-0 opacity-[0.07]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
            </div>
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white/60 text-[10px] uppercase tracking-widest font-medium">{t("tasks.tasksLabel")}</span>
                <p className="text-sm font-semibold text-white mt-0.5">{t("tasks.buyVipToWork")}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl p-8 border border-border text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
          <div className="relative">
            <div className="relative inline-block mb-5">
              <div className="absolute inset-0 bg-amber-500/15 rounded-full animate-pulse" style={{ animationDuration: "3s" }} />
              <div className="relative w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/20">
                <Lock className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3 className="text-foreground font-bold text-xl mb-2">{t("tasks.noPrivilege")}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-3 max-w-xs mx-auto">{t("tasks.noPrivilegeDesc")}</p>
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl px-4 py-3 mb-6 border border-amber-500/20 inline-block">
              <p className="text-amber-600 dark:text-amber-400 text-xs font-semibold">{t("tasks.noPrivilegeHint")}</p>
            </div>
            <div>
              <Link href="/vip">
                <Button
                  className="bg-gradient-to-r from-primary to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-12 px-10 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform text-base"
                  data-testid="button-go-vip"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  {t("tasks.getVip")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
        {user && (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 shadow-xl shadow-primary/20 animate-fade-up" style={{ animationDelay: "0.05s", animationFillMode: "both" }}>
            <div className="absolute inset-0 opacity-[0.07]">
              <div className="absolute top-0 right-0 w-36 h-36 bg-white rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/3 -translate-x-1/4" />
            </div>
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-white/60 text-[10px] uppercase tracking-widest font-medium">
                      {getVipName(user.vipLevel, locale)}
                    </span>
                    <p className="text-white font-semibold text-sm mt-0.5">
                      {t("tasks.perVideo")}: <span className="text-xl font-bold">${perVideoReward.toFixed(2)}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10">
                  <span className="text-white/50 text-[10px] uppercase tracking-widest">{t("tasks.tasksLabel")}</span>
                  <p className="text-white text-xl font-bold" data-testid="text-task-count">
                    {user.dailyTasksCompleted}<span className="text-white/40 font-normal mx-0.5">/</span>{user.dailyTasksLimit}
                  </p>
                </div>
              </div>
              <div className="bg-white/10 rounded-full overflow-hidden h-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white/60 to-white/90 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {isLimitReached && (
                <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300" />
                  <span className="text-white/80 text-xs font-medium">{t("tasks.dailyLimitDone")}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {hasNoVipPackage ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5" />
            <div className="relative p-8 text-center">
              <div className="relative inline-block mb-5">
                <div className="relative w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/20">
                  <Crown className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-foreground font-bold text-lg mb-2">{t("tasks.needVipTitle")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5 max-w-xs mx-auto">{t("tasks.needVipDesc")}</p>
              <Link href="/vip">
                <Button
                  className="bg-gradient-to-r from-primary to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 px-8 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                  data-testid="button-buy-vip"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {t("tasks.buyVip")}
                </Button>
              </Link>
            </div>
          </div>
        ) : isLimitReached ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-emerald-500/5" />
            <div className="relative p-8 text-center">
              <div className="relative inline-block mb-5">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: "3s" }} />
                <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-foreground font-bold text-lg mb-2">{t("tasks.allTasksDone")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5 max-w-xs mx-auto">{t("tasks.allTasksDoneDesc")}</p>
              <Link href="/vip">
                <Button
                  className="bg-gradient-to-r from-primary to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 px-8 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                  data-testid="button-upgrade-vip"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {t("tasks.upgradeVip")}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-foreground font-bold text-sm mb-3 px-0.5">{t("tasks.todayTasks")}</h2>

              <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
                <div className="relative aspect-video">
                  <img
                    src={`https://img.youtube.com/vi/${nextVideoId}/maxresdefault.jpg`}
                    alt="Video preview"
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <div className="bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-emerald-400 text-xs font-bold">+${perVideoReward.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-bold text-base mb-1 drop-shadow-lg">{t("tasks.videoTask")}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10">
                        <Clock className="w-3 h-3 text-white/70" />
                        <span className="text-white/70 text-[10px] font-medium">{t("tasks.watchSeconds", { seconds: TIMER_DURATION })}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <Button
                    onClick={handleStartTask}
                    disabled={!hasVip}
                    className="w-full bg-gradient-to-r from-primary to-blue-600 text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-12 text-sm disabled:opacity-40 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                    data-testid="button-start-task"
                  >
                    {noPrivilege ? (
                      t("tasks.noPrivilege")
                    ) : !hasVip ? (
                      t("tasks.vipRequired")
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" fill="white" fillOpacity={0.8} />
                        {t("tasks.startTask")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-2.5 justify-center">
                <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-primary" />
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("tasks.eachButton", { seconds: TIMER_DURATION })}
                </p>
              </div>
            </div>
          </>
        )}

        {activeVideoId && (
          <VideoPlayerModal
            videoId={activeVideoId}
            perVideoReward={perVideoReward}
            open={!!activeVideoId}
            onClose={handleCloseVideo}
          />
        )}
      </div>
  );
}
