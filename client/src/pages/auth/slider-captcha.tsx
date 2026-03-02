import { useState, useRef, useCallback } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";

export function SliderCaptcha({ onVerified, t }: { onVerified: () => void; t: (key: string) => string }) {
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((_clientX: number) => {
    if (verified) return;
    setIsDragging(true);
  }, [verified]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !trackRef.current || verified) return;
    const rect = trackRef.current.getBoundingClientRect();
    const maxX = rect.width - 44;
    const x = Math.max(0, Math.min(clientX - rect.left - 22, maxX));
    setSliderPos(x);
    if (x >= maxX - 5) {
      setVerified(true);
      setIsDragging(false);
      setSliderPos(maxX);
      onVerified();
    }
  }, [isDragging, verified, onVerified]);

  const handleEnd = useCallback(() => {
    if (!verified) setSliderPos(0);
    setIsDragging(false);
  }, [verified]);

  const trackWidth = trackRef.current?.getBoundingClientRect().width || 300;
  const maxX = trackWidth - 48;
  const progress = maxX > 0 ? Math.min((sliderPos / maxX) * 100, 100) : 0;

  return (
    <div
      ref={trackRef}
      className={`relative h-[52px] rounded-xl select-none overflow-hidden transition-all duration-500 ${verified ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10" : "bg-muted/50"}`}
      style={{ border: verified ? "1.5px solid rgba(34,197,94,0.3)" : "1.5px solid hsl(var(--border) / 0.5)" }}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      data-testid="captcha-slider-track"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-xl transition-all duration-100"
        style={{ width: `${progress}%`, background: verified ? "linear-gradient(90deg, rgba(34,197,94,0.15), rgba(16,185,129,0.15))" : "linear-gradient(90deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.04))" }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {verified ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-500 tracking-wide">{t("auth.captchaVerified")}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-muted-foreground font-medium tracking-wide">{t("auth.captchaSlide")}</span>
            <div className="flex -space-x-1">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 animate-pulse" />
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 animate-pulse" style={{ animationDelay: "150ms" }} />
            </div>
          </div>
        )}
      </div>
      <div
        className={`absolute top-[5px] w-[42px] h-[42px] rounded-lg flex items-center justify-center z-20 transition-all duration-150 ${verified ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30" : isDragging ? "bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl shadow-primary/30 scale-105" : "bg-card text-primary border border-border/50 shadow-md"}`}
        style={{ left: `${sliderPos + 4}px`, cursor: verified ? "default" : isDragging ? "grabbing" : "grab" }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        data-testid="captcha-slider-handle"
      >
        {verified ? <CheckCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
      </div>
    </div>
  );
}
