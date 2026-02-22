import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Copy, Users, UserPlus, Check } from "lucide-react";
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
    { level: 1, percent: "9%", color: "#c9a84c", data: stats?.level1 },
    { level: 2, percent: "3%", color: "#3b6db5", data: stats?.level2 },
    { level: 3, percent: "1%", color: "#888", data: stats?.level3 },
  ];

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-[#1e1b14] to-[#1a1a1a] rounded-lg p-6 border border-[#2a2510]" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#c9a84c]" />
            <h2 className="text-lg font-semibold text-[#e0e0e0]">Referal tizimi</h2>
          </div>
          <p className="text-[#888] text-sm mb-4">
            Do'stlaringizni taklif qiling va ularning daromadidan foiz oling
          </p>

          <div className="space-y-3">
            <label className="text-[#999] text-xs uppercase tracking-wider">Sizning referal ssilkangiz</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-md px-3 py-2 text-[#e0e0e0] text-sm truncate" data-testid="text-referral-link">
                {referralLink}
              </div>
              <Button
                onClick={copyLink}
                className="bg-[#c9a84c] text-[#121212] font-medium shrink-0 no-default-hover-elevate no-default-active-elevate"
                data-testid="button-copy-link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[#e0e0e0] font-semibold">Referal darajalari</h3>

          {levels.map((item) => (
            <div
              key={item.level}
              className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]"
              data-testid={`card-referral-level-${item.level}`}
            >
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    {item.level}
                  </div>
                  <div>
                    <h4 className="text-[#e0e0e0] font-medium text-sm">{item.level}-daraja</h4>
                    <span className="text-xs" style={{ color: item.color }}>{item.percent} komissiya</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <UserPlus className="w-3 h-3 text-[#666]" />
                    <span className="text-[#e0e0e0] text-sm font-medium">
                      {item.data?.count ?? 0}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-[#141414] rounded-md p-3 flex items-center justify-between gap-2">
                <span className="text-[#888] text-xs">Jami komissiya</span>
                <span className="font-medium text-sm" style={{ color: item.color }}>
                  {Number(item.data?.commission ?? 0).toLocaleString()} so'm
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
