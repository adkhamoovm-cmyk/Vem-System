import { Link } from "wouter";
import { PlayCircle, Wallet, Users, Crown, HelpCircle, Download, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface QuickActionsProps {
  onInstallClick: () => void;
}

export function QuickActions({ onInstallClick }: QuickActionsProps) {
  const { t } = useI18n();

  const quickActions: { title: string; href: string; icon: LucideIcon; gradient: string }[] = [
    { title: t("dashboard.quickTasks"), href: "/tasks", icon: PlayCircle, gradient: "from-blue-500 to-blue-600" },
    { title: t("dashboard.quickFund"), href: "/fund", icon: Wallet, gradient: "from-violet-500 to-purple-600" },
    { title: t("dashboard.quickInvite"), href: "/referral", icon: Users, gradient: "from-emerald-500 to-green-600" },
    { title: t("dashboard.quickVip"), href: "/vip", icon: Crown, gradient: "from-amber-500 to-orange-600" },
    { title: t("dashboard.quickHelp"), href: "/help", icon: HelpCircle, gradient: "from-cyan-500 to-blue-500" },
    { title: t("dashboard.quickApp"), href: "#install-app", icon: Download, gradient: "from-teal-500 to-emerald-600" },
    { title: t("dashboard.quickPromo"), href: "/promo", icon: Mail, gradient: "from-rose-500 to-red-600" },
  ];

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide animate-fade-up" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', animationDelay: "0.3s", animationFillMode: "both" }}>
      {quickActions.map((item) => (
        item.href === "#install-app" ? (
          <button key={item.href} onClick={onInstallClick} className="flex flex-col items-center gap-1.5 shrink-0" data-testid={`quick-${item.title.toLowerCase()}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${item.gradient} shadow-sm active:scale-95 transition-transform`}>
              <item.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-muted-foreground text-[10px] font-medium text-center leading-tight max-w-[56px]">{item.title}</span>
          </button>
        ) : (
          <Link key={item.href} href={item.href}>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0" data-testid={`quick-${item.title.toLowerCase()}`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${item.gradient} shadow-sm active:scale-95 transition-transform`}>
                <item.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-muted-foreground text-[10px] font-medium text-center leading-tight max-w-[56px]">{item.title}</span>
            </div>
          </Link>
        )
      ))}
    </div>
  );
}
