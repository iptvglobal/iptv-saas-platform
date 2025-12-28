import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  ShoppingCart, 
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Search
} from "lucide-react";

export default function AdminOrders() {
  const utils = trpc.useUtils();
  const { data: allOrders, isLoading } = trpc.orders.list.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  
  const verifyOrder = trpc.orders.verify.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      toast.success("Order verified successfully");
      setVerifyingOrder(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to verify order");
    }
  });
  
  const rejectOrder = trpc.orders.reject.useMutation({
    onSuccess: () => {
      utils.orders.list.invalidate();
      toast.success("Order rejected");
      setRejectingOrder(null);
      setRejectionReason("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject order");
    }
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingOrder, setViewingOrder] = useState<NonNullable<typeof allOrders>[0] | null>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<NonNullable<typeof allOrders>[0] | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<NonNullable<typeof allOrders>[0] | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const pendingOrders = allOrders?.filter(o => o.status === "pending") || [];
  const verifiedOrders = allOrders?.filter(o => o.status === "verified") || [];
  const rejectedOrders = allOrders?.filter(o => o.status === "rejected") || [];
  
  const filteredOrders = (orders: typeof allOrders) => {
    if (!orders) return [];
    if (!searchQuery) return orders;
    return orders.filter(o => 
      o.id.toString().includes(searchQuery) ||
      getUserName(o.userId).toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  const getPlanName = (planId: number) => {
    return plans?.find(p => p.id === planId)?.name || `Plan #${planId}`;
  };
  
  const getUserName = (userId: number) => {
    const user = users?.find(u => u.id === userId);
    return user?.name || user?.email || `User #${userId}`;
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="badge-pending gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "verified":
        return <Badge className="badge-verified gap-1"><CheckCircle className="h-3 w-3" />Verified</Badge>;
      case "rejected":
        return <Badge className="badge-rejected gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return null;
    }
  };
  
  const handleVerifyOrder = () => {
    if (verifyingOrder) {
      verifyOrder.mutate({ orderId: verifyingOrder.id });
    }
  };
  
  const handleRejectOrder = () => {
    if (rejectingOrder && rejectionReason) {
      rejectOrder.mutate({ orderId: rejectingOrder.id, reason: rejectionReason });
    }
  };
  
  const OrdersTable = ({ orders }: { orders: NonNullable<typeof allOrders> }) => (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map(order => (
            <TableRow key={order.id}>
              <TableCell>
                <div className="font-medium">#{order.id}</div>
                <div className="text-xs text-muted-foreground">
                  {order.connections} connections
                </div>
              </TableCell>
              <TableCell>{getUserName(order.userId)}</TableCell>
              <TableCell>{getPlanName(order.planId)}</TableCell>
              <TableCell className="font-medium">${order.price}</TableCell>
              <TableCell>
                {order.paymentMethodName ? (
                  <div>
                    <div className="font-medium text-sm">{order.paymentMethodName}</div>
                    {order.paymentMethodType && (
                      <div className="text-xs text-muted-foreground capitalize">{order.paymentMethodType}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">Not specified</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(order.createdAt), "MMM d, yyyy")}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewingOrder(order)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {order.status === "pending" && (
                      <>
                        <DropdownMenuItem onClick={() => setVerifyingOrder(order)}>
                          <Check className="mr-2 h-4 w-4 text-emerald-500" />
                          Verify Payment
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setRejectingOrder(order)}
                          className="text-destructive focus:text-destructive"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Reject Order
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">Verify payments and manage orders</p>
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
        
        {/* Orders */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>Manage subscription orders</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : !allOrders || allOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No orders yet</p>
              </div>
            ) : (
              <Tabs defaultValue="pending">
                <TabsList>
                  <TabsTrigger value="pending">Pending ({pendingOrders.length})</TabsTrigger>
                  <TabsTrigger value="verified">Verified ({verifiedOrders.length})</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected ({rejectedOrders.length})</TabsTrigger>
                  <TabsTrigger value="all">All ({allOrders.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending" className="mt-4">
                  {filteredOrders(pendingOrders).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No pending orders</div>
                  ) : (
                    <OrdersTable orders={filteredOrders(pendingOrders)} />
                  )}
                </TabsContent>
                
                <TabsContent value="verified" className="mt-4">
                  {filteredOrders(verifiedOrders).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No verified orders</div>
                  ) : (
                    <OrdersTable orders={filteredOrders(verifiedOrders)} />
                  )}
                </TabsContent>
                
                <TabsContent value="rejected" className="mt-4">
                  {filteredOrders(rejectedOrders).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No rejected orders</div>
                  ) : (
                    <OrdersTable orders={filteredOrders(rejectedOrders)} />
                  )}
                </TabsContent>
                
                <TabsContent value="all" className="mt-4">
                  <OrdersTable orders={filteredOrders(allOrders)} />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
        
        {/* View Order Dialog */}
        <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Order #{viewingOrder?.id}</DialogTitle>
              <DialogDescription>Order details and status</DialogDescription>
            </DialogHeader>
            {viewingOrder && (
              <div className="space-y-4 py-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">User</Label>
                    <div className="font-medium">{getUserName(viewingOrder.userId)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Plan</Label>
                    <div className="font-medium">{getPlanName(viewingOrder.planId)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Connections</Label>
                    <div className="font-medium">{viewingOrder.connections}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <div className="font-medium">${viewingOrder.price}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(viewingOrder.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <div className="font-medium">
                      {format(new Date(viewingOrder.createdAt), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                </div>
                
                {viewingOrder.paymentConfirmedAt && (
                  <div>
                    <Label className="text-muted-foreground">Payment Confirmed</Label>
                    <div className="font-medium">
                      {format(new Date(viewingOrder.paymentConfirmedAt), "MMM d, yyyy h:mm a")}
                    </div>
                  </div>
                )}
                
                {viewingOrder.rejectionReason && (
                  <div>
                    <Label className="text-muted-foreground">Rejection Reason</Label>
                    <div className="font-medium text-red-500">{viewingOrder.rejectionReason}</div>
                  </div>
                )}
                
                {viewingOrder.notes && (
                  <div>
                    <Label className="text-muted-foreground">Notes</Label>
                    <div className="font-medium">{viewingOrder.notes}</div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              {viewingOrder?.status === "pending" && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setViewingOrder(null);
                      setRejectingOrder(viewingOrder);
                    }}
                  >
                    Reject
                  </Button>
                  <Button 
                    onClick={() => {
                      setViewingOrder(null);
                      setVerifyingOrder(viewingOrder);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    Verify Payment
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Verify Order Dialog */}
        <Dialog open={!!verifyingOrder} onOpenChange={() => setVerifyingOrder(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Payment</DialogTitle>
              <DialogDescription>
                Confirm that payment has been received for Order #{verifyingOrder?.id}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <div>
                    <div className="font-medium">Amount: ${verifyingOrder?.price}</div>
                    <div className="text-sm text-muted-foreground">
                      {verifyingOrder?.connections} connections
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                After verification, you can assign IPTV credentials to this user from the Credentials page.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setVerifyingOrder(null)}>Cancel</Button>
              <Button 
                onClick={handleVerifyOrder}
                disabled={verifyOrder.isPending}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                {verifyOrder.isPending ? "Verifying..." : "Verify Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Reject Order Dialog */}
        <Dialog open={!!rejectingOrder} onOpenChange={() => {
          setRejectingOrder(null);
          setRejectionReason("");
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Order</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting Order #{rejectingOrder?.id}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label>Rejection Reason</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Payment not received, Invalid transaction..."
                rows={3}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setRejectingOrder(null);
                setRejectionReason("");
              }}>Cancel</Button>
              <Button 
                variant="destructive"
                onClick={handleRejectOrder}
                disabled={!rejectionReason || rejectOrder.isPending}
              >
                {rejectOrder.isPending ? "Rejecting..." : "Reject Order"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
