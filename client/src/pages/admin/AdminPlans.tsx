import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Package, 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  DollarSign
} from "lucide-react";

type PlanFormData = {
  name: string;
  description: string;
  durationDays: number;
  maxConnections: number;
  features: string;
  promoText: string;
  isActive: boolean;
  pricing: { connections: number; price: string }[];
};

const defaultPlanForm: PlanFormData = {
  name: "",
  description: "",
  durationDays: 30,
  maxConnections: 10,
  features: "",
  promoText: "",
  isActive: true,
  pricing: Array.from({ length: 10 }, (_, i) => ({ connections: i + 1, price: "" }))
};

export default function AdminPlans() {
  const utils = trpc.useUtils();
  const { data: plans, isLoading } = trpc.plans.list.useQuery();
  
  const createPlan = trpc.plans.create.useMutation({
    onSuccess: () => {
      utils.plans.list.invalidate();
      toast.success("Plan created successfully");
      setShowCreateDialog(false);
      setPlanForm(defaultPlanForm);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create plan");
    }
  });
  
  const updatePlan = trpc.plans.update.useMutation({
    onSuccess: () => {
      utils.plans.list.invalidate();
      toast.success("Plan updated successfully");
      setEditingPlan(null);
      setPlanForm(defaultPlanForm);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update plan");
    }
  });
  
  const deletePlan = trpc.plans.delete.useMutation({
    onSuccess: () => {
      utils.plans.list.invalidate();
      toast.success("Plan deleted");
      setDeletingPlan(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete plan");
    }
  });
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<NonNullable<typeof plans>[0] | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<NonNullable<typeof plans>[0] | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormData>(defaultPlanForm);
  
  const handleEditPlan = (plan: NonNullable<typeof plans>[0]) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || "",
      durationDays: plan.durationDays,
      maxConnections: plan.maxConnections,
      features: (plan.features as string[] || []).join("\n"),
      promoText: plan.promoText || "",
      isActive: plan.isActive,
      pricing: Array.from({ length: 10 }, (_, i) => {
        const existing = plan.pricing?.find(p => p.connections === i + 1);
        return { connections: i + 1, price: existing?.price || "" };
      })
    });
  };
  
  const handleSavePlan = () => {
    const features = planForm.features.split("\n").filter(f => f.trim());
    const pricing = planForm.pricing.filter(p => p.price && parseFloat(p.price) > 0);
    
    if (!planForm.name) {
      toast.error("Plan name is required");
      return;
    }
    
    if (pricing.length === 0) {
      toast.error("At least one price is required");
      return;
    }
    
    const data = {
      name: planForm.name,
      description: planForm.description,
      durationDays: planForm.durationDays,
      maxConnections: planForm.maxConnections,
      features,
      promoText: planForm.promoText || null,
      isActive: planForm.isActive,
      pricing
    };
    
    if (editingPlan) {
      updatePlan.mutate({ id: editingPlan.id, ...data });
    } else {
      createPlan.mutate(data);
    }
  };
  
  const handleDeletePlan = () => {
    if (deletingPlan) {
      deletePlan.mutate({ id: deletingPlan.id });
    }
  };
  
  const updatePricing = (index: number, price: string) => {
    setPlanForm(prev => ({
      ...prev,
      pricing: prev.pricing.map((p, i) => i === index ? { ...p, price } : p)
    }));
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Subscription Plans</h1>
            <p className="text-muted-foreground">Manage pricing and features</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Plan
          </Button>
        </div>
        
        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Plans</CardTitle>
            <CardDescription>Configure subscription plans and pricing</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : !plans || plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No plans created yet</p>
                <Button variant="link" onClick={() => setShowCreateDialog(true)}>
                  Create your first plan
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Max Connections</TableHead>
                      <TableHead>Price Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map(plan => {
                      const prices = plan.pricing?.map(p => parseFloat(p.price)) || [];
                      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
                      
                      return (
                        <TableRow key={plan.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <Package className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{plan.name}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {plan.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{plan.durationDays} days</TableCell>
                          <TableCell>{plan.maxConnections}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              {minPrice === maxPrice 
                                ? `${minPrice.toFixed(2)}`
                                : `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`
                              }
                            </div>
                          </TableCell>
                          <TableCell>
                            {plan.isActive ? (
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
                                <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Plan
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => setDeletingPlan(plan)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Plan
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Create/Edit Plan Dialog */}
        <Dialog 
          open={showCreateDialog || !!editingPlan} 
          onOpenChange={() => {
            setShowCreateDialog(false);
            setEditingPlan(null);
            setPlanForm(defaultPlanForm);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
              <DialogDescription>
                Configure plan details and pricing per connection
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plan Name</Label>
                  <Input
                    value={planForm.name}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Monthly Premium"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration (days)</Label>
                  <Input
                    type="number"
                    value={planForm.durationDays}
                    onChange={(e) => setPlanForm(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 30 }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={planForm.description}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this plan"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Features (one per line)</Label>
                <Textarea
                  value={planForm.features}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, features: e.target.value }))}
                  placeholder="HD Quality&#10;24/7 Support&#10;10,000+ Channels"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Promotional Badge (optional)</Label>
                <Input
                  value={planForm.promoText}
                  onChange={(e) => setPlanForm(prev => ({ ...prev, promoText: e.target.value }))}
                  placeholder="e.g., Free Premium Player, Best Value, Most Popular"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">Leave blank to hide the promotional badge</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={planForm.isActive}
                  onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Active (visible to users)</Label>
              </div>
              
              {/* Pricing Grid */}
              <div className="space-y-3">
                <Label>Pricing per Connection</Label>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
                  {planForm.pricing.map((p, i) => (
                    <div key={i} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        {p.connections} {p.connections === 1 ? "connection" : "connections"}
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={p.price}
                          onChange={(e) => updatePricing(i, e.target.value)}
                          placeholder="0.00"
                          className="pl-7"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty for connections you don't want to offer
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingPlan(null);
                  setPlanForm(defaultPlanForm);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSavePlan}
                disabled={createPlan.isPending || updatePlan.isPending}
              >
                {createPlan.isPending || updatePlan.isPending 
                  ? "Saving..." 
                  : editingPlan ? "Update Plan" : "Create Plan"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingPlan} onOpenChange={() => setDeletingPlan(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Plan</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingPlan?.name}"? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingPlan(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeletePlan} disabled={deletePlan.isPending}>
                {deletePlan.isPending ? "Deleting..." : "Delete Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
