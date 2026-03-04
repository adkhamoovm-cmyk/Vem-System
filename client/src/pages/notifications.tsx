import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCheck, Gift, Crown, Users, ArrowDownToLine, ArrowUpFromLine, Settings, Megaphone, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import type { Notification } from "@shared/schema";

function linkifyText(text: string): string {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>'
  );
}

function getTimeAgo(date: string | Date | null | undefined, t: (key: string, params?: Record<string, string | number>) => string): string {
  if (!date) return "";
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t("notifications.timeAgo.now");
  if (diffMin < 60) return t("notifications.timeAgo.minutes", { count: diffMin });
  if (diffHrs < 24) return t("notifications.timeAgo.hours", { count: diffHrs });
  return t("notifications.timeAgo.days", { count: diffDays });
}

function getTypeIcon(type: string) {
  const iconMap: Record<string, { icon: typeof Bell; gradient: string }> = {
    task_reward: { icon: Gift, gradient: "from-emerald-500 to-green-600" },
    vip_expiry: { icon: Crown, gradient: "from-amber-500 to-orange-600" },
    referral_bonus: { icon: Users, gradient: "from-blue-500 to-indigo-600" },
    deposit_confirmed: { icon: ArrowDownToLine, gradient: "from-green-500 to-emerald-600" },
    withdrawal_done: { icon: ArrowUpFromLine, gradient: "from-violet-500 to-purple-600" },
    system: { icon: Settings, gradient: "from-gray-500 to-slate-600" },
    broadcast: { icon: Megaphone, gradient: "from-rose-500 to-red-600" },
  };
  return iconMap[type] || iconMap.system;
}

