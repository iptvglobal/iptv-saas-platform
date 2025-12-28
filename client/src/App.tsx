import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Plans from "./pages/Plans";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Credentials from "./pages/Credentials";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminPaymentMethods from "./pages/admin/AdminPaymentMethods";
import AdminPaymentWidgets from "./pages/admin/AdminPaymentWidgets";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCredentials from "./pages/admin/AdminCredentials";
import AdminChat from "./pages/admin/AdminChat";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminEmailTemplates from "./pages/admin/AdminEmailTemplates";

// Protected route wrapper
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 spinner" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

// Admin route wrapper
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 spinner" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }
  
  if (user?.role !== "admin" && user?.role !== "agent") {
    return <Redirect to="/dashboard" />;
  }
  
  return <Component />;
}

function Router() {
  const { isAuthenticated, loading } = useAuth();
  
  return (
    <Switch>
      {/* Root path - Login or redirect to dashboard */}
      <Route path="/">
        {() => {
          if (loading) {
            return (
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 spinner" />
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              </div>
            );
          }
          return isAuthenticated ? <Redirect to="/dashboard" /> : <Login />;
        }}
      </Route>
      
      {/* User Routes */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/plans">
        {() => <ProtectedRoute component={Plans} />}
      </Route>
      <Route path="/checkout/:planId">
        {() => <ProtectedRoute component={Checkout} />}
      </Route>
      <Route path="/orders">
        {() => <ProtectedRoute component={Orders} />}
      </Route>
      <Route path="/credentials">
        {() => <ProtectedRoute component={Credentials} />}
      </Route>
      <Route path="/chat">
        {() => <ProtectedRoute component={Chat} />}
      </Route>
      <Route path="/profile">
        {() => <ProtectedRoute component={Profile} />}
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin">
        {() => <AdminRoute component={AdminDashboard} />}
      </Route>
      <Route path="/admin/users">
        {() => <AdminRoute component={AdminUsers} />}
      </Route>
      <Route path="/admin/plans">
        {() => <AdminRoute component={AdminPlans} />}
      </Route>
      <Route path="/admin/payment-methods">
        {() => <AdminRoute component={AdminPaymentMethods} />}
      </Route>
      <Route path="/admin/payment-widgets">
        {() => <AdminRoute component={AdminPaymentWidgets} />}
      </Route>
      <Route path="/admin/orders">
        {() => <AdminRoute component={AdminOrders} />}
      </Route>
      <Route path="/admin/credentials">
        {() => <AdminRoute component={AdminCredentials} />}
      </Route>
      <Route path="/admin/chat">
        {() => <AdminRoute component={AdminChat} />}
      </Route>
      <Route path="/admin/logs">
        {() => <AdminRoute component={AdminLogs} />}
      </Route>
      <Route path="/admin/email-templates">
        {() => <AdminRoute component={AdminEmailTemplates} />}
      </Route>
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
