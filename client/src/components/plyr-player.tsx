import { useEffect, useRef } from "react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

interface PlyrPlayerProps {
  videoId: string;
  autoplay?: boolean;
  controls?: boolean;
  className?: string;
}

export default function PlyrPlayer({ videoId, autoplay = true, controls = true, className = "" }: PlyrPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = `<div id="plyr-${videoId}" data-plyr-provider="youtube" data-plyr-embed-id="${videoId}"></div>`;

    const target = containerRef.current.querySelector(`#plyr-${videoId}`);
    if (!target) return;

    playerRef.current = new Plyr(target as HTMLElement, {
      autoplay,
      controls: controls
        ? ["play-large", "play", "progress", "current-time", "mute", "volume", "fullscreen"]
        : ["play-large"],
      youtube: {
        noCookie: true,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
      },
      hideControls: !controls,
      clickToPlay: true,
      resetOnEnd: false,
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, autoplay, controls]);

  return <div ref={containerRef} className={className} />;
}
