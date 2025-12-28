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
  Bitcoin, 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from "lucide-react";

interface WidgetFormData {
  name: string;
  invoiceId: string; // NowPayments invoice ID
  planId: number;
  minConnections: number;
  maxConnections: number;
  isActive: boolean;
}

const defaultWidgetForm: WidgetFormData = {
  name: "",
  invoiceId: "", // Just the invoice ID, not the full iframe
  planId: 0,
  minConnections: 1,
  maxConnections: 10,
  isActive: true
};

export default function AdminPaymentWidgets() {
  const utils = trpc.useUtils();
  const { data: widgets, isLoading } = trpc.paymentWidgets.list.useQuery();
  const { data: plans } = trpc.plans.list.useQuery();
  
  const createWidget = trpc.paymentWidgets.create.useMutation({
    onSuccess: () => {
      utils.paymentWidgets.list.invalidate();
      toast.success("Payment widget created");
      setShowCreateDialog(false);
      setWidgetForm(defaultWidgetForm);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create widget");
    }
  });
  
  const updateWidget = trpc.paymentWidgets.update.useMutation({
    onSuccess: () => {
      utils.paymentWidgets.list.invalidate();
      toast.success("Payment widget updated");
      setEditingWidget(null);
      setWidgetForm(defaultWidgetForm);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update widget");
    }
  });
  
  const deleteWidget = trpc.paymentWidgets.delete.useMutation({
    onSuccess: () => {
      utils.paymentWidgets.list.invalidate();
      toast.success("Payment widget deleted");
      setDeletingWidget(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete widget");
    }
  });
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWidget, setEditingWidget] = useState<NonNullable<typeof widgets>[0] | null>(null);
  const [deletingWidget, setDeletingWidget] = useState<NonNullable<typeof widgets>[0] | null>(null);
  const [previewWidget, setPreviewWidget] = useState<NonNullable<typeof widgets>[0] | null>(null);
  const [widgetForm, setWidgetForm] = useState<WidgetFormData>(defaultWidgetForm);
  
  const handleEditWidget = (widget: NonNullable<typeof widgets>[0]) => {
    setEditingWidget(widget);
    setWidgetForm({
      name: widget.name,
      invoiceId: widget.invoiceId,
      planId: widget.planId,
      minConnections: widget.minConnections,
      maxConnections: widget.maxConnections,
      isActive: widget.isActive
    });
  };
  
  const handleSaveWidget = () => {
    if (!widgetForm.name) {
      toast.error("Widget name is required");
      return;
    }
    if (!widgetForm.invoiceId) {
      toast.error("Invoice ID is required");
      return;
    }
    if (!widgetForm.planId) {
      toast.error("Please select a plan");
      return;
    }
    
    const data = {
      name: widgetForm.name,
      invoiceId: widgetForm.invoiceId,
      planId: widgetForm.planId,
      minConnections: widgetForm.minConnections,
      maxConnections: widgetForm.maxConnections,
      isActive: widgetForm.isActive
    };
    
    if (editingWidget) {
      updateWidget.mutate({ id: editingWidget.id, ...data });
    } else {
      createWidget.mutate(data);
    }
  };
  
  const handleDeleteWidget = () => {
    if (deletingWidget) {
      deleteWidget.mutate({ id: deletingWidget.id });
    }
  };
  
  const getPlanName = (planId: number) => {
    return plans?.find(p => p.id === planId)?.name || `Plan #${planId}`;
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Payment Widgets</h1>
            <p className="text-muted-foreground">Configure NowPayments crypto widgets per plan</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Widget
          </Button>
        </div>
        
        {/* Info Card */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Bitcoin className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-600 dark:text-amber-400">NowPayments Integration</p>
                <p className="text-muted-foreground mt-1">
                  Create widgets for different plans and connection ranges. Paste the iframe code from your 
                  NowPayments dashboard. Each widget can be assigned to a specific plan and connection range.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Widgets Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Payment Widgets</CardTitle>
            <CardDescription>Crypto payment widgets for subscription plans</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : !widgets || widgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bitcoin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No payment widgets configured</p>
                <Button variant="link" onClick={() => setShowCreateDialog(true)}>
                  Add your first widget
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Widget</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Connections</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {widgets.map(widget => (
                      <TableRow key={widget.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                              <Bitcoin className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                              <div className="font-medium">{widget.name}</div>
                              <div className="text-sm text-muted-foreground">
                                NowPayments Widget
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanName(widget.planId)}</TableCell>
                        <TableCell>
                          {widget.minConnections} - {widget.maxConnections}
                        </TableCell>
                        <TableCell>
                          {widget.isActive ? (
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
                              <DropdownMenuItem onClick={() => setPreviewWidget(widget)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditWidget(widget)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletingWidget(widget)}
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
          open={showCreateDialog || !!editingWidget} 
          onOpenChange={() => {
            setShowCreateDialog(false);
            setEditingWidget(null);
            setWidgetForm(defaultWidgetForm);
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingWidget ? "Edit Payment Widget" : "Add Payment Widget"}</DialogTitle>
              <DialogDescription>
                Configure a NowPayments widget for crypto payments
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Widget Name</Label>
                <Input
                  value={widgetForm.name}
                  onChange={(e) => setWidgetForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Monthly Plan - 1-3 Connections"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Assign to Plan</Label>
                <Select 
                  value={widgetForm.planId?.toString() || ""} 
                  onValueChange={(v) => setWidgetForm(prev => ({ ...prev, planId: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans?.map(plan => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Min Connections</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={widgetForm.minConnections}
                    onChange={(e) => setWidgetForm(prev => ({ ...prev, minConnections: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Connections</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={widgetForm.maxConnections}
                    onChange={(e) => setWidgetForm(prev => ({ ...prev, maxConnections: parseInt(e.target.value) || 10 }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>NowPayments Invoice ID</Label>
                <Input
                  value={widgetForm.invoiceId}
                  onChange={(e) => setWidgetForm(prev => ({ ...prev, invoiceId: e.target.value }))}
                  placeholder='Enter the invoice ID (iid) from NowPayments, e.g., 4315608458'
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Paste the complete iframe code from NowPayments dashboard
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={widgetForm.isActive}
                  onCheckedChange={(checked) => setWidgetForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingWidget(null);
                  setWidgetForm(defaultWidgetForm);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveWidget}
                disabled={createWidget.isPending || updateWidget.isPending}
              >
                {createWidget.isPending || updateWidget.isPending 
                  ? "Saving..." 
                  : editingWidget ? "Update" : "Create"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Preview Dialog */}
        <Dialog open={!!previewWidget} onOpenChange={() => setPreviewWidget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Widget Preview</DialogTitle>
              <DialogDescription>
                {previewWidget?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {previewWidget && (
                <iframe 
                  src={`https://nowpayments.io/embeds/payment-widget?iid=${previewWidget.invoiceId}`}
                  width="410"
                  height="696"
                  frameBorder="0"
                  scrolling="no"
                  style={{ overflowY: 'hidden' }}
                  className="mx-auto rounded-lg border"
                >
                  Can't load widget
                </iframe>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingWidget} onOpenChange={() => setDeletingWidget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Payment Widget</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingWidget?.name}"? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingWidget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteWidget} disabled={deleteWidget.isPending}>
                {deleteWidget.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
