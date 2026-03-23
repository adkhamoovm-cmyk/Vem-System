import { useState, useEffect } from "react";
import { Bell, X, Zap, MessageCircle, Gift } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const PROMPT_KEY = "vem-notif-prompt-shown";
const PROMPT_DELAY = 3000;

const texts: Record<string, {
  title: string;
  subtitle: string;
  benefit1: string;
  benefit2: string;
  benefit3: string;
  enable: string;
  later: string;
}> = {
  uz: {
    title: "Bildirishnomalarni yoqing",
    subtitle: "Muhim xabarlarni o'z vaqtida oling",
    benefit1: "Depozit va pul yechish holati haqida tezkor xabar",
    benefit2: "Yangi vazifalar va bonuslar haqida bildirishnoma",
    benefit3: "Referal daromadlari va aksiyalar haqida xabar",
    enable: "Bildirishnomalarni yoqish",
    later: "Keyinroq",
  },
  ru: {
    title: "Включите уведомления",
    subtitle: "Получайте важные сообщения вовремя",
    benefit1: "Мгновенные уведомления о статусе депозитов и выводов",
    benefit2: "Уведомления о новых заданиях и бонусах",
    benefit3: "Информация о реферальных доходах и акциях",
    enable: "Включить уведомления",
    later: "Позже",
  },
  en: {
    title: "Enable Notifications",
    subtitle: "Get important updates on time",
    benefit1: "Instant updates on deposit and withdrawal status",
    benefit2: "Notifications about new tasks and bonuses",
    benefit3: "Referral earnings and promotion alerts",
    enable: "Enable Notifications",
    later: "Maybe Later",
  },
  es: {
    title: "Activar notificaciones",
    subtitle: "Recibe mensajes importantes a tiempo",
    benefit1: "Actualizaciones instantáneas sobre depósitos y retiros",
    benefit2: "Notificaciones sobre nuevas tareas y bonos",
    benefit3: "Alertas sobre ganancias de referidos y promociones",
    enable: "Activar notificaciones",
    later: "Más tarde",
  },
  tr: {
    title: "Bildirimleri açın",
    subtitle: "Önemli güncellemeleri zamanında alın",
    benefit1: "Depozito ve çekim durumu hakkında anında bildirim",
    benefit2: "Yeni görevler ve bonuslar hakkında bildirim",
    benefit3: "Referans kazançları ve kampanya bildirimleri",
    enable: "Bildirimleri aç",
    later: "Daha sonra",
  },
};

export function NotificationPrompt() {
  const { locale } = useI18n();
  const [show, setShow] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted" || Notification.permission === "denied") return;

    const alreadyShown = localStorage.getItem(PROMPT_KEY);
    if (alreadyShown) return;

    const timer = setTimeout(() => setShow(true), PROMPT_DELAY);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setAnimateOut(true);
    setTimeout(() => {
      setShow(false);
      localStorage.setItem(PROMPT_KEY, "later");
    }, 300);
  };

  const handleEnable = async () => {
    localStorage.setItem(PROMPT_KEY, "accepted");
    setAnimateOut(true);
    setTimeout(() => setShow(false), 300);

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted" && "serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!sub) {
          try {
            await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: undefined,
            });
          } catch {}
        }
      }
    } catch {}
  };

  if (!show) return null;

  const t = texts[locale] || texts.en;

  return (
    <div className={`fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm ${animateOut ? "animate-out fade-out duration-300" : "animate-in fade-in duration-300"}`}>
      <div className={`w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl overflow-hidden ${animateOut ? "animate-out slide-out-to-bottom-4 duration-300" : "animate-in slide-in-from-bottom-4 duration-300"}`}>
        <div className="relative bg-gradient-to-br from-primary/20 via-blue-600/10 to-purple-600/10 px-5 pt-6 pb-5">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-notif-prompt-close"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-foreground font-bold text-lg mb-1">{t.title}</h2>
            <p className="text-muted-foreground text-xs">{t.subtitle}</p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-2.5">
          {[
            { icon: Zap, color: "#10B981", text: t.benefit1 },
            { icon: Gift, color: "#F59E0B", text: t.benefit2 },
            { icon: MessageCircle, color: "#8B5CF6", text: t.benefit3 },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: item.color + "15" }}>
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <p className="text-foreground text-[13px] leading-relaxed pt-1">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 pt-1 space-y-2">
          <button
            onClick={handleEnable}
            className="w-full bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl h-12 text-sm font-bold flex items-center justify-center gap-2 active:opacity-90 transition-all shadow-lg shadow-primary/25"
            data-testid="button-notif-prompt-enable"
          >
            <Bell className="w-4 h-4" />
            {t.enable}
          </button>
          <button
            onClick={handleClose}
            className="w-full text-muted-foreground text-xs font-medium py-2 hover:text-foreground transition-colors"
            data-testid="button-notif-prompt-later"
          >
            {t.later}
          </button>
        </div>
      </div>
    </div>
  );
}
