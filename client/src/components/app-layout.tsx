import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Home, Flame, PlayCircle, Users, User as UserIcon, LogOut, Sun, Moon, Megaphone, X, ChevronRight } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SupportWidget } from "@/components/support-widget";
import type { User, Broadcast } from "@shared/schema";
import vemLogo from "@assets/photo_2026-02-24_19-42-53-removebg-preview_1771944480591.png";

function BroadcastModal() {
  const { locale } = useI18n();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data: unread = [] } = useQuery<Broadcast[]>({
    queryKey: ["/api/broadcasts/unread"],
    refetchInterval: 60000,
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/broadcasts/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/broadcasts/unread"] });
    },
  });

  const visible = unread.filter(b => !dismissed.includes(b.id));
  if (visible.length === 0) return null;

  const current = visible[0];

  const handleClose = () => {
    readMutation.mutate(current.id);
    setDismissed(prev => [...prev, current.id]);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 px-4 py-3 border-b border-border flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-bold text-sm truncate">{current.title}</p>
            {visible.length > 1 && (
              <p className="text-muted-foreground text-[10px]">
                {locale === "ru" ? `Ещё ${visible.length - 1} сообщений` : locale === "en" ? `${visible.length - 1} more messages` : `Yana ${visible.length - 1} ta xabar`}
              </p>
            )}
          </div>
          <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0" data-testid="button-close-broadcast">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-4">
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{current.message}</p>
        </div>
        <div className="px-4 pb-4">
          <button
            onClick={handleClose}
            className="w-full bg-primary text-primary-foreground rounded-xl h-10 text-sm font-semibold flex items-center justify-center gap-2 active:opacity-90"
            data-testid="button-broadcast-read"
          >
            {locale === "ru" ? "Понял(а)" : locale === "en" ? "Got it" : "Tushunarli"}
            {visible.length > 1 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  const sideNavItems = [
    { title: t("nav.home"), href: "/dashboard", icon: Home, testId: "nav-asosiy" },
    { title: t("nav.trends"), href: "/trends", icon: Flame, testId: "nav-trendlar" },
  ];

  const rightNavItems = [
    { title: t("nav.referral"), href: "/referral", icon: Users, testId: "nav-referal" },
    { title: t("nav.profile"), href: "/profile", icon: UserIcon, testId: "nav-profil" },
  ];

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      window.location.href = "/login";
    },
  });

  const isTasksActive = location === "/tasks";
  const isHelpActive = location === "/help";
  const showSupportWidget = !isHelpActive;

  return (
    <div className="min-h-screen bg-background pb-20">
      <BroadcastModal />

      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-1">
            <img src={vemLogo} alt="VEM" loading="eager" className="h-16 object-contain" style={{filter: "drop-shadow(0px 2px 6px rgba(79, 107, 255, 0.3))"}} />
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <button
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">{children}</main>

      {showSupportWidget && <SupportWidget />}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-1 relative">
          {sideNavItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[48px] ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                  data-testid={item.testId}
                >
                  <item.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                  <span className="text-[10px] font-medium">{item.title}</span>
                </button>
              </Link>
            );
          })}

          <Link href="/tasks">
            <button
              className="flex flex-col items-center -mt-7 relative"
              data-testid="nav-vazifalar"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 bg-primary ${
                isTasksActive
                  ? "shadow-[0_4px_15px_hsl(var(--primary)/0.4)]"
                  : "shadow-[0_4px_15px_hsl(var(--primary)/0.25)]"
              }`}>
                <PlayCircle className="w-7 h-7 text-primary-foreground stroke-[2]" />
              </div>
              <span className={`text-[10px] font-semibold mt-0.5 ${isTasksActive ? "text-primary" : "text-muted-foreground"}`}>
                {t("nav.tasks")}
              </span>
            </button>
          </Link>

          {rightNavItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[48px] ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                  data-testid={item.testId}
                >
                  <item.icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                  <span className="text-[10px] font-medium">{item.title}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
