import { useEffect, useRef, useState, useCallback } from "react";

type AnimationType = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale-up" | "blur-in";

interface UseAnimateOptions {
  type?: AnimationType;
  delay?: number;
  threshold?: number;
  once?: boolean;
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useAnimate<T extends HTMLElement = HTMLDivElement>(options: UseAnimateOptions = {}) {
  const { type = "fade-up", delay = 0, threshold = 0.1, once = true } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    let timerId: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timerId = setTimeout(() => setIsVisible(true), delay);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      if (timerId) clearTimeout(timerId);
    };
  }, [delay, threshold, once]);

  const className = isVisible ? `animate-${type}` : "opacity-0";

  return { ref, className, isVisible };
}

export function useStaggerAnimate(count: number, baseDelay = 0, stagger = 80) {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(
    prefersReducedMotion() ? new Set(Array.from({ length: count }, (_, i) => i)) : new Set()
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const container = containerRef.current;
    if (!container) return;

    const timerIds: ReturnType<typeof setTimeout>[] = [];

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          for (let i = 0; i < count; i++) {
            const id = setTimeout(() => {
              setVisibleItems((prev) => new Set([...prev, i]));
            }, baseDelay + i * stagger);
            timerIds.push(id);
          }
          observer.unobserve(container);
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
      timerIds.forEach(clearTimeout);
    };
  }, [count, baseDelay, stagger]);

  const getItemClass = useCallback(
    (index: number) => (visibleItems.has(index) ? "animate-fade-up" : "opacity-0"),
    [visibleItems]
  );

  return { containerRef, getItemClass, visibleItems };
}
