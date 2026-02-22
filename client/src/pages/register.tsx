import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Phone, Lock, Shield, Eye, EyeOff, UserPlus } from "lucide-react";

const registerSchema = z.object({
  phone: z.string().min(9, "Telefon raqamini kiriting"),
  password: z.string().min(6, "Parol kamida 6 ta belgidan iborat bo'lishi kerak"),
  fundPassword: z.string().min(4, "Moliyaviy parolni kiriting"),
  captcha: z.boolean().refine(val => val === true, "Captchani tasdiqlang"),
  referralCode: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showFundPassword, setShowFundPassword] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { phone: "", password: "", fundPassword: "", captcha: false, referralCode: "" },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
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
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-[#c9a84c]">VEM</span>
          </h1>
          <p className="text-[#888] mt-2 text-sm">Premium Video Earning Platform</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
          <h2 className="text-xl font-semibold text-[#e0e0e0] mb-6">Ro'yxatdan o'tish</h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#999]">Telefon raqami</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                        <Input
                          {...field}
                          placeholder="+998 90 123 45 67"
                          className="pl-10 bg-[#141414] border-[#2a2a2a] text-[#e0e0e0] placeholder:text-[#444] focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20"
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
                    <FormLabel className="text-[#999]">Kirish paroli</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Kamida 6 ta belgi"
                          className="pl-10 pr-10 bg-[#141414] border-[#2a2a2a] text-[#e0e0e0] placeholder:text-[#444] focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]"
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
                    <FormLabel className="text-[#999]">Moliyaviy parol</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                        <Input
                          {...field}
                          type={showFundPassword ? "text" : "password"}
                          placeholder="Pul yechish uchun parol"
                          className="pl-10 pr-10 bg-[#141414] border-[#2a2a2a] text-[#e0e0e0] placeholder:text-[#444] focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20"
                          data-testid="input-fund-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowFundPassword(!showFundPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]"
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
                    <FormLabel className="text-[#999]">Referal kodi (ixtiyoriy)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                        <Input
                          {...field}
                          placeholder="Taklif kodini kiriting"
                          className="pl-10 bg-[#141414] border-[#2a2a2a] text-[#e0e0e0] placeholder:text-[#444] focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20"
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
                    <div className="flex items-center gap-3 p-3 bg-[#141414] rounded-md border border-[#2a2a2a]">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="border-[#444] data-[state=checked]:bg-[#c9a84c] data-[state=checked]:border-[#c9a84c]"
                          data-testid="checkbox-captcha"
                        />
                      </FormControl>
                      <FormLabel className="text-[#999] text-sm cursor-pointer">
                        Men robot emasman
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-[#c9a84c] text-[#121212] font-semibold no-default-hover-elevate no-default-active-elevate mt-2"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? "Ro'yxatdan o'tilmoqda..." : "Ro'yxatdan o'tish"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-[#666] text-sm">
              Hisobingiz bormi?{" "}
              <Link href="/login" className="text-[#c9a84c] font-medium" data-testid="link-login">
                Kirish
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
