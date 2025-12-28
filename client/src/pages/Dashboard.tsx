import UserLayout from "@/components/UserLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { 
  Package, 
  ShoppingCart, 
  Key, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  Tv,
  MessageCircle,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: orders, isLoading: ordersLoading } = trpc.orders.myOrders.useQuery();
  const { data: credentials, isLoading: credentialsLoading } = trpc.credentials.myCredentials.useQuery();
  const { data: plans } = trpc.plans.list.useQuery({ activeOnly: true });
  
  const pendingOrders = orders?.filter(o => o.status === "pending").length || 0;
  const verifiedOrders = orders?.filter(o => o.status === "verified").length || 0;
  const activeCredentials = credentials?.filter(c => c.isActive).length || 0;
  
  const recentOrders = orders?.slice(0, 3) || [];
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "verified":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "pending":
        return `${baseClasses} badge-pending`;
      case "verified":
        return `${baseClasses} badge-verified`;
      case "rejected":
        return `${baseClasses} badge-rejected`;
      default:
        return baseClasses;
    }
  };
  
  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name || "User"}!</h1>
            <p className="text-muted-foreground">Here's an overview of your IPTV subscription</p>
          </div>
<div className="flex flex-wrap gap-3">
  {/* Browse Plans */}
  <Link href="/plans">
    <Button className="gradient-primary">
      <Package className="mr-2 h-4 w-4" />
      Browse Plans
    </Button>
  </Link>

  {/* Free Trial Chat */}
  <a
    href="https://members.iptvtop.live/chat"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Button
      variant="outline"
      className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      Request Free Trial 24H
    </Button>
  </a>

  {/* Tutorial */}
  <a
    href="https://revsfr.com/iptv-guide/"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Button
      variant="outline"
      className="border-blue-500 text-blue-600 hover:bg-blue-50"
    >
      <BookOpen className="mr-2 h-4 w-4" />
      Tutorial
    </Button>
  </a>
</div>

        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Credentials
              </CardTitle>
              <Key className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCredentials}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeCredentials === 1 ? "connection" : "connections"} active
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Orders
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                awaiting verification
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Verified Orders
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedOrders}</div>
              <p className="text-xs text-muted-foreground mt-1">
                completed purchases
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions & Recent Orders */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Link href="/plans">
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Browse Plans</div>
                      <div className="text-xs text-muted-foreground">View available subscription plans</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              
              <Link href="/credentials">
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <Key className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">My Credentials</div>
                      <div className="text-xs text-muted-foreground">View your IPTV login details</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              
              <Link href="/orders">
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <ShoppingCart className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Order History</div>
                      <div className="text-xs text-muted-foreground">Track your orders and payments</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest subscription orders</CardDescription>
              </div>
              <Link href="/orders">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="skeleton h-16 rounded-lg" />
                  ))}
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Tv className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <Link href="/plans">
                    <Button variant="link" className="mt-2">Browse plans to get started</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map(order => (
                    <div 
                      key={order.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <div className="font-medium">Order #{order.id}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.connections} {order.connections === 1 ? "connection" : "connections"} • ${order.price}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={getStatusBadge(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(order.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Active Credentials Preview */}
        {activeCredentials > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Your Active Credentials</CardTitle>
                <CardDescription>Quick access to your IPTV login information</CardDescription>
              </div>
              <Link href="/credentials">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {credentials?.filter(c => c.isActive).slice(0, 3).map(cred => (
                  <div 
                    key={cred.id}
                    className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Key className="h-4 w-4 text-primary" />
                      <span className="font-medium">Connection {cred.connectionNumber}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Type: {cred.credentialType.toUpperCase()}
                    </div>
                    {cred.expiresAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Expires: {format(new Date(cred.expiresAt), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}
