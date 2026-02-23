import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Clock, CheckCircle, Crown, Lock, X } from "lucide-react";
import type { User, VipPackage } from "@shared/schema";
import AppLayout from "@/components/app-layout";
import { Link } from "wouter";

const youtubeVideos = [
  "8Qn_spdM5Zg",
  "d9MyW72ELq0",
  "TcMBFSGVi1c",
  "eOrNdBpGMv8",
  "xjDjIWPwcPU",
  "YoHD9XEInc0",
  "hYcw5ksV8YQ",
  "u34gHaRiBIU",
  "giXco2jaZ_4",
  "dQw4w9WgXcQ",
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
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [completed, setCompleted] = useState(false);

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const iframeSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&rel=0&modestbranding=1`;

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tasks/complete", { youtubeVideoId: videoId });
      return res.json();
    },
    onSuccess: (data: any) => {
      setCompleted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Vazifa bajarildi!",
        description: `$${data.reward} hisobingizga tushdi`,
      });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" data-testid="modal-video">
      <div className="w-full max-w-lg bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#2a2a2a] shadow-2xl">
        <div className="relative aspect-video bg-black">
          {!started ? (
            <div className="relative w-full h-full">
              <img
                src={thumbnailUrl}
                alt="Video thumbnail"
                className="w-full h-full object-cover"
                data-testid="img-thumbnail"
              />
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center">
                <Button
                  onClick={() => setStarted(true)}
                  className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#E8453C] rounded-full flex items-center justify-center shadow-xl shadow-[#FF6B35]/30 no-default-hover-elevate no-default-active-elevate cursor-pointer"
                  data-testid="button-play"
                >
                  <Play className="w-7 h-7 text-white ml-1" />
                </Button>
                <span className="text-white/90 text-xs mt-3 font-medium drop-shadow-lg">
                  Boshlash uchun bosing
                </span>
              </div>
            </div>
          ) : !completed ? (
            <>
              <iframe
                src={iframeSrc}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen={false}
                data-testid="video-iframe"
              />
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
                  <Clock className="w-3 h-3 text-[#FF6B35]" />
                  <span className="text-white text-xs font-mono font-bold" data-testid="text-timer">
                    Qolgan vaqt: {timeLeft} soniya
                  </span>
                </div>
                <div className="bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <span className="text-[#FF6B35] font-bold text-xs">+${perVideoReward.toFixed(2)}</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
                <div className="h-1 bg-white/20">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF6B35] to-[#E8453C] transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#111] to-[#0a0a0a] gap-3">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Bajarildi!</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {started && !completed && (
            <div className="bg-[#FF6B35]/10 rounded-xl p-3 border border-[#FF6B35]/20">
              <div className="flex items-center justify-between">
                <span className="text-[#aaa] text-xs">Taymer tugagunga qadar oynani yopmang</span>
                <span className="text-[#FF6B35] font-bold text-sm">+${perVideoReward.toFixed(2)}</span>
              </div>
            </div>
          )}

          {completed && (
            <>
              <div className="bg-[#4ADE80]/10 rounded-xl p-4 border border-[#4ADE80]/20 text-center">
                <p className="text-[#4ADE80] font-bold text-lg">+${perVideoReward.toFixed(2)}</p>
                <p className="text-[#4ADE80]/70 text-xs mt-0.5">Vazifa bajarildi, balansingizga pul qo'shildi!</p>
              </div>
              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-10"
                data-testid="button-close-video"
              >
                Davom etish
              </Button>
            </>
          )}

          {!completed && (
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-[#666] hover:text-white text-xs h-8"
              data-testid="button-cancel-video"
              disabled={started && timeLeft > 0}
            >
              {started && timeLeft > 0 ? "Taymer tugashini kuting..." : "Yopish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: vipPackages } = useQuery<VipPackage[]>({
    queryKey: ["/api/vip-packages"],
  });

  const [nextVideoId, setNextVideoId] = useState(() =>
    youtubeVideos[Math.floor(Math.random() * youtubeVideos.length)]
  );
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const currentPkg = vipPackages?.find((p) => p.level === user?.vipLevel);
  const perVideoReward = currentPkg ? Number(currentPkg.perVideoReward) : 0;
  const hasVip = user && user.vipLevel >= 0 && perVideoReward > 0;
  const isLimitReached = user ? user.dailyTasksCompleted >= user.dailyTasksLimit : false;

  const pickNextVideo = () => {
    setNextVideoId(youtubeVideos[Math.floor(Math.random() * youtubeVideos.length)]);
  };

  const handleStartTask = () => {
    if (!hasVip || isLimitReached) return;
    setActiveVideoId(nextVideoId);
  };

  const handleCloseVideo = () => {
    setActiveVideoId(null);
    pickNextVideo();
  };

  return (
    <AppLayout>
      <div className="p-4">
        {user && (
          <div className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] rounded-2xl p-4 text-white shadow-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Crown className="w-4 h-4 text-white/80" />
                  <span className="text-white/80 text-xs font-medium">
                    {user.vipLevel < 0 ? "VIP yo'q" : user.vipLevel === 0 ? "Stajyor" : `M${user.vipLevel}`}
                  </span>
                </div>
                <p className="text-sm font-semibold">
                  Har video: <span className="text-lg font-bold">${perVideoReward.toFixed(2)}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-white/80 text-xs">Vazifalar</span>
                <p className="text-lg font-bold" data-testid="text-task-count">
                  {user.dailyTasksCompleted} / {user.dailyTasksLimit}
                </p>
              </div>
            </div>
            <Progress
              value={user.dailyTasksLimit > 0 ? (user.dailyTasksCompleted / user.dailyTasksLimit) * 100 : 0}
              className="h-1.5 bg-white/20 mt-3 rounded-full"
            />
          </div>
        )}

        {!hasVip && (
          <div className="bg-[#FF6B35]/10 rounded-2xl p-4 border border-[#FF6B35]/20 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF6B35]/20 rounded-xl flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">VIP paket kerak</p>
                <p className="text-[#888] text-xs mt-0.5">Daromad olish uchun VIP paket sotib oling</p>
              </div>
              <Link href="/vip">
                <Button
                  className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white text-xs no-default-hover-elevate no-default-active-elevate rounded-xl h-8 px-4"
                  data-testid="button-go-vip"
                >
                  VIP olish
                </Button>
              </Link>
            </div>
          </div>
        )}

        <h2 className="text-white font-bold text-sm mb-3">Bugungi vazifalar</h2>

        <div className="space-y-3">
          <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#2a2a2a]">
            <div className="relative aspect-video">
              <img
                src={`https://img.youtube.com/vi/${nextVideoId}/maxresdefault.jpg`}
                alt="Video preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-bold text-sm mb-1">Video ko'rish vazifasi</p>
                <p className="text-white/60 text-xs">Tasodifiy trayler ko'ring va mukofot oling</p>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-[#aaa] text-xs">{TIMER_DURATION} soniya ko'ring</span>
                </div>
                <span className="text-[#FF6B35] text-sm font-bold">+${perVideoReward.toFixed(2)}</span>
              </div>

              <Button
                onClick={handleStartTask}
                disabled={!hasVip || isLimitReached}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-11 text-sm disabled:opacity-50"
                data-testid="button-start-task"
              >
                {isLimitReached ? (
                  "Kunlik limit tugadi"
                ) : !hasVip ? (
                  "VIP paket kerak"
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Vazifani bajarish
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a]">
            <p className="text-[#888] text-xs text-center">
              Har safar tugma bosilganda tasodifiy trayler ochiladi. {TIMER_DURATION} soniya ko'rganingizdan so'ng mukofot beriladi.
            </p>
          </div>
        </div>

        {activeVideoId && (
          <VideoPlayerModal
            videoId={activeVideoId}
            perVideoReward={perVideoReward}
            open={!!activeVideoId}
            onClose={handleCloseVideo}
          />
        )}
      </div>
    </AppLayout>
  );
}
