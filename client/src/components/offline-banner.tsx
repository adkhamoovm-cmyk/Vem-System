import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { t } = useI18n();

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => {
      setIsOffline(false);
      window.location.reload();
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <>
      <style>{`
        @keyframes offlineFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes offlineIconFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes offlineRing { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.8); opacity: 0; } }
        @keyframes offlineDot { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.3); } }
        @keyframes offlineShimmer { 0%, 100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }
      `}</style>
      <div
        className="fixed inset-0 z-[9999] bg-background flex items-center justify-center"
        style={{ animation: "offlineFadeIn 0.4s ease-out" }}
        data-testid="overlay-offline"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[20%] w-72 h-72 rounded-full bg-primary/[0.08] blur-[80px]" style={{ animation: "offlineIconFloat 8s ease-in-out infinite" }} />
          <div className="absolute bottom-[10%] right-[15%] w-60 h-60 rounded-full bg-purple-500/[0.06] blur-[60px]" style={{ animation: "offlineIconFloat 10s ease-in-out infinite reverse" }} />
        </div>

        <div className="relative text-center px-6 max-w-sm">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" style={{ animation: "offlineRing 3s ease-out infinite" }} />
            <div className="absolute inset-0 rounded-full border-2 border-primary/15" style={{ animation: "offlineRing 3s ease-out 1s infinite" }} />
            <div className="absolute inset-0 rounded-full border-2 border-primary/10" style={{ animation: "offlineRing 3s ease-out 2s infinite" }} />
            <div
              className="absolute inset-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30"
              style={{ animation: "offlineIconFloat 4s ease-in-out infinite" }}
            >
              <WifiOff className="w-9 h-9 text-white" />
            </div>
            <div className="absolute top-1/2 left-1/2 w-14 h-0.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] -translate-x-1/2 -translate-y-1/2 -rotate-45" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" style={{ animation: "offlineDot 2s ease-in-out infinite" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" style={{ animation: "offlineDot 2s ease-in-out 0.3s infinite" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" style={{ animation: "offlineDot 2s ease-in-out 0.6s infinite" }} />
            <span className="text-red-500 text-[11px] font-bold tracking-widest uppercase ml-1">OFFLINE</span>
          </div>

          <h1 className="text-xl font-extrabold mb-2 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent" data-testid="text-offline-title">
            {t("common.offlineTitle")}
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8" data-testid="text-offline-message">
            {t("common.offlineDesc")}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="relative overflow-hidden inline-flex items-center gap-2 bg-gradient-to-r from-primary to-blue-500 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 active:scale-[0.96] transition-transform"
            data-testid="button-retry-connection"
          >
            <RefreshCw className="w-4.5 h-4.5" />
            {t("common.retryConnection")}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent" style={{ animation: "offlineShimmer 3s ease-in-out infinite" }} />
          </button>
        </div>
      </div>
    </>
  );
}
