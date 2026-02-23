import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Phone, Lock, Eye, EyeOff, ChevronDown } from "lucide-react";

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

const loginSchema = z.object({
  phone: z.string().min(5, "Telefon raqamini kiriting"),
  password: z.string().min(4, "Parolni kiriting"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("vem_remember") === "true");
  const [selectedCountry, setSelectedCountry] = useState(() => {
    const saved = localStorage.getItem("vem_country");
    if (saved) {
      const found = countryCodes.find(c => c.country === saved);
      if (found) return found;
    }
    return countryCodes[0];
  });
  const [showCountryList, setShowCountryList] = useState(false);

  const savedPhone = rememberMe ? (localStorage.getItem("vem_phone") || "") : "";

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: savedPhone, password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const fullPhone = selectedCountry.code + data.phone;
      const res = await apiRequest("POST", "/api/auth/login", { ...data, phone: fullPhone, rememberMe });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      if (rememberMe) {
        localStorage.setItem("vem_remember", "true");
        localStorage.setItem("vem_phone", variables.phone);
        localStorage.setItem("vem_country", selectedCountry.country);
      } else {
        localStorage.removeItem("vem_remember");
        localStorage.removeItem("vem_phone");
        localStorage.removeItem("vem_country");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/dashboard");
    },
    onError: (error: Error) => {
      toast({ title: "Xatolik", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF6B35] to-[#E8453C] rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#FF6B35]/20">
            <span className="text-white text-3xl font-bold">V</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">VEM</h1>
          <p className="text-[#999] mt-1 text-sm">Video Earning Platform</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-2xl p-6 shadow-lg border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-5 bg-gradient-to-b from-[#FF6B35] to-[#E8453C] rounded-full" />
            <h2 className="text-lg font-bold text-white">Tizimga kirish</h2>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">Telefon raqami</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowCountryList(!showCountryList)}
                            className="flex items-center gap-1.5 h-11 px-3 bg-[#111] border border-[#333] rounded-xl text-sm font-medium text-white whitespace-nowrap hover:border-[#FF6B35]/40 transition-colors"
                            data-testid="button-country-code"
                          >
                            <span className="text-lg">{selectedCountry.flag}</span>
                            <span className="text-sm">{selectedCountry.code}</span>
                            <ChevronDown className={`w-3.5 h-3.5 text-[#999] transition-transform ${showCountryList ? "rotate-180" : ""}`} />
                          </button>
                          {showCountryList && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setShowCountryList(false)} />
                              <div className="absolute top-full left-0 mt-1 w-72 max-h-60 overflow-y-auto bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl z-50">
                                {countryCodes.map((c) => (
                                  <button
                                    key={c.country + c.code}
                                    type="button"
                                    onClick={() => { setSelectedCountry(c); setShowCountryList(false); }}
                                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-[#222] transition-colors ${
                                      selectedCountry.country === c.country ? "bg-[#222]" : ""
                                    }`}
                                    data-testid={`option-country-${c.country}`}
                                  >
                                    <span className="text-lg">{c.flag}</span>
                                    <span className="text-white font-medium flex-1">{c.name}</span>
                                    <span className="text-[#999] text-xs">{c.code}</span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                          <Input
                            {...field}
                            placeholder="90 123 45 67"
                            className="pl-10 h-11 bg-[#111] border-[#333] text-white placeholder:text-[#555] focus:border-[#FF6B35]/50 focus:ring-[#FF6B35]/20 rounded-xl"
                            data-testid="input-phone"
                          />
                        </div>
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
                    <FormLabel className="text-[#aaa] text-xs font-semibold uppercase tracking-wider">Parol</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Parolingizni kiriting"
                          className="pl-10 pr-10 h-11 bg-[#111] border-[#333] text-white placeholder:text-[#555] focus:border-[#FF6B35]/50 focus:ring-[#FF6B35]/20 rounded-xl"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(val) => setRememberMe(val === true)}
                    className="border-[#444] data-[state=checked]:bg-[#FF6B35] data-[state=checked]:border-[#FF6B35]"
                    data-testid="checkbox-remember-me"
                  />
                  <span className="text-[#888] text-sm">Meni eslab qol</span>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white font-semibold no-default-hover-elevate no-default-active-elevate h-12 rounded-xl shadow-lg shadow-[#FF6B35]/20 text-base"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Kirish..." : "Kirish"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-[#999] text-sm">
              Hisobingiz yo'qmi?{" "}
              <Link href="/register" className="text-[#FF6B35] font-semibold" data-testid="link-register">
                Ro'yxatdan o'ting
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-[#555] text-[10px] mt-4">
          VEM Platform &copy; 2026. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}