const NOTIF_TEMPLATES: Record<string, Record<string, { title: string; message: string }>> = {
  uz: {
    task_completed: { title: "Vazifa bajarildi!", message: "+{amount} USDT qo'shildi" },
    vip_activated: { title: "{name} paketi faollashtirildi", message: "{tasks} ta kunlik vazifa, {days} kun" },
    deposit_approved: { title: "Depozit tasdiqlandi", message: "+{amount} USDT balansga qo'shildi" },
    deposit_rejected: { title: "Depozit rad etildi", message: "{amount} {currency} depozit so'rovi rad etildi" },
    withdrawal_approved: { title: "Pul yechish tasdiqlandi", message: "{amount} USDT muvaffaqiyatli yechildi" },
    withdrawal_rejected: { title: "Pul yechish rad etildi", message: "{amount} USDT qaytarildi. So'rov rad etildi." },
    referral_commission: { title: "Referal komissiya", message: "+{amount} USDT ({level}-daraja)" },
    stajyor_approved: { title: "Stajyor faollashtirildi!", message: "3 kunlik sinov davri boshlandi. Kuniga 3 ta video ko'ring!" },
    stajyor_rejected: { title: "Stajyor so'rovi rad etildi", message: "So'rovingiz rad etildi. Iltimos qayta urinib ko'ring." },
    promo_applied: { title: "Promokod qabul qilindi", message: "+{amount} USDT promokod orqali qo'shildi" },
    fund_invested: { title: "{name} fondiga investitsiya", message: "{amount} USDT investitsiya qilindi" },
    fund_profit: { title: "Fond daromadi", message: "+{amount} USDT {name} fondidan" },
    fund_returned: { title: "Fond investitsiyasi qaytarildi", message: "+{amount} USDT {name} fondidan qaytarildi" },
  },
  ru: {
    task_completed: { title: "Задание выполнено!", message: "+{amount} USDT начислено" },
    vip_activated: { title: "Пакет {name} активирован", message: "{tasks} заданий в день, {days} дней" },
    deposit_approved: { title: "Депозит подтверждён", message: "+{amount} USDT зачислено на баланс" },
    deposit_rejected: { title: "Депозит отклонён", message: "Заявка на {amount} {currency} отклонена" },
    withdrawal_approved: { title: "Вывод подтверждён", message: "{amount} USDT успешно выведено" },
    withdrawal_rejected: { title: "Вывод отклонён", message: "{amount} USDT возвращено. Заявка отклонена." },
    referral_commission: { title: "Реферальная комиссия", message: "+{amount} USDT ({level}-уровень)" },
    stajyor_approved: { title: "Стажёр активирован!", message: "3-дневный пробный период начался. Смотрите 3 видео в день!" },
    stajyor_rejected: { title: "Заявка на стажёра отклонена", message: "Ваша заявка отклонена. Попробуйте снова." },
    promo_applied: { title: "Промокод применён", message: "+{amount} USDT начислено по промокоду" },
    fund_invested: { title: "Инвестиция в {name}", message: "{amount} USDT инвестировано" },
    fund_profit: { title: "Доход от фонда", message: "+{amount} USDT от {name}" },
    fund_returned: { title: "Инвестиция возвращена", message: "+{amount} USDT возвращено из {name}" },
  },
  en: {
    task_completed: { title: "Task completed!", message: "+{amount} USDT earned" },
    vip_activated: { title: "{name} package activated", message: "{tasks} daily tasks, {days} days" },
    deposit_approved: { title: "Deposit approved", message: "+{amount} USDT added to balance" },
    deposit_rejected: { title: "Deposit rejected", message: "{amount} {currency} deposit request rejected" },
    withdrawal_approved: { title: "Withdrawal approved", message: "{amount} USDT successfully withdrawn" },
    withdrawal_rejected: { title: "Withdrawal rejected", message: "{amount} USDT returned. Request rejected." },
    referral_commission: { title: "Referral commission", message: "+{amount} USDT (level {level})" },
    stajyor_approved: { title: "Intern activated!", message: "3-day trial period started. Watch 3 videos daily!" },
    stajyor_rejected: { title: "Intern request rejected", message: "Your request was rejected. Please try again." },
    promo_applied: { title: "Promo code applied", message: "+{amount} USDT added via promo code" },
    fund_invested: { title: "Invested in {name}", message: "{amount} USDT invested" },
    fund_profit: { title: "Fund profit", message: "+{amount} USDT from {name}" },
    fund_returned: { title: "Fund investment returned", message: "+{amount} USDT returned from {name}" },
  },
  es: {
    task_completed: { title: "¡Tarea completada!", message: "+{amount} USDT ganado" },
    vip_activated: { title: "Paquete {name} activado", message: "{tasks} tareas diarias, {days} días" },
    deposit_approved: { title: "Depósito aprobado", message: "+{amount} USDT añadido al saldo" },
    deposit_rejected: { title: "Depósito rechazado", message: "Solicitud de depósito de {amount} {currency} rechazada" },
    withdrawal_approved: { title: "Retiro aprobado", message: "{amount} USDT retirado exitosamente" },
    withdrawal_rejected: { title: "Retiro rechazado", message: "{amount} USDT devuelto. Solicitud rechazada." },
    referral_commission: { title: "Comisión de referido", message: "+{amount} USDT (nivel {level})" },
    stajyor_approved: { title: "¡Pasante activado!", message: "Período de prueba de 3 días iniciado. ¡Mira 3 videos al día!" },
    stajyor_rejected: { title: "Solicitud de pasante rechazada", message: "Tu solicitud fue rechazada. Inténtalo de nuevo." },
    promo_applied: { title: "Código promocional aplicado", message: "+{amount} USDT añadido con código promocional" },
    fund_invested: { title: "Invertido en {name}", message: "{amount} USDT invertido" },
    fund_profit: { title: "Ganancia del fondo", message: "+{amount} USDT de {name}" },
    fund_returned: { title: "Inversión del fondo devuelta", message: "+{amount} USDT devuelto de {name}" },
  },
  tr: {
    task_completed: { title: "Görev tamamlandı!", message: "+{amount} USDT kazanıldı" },
    vip_activated: { title: "{name} paketi etkinleştirildi", message: "Günlük {tasks} görev, {days} gün" },
    deposit_approved: { title: "Depozito onaylandı", message: "+{amount} USDT bakiyeye eklendi" },
    deposit_rejected: { title: "Depozito reddedildi", message: "{amount} {currency} depozito talebi reddedildi" },
    withdrawal_approved: { title: "Çekim onaylandı", message: "{amount} USDT başarıyla çekildi" },
    withdrawal_rejected: { title: "Çekim reddedildi", message: "{amount} USDT iade edildi. Talep reddedildi." },
    referral_commission: { title: "Referans komisyonu", message: "+{amount} USDT (seviye {level})" },
    stajyor_approved: { title: "Stajyer etkinleştirildi!", message: "3 günlük deneme süresi başladı. Günde 3 video izleyin!" },
    stajyor_rejected: { title: "Stajyer talebi reddedildi", message: "Talebiniz reddedildi. Lütfen tekrar deneyin." },
    promo_applied: { title: "Promosyon kodu uygulandı", message: "+{amount} USDT promosyon koduyla eklendi" },
    fund_invested: { title: "{name} fonuna yatırım", message: "{amount} USDT yatırıldı" },
    fund_profit: { title: "Fon kazancı", message: "+{amount} USDT {name} fonundan" },
    fund_returned: { title: "Fon yatırımı iade edildi", message: "+{amount} USDT {name} fonundan iade edildi" },
  },
};

