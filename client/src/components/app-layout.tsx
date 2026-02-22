import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { LayoutDashboard, PlayCircle, Users, Crown, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import type { User } from "@shared/schema";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Vazifalar", href: "/tasks", icon: PlayCircle },
  { title: "Referal", href: "/referral", icon: Users },
  { title: "VIP Paketlar", href: "/vip", icon: Crown },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <div className="min-h-screen bg-[#121212]">
      <header className="sticky top-0 z-50 bg-[#161616] border-b border-[#222]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-[#888]"
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link href="/dashboard">
              <span className="text-xl font-bold text-[#c9a84c] tracking-tight cursor-pointer" data-testid="link-logo">VEM</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? "text-[#c9a84c] bg-[#c9a84c]/10"
                        : "text-[#888] hover:text-[#bbb]"
                    }`}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {user && (
              <span className="text-[#c9a84c] text-sm font-medium hidden sm:block" data-testid="text-header-balance">
                {Number(user.balance).toLocaleString()} so'm
              </span>
            )}
            <button
              onClick={() => logoutMutation.mutate()}
              className="text-[#666] hover:text-[#999] transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <nav
            className="bg-[#161616] border-r border-[#222] w-64 h-full p-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 px-2">
              <span className="text-xl font-bold text-[#c9a84c]">VEM</span>
            </div>
            {navItems.map((item) => {
              const active = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                      active
                        ? "text-[#c9a84c] bg-[#c9a84c]/10"
                        : "text-[#888] hover:text-[#bbb]"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </span>
                </Link>
              );
            })}
            <div className="pt-4 border-t border-[#222] mt-4">
              <button
                onClick={() => logoutMutation.mutate()}
                className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[#888] hover:text-[#bbb] w-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Chiqish
              </button>
            </div>
          </nav>
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}
