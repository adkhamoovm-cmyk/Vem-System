import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, CheckCircle, Lock, DollarSign, Film, Calendar, TrendingUp } from "lucide-react";
import type { VipPackage, User } from "@shared/schema";
import AppLayout from "@/components/app-layout";

const levelColors: Record<number, { primary: string; bg: string; gradient: string; border: string }> = {
  0: { primary: "#78909C", bg: "#ECEFF1", gradient: "from-[#90A4AE] to-[#607D8B]", border: "border-[#B0BEC5]" },
  1: { primary: "#cd7f32", bg: "#FFF3E0", gradient: "from-[#cd7f32] to-[#a0622b]", border: "border-[#cd7f32]/30" },
  2: { primary: "#78909C", bg: "#ECEFF1", gradient: "from-[#90A4AE] to-[#607D8B]", border: "border-[#90A4AE]/30" },
  3: { primary: "#FFB300", bg: "#FFF8E1", gradient: "from-[#FFB300] to-[#FF8F00]", border: "border-[#FFB300]/30" },
  4: { primary: "#42A5F5", bg: "#E3F2FD", gradient: "from-[#42A5F5] to-[#1976D2]", border: "border-[#42A5F5]/30" },
  5: { primary: "#AB47BC", bg: "#F3E5F5", gradient: "from-[#AB47BC] to-[#7B1FA2]", border: "border-[#AB47BC]/30" },
  6: { primary: "#E53935", bg: "#FFEBEE", gradient: "from-[#E53935] to-[#B71C1C]", border: "border-[#E53935]/30" },
  7: { primary: "#00897B", bg: "#E0F2F1", gradient: "from-[#00897B] to-[#004D40]", border: "border-[#00897B]/30" },
  8: { primary: "#5C6BC0", bg: "#E8EAF6", gradient: "from-[#5C6BC0] to-[#283593]", border: "border-[#5C6BC0]/30" },
  9: { primary: "#F4511E", bg: "#FBE9E7", gradient: "from-[#F4511E] to-[#BF360C]", border: "border-[#F4511E]/30" },
  10: { primary: "#FFD700", bg: "#FFFDE7", gradient: "from-[#FFD700] to-[#FF8F00]", border: "border-[#FFD700]/30" },
};

