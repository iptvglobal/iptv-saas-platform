import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  Key, 
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Search,
  User
} from "lucide-react";

type CredentialFormData = {
  userId: number | null;
  orderId: number | null;
  connectionNumber: number;
  credentialType: "xtream" | "m3u" | "portal" | "combined";
  serverUrl: string;
  username: string;
  password: string;
  m3uUrl: string;
  epgUrl: string;
  portalUrl: string;
  macAddress: string;
  expiresAt: string;
  isActive: boolean;
};

const defaultCredentialForm: CredentialFormData = {
  userId: null,
  orderId: null,
  connectionNumber: 1,
  credentialType: "combined",
  serverUrl: "",
  username: "",
  password: "",
  m3uUrl: "",
  epgUrl: "",
  portalUrl: "",
  macAddress: "",
  expiresAt: "",
  isActive: true
};

export default function AdminCredentials() {
  const utils = trpc.useUtils();
  const { data: credentials, isLoading } = trpc.credentials.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  const { data: orders } = trpc.orders.list.useQuery({ status: "verified" });
  
  const createCredential = trpc.credentials.create.useMutation({
    onSuccess: () => {
      utils.credentials.list.invalidate();
      toast.success("Credential created");
      setShowCreateDialog(false);
      setCredentialForm(defaultCredentialForm);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create credential");
    }
  });
  
  const updateCredential = trpc.credentials.update.useMutation({
    onSuccess: () => {
      utils.credentials.list.invalidate();
      toast.success("Credential updated");
      setEditingCredential(null);
      setCredentialForm(defaultCredentialForm);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update credential");
    }
  });
  
  const deleteCredential = trpc.credentials.delete.useMutation({
    onSuccess: () => {
      utils.credentials.list.invalidate();
      toast.success("Credential deleted");
      setDeletingCredential(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete credential");
    }
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCredential, setEditingCredential] = useState<NonNullable<typeof credentials>[0] | null>(null);
  const [deletingCredential, setDeletingCredential] = useState<NonNullable<typeof credentials>[0] | null>(null);
  const [credentialForm, setCredentialForm] = useState<CredentialFormData>(defaultCredentialForm);
  
  const filteredCredentials = credentials?.filter(c => {
    if (!searchQuery) return true;
    const userName = getUserName(c.userId);
    return userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           c.id.toString().includes(searchQuery);
  }) || [];
  
  const getUserName = (userId: number) => {
    const user = users?.find(u => u.id === userId);
    return user?.name || user?.email || `User #${userId}`;
  };
  
  const handleEditCredential = (credential: NonNullable<typeof credentials>[0]) => {
    setEditingCredential(credential);
    setCredentialForm({
      userId: credential.userId,
      orderId: credential.orderId,
      connectionNumber: credential.connectionNumber,
      credentialType: credential.credentialType,
      serverUrl: credential.serverUrl || "",
      username: credential.username || "",
      password: credential.password || "",
      m3uUrl: credential.m3uUrl || "",
      epgUrl: credential.epgUrl || "",
      portalUrl: credential.portalUrl || "",
      macAddress: credential.macAddress || "",
      expiresAt: credential.expiresAt ? new Date(credential.expiresAt).toISOString().split("T")[0] : "",
      isActive: credential.isActive
    });
  };
  
  const handleSaveCredential = () => {
    if (!credentialForm.userId) {
      toast.error("Please select a user");
      return;
    }
    if (!credentialForm.orderId) {
      toast.error("Please select an order");
      return;
    }
    
    const data = {
      userId: credentialForm.userId,
      orderId: credentialForm.orderId,
      connectionNumber: credentialForm.connectionNumber,
      credentialType: credentialForm.credentialType,
      serverUrl: credentialForm.serverUrl || undefined,
      username: credentialForm.username || undefined,
      password: credentialForm.password || undefined,
      m3uUrl: credentialForm.m3uUrl || undefined,
      epgUrl: credentialForm.epgUrl || undefined,
      portalUrl: credentialForm.portalUrl || undefined,
      macAddress: credentialForm.macAddress || undefined,
      expiresAt: credentialForm.expiresAt ? new Date(credentialForm.expiresAt) : undefined,
      isActive: credentialForm.isActive
    };
    
    if (editingCredential) {
      updateCredential.mutate({ id: editingCredential.id, ...data });
    } else {
      createCredential.mutate(data);
    }
  };
  
  const handleDeleteCredential = () => {
    if (deletingCredential) {
      deleteCredential.mutate({ id: deletingCredential.id });
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">IPTV Credentials</h1>
            <p className="text-muted-foreground">Manage user IPTV access credentials</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Credential
          </Button>
        </div>
        
        {/* Credentials Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>All Credentials</CardTitle>
                <CardDescription>User IPTV login information</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user..."
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
            ) : filteredCredentials.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No credentials found</p>
                <Button variant="link" onClick={() => setShowCreateDialog(true)}>
                  Add your first credential
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Connection</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCredentials.map(credential => (
                      <TableRow key={credential.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{getUserName(credential.userId)}</div>
                              <div className="text-xs text-muted-foreground">
                                Order #{credential.orderId}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>#{credential.connectionNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="uppercase">
                            {credential.credentialType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {credential.expiresAt 
                            ? format(new Date(credential.expiresAt), "MMM d, yyyy")
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {credential.isActive ? (
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
                              <DropdownMenuItem onClick={() => handleEditCredential(credential)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setDeletingCredential(credential)}
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
          open={showCreateDialog || !!editingCredential} 
          onOpenChange={() => {
            setShowCreateDialog(false);
            setEditingCredential(null);
            setCredentialForm(defaultCredentialForm);
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCredential ? "Edit Credential" : "Add Credential"}</DialogTitle>
              <DialogDescription>
                Configure IPTV access credentials for a user
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>User</Label>
                  <Select 
                    value={credentialForm.userId?.toString() || ""} 
                    onValueChange={(v) => setCredentialForm(prev => ({ ...prev, userId: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Order (Verified)</Label>
                  <Select 
                    value={credentialForm.orderId?.toString() || ""} 
                    onValueChange={(v) => setCredentialForm(prev => ({ ...prev, orderId: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select order" />
                    </SelectTrigger>
                    <SelectContent>
                      {orders?.filter(o => !credentialForm.userId || o.userId === credentialForm.userId).map(order => (
                        <SelectItem key={order.id} value={order.id.toString()}>
                          Order #{order.id} - {order.connections} connections
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Connection Number</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={credentialForm.connectionNumber}
                    onChange={(e) => setCredentialForm(prev => ({ ...prev, connectionNumber: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Credential Type</Label>
                  <Select 
                    value={credentialForm.credentialType} 
                    onValueChange={(v) => setCredentialForm(prev => ({ ...prev, credentialType: v as "xtream" | "m3u" | "portal" | "combined" }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xtream">Xtream Codes</SelectItem>
                      <SelectItem value="m3u">M3U + EPG</SelectItem>
                      <SelectItem value="portal">Portal URL</SelectItem>
                      <SelectItem value="combined">Combined (Xtream + M3U + EPG)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Combined / Xtream Fields */}
              {(credentialForm.credentialType === "xtream" || credentialForm.credentialType === "combined") && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-medium">Xtream Codes Details</h4>
                  <div className="space-y-2">
                    <Label>Server URL</Label>
                    <Input
                      value={credentialForm.serverUrl}
                      onChange={(e) => setCredentialForm(prev => ({ ...prev, serverUrl: e.target.value }))}
                      placeholder="http://server.example.com:8080"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      value={credentialForm.username}
                      onChange={(e) => setCredentialForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      value={credentialForm.password}
                      onChange={(e) => setCredentialForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="password"
                    />
                  </div>
                </div>
              )}
              
              {/* M3U Fields */}
              {(credentialForm.credentialType === "m3u" || credentialForm.credentialType === "combined") && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-medium">M3U Details</h4>
                  <div className="space-y-2">
                    <Label>M3U URL</Label>
                    <Input
                      value={credentialForm.m3uUrl}
                      onChange={(e) => setCredentialForm(prev => ({ ...prev, m3uUrl: e.target.value }))}
                      placeholder="http://server.example.com/get.php?username=...&password=...&type=m3u_plus&output=ts"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>EPG URL</Label>
                    <Input
                      value={credentialForm.epgUrl}
                      onChange={(e) => setCredentialForm(prev => ({ ...prev, epgUrl: e.target.value }))}
                      placeholder="http://server.example.com/xmltv.php?username=...&password=..."
                    />
                  </div>
                </div>
              )}
              
              {/* Portal Fields */}
              {credentialForm.credentialType === "portal" && (
                <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-medium">Portal Details</h4>
                  <div className="space-y-2">
                    <Label>Portal URL</Label>
                    <Input
                      value={credentialForm.portalUrl}
                      onChange={(e) => setCredentialForm(prev => ({ ...prev, portalUrl: e.target.value }))}
                      placeholder="http://portal.example.com/c/"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>MAC Address</Label>
                    <Input
                      value={credentialForm.macAddress}
                      onChange={(e) => setCredentialForm(prev => ({ ...prev, macAddress: e.target.value }))}
                      placeholder="00:1A:79:XX:XX:XX"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Expires At</Label>
                  <Input
                    type="date"
                    value={credentialForm.expiresAt}
                    onChange={(e) => setCredentialForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-8">
                  <Switch
                    checked={credentialForm.isActive}
                    onCheckedChange={(checked) => setCredentialForm(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label>Active</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateDialog(false);
                  setEditingCredential(null);
                  setCredentialForm(defaultCredentialForm);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveCredential}
                disabled={createCredential.isPending || updateCredential.isPending}
              >
                {createCredential.isPending || updateCredential.isPending 
                  ? "Saving..." 
                  : editingCredential ? "Update" : "Create"
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deletingCredential} onOpenChange={() => setDeletingCredential(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Credential</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this credential? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingCredential(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteCredential} disabled={deleteCredential.isPending}>
                {deleteCredential.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
