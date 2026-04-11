import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import AppLayout from "@/components/app-layout";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";
import { lazy, Suspense, useEffect } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineBanner } from "@/components/offline-banner";

const LandingPage = lazy(() => import("@/pages/landing"));
const DashboardPage = lazy(() => import("@/pages/dashboard"));
const TasksPage = lazy(() => import("@/pages/tasks"));
const ReferralPage = lazy(() => import("@/pages/referral"));
const VipPage = lazy(() => import("@/pages/vip"));
const ProfilePage = lazy(() => import("@/pages/profile"));
const TrendsPage = lazy(() => import("@/pages/trends"));
const FundPage = lazy(() => import("@/pages/fund"));
const AdminPage = lazy(() => import("@/pages/admin"));
const HelpPage = lazy(() => import("@/pages/help"));
const PromoPage = lazy(() => import("@/pages/promo"));
const NotificationsPage = lazy(() => import("@/pages/notifications"));
const ReportsPage = lazy(() => import("@/pages/reports"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) return <PageLoader />;
  if (error && error.message === "ACCOUNT_BANNED") {
    localStorage.setItem("vem-banned", "1");
    return <Redirect to="/" />;
  }
  if (!user) return <Redirect to="/login" />;

  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    </AppLayout>
  );
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) return <PageLoader />;
  if (error && error.message === "ACCOUNT_BANNED") {
    localStorage.setItem("vem-banned", "1");
    return <Redirect to="/" />;
  }
  if (!user || !user.isAdmin) return <Redirect to="/dashboard" />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function BannedListener() {
  const [, navigate] = useLocation();
  useEffect(() => {
    const handler = () => {
      queryClient.clear();
      navigate("/");
    };
    window.addEventListener("vem-account-banned", handler);
    return () => window.removeEventListener("vem-account-banned", handler);
  }, [navigate]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <LandingPage />
          </Suspense>
        )}
      </Route>
      <Route path="/login">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <LandingPage initialAuth="login" />
          </Suspense>
        )}
      </Route>
      <Route path="/register">
        {() => (
          <Suspense fallback={<PageLoader />}>
            <LandingPage initialAuth="register" />
          </Suspense>
        )}
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
      <Route path="/help">
        {() => <ProtectedRoute component={HelpPage} />}
      </Route>
      <Route path="/promo">
        {() => <ProtectedRoute component={PromoPage} />}
      </Route>
      <Route path="/notifications">
        {() => <ProtectedRoute component={NotificationsPage} />}
      </Route>
      <Route path="/reports">
        {() => <ProtectedRoute component={ReportsPage} />}
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
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <OfflineBanner />
              <BannedListener />
              <Router />
            </TooltipProvider>
          </QueryClientProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
