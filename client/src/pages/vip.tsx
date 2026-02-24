import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Crown, CheckCircle, Lock, DollarSign, Film, Calendar, TrendingUp, Send, Clock, MessageSquare, Shield, Star, Award, Gem, Zap, Flame, Rocket, Target, Sparkles, Medal } from "lucide-react";
import type { VipPackage, User, StajyorRequest } from "@shared/schema";
import AppLayout from "@/components/app-layout";

const levelIcons: Record<number, typeof Shield> = {
  0: Shield, 1: Medal, 2: Star, 3: Award, 4: Gem, 5: Zap,
  6: Flame, 7: Rocket, 8: Target, 9: Sparkles, 10: Crown,
};

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
  const [stajyorMsg, setStajyorMsg] = useState("");

  const { data: packages, isLoading } = useQuery<VipPackage[]>({
    queryKey: ["/api/vip-packages"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { data: stajyorRequests = [] } = useQuery<StajyorRequest[]>({
    queryKey: ["/api/stajyor/status"],
    enabled: !!user && user.vipLevel < 0,
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

  const stajyorMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stajyor/request", { message: stajyorMsg || "Menga Stajyor lavozimini yoqing" });
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stajyor/status"] });
      setStajyorMsg("");
      toast({ title: "Yuborildi!", description: data.message });
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const sortedPackages = [...(packages || [])].sort((a, b) => a.level - b.level);

  return (
    <AppLayout>
      <div className="p-4">
        <div className="bg-primary rounded-2xl p-5 text-primary-foreground shadow-xl mb-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-lg">VIP Darajalar</h2>
              <p className="text-primary-foreground/70 text-xs">Yuqori daraja = Yuqori daromad</p>
            </div>
          </div>
          {user && (
            <div className="mt-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="text-primary-foreground/80 text-xs">Hozirgi daraja:</span>
                <span className="font-bold text-sm">{user.vipLevel < 0 ? "Rasmiy xodim emas" : user.vipLevel === 0 ? "Stajyor" : `M${user.vipLevel}`}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-primary-foreground/80 text-xs">Balans:</span>
                <span className="font-bold text-sm">${Number(user.balance).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {user && user.vipLevel < 0 && (
          <div className="bg-card rounded-2xl border border-[#78909C]/30 overflow-hidden mb-4" data-testid="stajyor-request-section">
            <div className="bg-gradient-to-r from-[#90A4AE] to-[#607D8B] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Stajyor lavozimini yoqtirish</h3>
                  <p className="text-white/70 text-[11px]">Admin orqali 3 kunlik sinov davrini faollashtiring</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              {stajyorRequests.some(r => r.status === "pending") ? (
                <div className="bg-[#FFB300]/10 rounded-xl p-4 border border-[#FFB300]/20 text-center">
                  <Clock className="w-8 h-8 text-[#FFB300] mx-auto mb-2" />
                  <p className="text-[#FFB300] font-semibold text-sm">So'rov yuborilgan</p>
                  <p className="text-muted-foreground text-xs mt-1">Admin tekshirmoqda. Iltimos kuting...</p>
                </div>
              ) : stajyorRequests.some(r => r.status === "rejected") && !stajyorRequests.some(r => r.status === "pending") ? (
                <div className="space-y-3">
                  <div className="bg-destructive/10 rounded-xl p-3 border border-destructive/20">
                    <p className="text-destructive text-xs">Oldingi so'rovingiz rad etilgan. Yangi so'rov yuboring.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        value={stajyorMsg}
                        onChange={(e) => setStajyorMsg(e.target.value)}
                        placeholder="Xabar yozing (ixtiyoriy)..."
                        className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#78909C]"
                        data-testid="input-stajyor-message"
                      />
                    </div>
                    <Button
                      onClick={() => stajyorMutation.mutate()}
                      disabled={stajyorMutation.isPending}
                      className="bg-gradient-to-r from-[#90A4AE] to-[#607D8B] text-white rounded-xl h-10 px-5 font-semibold"
                      data-testid="button-send-stajyor"
                    >
                      {stajyorMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> Yuborish</>}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-card rounded-xl p-3 space-y-1.5 text-xs text-muted-foreground">
                    <p>Stajyor lavozimi - 3 kunlik bepul sinov davri.</p>
                    <p>Kuniga 3 ta video ko'rish va daromad olish imkoniyati.</p>
                    <p className="text-primary">Pul yechish uchun kamida 1 ta Fundga pul qo'ying yoki M1 xarid qiling.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        value={stajyorMsg}
                        onChange={(e) => setStajyorMsg(e.target.value)}
                        placeholder="Xabar yozing (ixtiyoriy)..."
                        className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#78909C]"
                        data-testid="input-stajyor-message"
                      />
                    </div>
                    <Button
                      onClick={() => stajyorMutation.mutate()}
                      disabled={stajyorMutation.isPending}
                      className="bg-gradient-to-r from-[#90A4AE] to-[#607D8B] text-white rounded-xl h-10 px-5 font-semibold"
                      data-testid="button-send-stajyor"
                    >
                      {stajyorMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4 mr-1" /> Yuborish</>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {sortedPackages.map((pkg) => {
            const colors = levelColors[pkg.level] || levelColors[1];
            const isCurrentLevel = user?.vipLevel === pkg.level;
            const isLocked = pkg.isLocked;
            const canBuy = !isCurrentLevel && !isLocked && user && Number(user.balance) >= Number(pkg.price);

            return (
              <div
                key={pkg.id}
                className={`bg-card rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isCurrentLevel ? "ring-2 ring-primary/30 border-primary/20" : isLocked ? "border-border opacity-75" : "border-border"
                }`}
                data-testid={`card-vip-${pkg.level}`}
              >
                {isCurrentLevel && (
                  <div className="bg-primary px-4 py-1.5 text-center">
                    <span className="text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
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
                        {(() => { const Icon = levelIcons[pkg.level] || (isLocked ? Lock : Crown); return <Icon className="w-6 h-6" style={{ color: colors.primary }} />; })()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-foreground font-bold">{pkg.name}</h3>
                          {isLocked && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <p className="text-muted-foreground text-xs mt-0.5">{pkg.description}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold" style={{ color: colors.primary }}>
                        {Number(pkg.price) === 0 ? "Bepul" : `$${Number(pkg.price).toLocaleString()}`}
                      </div>
                      {Number(pkg.price) > 0 && <span className="text-muted-foreground text-[10px]">garov</span>}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-card rounded-xl p-2.5 text-center">
                      <Film className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-0.5" />
                      <p className="text-foreground font-bold text-xs">{pkg.dailyTasks} ta</p>
                      <p className="text-muted-foreground text-[9px]">Kunlik video</p>
                    </div>
                    <div className="bg-card rounded-xl p-2.5 text-center">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-0.5" />
                      <p className="font-bold text-xs" style={{ color: colors.primary }}>${Number(pkg.perVideoReward).toFixed(2)}</p>
                      <p className="text-muted-foreground text-[9px]">Har video</p>
                    </div>
                    <div className="bg-card rounded-xl p-2.5 text-center">
                      <TrendingUp className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-0.5" />
                      <p className="font-bold text-xs" style={{ color: colors.primary }}>${Number(pkg.dailyEarning).toFixed(2)}</p>
                      <p className="text-muted-foreground text-[9px]">Kunlik</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between bg-card rounded-lg px-3 py-1.5">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground text-[10px]">Muddat: {pkg.durationDays} kun</span>
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
                    <div className="mt-3 flex items-center justify-center gap-2 py-2.5 bg-card rounded-xl">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground text-sm font-medium">Qulflangan</span>
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

        <div className="mt-4 bg-primary/10 rounded-2xl p-4 border border-primary/20">
          <p className="text-primary text-xs leading-relaxed">
            <strong>Muhim:</strong> Garov summasi paket muddati tugagandan so'ng qaytariladi. 10% komissiya daromaddan ushlanadi. Qulflangan paketlar ma'lum shartlar bajarilgandan so'ng ochiladi.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
