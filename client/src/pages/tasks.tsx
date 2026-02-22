import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Clock, CheckCircle, X } from "lucide-react";
import type { Video, User } from "@shared/schema";
import AppLayout from "@/components/app-layout";

function VideoModal({ video, open, onClose }: { video: Video; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const durationRef = useRef(25);
  const completedRef = useRef(false);

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

  const duration = durationRef.current;
  const progress = started ? ((duration - timeLeft) / duration) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && (completed || !started)) onClose(); }}>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] max-w-lg" data-testid="modal-video" aria-describedby="video-modal-desc">
        <DialogHeader>
          <DialogTitle className="text-[#e0e0e0]">{video.title}</DialogTitle>
          <p id="video-modal-desc" className="text-[#888] text-sm">Video ko'rib vazifani bajaring</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative rounded-md overflow-hidden aspect-video bg-[#111]">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            {!started && !completed && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Button
                  onClick={() => setStarted(true)}
                  className="bg-[#c9a84c] text-[#121212] font-semibold no-default-hover-elevate no-default-active-elevate gap-2"
                  data-testid="button-start-video"
                >
                  <Play className="w-5 h-5" />
                  Boshlash
                </Button>
              </div>
            )}
            {completed && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-2">
                <CheckCircle className="w-12 h-12 text-[#c9a84c]" />
                <span className="text-[#c9a84c] font-semibold text-lg">Bajarildi!</span>
              </div>
            )}
          </div>

          {started && !completed && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#c9a84c]" />
                  <span className="text-[#999] text-sm">Qolgan vaqt</span>
                </div>
                <span className="text-[#e0e0e0] font-mono text-sm" data-testid="text-timer">
                  {timeLeft} soniya
                </span>
              </div>
              <Progress value={progress} className="h-1.5 bg-[#222]" />
              <p className="text-[#666] text-xs text-center">
                Taymer tugagunga qadar oynani yopmang
              </p>
            </div>
          )}

          {completed && (
            <div className="bg-[#1e1b14] rounded-md p-4 border border-[#2a2510] text-center">
              <p className="text-[#c9a84c] font-medium">
                +{Number(video.reward).toLocaleString()} so'm hisobingizga tushdi
              </p>
            </div>
          )}

          {completed && (
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-[#2a2a2a] text-[#999]"
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
          <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {user && (
          <div className="mb-6 bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[#999] text-sm">Bugungi progress</span>
              <span className="text-[#e0e0e0] text-sm font-medium" data-testid="text-task-count">
                {user.dailyTasksCompleted} / {user.dailyTasksLimit} vazifa
              </span>
            </div>
            <Progress
              value={user.dailyTasksLimit > 0 ? (user.dailyTasksCompleted / user.dailyTasksLimit) * 100 : 0}
              className="h-1.5 bg-[#222] mt-2"
            />
          </div>
        )}

        <h2 className="text-lg font-semibold text-[#e0e0e0] mb-4">Videolar</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {videos?.map((video) => (
            <div
              key={video.id}
              onClick={() => setSelectedVideo(video)}
              className="cursor-pointer group"
              data-testid={`card-video-${video.id}`}
            >
              <div className="relative rounded-md overflow-hidden aspect-[3/4] bg-[#111]">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-white text-sm font-medium line-clamp-2">{video.title}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[#c9a84c] text-xs font-medium">
                      +{Number(video.reward).toLocaleString()} so'm
                    </span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-0.5">
                  <span className="text-white text-[10px]">{video.category}</span>
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