export default function VipPage() {
  const { toast } = useToast();
  const { data: packages, isLoading } = useQuery<VipPackage[]>({
    queryKey: ["/api/vip-packages"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const res = await apiRequest("POST", "/api/vip/purchase", { packageId });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vip-packages"] });
      toast({ title: "Muvaffaqiyatli!", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const sortedPackages = [...(packages || [])].sort((a, b) => a.level - b.level);

  return (
    <AppLayout>
      <div className="p-4">
        <div className="bg-gradient-to-br from-[#FF6B35] via-[#E8553C] to-[#D63A3A] rounded-2xl p-5 text-white shadow-xl mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">VIP Darajalar</h2>
              <p className="text-white/70 text-xs">Yuqori daraja = Yuqori daromad</p>
            </div>
          </div>
          {user && (
            <div className="mt-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/80 text-xs">Hozirgi daraja:</span>
                <span className="font-bold text-sm">{user.vipLevel === 0 ? "Stajyor" : `M${user.vipLevel}`}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-white/80 text-xs">Balans:</span>
                <span className="font-bold text-sm">${Number(user.balance).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {sortedPackages.map((pkg) => {
            const colors = levelColors[pkg.level] || levelColors[1];
            const isCurrentLevel = user?.vipLevel === pkg.level;
            const isLocked = pkg.isLocked;
            const canBuy = !isCurrentLevel && !isLocked && user && Number(user.balance) >= Number(pkg.price);

            return (
              <div
                key={pkg.id}
                className={`bg-[#1a1a1a] rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isCurrentLevel ? "ring-2 ring-[#FF6B35]/30 border-[#FF6B35]/20" : isLocked ? "border-[#222] opacity-75" : "border-[#2a2a2a]"
                }`}
                data-testid={`card-vip-${pkg.level}`}
              >
                {isCurrentLevel && (
                  <div className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] px-4 py-1.5 text-center">
                    <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                      Hozirgi paketingiz
                    </span>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                        style={{ backgroundColor: colors.bg }}
                      >
                        {pkg.emoji || (isLocked ? "\u{1F512}" : "\u{1F451}")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold">{pkg.name}</h3>
                          {isLocked && <Lock className="w-3.5 h-3.5 text-[#666]" />}
                        </div>
                        <p className="text-[#888] text-xs mt-0.5">{pkg.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold" style={{ color: colors.primary }}>
                        {Number(pkg.price) === 0 ? "Bepul" : `$${Number(pkg.price).toLocaleString()}`}
                      </div>
                      {Number(pkg.price) > 0 && <span className="text-[#888] text-[10px]">garov</span>}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-[#111] rounded-xl p-2.5 text-center">
                      <Film className="w-3.5 h-3.5 text-[#888] mx-auto mb-0.5" />
                      <p className="text-white font-bold text-xs">{pkg.dailyTasks} ta</p>
                      <p className="text-[#666] text-[9px]">Kunlik video</p>
                    </div>
                    <div className="bg-[#111] rounded-xl p-2.5 text-center">
                      <DollarSign className="w-3.5 h-3.5 text-[#888] mx-auto mb-0.5" />
                      <p className="font-bold text-xs" style={{ color: colors.primary }}>${Number(pkg.perVideoReward).toFixed(2)}</p>
                      <p className="text-[#666] text-[9px]">Har video</p>
                    </div>
                    <div className="bg-[#111] rounded-xl p-2.5 text-center">
                      <TrendingUp className="w-3.5 h-3.5 text-[#888] mx-auto mb-0.5" />
                      <p className="font-bold text-xs" style={{ color: colors.primary }}>${Number(pkg.dailyEarning).toFixed(2)}</p>
                      <p className="text-[#666] text-[9px]">Kunlik</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between bg-[#111] rounded-lg px-3 py-1.5">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#888]" />
                      <span className="text-[#888] text-[10px]">Muddat: {pkg.durationDays} kun</span>
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: isLocked ? "#bbb" : colors.primary }}>
                      {isLocked ? "Qulflangan" : "Ochiq"}
                    </span>
                  </div>

                  {!isCurrentLevel && !isLocked && Number(pkg.price) > 0 && (
                    <Button
                      className={`w-full mt-3 font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-10 shadow-md text-white bg-gradient-to-r ${colors.gradient}`}
                      disabled={purchaseMutation.isPending || !canBuy}
                      onClick={() => purchaseMutation.mutate(pkg.id)}
                      data-testid={`button-buy-vip-${pkg.level}`}
                    >
                      {purchaseMutation.isPending ? "Sotib olinmoqda..." : canBuy ? "Sotib olish" : `$${Number(pkg.price).toLocaleString()} kerak`}
                    </Button>
                  )}

                  {isLocked && (
                    <div className="mt-3 flex items-center justify-center gap-2 py-2.5 bg-[#111] rounded-xl">
                      <Lock className="w-4 h-4 text-[#555]" />
                      <span className="text-[#666] text-sm font-medium">Qulflangan</span>
                    </div>
                  )}

                  {isCurrentLevel && (
                    <div className="mt-3 flex items-center justify-center gap-2 py-2.5 bg-[#4CAF50]/10 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-[#4CAF50]" />
                      <span className="text-[#4CAF50] text-sm font-semibold">Faol</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 bg-[#FF6B35]/10 rounded-2xl p-4 border border-[#FF6B35]/20">
          <p className="text-[#FF6B35] text-xs leading-relaxed">
            <strong>Muhim:</strong> Garov summasi paket muddati tugagandan so'ng qaytariladi. 10% komissiya daromaddan ushlanadi. Qulflangan paketlar ma'lum shartlar bajarilgandan so'ng ochiladi.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
