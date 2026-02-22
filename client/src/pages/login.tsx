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
import { Phone, Lock, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  phone: z.string().min(9, "Telefon raqamini kiriting"),
  password: z.string().min(4, "Parolni kiriting"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "", password: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
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
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#E8453C] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-bold">V</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a2e] tracking-tight">VEM</h1>
          <p className="text-[#888] mt-1 text-sm">Video Earning Platform</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md border border-[#eee]">
          <h2 className="text-lg font-semibold text-[#1a1a2e] mb-6">Tizimga kirish</h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#555]">Telefon raqami</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]" />
                        <Input
                          {...field}
                          placeholder="+998 90 123 45 67"
                          className="pl-10 bg-[#f9f9f9] border-[#e0e0e0] text-[#1a1a2e] placeholder:text-[#bbb] focus:border-[#FF6B35]/50 focus:ring-[#FF6B35]/20"
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
                    <FormLabel className="text-[#555]">Parol</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aaa]" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Parolingizni kiriting"
                          className="pl-10 pr-10 bg-[#f9f9f9] border-[#e0e0e0] text-[#1a1a2e] placeholder:text-[#bbb] focus:border-[#FF6B35]/50 focus:ring-[#FF6B35]/20"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#aaa]"
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

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E8453C] text-white font-semibold no-default-hover-elevate no-default-active-elevate h-11 rounded-xl shadow-md"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Kirish..." : "Kirish"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-[#888] text-sm">
              Hisobingiz yo'qmi?{" "}
              <Link href="/register" className="text-[#FF6B35] font-semibold" data-testid="link-register">
                Ro'yxatdan o'ting
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
