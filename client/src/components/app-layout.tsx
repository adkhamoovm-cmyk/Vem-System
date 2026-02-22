import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Home, PlayCircle, Users, Crown, User as UserIcon, LogOut } from "lucide-react";
import type { User } from "@shared/schema";

const navItems = [
  { title: "Bosh sahifa", href: "/dashboard", icon: Home },
  { title: "Vazifalar", href: "/tasks", icon: PlayCircle },
  { title: "Referal", href: "/referral", icon: Users },
  { title: "VIP", href: "/vip", icon: Crown },
  { title: "Profil", href: "/profile", icon: UserIcon },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

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

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      <header className="sticky top-0 z-50 bg-white border-b border-[#eee] shadow-sm">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-12">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-[#FF6B35] to-[#E8453C] rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">V</span>
            </div>
            <span className="text-lg font-bold text-[#1a1a2e] tracking-tight">VEM</span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-[#FF6B35] text-sm font-semibold" data-testid="text-header-balance">
                {Number(user.balance).toLocaleString()} so'm
              </span>
            )}
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-[#999] hover:text-[#666] transition-colors p-1"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#eee] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[56px] ${
                    active
                      ? "text-[#FF6B35]"
                      : "text-[#999]"
                  }`}
                  data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
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
