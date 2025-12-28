import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { format } from "date-fns";
import { 
  Activity, 
  Search,
  User,
  ShoppingCart,
  Key,
  CreditCard,
  Settings
} from "lucide-react";

export default function AdminLogs() {
  const { data: logs, isLoading } = trpc.activityLogs.list.useQuery();
  const { data: users } = trpc.users.list.useQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  
  const getUserName = (userId: number | null) => {
    if (!userId) return "System";
    const user = users?.find(u => u.id === userId);
    return user?.name || user?.email || `User #${userId}`;
  };
  
  const getActionIcon = (action: string) => {
    if (action.includes("user")) return <User className="h-4 w-4" />;
    if (action.includes("order")) return <ShoppingCart className="h-4 w-4" />;
    if (action.includes("credential")) return <Key className="h-4 w-4" />;
    if (action.includes("payment")) return <CreditCard className="h-4 w-4" />;
    if (action.includes("setting")) return <Settings className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };
  
  const getActionBadge = (action: string) => {
    if (action.includes("create")) return <Badge className="badge-verified">Create</Badge>;
    if (action.includes("update")) return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Update</Badge>;
    if (action.includes("delete")) return <Badge className="badge-rejected">Delete</Badge>;
    if (action.includes("verify")) return <Badge className="badge-verified">Verify</Badge>;
    if (action.includes("reject")) return <Badge className="badge-rejected">Reject</Badge>;
    if (action.includes("login")) return <Badge variant="outline">Login</Badge>;
    return <Badge variant="outline">Action</Badge>;
  };
  
  const filteredLogs = logs?.filter(log => {
    const matchesSearch = !searchQuery || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getUserName(log.userId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterAction === "all" || log.action.includes(filterAction);
    return matchesSearch && matchesFilter;
  }) || [];
  
  const actionTypes = [
    { value: "all", label: "All Actions" },
    { value: "user", label: "User Actions" },
    { value: "order", label: "Order Actions" },
    { value: "credential", label: "Credential Actions" },
    { value: "payment", label: "Payment Actions" },
    { value: "plan", label: "Plan Actions" },
  ];
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">Monitor system activity and changes</p>
        </div>
        
        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="skeleton h-16 rounded-lg" />
                ))}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No activity logs found</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted">
                              {getActionIcon(log.action)}
                            </div>
                            <div>
                              <div className="font-medium capitalize">
                                {log.action.replace(/_/g, " ")}
                              </div>
                              {getActionBadge(log.action)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getUserName(log.userId)}</TableCell>
                        <TableCell>
                          {log.entityType && (
                            <div className="text-sm">
                              <span className="capitalize">{log.entityType}</span>
                              {log.entityId && <span className="text-muted-foreground"> #{log.entityId}</span>}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {log.details && (
                            <span className="text-sm text-muted-foreground truncate block">
                              {typeof log.details === "string" ? log.details : JSON.stringify(log.details)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
