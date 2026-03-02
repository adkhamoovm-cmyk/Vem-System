import { useEffect, useState, useCallback, useRef } from "react";
import { Crown, Rocket, TrendingUp, Star, Sparkles, Zap, X, ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface CelebrationData {
  type: "vip_activated" | "vip_extended" | "fund_invested";
  packageName?: string;
  level?: number;
  dailyTasks?: number;
  durationDays?: number;
  perVideoReward?: string;
  refundAmount?: string | null;
  planName?: string;
  amount?: number;
  dailyProfit?: string;
  dailyRoi?: string;
}

interface CelebrationModalProps {
  data: CelebrationData | null;
  onClose: () => void;
}

const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
  "#85C1E9", "#F8C471", "#82E0AA", "#F1948A", "#AED6F1",
];

const levelGradients: Record<number, string> = {
  0: "from-gray-500 to-gray-600",
  1: "from-emerald-500 to-emerald-600",
  2: "from-blue-500 to-blue-600",
  3: "from-violet-500 to-violet-600",
  4: "from-purple-500 to-purple-600",
  5: "from-amber-500 to-amber-600",
  6: "from-orange-500 to-red-500",
  7: "from-rose-500 to-pink-600",
  8: "from-cyan-400 to-blue-600",
  9: "from-indigo-500 to-purple-600",
  10: "from-yellow-400 to-amber-500",
};

interface Particle {
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: number;
}

export default function CelebrationModal({ data, onClose }: CelebrationModalProps) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

  const animateConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 200,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 4 + Math.random() * 8,
        speedX: (Math.random() - 0.5) * 4,
        speedY: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: Math.floor(Math.random() * 3),
      });
    }
    particlesRef.current = particles;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particlesRef.current.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.05;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, p.opacity - 0.003);

        if (p.y < canvas.height + 50 && p.opacity > 0) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          if (p.shape === 0) {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (p.shape === 1) {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
              const r = p.size / 2;
              ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
              const innerAngle = angle + (2 * Math.PI) / 10;
              ctx.lineTo(Math.cos(innerAngle) * r * 0.4, Math.sin(innerAngle) * r * 0.4);
            }
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      });

      if (alive) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  }, []);

  const handleClose = useCallback(() => {
    setShowContent(false);
    setTimeout(() => {
      setShow(false);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      document.body.style.overflow = "";
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (data) {
      setShow(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => setShowContent(true), 100);
      setTimeout(() => animateConfetti(), 50);

      const timer = setTimeout(() => handleClose(), 8000);

      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") handleClose();
      };
      window.addEventListener("keydown", handleEsc);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleEsc);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        document.body.style.overflow = "";
      };
    }
  }, [data, handleClose, animateConfetti]);

  useEffect(() => {
    if (showContent && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [showContent]);

  if (!data || !show) return null;

  const isVip = data.type === "vip_activated" || data.type === "vip_extended";
  const isFund = data.type === "fund_invested";
  const gradient = isVip ? levelGradients[data.level || 0] || "from-blue-500 to-purple-600" : "from-emerald-500 to-cyan-500";

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${showContent ? "bg-black/70 backdrop-blur-sm" : "bg-transparent"}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("celebration.congratulations")}
      data-testid="celebration-overlay"
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[101]" />

      <div 
        ref={dialogRef}
        tabIndex={-1}
        className={`relative z-[102] w-[90%] max-w-sm transition-all duration-500 outline-none ${showContent ? "scale-100 opacity-100 translate-y-0" : "scale-50 opacity-0 translate-y-10"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute -top-3 -right-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white/70"
            data-testid="celebration-close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          <div className={`bg-gradient-to-br ${gradient} p-6 pb-8 text-center relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-white/30 blur-xl animate-pulse" />
              <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full bg-white/20 blur-2xl animate-pulse delay-500" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
            </div>

            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce">
                {isVip ? (
                  <Crown className="w-10 h-10 text-white drop-shadow-lg" />
                ) : (
                  <TrendingUp className="w-10 h-10 text-white drop-shadow-lg" />
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" />
                <h2 className="text-2xl font-bold text-white drop-shadow-md" data-testid="celebration-title">
                  {t("celebration.congratulations")}
                </h2>
                <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse" />
              </div>

              <p className="text-white/90 text-sm font-medium" data-testid="celebration-subtitle">
                {isVip
                  ? (data.type === "vip_extended" 
                    ? t("celebration.vipExtended", { name: data.packageName || "" })
                    : t("celebration.vipActivated", { name: data.packageName || "" }))
                  : t("celebration.fundInvested", { name: data.planName || "" })
                }
              </p>
            </div>
          </div>

          <div className="bg-[#0d1117] p-5 space-y-3">
            {isVip && (
              <>
                <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/5 border border-white/5" data-testid="celebration-stat-level">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white/70">{t("celebration.level")}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{data.packageName}</span>
                </div>

                <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/5 border border-white/5" data-testid="celebration-stat-tasks">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white/70">{t("celebration.dailyTasks")}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{data.dailyTasks} {t("celebration.tasks")}</span>
                </div>

                <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/5 border border-white/5" data-testid="celebration-stat-reward">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white/70">{t("celebration.perVideo")}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{data.perVideoReward} USDT</span>
                </div>

                <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/5 border border-white/5" data-testid="celebration-stat-duration">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                      <Rocket className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white/70">{t("celebration.duration")}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{data.durationDays} {t("celebration.workDays")}</span>
                </div>

                {data.refundAmount && (
                  <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20" data-testid="celebration-stat-refund">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center">
                        <ArrowDownLeft className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-emerald-300">{t("celebration.refund")}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">+{data.refundAmount} USDT</span>
                  </div>
                )}
              </>
            )}

            {isFund && (
              <>
                <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/5 border border-white/5" data-testid="celebration-stat-plan">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white/70">{t("celebration.fundPlan")}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{data.planName}</span>
                </div>

                <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/5 border border-white/5" data-testid="celebration-stat-amount">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white/70">{t("celebration.invested")}</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{data.amount} USDT</span>
                </div>

                <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/5 border border-white/5" data-testid="celebration-stat-profit">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                      <Star className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white/70">{t("celebration.dailyProfit")}</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-400">+{data.dailyProfit} USDT</span>
                </div>

                <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-white/5 border border-white/5" data-testid="celebration-stat-roi">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                      <Rocket className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-white/70">{t("celebration.roi")}</span>
                  </div>
                  <span className="text-sm font-bold text-purple-400">{data.dailyRoi}% / {t("celebration.day")}</span>
                </div>
              </>
            )}

            <Button
              onClick={handleClose}
              className={`w-full mt-3 rounded-xl bg-gradient-to-r ${gradient} text-white font-semibold shadow-lg border-0`}
              data-testid="celebration-continue"
            >
              {t("celebration.continue")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
