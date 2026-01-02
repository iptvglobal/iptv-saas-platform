import UserLayout from "@/components/UserLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  Key, 
  Copy, 
  Server,
  User,
  Lock,
  Link as LinkIcon,
  FileText,
  Tv,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen
} from "lucide-react";

export default function Credentials() {
  const { data: credentials, isLoading } = trpc.credentials.myCredentials.useQuery();
  
  const activeCredentials = credentials?.filter(c => c.isActive) || [];
  const expiredCredentials = credentials?.filter(c => !c.isActive) || [];
  
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
  
  if (isLoading) {
    return (
      <UserLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">My Credentials</h1>
            <p className="text-muted-foreground">Your IPTV login information</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map(i => (
              <div key={i} className="skeleton h-64 rounded-xl" />
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
            <h1 className="text-2xl font-bold">My Credentials</h1>
            <p className="text-muted-foreground">Access your IPTV login information</p>
          </div>
<div className="flex flex-wrap gap-3">
  {/* Get More Connections */}
  <Link href="/plans">
    <Button className="gradient-primary gap-2">
      <Key className="h-4 w-4" />
      Get More Connections
    </Button>
  </Link>

  {/* Tutorial Button */}
  <a
    href="https://revsfr.com/iptv-guide/"
    target="_blank"
    rel="noopener noreferrer"
  >
    <Button
      variant="outline"
      className="gap-2 border-blue-500 text-blue-600 hover:bg-blue-50"
    >
      <BookOpen className="h-4 w-4" />
      Tutorial
    </Button>
  </a>
</div>

        </div>
        
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeCredentials.length}</div>
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
                <div className="text-2xl font-bold">{expiredCredentials.length}</div>
                <div className="text-sm text-muted-foreground">Expired/Inactive</div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Credentials */}
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
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active ({activeCredentials.length})</TabsTrigger>
              <TabsTrigger value="expired">Expired ({expiredCredentials.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              {activeCredentials.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No active credentials
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {activeCredentials.map(cred => (
                    <CredentialCard key={cred.id} credential={cred} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="expired" className="mt-4">
              {expiredCredentials.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No expired credentials
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {expiredCredentials.map(cred => (
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
              Need help? <Link href="/chat" className="text-primary hover:underline">Contact our support team</Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
