import { Link } from "wouter";
import { useI18n } from "@/lib/i18n";
import { Home } from "lucide-react";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 overflow-hidden relative" style={{ paddingTop: "var(--sat, 0px)", paddingBottom: "var(--sab, 0px)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl animate-float-slow-reverse" />
      </div>

      <div className="relative text-center max-w-sm w-full">
        <div className="relative mb-6">
          <span className="text-[120px] sm:text-[160px] font-black leading-none bg-gradient-to-br from-primary/30 via-blue-500/20 to-purple-500/20 bg-clip-text text-transparent select-none animate-pulse-slow" data-testid="text-404-title">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/30 animate-bounce-gentle">
              <span className="text-3xl">?</span>
            </div>
          </div>
        </div>

        <h2 className="text-foreground font-bold text-xl mb-2">{t("common.pageNotFound")}</h2>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">{t("common.pageNotFoundDesc")}</p>

        <Link href="/dashboard">
          <button
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 text-white px-8 py-3.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97] transition-all duration-200"
            data-testid="button-go-home"
          >
            <Home className="w-4 h-4" />
            {t("common.goHome")}
          </button>
        </Link>
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes float-slow-reverse {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(20px) scale(0.95); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-4px) rotate(3deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.15; }
        }
        .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
        .animate-float-slow-reverse { animation: float-slow-reverse 8s ease-in-out infinite; }
        .animate-bounce-gentle { animation: bounce-gentle 3s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
