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
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-[#c9a84c]">VEM</span>
          </h1>
          <p className="text-[#888] mt-2 text-sm">Premium Video Earning Platform</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#2a2a2a]" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
          <h2 className="text-xl font-semibold text-[#e0e0e0] mb-6">Tizimga kirish</h2>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-5">
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
                    <FormLabel className="text-[#999]">Parol</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Parolingizni kiriting"
                          className="pl-10 pr-10 bg-[#141414] border-[#2a2a2a] text-[#e0e0e0] placeholder:text-[#444] focus:border-[#c9a84c]/50 focus:ring-[#c9a84c]/20"
                          data-testid="input-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555]"
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
                className="w-full bg-[#c9a84c] text-[#121212] font-semibold no-default-hover-elevate no-default-active-elevate"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? "Kirish..." : "Kirish"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-[#666] text-sm">
              Hisobingiz yo'qmi?{" "}
              <Link href="/register" className="text-[#c9a84c] font-medium" data-testid="link-register">
                Ro'yxatdan o'ting
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
