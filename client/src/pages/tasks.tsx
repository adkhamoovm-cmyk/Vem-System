import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Clock, CheckCircle, Star, Calendar, MapPin } from "lucide-react";
import type { Video, User } from "@shared/schema";
import AppLayout from "@/components/app-layout";

function VideoModal({ video, open, onClose }: { video: Video; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const durationRef = useRef(25);
  const completedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

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
        description: `${data.reward} so'm hisobingizga tushdi`,
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

  const handleStart = () => {
    setStarted(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const duration = durationRef.current;
  const progress = started ? ((duration - timeLeft) / duration) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && (completed || !started)) onClose(); }}>
      <DialogContent className="bg-white border-[#eee] max-w-lg rounded-2xl" data-testid="modal-video" aria-describedby="video-modal-desc">
        <DialogHeader>
          <DialogTitle className="text-[#1a1a2e]">{video.title}</DialogTitle>
          <p id="video-modal-desc" className="text-[#999] text-sm">Video ko'rib vazifani bajaring</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
            {video.videoUrl ? (
              <video
                ref={videoRef}
                src={video.videoUrl}
                poster={video.thumbnail}
                className="w-full h-full object-cover"
                muted
                playsInline
                data-testid="video-player"
              />
            ) : (
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            )}
            {!started && !completed && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Button
                  onClick={handleStart}
                  className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white font-semibold no-default-hover-elevate no-default-active-elevate gap-2 rounded-xl shadow-lg h-11 px-6"
                  data-testid="button-start-video"
                >
                  <Play className="w-5 h-5" />
                  Boshlash
                </Button>
              </div>
            )}
            {completed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-2">
                <CheckCircle className="w-14 h-14 text-[#4CAF50]" />
                <span className="text-white font-bold text-lg">Bajarildi!</span>
              </div>
            )}
          </div>

          {started && !completed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-[#666] text-sm">Qolgan vaqt</span>
                </div>
                <span className="text-[#1a1a2e] font-mono text-sm font-bold" data-testid="text-timer">
                  {timeLeft} soniya
                </span>
              </div>
              <Progress value={progress} className="h-2 bg-[#f0f0f0] rounded-full" />
              <p className="text-[#999] text-xs text-center">
                Taymer tugagunga qadar oynani yopmang
              </p>
            </div>
          )}

          {completed && (
            <div className="bg-[#E8F5E9] rounded-xl p-4 border border-[#C8E6C9] text-center">
              <p className="text-[#2E7D32] font-semibold">
                +{Number(video.reward).toLocaleString()} so'm hisobingizga tushdi
              </p>
            </div>
          )}

          {completed && (
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-[#e0e0e0] text-[#666] rounded-xl"
              data-testid="button-close-video"
            >
              Yopish
            </Button>
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

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

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
                <span className="text-white/80 text-xs font-medium">V{user.vipLevel}</span>
                <p className="text-sm font-semibold mt-0.5">
                  Kunlik daromad: {Number(user.balance).toLocaleString()} so'm
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

        <h2 className="text-[#1a1a2e] font-bold text-sm mb-3">Bugungi vazifalar</h2>

        <div className="space-y-3">
          {videos?.map((video) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="bg-white rounded-2xl p-3 flex gap-3 shadow-sm border border-[#f0f0f0] cursor-pointer active:scale-[0.99] transition-transform"
              data-testid={`card-video-${video.id}`}
            >
              <div className="w-24 h-32 rounded-xl overflow-hidden shrink-0 bg-[#f0f0f0]">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h3 className="text-[#1a1a2e] font-bold text-sm">{video.title}</h3>
                {video.actors && (
                  <p className="text-[#999] text-xs mt-1 line-clamp-1">
                    Aktyor: {video.actors}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1.5">
                  {[1,2,3,4,5].map(i => {
                    const rating = Number(video.rating || 5);
                    const full = i <= Math.floor(rating);
                    return (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${full ? "fill-[#FFB300] text-[#FFB300]" : "fill-[#ddd] text-[#ddd]"}`}
                      />
                    );
                  })}
                  <span className="text-[#999] text-[10px] ml-1">{video.rating}</span>
                </div>
                {video.releaseDate && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-[#bbb]" />
                    <span className="text-[#bbb] text-[10px]">{video.releaseDate}</span>
                    {video.country && (
                      <>
                        <span className="text-[#ddd] text-[10px]">·</span>
                        <span className="text-[#bbb] text-[10px]">{video.country}</span>
                      </>
                    )}
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[#FF6B35] text-xs font-bold">
                    +{Number(video.reward).toLocaleString()} so'm
                  </span>
                  <span className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white text-[10px] font-semibold px-3 py-1 rounded-full">
                    Boshlash
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedVideo && (
          <VideoModal
            video={selectedVideo}
            open={!!selectedVideo}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
