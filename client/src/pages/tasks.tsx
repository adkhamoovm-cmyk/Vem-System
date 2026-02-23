import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Clock, CheckCircle, Star, Calendar, MapPin, Crown, Lock, Volume2, VolumeX, Maximize2 } from "lucide-react";
import ReactPlayer from "react-player";
import type { Video, User, VipPackage } from "@shared/schema";
import AppLayout from "@/components/app-layout";
import { Link } from "wouter";

function VideoModal({ video, perVideoReward, open, onClose }: { video: Video; perVideoReward: number; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const durationRef = useRef(25);
  const completedRef = useRef(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tasks/complete", { videoId: video.id });
      return res.json();
    },
    onSuccess: (data: any) => {
      completedRef.current = true;
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
      const d = Math.floor(Math.random() * 13) + 18;
      durationRef.current = d;
      completedRef.current = false;
      setTimeLeft(d);
      setStarted(false);
      setCompleted(false);
    }
  }, [open]);

  useEffect(() => {
    if (!started || completed) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!completedRef.current) {
            completeMutation.mutate();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, completed]);

  const handleVideoPlay = () => {
    if (!started) {
      setStarted(true);
    }
  };

  const duration = durationRef.current;
  const progress = started ? ((duration - timeLeft) / duration) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && (completed || !started)) onClose(); }}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-lg rounded-2xl p-0 overflow-hidden" data-testid="modal-video" aria-describedby="video-modal-desc">
        <div className="relative aspect-video bg-black" ref={playerContainerRef}>
          <ReactPlayer
            url={video.videoUrl || undefined}
            light={video.thumbnail}
            playing={started}
            controls={true}
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
            onPlay={handleVideoPlay}
            onClickPreview={handleVideoPlay}
            playIcon={
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#E8453C] rounded-full flex items-center justify-center shadow-xl shadow-[#FF6B35]/30">
                  <Play className="w-7 h-7 text-white ml-1" />
                </div>
                <span className="text-white/90 text-xs mt-3 font-medium drop-shadow-lg">Boshlash uchun bosing</span>
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
            data-testid="video-player"
          />

          {started && !completed && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-xs font-mono font-bold" data-testid="text-timer">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
              </div>
              <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                <span className="text-[#FF6B35] font-bold text-xs">+${perVideoReward.toFixed(2)}</span>
              </div>
            </div>
          )}

          {started && !completed && (
            <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none">
              <div className="h-1 bg-white/20">
                <div className="h-full bg-gradient-to-r from-[#FF6B35] to-[#E8453C] transition-all duration-1000" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {completed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-2 z-10">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Bajarildi!</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <DialogHeader>
            <DialogTitle className="text-white text-base">{video.title}</DialogTitle>
            <p id="video-modal-desc" className="text-[#888] text-xs">{video.actors}</p>
          </DialogHeader>

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
                <p className="text-[#4ADE80]/70 text-xs mt-0.5">hisobingizga tushdi</p>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TasksPage() {
  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: vipPackages } = useQuery<VipPackage[]>({
    queryKey: ["/api/vip-packages"],
  });

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const currentPkg = vipPackages?.find(p => p.level === user?.vipLevel);
  const perVideoReward = currentPkg ? Number(currentPkg.perVideoReward) : 0;
  const hasVip = user && user.vipLevel >= 0 && perVideoReward > 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

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
                    {user.vipLevel === 0 ? "Stajyor" : `M${user.vipLevel}`}
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
                <Button className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white text-xs no-default-hover-elevate no-default-active-elevate rounded-xl h-8 px-4" data-testid="button-go-vip">
                  VIP olish
                </Button>
              </Link>
            </div>
          </div>
        )}

        <h2 className="text-white font-bold text-sm mb-3">Bugungi vazifalar</h2>

        <div className="space-y-3">
          {videos?.map((video) => {
            const isLimitReached = user && user.dailyTasksCompleted >= user.dailyTasksLimit;

            return (
              <div
                key={video.id}
                onClick={() => {
                  if (!isLimitReached && hasVip) setSelectedVideo(video);
                }}
                className={`bg-[#1a1a1a] rounded-2xl p-3 flex gap-3 border border-[#2a2a2a] transition-transform ${
                  !isLimitReached && hasVip ? "cursor-pointer active:scale-[0.99]" : "opacity-70"
                }`}
                data-testid={`card-video-${video.id}`}
              >
                <div className="w-24 h-32 rounded-xl overflow-hidden shrink-0 bg-[#111] relative">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 left-1.5">
                    <span className="bg-[#E50914] text-white text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {video.category}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <h3 className="text-white font-bold text-sm">{video.title}</h3>
                  {video.actors && (
                    <p className="text-[#888] text-xs mt-1 line-clamp-1">{video.actors}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1.5">
                    {[1,2,3,4,5].map(i => {
                      const rating = Number(video.rating || 5);
                      const full = i <= Math.floor(rating);
                      return (
                        <Star key={i} className={`w-3 h-3 ${full ? "fill-[#FFB300] text-[#FFB300]" : "fill-[#333] text-[#333]"}`} />
                      );
                    })}
                    <span className="text-[#888] text-[10px] ml-1">{video.rating}</span>
                  </div>
                  {video.releaseDate && (
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-[#555]" />
                      <span className="text-[#555] text-[10px]">{video.releaseDate}</span>
                      {video.country && (
                        <>
                          <span className="text-[#444] text-[10px]">&middot;</span>
                          <span className="text-[#555] text-[10px]">{video.country}</span>
                        </>
                      )}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[#FF6B35] text-xs font-bold">
                      +${perVideoReward.toFixed(2)}
                    </span>
                    {!isLimitReached && hasVip ? (
                      <span className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white text-[10px] font-semibold px-3 py-1 rounded-full">
                        Boshlash
                      </span>
                    ) : (
                      <span className="bg-[#333] text-[#888] text-[10px] font-semibold px-3 py-1 rounded-full">
                        {isLimitReached ? "Limit tugadi" : "VIP kerak"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedVideo && (
          <VideoModal
            video={selectedVideo}
            perVideoReward={perVideoReward}
            open={!!selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
