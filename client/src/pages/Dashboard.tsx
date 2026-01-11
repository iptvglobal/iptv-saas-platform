import UserLayout from "@/components/UserLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { toast } from "sonner";
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
  BookOpen,
  Copy,
  Server,
  User,
  Lock,
  Link as LinkIcon,
  FileText,
  AlertCircle
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
  const expiredCredentials = credentials?.filter(c => !c.isActive).length || 0;
  
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 shrink-0"
      onClick={() => copyToClipboard(text, label)}
    >
      <Copy className="h-4 w-4" />
    </Button>
  );

  const CredentialField = ({ 
    icon: Icon, 
    label, 
    value, 
    copyLabel 
  }: { 
    icon: React.ElementType; 
    label: string; 
    value: string; 
    copyLabel: string;
  }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3 min-w-0">
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-mono text-sm truncate">{value}</div>
        </div>
      </div>
      <CopyButton text={value} label={copyLabel} />
    </div>
  );

  const CredentialCard = ({ credential }: { credential: NonNullable<typeof credentials>[0] }) => {
    const isExpired = credential.expiresAt && new Date(credential.expiresAt) < new Date();
    
    return (
      <Card className={`card-hover ${!credential.isActive || isExpired ? "opacity-60" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Connection {credential.connectionNumber}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {credential.credentialType.toUpperCase()}
                  </Badge>
                </CardDescription>
              </div>
            </div>
            {credential.isActive && !isExpired ? (
              <Badge className="badge-verified gap-1">
                <CheckCircle className="h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge className="badge-rejected gap-1">
                <AlertCircle className="h-3 w-3" />
                {isExpired ? "Expired" : "Inactive"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Xtream Codes / Combined */}
          {(credential.credentialType === "xtream" || credential.credentialType === "combined") && (
            <>
              {credential.serverUrl && (
                <CredentialField 
                  icon={Server} 
                  label="Server URL" 
                  value={credential.serverUrl} 
                  copyLabel="Server URL"
                />
              )}
              {credential.username && (
                <CredentialField 
                  icon={User} 
                  label="Username" 
                  value={credential.username} 
                  copyLabel="Username"
                />
              )}
              {credential.password && (
                <CredentialField 
                  icon={Lock} 
                  label="Password" 
                  value={credential.password} 
                  copyLabel="Password"
                />
              )}
            </>
          )}
          
          {/* M3U / Combined */}
          {(credential.credentialType === "m3u" || credential.credentialType === "combined") && (
            <>
              {credential.m3uUrl && (
                <CredentialField 
                  icon={LinkIcon} 
                  label="M3U URL" 
                  value={credential.m3uUrl} 
                  copyLabel="M3U URL"
                />
              )}
              {credential.epgUrl && (
                <CredentialField 
                  icon={FileText} 
                  label="EPG URL" 
                  value={credential.epgUrl} 
                  copyLabel="EPG URL"
                />
              )}
            </>
          )}
          
          {/* Portal */}
          {credential.credentialType === "portal" && (
            <>
              {credential.portalUrl && (
                <CredentialField 
                  icon={Tv} 
                  label="Portal URL" 
                  value={credential.portalUrl} 
                  copyLabel="Portal URL"
                />
              )}
              {credential.macAddress && (
                <CredentialField 
                  icon={Server} 
                  label="MAC Address" 
                  value={credential.macAddress} 
                  copyLabel="MAC Address"
                />
              )}
            </>
          )}
          
          {/* Expiry */}
          {credential.expiresAt && (
            <div className="flex items-center gap-2 pt-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {isExpired ? "Expired on " : "Expires on "}
                {format(new Date(credential.expiresAt), "MMM d, yyyy")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
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
              
              <a
                href="https://revsfr.com/iptv-guide/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Setup Guide</div>
                      <div className="text-xs text-muted-foreground">Learn how to use your credentials</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
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

        {/* Credentials Section - Moved from Credentials page */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">My Credentials</h2>
              <p className="text-muted-foreground">Access your IPTV login information</p>
            </div>
            <Link href="/plans">
              <Button className="gradient-primary gap-2">
                <Key className="h-4 w-4" />
                Get More Connections
              </Button>
            </Link>
          </div>

          {/* Credentials Stats */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{activeCredentials}</div>
                  <div className="text-sm text-muted-foreground">Active Connections</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{expiredCredentials}</div>
                  <div className="text-sm text-muted-foreground">Expired/Inactive</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Credentials Tabs */}
          {!credentials || credentials.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Key className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold mb-2">No Credentials Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  You don't have any IPTV credentials yet. Purchase a plan to get started.
                </p>
                <Link href="/plans">
                  <Button>Browse Plans</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="active" className="w-full">
              <TabsList>
                <TabsTrigger value="active">Active ({activeCredentials})</TabsTrigger>
                <TabsTrigger value="expired">Expired ({expiredCredentials})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-4">
                {activeCredentials === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No active credentials
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {credentials.filter(c => c.isActive).map(cred => (
                      <CredentialCard key={cred.id} credential={cred} />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="expired" className="mt-4">
                {expiredCredentials === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No expired credentials
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {credentials.filter(c => !c.isActive).map(cred => (
                      <CredentialCard key={cred.id} credential={cred} />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Help Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use Your Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <strong className="text-foreground">Xtream Codes:</strong> Enter the Server URL, Username, and Password in your IPTV app's Xtream Codes section.
              </div>
              <div>
                <strong className="text-foreground">M3U:</strong> Copy the M3U URL and paste it into your IPTV player. Add the EPG URL for program guide.
              </div>
              <div>
                <strong className="text-foreground">Portal:</strong> Enter the Portal URL and MAC Address in your STB Emulator or similar app.
              </div>
              <div className="pt-2">
                Need help? <a href="https://members.iptvtop.live/chat" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Contact our support team</a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
}
