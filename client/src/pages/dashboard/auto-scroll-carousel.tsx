import { useRef, useEffect } from "react";

export function AutoScrollCarousel({ children, speed = 0.5 }: { children: React.ReactNode; speed?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const isUserInteracting = useRef(false);
  const resumeTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const animate = () => {
      if (!isUserInteracting.current && el) {
        el.scrollLeft += speed;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 1) {
          el.scrollLeft = 0;
        }
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [speed]);

  const handleInteractionStart = () => {
    isUserInteracting.current = true;
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
  };

  const handleInteractionEnd = () => {
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 2000);
  };

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
    >
      {children}
    </div>
  );
}
