import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  ShoppingCart, 
  Clock, 
  DollarSign,
  TrendingUp,
  Package,
  Key,
  MessageCircle
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: pendingOrders } = trpc.orders.list.useQuery({ status: "pending" });
  const { data: recentLogs } = trpc.activityLogs.list.useQuery({ limit: 5 });
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="skeleton h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your IPTV platform</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Registered accounts
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All time orders
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
              <div className="text-2xl font-bold text-amber-500">{stats?.pendingOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting verification
              </p>
            </CardContent>
          </Card>
          
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                ${parseFloat(stats?.totalRevenue || "0").toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From verified orders
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions & Pending Orders */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link href="/admin/orders">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Clock className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Pending Orders</div>
                    <div className="text-xs text-muted-foreground">{stats?.pendingOrders || 0} to verify</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/admin/users">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Manage Users</div>
                    <div className="text-xs text-muted-foreground">{stats?.totalUsers || 0} users</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/admin/plans">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Manage Plans</div>
                    <div className="text-xs text-muted-foreground">Pricing & features</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/admin/credentials">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Key className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Credentials</div>
                    <div className="text-xs text-muted-foreground">IPTV access</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/admin/chat">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Support Chat</div>
                    <div className="text-xs text-muted-foreground">User messages</div>
                  </div>
                </Button>
              </Link>
              
              <Link href="/admin/logs">
                <Button variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Activity Logs</div>
                    <div className="text-xs text-muted-foreground">Recent activity</div>
                  </div>
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Pending Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Orders</CardTitle>
                <CardDescription>Orders awaiting verification</CardDescription>
              </div>
              <Link href="/admin/orders">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!pendingOrders || pendingOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No pending orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingOrders.slice(0, 5).map(order => (
                    <div 
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div>
                        <div className="font-medium">Order #{order.id}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.connections} connections • ${order.price}
                        </div>
                      </div>
                      <Link href="/admin/orders">
                        <Button size="sm" variant="outline">Review</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform actions</CardDescription>
            </div>
            <Link href="/admin/logs">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!recentLogs || recentLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map(log => (
                  <div 
                    key={log.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{log.action.replace(/_/g, " ")}</div>
                      <div className="text-xs text-muted-foreground">
                        {log.entityType && `${log.entityType} #${log.entityId}`}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
