import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Zap, CheckCircle, TrendingUp } from "lucide-react";
import type { VipPackage, User } from "@shared/schema";
import AppLayout from "@/components/app-layout";

const levelColors: Record<number, { primary: string; bg: string; gradient: string }> = {
  1: { primary: "#cd7f32", bg: "#FFF3E0", gradient: "from-[#cd7f32] to-[#a0622b]" },
  2: { primary: "#78909C", bg: "#ECEFF1", gradient: "from-[#90A4AE] to-[#607D8B]" },
  3: { primary: "#FFB300", bg: "#FFF8E1", gradient: "from-[#FFB300] to-[#FF8F00]" },
  4: { primary: "#42A5F5", bg: "#E3F2FD", gradient: "from-[#42A5F5] to-[#1976D2]" },
  5: { primary: "#AB47BC", bg: "#F3E5F5", gradient: "from-[#AB47BC] to-[#7B1FA2]" },
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

  return (
    <AppLayout>
      <div className="p-4">
        <div className="bg-gradient-to-r from-[#FF6B35] to-[#E8453C] rounded-2xl p-5 text-white shadow-lg mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg">VIP Paketlar</h2>
              <p className="text-white/70 text-xs">Darajangizni oshiring va ko'proq ishlang</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {packages?.map((pkg) => {
            const colors = levelColors[pkg.level] || levelColors[1];
            const isCurrentLevel = user?.vipLevel === pkg.level;

            return (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  isCurrentLevel ? "border-[#FF6B35]/30 ring-1 ring-[#FF6B35]/10" : "border-[#f0f0f0]"
                }`}
                data-testid={`card-vip-${pkg.id}`}
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
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: colors.bg }}
                      >
                        <Crown className="w-6 h-6" style={{ color: colors.primary }} />
                      </div>
                      <div>
                        <h3 className="text-[#1a1a2e] font-bold">{pkg.name}</h3>
                        <p className="text-[#999] text-xs mt-0.5">{pkg.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold" style={{ color: colors.primary }}>
                        {pkg.price.toLocaleString()}
                      </div>
                      <span className="text-[#999] text-[10px]">so'm</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-[#f8f8f8] rounded-xl p-3">
                      <span className="text-[#999] text-[10px] uppercase tracking-wider font-medium">Kunlik vazifalar</span>
                      <p className="text-[#1a1a2e] font-bold mt-0.5">{pkg.dailyTasks} ta video</p>
                    </div>
                    <div className="bg-[#f8f8f8] rounded-xl p-3">
                      <span className="text-[#999] text-[10px] uppercase tracking-wider font-medium">Kunlik daromad</span>
                      <p className="font-bold mt-0.5" style={{ color: colors.primary }}>
                        {Number(pkg.dailyEarning).toLocaleString()} so'm
                      </p>
                    </div>
                  </div>

                  {!isCurrentLevel && (
                    <Button
                      className={`w-full mt-3 font-semibold no-default-hover-elevate no-default-active-elevate rounded-xl h-10 shadow-md text-white bg-gradient-to-r ${colors.gradient}`}
                      disabled={purchaseMutation.isPending}
                      onClick={() => purchaseMutation.mutate(pkg.id)}
                      data-testid={`button-buy-vip-${pkg.id}`}
                    >
                      {purchaseMutation.isPending ? "Sotib olinmoqda..." : "Sotib olish"}
                    </Button>
                  )}

                  {isCurrentLevel && (
                    <div className="mt-3 flex items-center justify-center gap-2 py-2 bg-[#E8F5E9] rounded-xl">
                      <CheckCircle className="w-4 h-4 text-[#4CAF50]" />
                      <span className="text-[#4CAF50] text-sm font-semibold">Faol</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
