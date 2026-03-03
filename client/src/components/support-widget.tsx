import { useState, useRef, useCallback, useEffect } from "react";
import { MessageCircle, X, Headphones, Megaphone, Users } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { useI18n } from "@/lib/i18n";

const supportLinks = [
  {
    key: "support",
    icon: Headphones,
    url: "https://t.me/vem_ms",
    color: "#3B82F6",
    labelKey: "help.techSupport",
    descKey: "help.support247",
  },
  {
    key: "channel",
    icon: Megaphone,
    url: "https://t.me/Vem_Official",
    color: "#8B5CF6",
    labelKey: "help.officialChannel",
    descKey: "help.newsAnnouncements",
  },
  {
    key: "community",
    icon: Users,
    url: "https://t.me/+rO6-eoMDl0EyYWNh",
    color: "#10B981",
    labelKey: "help.community",
    descKey: "help.userGroup",
  },
];

export function SupportWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    setPosition({ x: w - 72, y: h - 140 });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    setHasMoved(false);
    dragStart.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setHasMoved(true);
    const newX = Math.max(8, Math.min(window.innerWidth - 64, dragStart.current.px + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - 64, dragStart.current.py + dy));
    setPosition({ x: newX, y: newY });
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    if (!hasMoved) {
      setOpen(prev => !prev);
    }
  }, [hasMoved]);

  if (dismissed) return null;

  return (
    <div
      ref={btnRef}
      className="fixed z-[999]"
      style={{ left: position.x, top: position.y, touchAction: "none" }}
    >
      {open && (
        <div className="absolute bottom-16 right-0 w-64 animate-in fade-in slide-in-from-bottom-3 duration-200" data-testid="support-menu">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <SiTelegram className="w-4 h-4 text-primary" />
                <span className="text-foreground font-bold text-sm">
                  {t("common.contactUs")}
                </span>
              </div>
            </div>
            <div className="p-1.5">
              {supportLinks.map((link) => (
                <a
                  key={link.key}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/80 transition-all group"
                  data-testid={`support-link-${link.key}`}
                  onClick={() => setOpen(false)}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: link.color + "18" }}
                  >
                    <link.icon className="w-4.5 h-4.5" style={{ color: link.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-[13px] font-semibold">{t(link.labelKey)}</p>
                    <p className="text-muted-foreground text-[10px]">{t(link.descKey)}</p>
                  </div>
                  <SiTelegram className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing shadow-2xl transition-all duration-300 select-none ${
          open
            ? "bg-muted border-2 border-border"
            : "bg-gradient-to-br from-primary via-blue-500 to-purple-600 border-2 border-white/20"
        }`}
        style={{
          boxShadow: open
            ? "0 4px 20px rgba(0,0,0,0.3)"
            : "0 4px 24px rgba(37,99,235,0.4), 0 0 40px rgba(37,99,235,0.15)",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        data-testid="support-widget-button"
      >
        {open ? (
          <X className="w-5 h-5 text-foreground" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </div>

      {!open && (
        <>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="absolute -bottom-1 -right-1 w-5 h-5 bg-muted border border-border rounded-full flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-colors"
            data-testid="button-dismiss-support"
            title={t("common.hide")}
          >
            <X className="w-2.5 h-2.5 text-muted-foreground" />
          </button>
        </>
      )}
    </div>
  );
}
