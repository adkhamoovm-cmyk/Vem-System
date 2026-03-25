import { useState, useEffect, useRef } from "react";
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

const youtubeVideos = [
  "Ed1sGgHUo88", "_zHPsmXCjB0", "ueCc-AYUMRs", "XwQRkOK5KC4", "YN2H_sKcmGw",
  "u3V5KDHRQvk", "gn5QmllRCn4", "C5pHpQqhmR4", "TcMBFSGVi1c", "PLLQK9la6Go",
  "pBk4NYhWNMM", "L0MK7qz13bU", "ue80QwXMRHg", "-sAOWhvheK8", "fsQgc9pCyDU",
  "xxEt9fnILgQ", "8g18jFHCLXk", "cqGjhVJWtEg", "KK8FHdFluOQ", "6COmYeLsz4c",
  "mqqft2x_Aa4", "Rt_UqUm38BI", "YoHD9XEInc0", "d9MyW72ELq0", "giXco2jaZ_4",
  "8Qn_spdM5Zg", "eOrNdBpGMv8", "xjDjIWPwcPU", "hYcw5ksV8YQ", "u34gHaRiBIU",
  "JfVOs4VSpmA", "Way9Dexny3w", "odM92ap8_c0", "BwPL0Md_QFQ", "dxWvtMOGAhw",
  "GoAA0sYkLI0", "zSWdZVtXT7E", "vKQi3bBA1y8", "X0tOpBuYasI", "CaimKeDcudo",
  "nW948Va-l10", "wxN1T1uxQ2g", "IWBsDaFWyTE", "0WVDKZJkGlY", "BIhNsAtPbPI",
  "2m1drlOZSDw", "P6AaSMfXHbA", "bK6ldnjE3Y0", "kXYiU_JCYtU", "ZYzbalQ6Lg8",
  "lV1OOlGwExM", "8YjFbMbfXaQ", "qEVUtrk8_B4", "t86sKsR4pnk", "lB95KLmpLR4",
  "oZ6iiRrz1SY", "wb49-oV0F78", "6DxjJzmYsXo", "s7EdQ4FqbhY", "RlOB3UALvrQ",
  "EG0si5bSd6I", "4rgYUipGJNo", "5PSNL1qE6VY", "tmeOjFno6Do", "8ZYhuvIv1pA",
  "shW9i6k8cB0", "GV3HUDMQ-F8", "M7XM597XO94", "aWzlQ2N6qqg", "Py_IndUbcxc",
  "G5kzUpWAusI", "u9Mv98Gr5pY", "ahZFCF--uRY", "V75dMMIW2B4", "kBY2k3G6LsM",
  "5xH0HfJHsaY", "rBxcF-r9Ibs", "vw2FOYjCz38", "o_1aF54DO60", "kVrqfYjkTdQ",
  "FnCdOQsX5kc", "2LqzF5WauAw", "bO7FQsCcbD8", "T7O7BtBnsG4", "ELeMaP8EPAA",
  "Hhy7JUinlu0", "0gNauGdOkro", "FOjdXSrtUxA", "gxEPV4kolz0", "GjwfqXTebIY",
  "Fp9pNPdNwjI", "LZM9YdO_QKk", "FgmnKsED-jU", "EXeTwQWrcwY", "uYPbbksJxIg",
  "CmRih_VtVAs", "AYaTCPbYGdk", "jg09lNupc1s", "NYH2sLid0Zc", "rOJ1cw6mohw",
  "JKa05nyUmuQ", "TnGl01FkMMo", "QwievZ1Tx-8", "SUXWAEX2jlg", "9ix7TUGVYIo",
  "oyRxxpD3yNw", "ASzOzrB-a9E", "U2Qp5pL3ovA",
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
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&controls=0&showinfo=0&iv_load_policy=3`}
                  className="w-full h-full absolute inset-0"
                  allow="autoplay; encrypted-media; fullscreen; accelerometer; gyroscope"
                  allowFullScreen
                  style={{ border: "none" }}
                />
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
