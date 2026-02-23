import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Copy, Users, UserPlus, Check, Share2 } from "lucide-react";
import { useState } from "react";
import type { User } from "@shared/schema";
import AppLayout from "@/components/app-layout";

interface ReferralStats {
  level1: { count: number; commission: string };
  level2: { count: number; commission: string };
  level3: { count: number; commission: string };
}

export default function ReferralPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ["/api/referrals/stats"],
  });

  const referralLink = user ? `${window.location.origin}/register?ref=${user.referralCode}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Nusxalandi!", description: "Referal ssilka nusxalandi" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Xatolik", description: "Nusxalab bo'lmadi", variant: "destructive" });
    }
  };

  const levels = [
    { level: 1, percent: "9%", color: "#FF6B35", bg: "rgba(255, 107, 53, 0.15)", data: stats?.level1 },
    { level: 2, percent: "3%", color: "#4CAF50", bg: "rgba(76, 175, 80, 0.15)", data: stats?.level2 },
    { level: 3, percent: "1%", color: "#2196F3", bg: "rgba(33, 150, 243, 0.15)", data: stats?.level3 },
  ];

  return (
    <AppLayout>
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Referal tizimi</h2>
              <p className="text-white/70 text-xs">Do'stlaringizni taklif qiling</p>
            </div>
          </div>
          <p className="text-white/80 text-xs leading-relaxed">
            Do'stlaringizni taklif qiling va ularning har bir vazifa daromadidan foiz oling!
          </p>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl p-4 shadow-sm border border-[#2a2a2a]">
          <label className="text-[#888] text-xs font-medium uppercase tracking-wider">Sizning referal ssilkangiz</label>
          <div className="flex gap-2 mt-2">
            <div className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-white text-xs truncate font-mono" data-testid="text-referral-link">
              {referralLink}
            </div>
            <Button
              onClick={copyLink}
              className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white font-medium shrink-0 no-default-hover-elevate no-default-active-elevate rounded-xl h-10 px-4 shadow-md"
              data-testid="button-copy-link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-white font-bold text-sm">Referal darajalari</h3>

          {levels.map((item) => (
            <div
              key={item.level}
              className="bg-[#1a1a1a] rounded-2xl p-4 shadow-sm border border-[#2a2a2a]"
              data-testid={`card-referral-level-${item.level}`}
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: item.bg, color: item.color }}
                  >
                    {item.level}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{item.level}-daraja</h4>
                    <span className="text-xs font-bold" style={{ color: item.color }}>{item.percent} komissiya</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5 text-[#888]" />
                    <span className="text-white text-sm font-bold">
                      {item.data?.count ?? 0}
                    </span>
                  </div>
                  <span className="text-[#888] text-[10px]">ta odam</span>
                </div>
              </div>
              <div className="bg-[#111] rounded-xl p-3 flex items-center justify-between gap-2">
                <span className="text-[#888] text-xs">Jami komissiya</span>
                <span className="font-bold text-sm" style={{ color: item.color }}>
                  {Number(item.data?.commission ?? 0).toLocaleString()} USDT
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
