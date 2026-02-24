import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Home, Flame, PlayCircle, Users, User as UserIcon, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import type { User } from "@shared/schema";

const sideNavItems = [
  { title: "Asosiy", href: "/dashboard", icon: Home, testId: "nav-asosiy" },
  { title: "Trendlar", href: "/trends", icon: Flame, testId: "nav-trendlar" },
];

const rightNavItems = [
  { title: "Referal", href: "/referral", icon: Users, testId: "nav-referal" },
  { title: "Profil", href: "/profile", icon: UserIcon, testId: "nav-profil" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

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

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">V</span>
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">VEM</span>
          </div>

          <div className="flex items-center gap-2">
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2 relative">
          {sideNavItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px] ${
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
                Vazifalar
              </span>
            </button>
          </Link>

          {rightNavItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px] ${
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
