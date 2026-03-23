import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";

export function SliderCaptcha({ onVerified, t }: { onVerified: () => void; t: (key: string) => string }) {
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const getMaxX = useCallback(() => {
    if (!trackRef.current) return 250;
    return trackRef.current.getBoundingClientRect().width - 48;
  }, []);

  const handleMove = useCallback((clientX: number) => {
    if (!draggingRef.current || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const maxX = rect.width - 48;
    const x = Math.max(0, Math.min(clientX - rect.left - 22, maxX));
    setSliderPos(x);
    if (x >= maxX - 5) {
      setVerified(true);
      draggingRef.current = false;
      setIsDragging(false);
      setSliderPos(maxX);
      onVerified();
    }
  }, [onVerified]);

  const handleEnd = useCallback(() => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);
    setSliderPos(0);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };
    const onMouseUp = () => handleEnd();
    const onTouchEnd = () => handleEnd();

    document.addEventListener("mousemove", onMouseMove, { passive: false });
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (verified) return;
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;
    setIsDragging(true);
  }, [verified]);

  const maxX = getMaxX();
  const progress = maxX > 0 ? Math.min((sliderPos / maxX) * 100, 100) : 0;

  return (
    <div
      ref={trackRef}
      className={`relative h-[52px] rounded-xl select-none overflow-hidden touch-none transition-all duration-500 ${verified ? "bg-gradient-to-r from-emerald-500/10 to-green-500/10" : "bg-muted/50"}`}
      style={{ border: verified ? "1.5px solid rgba(34,197,94,0.3)" : "1.5px solid hsl(var(--border) / 0.5)" }}
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
        className={`absolute top-[5px] w-[42px] h-[42px] rounded-lg flex items-center justify-center z-20 transition-shadow duration-150 ${verified ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-lg shadow-emerald-500/30" : isDragging ? "bg-gradient-to-br from-primary to-blue-600 text-white shadow-xl shadow-primary/30 scale-105" : "bg-card text-primary border border-border/50 shadow-md"}`}
        style={{ left: `${sliderPos + 4}px`, cursor: verified ? "default" : isDragging ? "grabbing" : "grab", touchAction: "none" }}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        data-testid="captcha-slider-handle"
      >
        {verified ? <CheckCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
      </div>
    </div>
  );
}
