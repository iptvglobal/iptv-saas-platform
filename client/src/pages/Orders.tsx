const ORDER_NUMBER_OFFSET = 29355;
import UserLayout from "@/components/UserLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  ShoppingCart, 
  Clock, 
  CheckCircle, 
  XCircle,
  Package,
  ArrowRight
} from "lucide-react";

export default function Orders() {
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  
  const pendingOrders = orders?.filter(o => o.status === "pending") || [];
  const verifiedOrders = orders?.filter(o => o.status === "verified") || [];
  const rejectedOrders = orders?.filter(o => o.status === "rejected") || [];
  
  const getPlanName = (planId: number) => {
    return plans?.find(p => p.id === planId)?.name || `Plan #${planId}`;
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "verified":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="badge-pending">Pending</Badge>;
      case "verified":
        return <Badge className="badge-verified">Verified</Badge>;
      case "rejected":
        return <Badge className="badge-rejected">Rejected</Badge>;
      default:
        return null;
    }
  };
  
  const OrderCard = ({ order }: { order: NonNullable<typeof orders>[0] }) => (
    <Card className="card-hover">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              {getStatusIcon(order.status)}
            </div>
            <div>
              <div className="font-semibold">Order #{order.id + ORDER_NUMBER_OFFSET}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {getPlanName(order.planId)} • {order.connections} {order.connections === 1 ? "connection" : "connections"}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>
          </div>
          <div className="text-right">
            {getStatusBadge(order.status)}
            <div className="text-lg font-bold mt-2">${order.price}</div>
          </div>
        </div>
        
        {order.status === "verified" && (
          <div className="mt-4 pt-4 border-t">
            <Link href="/credentials">
              <Button variant="outline" size="sm" className="gap-2">
                View Credentials
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
        
        {order.status === "rejected" && order.rejectionReason && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-sm">
              <span className="text-muted-foreground">Reason: </span>
              <span className="text-red-500">{order.rejectionReason}</span>
            </div>
          </div>
        )}
        
        {order.status === "pending" && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              <span>Awaiting payment verification</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
  
  if (isLoading) {
    return (
      <UserLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track your subscription orders</p>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </UserLayout>
    );
  }
  
  return (
    <UserLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-muted-foreground">Track your subscription orders and payment status</p>
          </div>
          <Link href="/plans">
            <Button className="gradient-primary gap-2">
              <Package className="h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>
        
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingOrders.length}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{verifiedOrders.length}</div>
                <div className="text-sm text-muted-foreground">Verified</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{rejectedOrders.length}</div>
                <div className="text-sm text-muted-foreground">Rejected</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Orders Tabs */}
        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                You haven't placed any orders yet. Browse our plans to get started.
              </p>
              <Link href="/plans">
                <Button>Browse Plans</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
              <TabsTrigger value="verified">Verified ({verifiedOrders.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejectedOrders.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4 mt-4">
              {orders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4 mt-4">
              {pendingOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No pending orders
                  </CardContent>
                </Card>
              ) : (
                pendingOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="verified" className="space-y-4 mt-4">
              {verifiedOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No verified orders
                  </CardContent>
                </Card>
              ) : (
                verifiedOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="rejected" className="space-y-4 mt-4">
              {rejectedOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No rejected orders
                  </CardContent>
                </Card>
              ) : (
                rejectedOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </UserLayout>
  );
}
