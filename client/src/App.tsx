import { Switch, Route, Redirect } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import TasksPage from "@/pages/tasks";
import ReferralPage from "@/pages/referral";
import VipPage from "@/pages/vip";
import ProfilePage from "@/pages/profile";
import TrendsPage from "@/pages/trends";
import FundPage from "@/pages/fund";
import AdminPage from "@/pages/admin";
import type { User } from "@shared/schema";

function ProtectedRoute({ component: Component }: { component: () => JSX.Element }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function AdminRoute({ component: Component }: { component: () => JSX.Element }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !user.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function AuthRoute({ component: Component }: { component: () => JSX.Element }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Redirect to="/login" />
      </Route>
      <Route path="/login">
        {() => <AuthRoute component={LoginPage} />}
      </Route>
      <Route path="/register">
        {() => <AuthRoute component={RegisterPage} />}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute component={DashboardPage} />}
      </Route>
      <Route path="/trends">
        {() => <ProtectedRoute component={TrendsPage} />}
      </Route>
      <Route path="/tasks">
        {() => <ProtectedRoute component={TasksPage} />}
      </Route>
      <Route path="/referral">
        {() => <ProtectedRoute component={ReferralPage} />}
      </Route>
      <Route path="/vip">
        {() => <ProtectedRoute component={VipPage} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={ProfilePage} />}
      </Route>
      <Route path="/fund">
        {() => <ProtectedRoute component={FundPage} />}
      </Route>
      <Route path="/admin">
        {() => <AdminRoute component={AdminPage} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