function extractParams(template: string, actual: string): Record<string, string> | null {
  const placeholders = [...template.matchAll(/\{(\w+)\}/g)].map(m => m[1]);
  if (placeholders.length === 0) return template === actual ? {} : null;
  const paramNames: string[] = [];
  let regexStr = "";
  let lastIndex = 0;
  const phRegex = /\{(\w+)\}/g;
  let m;
  while ((m = phRegex.exec(template)) !== null) {
    const before = template.slice(lastIndex, m.index);
    regexStr += before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    paramNames.push(m[1]);
    regexStr += '(.+?)';
    lastIndex = m.index + m[0].length;
  }
  regexStr += template.slice(lastIndex).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  try {
    const match = actual.match(new RegExp('^' + regexStr + '$'));
    if (!match) return null;
    const params: Record<string, string> = {};
    paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
    return params;
  } catch {
    return null;
  }
}

function retranslateText(sourceText: string, sourceLang: string, targetLang: string, field: "title" | "message"): string | null {
  const sourceTemplates = NOTIF_TEMPLATES[sourceLang];
  const targetTemplates = NOTIF_TEMPLATES[targetLang];
  if (!sourceTemplates || !targetTemplates) return null;
  for (const key of Object.keys(sourceTemplates)) {
    const template = sourceTemplates[key][field];
    const params = extractParams(template, sourceText);
    if (params !== null) {
      let result = targetTemplates[key][field];
      for (const [k, v] of Object.entries(params)) {
        result = result.replace(`{${k}}`, v);
      }
      return result;
    }
  }
  return null;
}

function getLocalizedText(text: string, locale: string, field: "title" | "message" = "title"): string {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      if (parsed[locale]) return parsed[locale];
      for (const srcLang of ["en", "ru", "uz"] as const) {
        if (parsed[srcLang]) {
          const translated = retranslateText(parsed[srcLang], srcLang, locale, field);
          if (translated) return translated;
        }
      }
      return parsed.en || parsed.ru || parsed.uz || text;
    }
  } catch {}
  return text;
}

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
    onError: () => {
      toast({ title: t("common.error"), variant: "destructive" });
    },
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-xs animate-pulse">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4 pb-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
              data-testid="button-back-notifications"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </Link>
          <h1 className="text-foreground font-bold text-lg" data-testid="text-notifications-title">
            {t("notifications.title")}
          </h1>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="text-xs text-primary font-semibold flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/15 active:scale-95 transition-transform"
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Bell className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground text-sm" data-testid="text-notifications-empty">
            {t("notifications.empty")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const typeInfo = getTypeIcon(notification.type);
            const TypeIcon = typeInfo.icon;
            const isUnread = !notification.isRead;

            return (
              <button
                key={notification.id}
                onClick={() => {
                  if (isUnread) {
                    markReadMutation.mutate(notification.id);
                  }
                }}
                className={`w-full text-left rounded-2xl p-3.5 transition-all active:scale-[0.98] border ${
                  isUnread
                    ? "bg-primary/5 border-primary/15"
                    : "bg-card border-border/50"
                }`}
                data-testid={`notification-item-${notification.id}`}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${typeInfo.gradient} shadow-sm`}>
                    <TypeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-sm font-semibold ${isUnread ? "text-foreground" : "text-foreground/80"}`}>
                          {getLocalizedText(notification.title, locale, "title")}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                        )}
                      </div>
                      <span className="text-muted-foreground text-[10px] shrink-0 mt-0.5">
                        {getTimeAgo(notification.createdAt, t)}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${isUnread ? "text-muted-foreground" : "text-muted-foreground/70"}`} dangerouslySetInnerHTML={{ __html: linkifyText(getLocalizedText(notification.message, locale, "message")) }} />
                    <span className={`inline-block text-[9px] uppercase tracking-wider font-medium mt-1.5 px-1.5 py-0.5 rounded-md ${
                      isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {t(`notifications.type.${notification.type}`) || notification.type}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
