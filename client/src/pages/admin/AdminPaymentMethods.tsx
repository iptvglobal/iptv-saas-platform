import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { 
  CreditCard, 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Wallet,
  Bitcoin
} from "lucide-react";

type MethodFormData = {
  name: string;
  type: "card" | "paypal" | "crypto" | "custom";
  planId: number | null;
  minConnections: number;
  maxConnections: number;
  instructions: string;
  paymentLink: string;
  isActive: boolean;
};

const defaultMethodForm: MethodFormData = {
  name: "",
  type: "custom",
  planId: null,
  minConnections: 1,
  maxConnections: 10,
  instructions: "",
  paymentLink: "",
  isActive: true
};

export default function AdminPaymentMethods() {
  const utils = trpc.useUtils();
  const { data: methods, isLoading } = trpc.paymentMethods.list.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  
  const createMethod = trpc.paymentMethods.create.useMutation({
    onSuccess: () => {
      utils.paymentMethods.list.invalidate();
      toast.success("Payment method created");
      setShowCreateDialog(false);
      setMethodForm(defaultMethodForm);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create payment method");
    }
  });
  
  const updateMethod = trpc.paymentMethods.update.useMutation({
    onSuccess: () => {
      utils.paymentMethods.list.invalidate();
      toast.success("Payment method updated");
      setEditingMethod(null);
      setMethodForm(defaultMethodForm);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update payment method");
    }
  });
  
  const deleteMethod = trpc.paymentMethods.delete.useMutation({
    onSuccess: () => {
      utils.paymentMethods.list.invalidate();
      toast.success("Payment method deleted");
      setDeletingMethod(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete payment method");
    }
  });
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<NonNullable<typeof methods>[0] | null>(null);
  const [deletingMethod, setDeletingMethod] = useState<NonNullable<typeof methods>[0] | null>(null);
  const [methodForm, setMethodForm] = useState<MethodFormData>(defaultMethodForm);
  
  const handleEditMethod = (method: NonNullable<typeof methods>[0]) => {
    setEditingMethod(method);
    setMethodForm({
      name: method.name,
      type: method.type as MethodFormData["type"],
      planId: method.planId,
      minConnections: method.minConnections,
      maxConnections: method.maxConnections,
      instructions: method.instructions || "",
      paymentLink: method.paymentLink || "",
      isActive: method.isActive
    });
  };
  
  const handleSaveMethod = () => {
    if (!methodForm.name) {
      toast.error("Method name is required");
      return;
    }
    if (!methodForm.planId) {
      toast.error("Please select a plan");
      return;
    }
    if (methodForm.minConnections > methodForm.maxConnections) {
      toast.error("Min connections cannot be greater than max connections");
      return;
    }
    
    const data = {
      name: methodForm.name,
      type: methodForm.type,
      planId: methodForm.planId,
      minConnections: methodForm.minConnections,
      maxConnections: methodForm.maxConnections,
      instructions: methodForm.instructions || undefined,
      paymentLink: methodForm.paymentLink || undefined,
      isActive: methodForm.isActive
    };
    
    if (editingMethod) {
      updateMethod.mutate({ id: editingMethod.id, ...data });
    } else {
      createMethod.mutate(data);
    }
  };
  
  const handleDeleteMethod = () => {
    if (deletingMethod) {
      deleteMethod.mutate({ id: deletingMethod.id });
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "card":
        return <CreditCard className="h-5 w-5 text-primary" />;
      case "paypal":
        return <Wallet className="h-5 w-5 text-blue-500" />;
      case "crypto":
        return <Bitcoin className="h-5 w-5 text-amber-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payment Methods</h1>
            <p className="text-muted-foreground">Configure manual payment options</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Method
          </Button>
        </div>
        
        {/* Methods Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Payment Methods</CardTitle>
            <CardDescription>Manual payment methods for users</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : !methods || methods.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No payment methods configured</p>
                <Button variant="link" onClick={() => setShowCreateDialog(true)}>
                  Add your first payment method
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Payment Link</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {methods.map(method => (
                      <TableRow key={method.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              {getTypeIcon(method.type)}
                            </div>
                            <div>
                              <div className="font-medium">{method.name}</div>
                              {method.instructions && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {method.instructions}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{method.type}</TableCell>
                        <TableCell>
                          {method.paymentLink ? (
                            <a 
                              href={method.paymentLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline text-sm"
                            >
                              View Link
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {method.isActive ? (
                            <Badge className="badge-verified">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditMethod(method)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletingMethod(method)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Create/Edit Dialog */}
        <Dialog 
          open={showCreateDialog || !!editingMethod} 
          onOpenChange={() => {
            setShowCreateDialog(false);
            setEditingMethod(null);
            setMethodForm(defaultMethodForm);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMethod ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
              <DialogDescription>
                Configure a manual payment option for users
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Method Name</Label>
                <Input
                  value={methodForm.name}
                  onChange={(e) => setMethodForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., PayPal, Bank Transfer"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={methodForm.type} 
                  onValueChange={(v) => setMethodForm(prev => ({ ...prev, type: v as MethodFormData["type"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Plan *</Label>
                <Select 
                  value={methodForm.planId?.toString() || ""} 
                  onValueChange={(v) => setMethodForm(prev => ({ ...prev, planId: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Connections</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={methodForm.minConnections}
                    onChange={(e) => setMethodForm(prev => ({ ...prev, minConnections: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Connections</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={methodForm.maxConnections}
                    onChange={(e) => setMethodForm(prev => ({ ...prev, maxConnections: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea
                  value={methodForm.instructions}
                  onChange={(e) => setMethodForm(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Payment instructions for users..."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Payment Link (optional)</Label>
                <Input
                  value={methodForm.paymentLink}
                  onChange={(e) => setMethodForm(prev => ({ ...prev, paymentLink: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={methodForm.isActive}
                  onCheckedChange={(checked) => setMethodForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingMethod(null);
                  setMethodForm(defaultMethodForm);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveMethod}
                disabled={createMethod.isPending || updateMethod.isPending}
              >
                {createMethod.isPending || updateMethod.isPending 
                  ? "Saving..." 
                  : editingMethod ? "Update" : "Create"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingMethod} onOpenChange={() => setDeletingMethod(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Payment Method</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingMethod?.name}"? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingMethod(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteMethod} disabled={deleteMethod.isPending}>
                {deleteMethod.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
