import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Zap, CheckCircle } from "lucide-react";
import type { VipPackage, User } from "@shared/schema";
import AppLayout from "@/components/app-layout";

const levelIcons: Record<number, typeof Crown> = {
  1: Star,
  2: Star,
  3: Crown,
  4: Crown,
  5: Zap,
};

const levelColors: Record<number, string> = {
  1: "#cd7f32",
  2: "#a8a8a8",
  3: "#c9a84c",
  4: "#4a9eff",
  5: "#e040fb",
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
          <div className="w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-[#e0e0e0]">VIP Paketlar</h2>
          <p className="text-[#888] text-sm mt-1">Darajangizni oshiring va ko'proq pul ishlang</p>
        </div>

        <div className="space-y-4">
          {packages?.map((pkg) => {
            const Icon = levelIcons[pkg.level] || Star;
            const color = levelColors[pkg.level] || "#c9a84c";
            const isCurrentLevel = user?.vipLevel === pkg.level;

            return (
              <div
                key={pkg.id}
                className={`bg-[#1a1a1a] rounded-lg border ${isCurrentLevel ? "border-[#c9a84c]/40" : "border-[#2a2a2a]"} relative`}
                style={{ boxShadow: isCurrentLevel ? "0 0 20px rgba(201,168,76,0.1)" : undefined }}
                data-testid={`card-vip-${pkg.id}`}
              >
                {isCurrentLevel && (
                  <div className="absolute -top-3 left-4">
                    <span className="bg-[#c9a84c] text-[#121212] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Hozirgi
                    </span>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <Icon className="w-6 h-6" style={{ color }} />
                      </div>
                      <div>
                        <h3 className="text-[#e0e0e0] font-semibold">{pkg.name}</h3>
                        <p className="text-[#888] text-xs mt-0.5">{pkg.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold" style={{ color }}>
                        {pkg.price.toLocaleString()}
                      </div>
                      <span className="text-[#666] text-xs">so'm</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-[#141414] rounded-md p-3">
                      <span className="text-[#888] text-[10px] uppercase tracking-wider">Kunlik vazifalar</span>
                      <p className="text-[#e0e0e0] font-semibold mt-1">{pkg.dailyTasks} ta video</p>
                    </div>
                    <div className="bg-[#141414] rounded-md p-3">
                      <span className="text-[#888] text-[10px] uppercase tracking-wider">Kunlik daromad</span>
                      <p className="font-semibold mt-1" style={{ color }}>
                        {Number(pkg.dailyEarning).toLocaleString()} so'm
                      </p>
                    </div>
                  </div>

                  {!isCurrentLevel && (
                    <Button
                      className="w-full mt-4 font-semibold no-default-hover-elevate no-default-active-elevate"
                      style={{ backgroundColor: color, color: "#121212" }}
                      disabled={purchaseMutation.isPending}
                      onClick={() => purchaseMutation.mutate(pkg.id)}
                      data-testid={`button-buy-vip-${pkg.id}`}
                    >
                      {purchaseMutation.isPending ? "Sotib olinmoqda..." : "Sotib olish"}
                    </Button>
                  )}

                  {isCurrentLevel && (
                    <div className="mt-4 flex items-center justify-center gap-2 py-2">
                      <CheckCircle className="w-4 h-4 text-[#c9a84c]" />
                      <span className="text-[#c9a84c] text-sm font-medium">Faol</span>
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
