import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { t } = useI18n();

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

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
      <style>{`@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }`}</style>
      <div className="fixed top-0 left-0 right-0 z-[9999]" style={{ animation: "slideDown 0.3s ease-out" }}>
        <div className="bg-gradient-to-r from-red-600 to-orange-500 px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
          <WifiOff className="w-4 h-4 text-white shrink-0 animate-pulse" />
          <span className="text-white text-sm font-medium" data-testid="text-offline-message">
            {t("common.offlineMessage")}
          </span>
          <button
            onClick={() => window.location.reload()}
            className="text-white/90 hover:text-white ml-1 shrink-0"
            data-testid="button-retry-connection"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
