import { useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Lock, Shield, Eye, EyeOff, UserPlus, ChevronDown, CheckCircle, ArrowRight } from "lucide-react";

const countryCodes = [
  { code: "+998", country: "UZ", flag: "\u{1F1FA}\u{1F1FF}", name: "O'zbekiston" },
  { code: "+7", country: "RU", flag: "\u{1F1F7}\u{1F1FA}", name: "Rossiya" },
  { code: "+1", country: "US", flag: "\u{1F1FA}\u{1F1F8}", name: "AQSH" },
  { code: "+44", country: "GB", flag: "\u{1F1EC}\u{1F1E7}", name: "Buyuk Britaniya" },
  { code: "+49", country: "DE", flag: "\u{1F1E9}\u{1F1EA}", name: "Germaniya" },
  { code: "+82", country: "KR", flag: "\u{1F1F0}\u{1F1F7}", name: "Janubiy Koreya" },
  { code: "+90", country: "TR", flag: "\u{1F1F9}\u{1F1F7}", name: "Turkiya" },
  { code: "+86", country: "CN", flag: "\u{1F1E8}\u{1F1F3}", name: "Xitoy" },
  { code: "+91", country: "IN", flag: "\u{1F1EE}\u{1F1F3}", name: "Hindiston" },
  { code: "+81", country: "JP", flag: "\u{1F1EF}\u{1F1F5}", name: "Yaponiya" },
  { code: "+971", country: "AE", flag: "\u{1F1E6}\u{1F1EA}", name: "BAA" },
  { code: "+992", country: "TJ", flag: "\u{1F1F9}\u{1F1EF}", name: "Tojikiston" },
  { code: "+996", country: "KG", flag: "\u{1F1F0}\u{1F1EC}", name: "Qirg'iziston" },
  { code: "+993", country: "TM", flag: "\u{1F1F9}\u{1F1F2}", name: "Turkmaniston" },
  { code: "+7", country: "KZ", flag: "\u{1F1F0}\u{1F1FF}", name: "Qozog'iston" },
];

const registerSchema = z.object({
  phone: z.string().min(5, "Telefon raqamini kiriting"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  fundPassword: z.string().min(4, "Moliyaviy parolni kiriting"),
  captcha: z.boolean().refine(val => val === true, "Captchani tasdiqlang"),
  referralCode: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

function SliderCaptcha({ onVerified }: { onVerified: () => void }) {
  const [sliderPos, setSliderPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [verified, setVerified] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((clientX: number) => {
    if (verified) return;
    setIsDragging(true);
  }, [verified]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || !trackRef.current || verified) return;
    const rect = trackRef.current.getBoundingClientRect();
    const maxX = rect.width - 44;
    const x = Math.max(0, Math.min(clientX - rect.left - 22, maxX));
    setSliderPos(x);

    if (x >= maxX - 5) {
      setVerified(true);
      setIsDragging(false);
      setSliderPos(maxX);
      onVerified();
    }
  }, [isDragging, verified, onVerified]);

  const handleEnd = useCallback(() => {
    if (!verified) {
      setSliderPos(0);
    }
    setIsDragging(false);
  }, [verified]);

  return (
    <div
      ref={trackRef}
      className={`relative h-11 rounded-xl border-2 select-none transition-colors ${
        verified
          ? "bg-green-50 border-green-400"
          : "bg-[#f0f0f0] border-[#ddd]"
      }`}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      data-testid="captcha-slider-track"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={`text-sm font-medium ${verified ? "text-green-600" : "text-[#aaa]"}`}>
          {verified ? "Tasdiqlandi!" : "Suring \u2192 Tasdiqlash"}
        </span>
      </div>

      {verified && (
        <div
          className="absolute inset-0 rounded-xl bg-green-100/60"
          style={{ width: "100%" }}
        />
      )}

      <div
        className={`absolute top-0.5 w-10 h-9 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing shadow-md transition-colors ${
          verified
            ? "bg-green-500 text-white"
            : "bg-white text-[#FF6B35] border border-[#ddd]"
        }`}
        style={{ left: `${sliderPos + 2}px` }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        data-testid="captcha-slider-handle"
      >
        {verified ? <CheckCircle className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showFundPassword, setShowFundPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]);
  const [showCountryList, setShowCountryList] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const refCode = params.get("ref") || "";

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: "", password: "", fundPassword: "", captcha: false, referralCode: refCode },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const fullPhone = selectedCountry.code + data.phone;
      const res = await apiRequest("POST", "/api/auth/register", { ...data, phone: fullPhone });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B35] to-[#E8453C] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white text-xl font-bold">V</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">VEM</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border border-[#eee]">
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-5">Ro'yxatdan o'tish</h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#555]">Telefon raqami</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowCountryList(!showCountryList)}
                            className="flex items-center gap-1.5 h-10 px-3 bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg text-sm font-medium text-[#1a1a2e] whitespace-nowrap"
                            data-testid="button-country-code"
                          >
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span>{selectedCountry.code}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-[#999]" />
                          </button>

                          {showCountryList && (
                            <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-[#eee] rounded-xl shadow-xl z-50">
                              {countryCodes.map((c) => (
                                <button
                                  key={c.country + c.code}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCountry(c);
                                    setShowCountryList(false);
                                  }}
                                  className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-[#f5f5f5] transition-colors"
                                  data-testid={`option-country-${c.country}`}
                                >
                                  <span className="text-lg">{c.flag}</span>
                                  <span className="text-[#1a1a2e] font-medium">{c.name}</span>
                                  <span className="text-[#999] ml-auto">{c.code}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <Input
                          {...field}
                          placeholder="90 123 45 67"
                          className="flex-1 bg-[#f9f9f9] border-[#e0e0e0] text-[#1a1a2e] placeholder:text-[#bbb] focus:border-[#FF6B35]/50 focus:ring-[#FF6B35]/20"
                          data-testid="input-phone"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#555]">Kirish paroli</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Kamida 6 ta belgi"
                          className="pl-10 pr-10 bg-[#f9f9f9] border-[#e0e0e0] text-[#1a1a2e] placeholder:text-[#bbb] focus:border-[#FF6B35]/50 focus:ring-[#FF6B35]/20"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fundPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#555]">Moliyaviy parol</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]" />
                        <Input
                          {...field}
                          type={showFundPassword ? "text" : "password"}
                          placeholder="Pul yechish uchun parol"
                          className="pl-10 pr-10 bg-[#f9f9f9] border-[#e0e0e0] text-[#1a1a2e] placeholder:text-[#bbb] focus:border-[#FF6B35]/50 focus:ring-[#FF6B35]/20"
                          data-testid="input-fund-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowFundPassword(!showFundPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa]"
                        >
                          {showFundPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#555]">Referal kodi (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]" />
                        <Input
                          {...field}
                          placeholder="Taklif kodini kiriting"
                          className="pl-10 bg-[#f9f9f9] border-[#e0e0e0] text-[#1a1a2e] placeholder:text-[#bbb] focus:border-[#FF6B35]/50 focus:ring-[#FF6B35]/20"
                          data-testid="input-referral"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="captcha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#555]">Tasdiqlash</FormLabel>
                    <FormControl>
                      <SliderCaptcha
                        onVerified={() => field.onChange(true)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white font-semibold no-default-hover-elevate no-default-active-elevate h-11 rounded-xl shadow-md mt-2"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
              </Button>
            </form>
          </Form>

          <div className="mt-5 text-center">
            <p className="text-[#888] text-sm">
              Hisobingiz bormi?{" "}
              <Link href="/login" className="text-[#FF6B35] font-semibold" data-testid="link-login">
                Kirish
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
