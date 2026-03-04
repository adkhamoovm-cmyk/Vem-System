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

function getLocalizedText(text: string, locale: string): string {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      return parsed[locale] || parsed.en || parsed.ru || parsed.uz || text;
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
                          {getLocalizedText(notification.title, locale)}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                        )}
                      </div>
                      <span className="text-muted-foreground text-[10px] shrink-0 mt-0.5">
                        {getTimeAgo(notification.createdAt, t)}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${isUnread ? "text-muted-foreground" : "text-muted-foreground/70"}`} dangerouslySetInnerHTML={{ __html: linkifyText(getLocalizedText(notification.message, locale)) }} />
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
