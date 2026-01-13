import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Send,
  Settings,
  Server,
  Key,
  User,
  Globe
} from "lucide-react";

interface DiagnosticResult {
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface DiagnosticReport {
  timestamp: string;
  environment: {
    brevoApiKey: DiagnosticResult;
    brevoSenderEmail: DiagnosticResult;
    brevoSenderName: DiagnosticResult;
    adminNotificationEmail: DiagnosticResult;
    appUrl: DiagnosticResult;
  };
  apiConnection: DiagnosticResult;
  recommendations: string[];
}

export default function AdminEmailSettings() {
  const [testEmail, setTestEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const { data: diagnostic, isLoading, refetch } = trpc.email.diagnostic.useQuery();
  const sendTestMutation = trpc.email.sendTest.useMutation();
  
  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    setIsSending(true);
    try {
      const result = await sendTestMutation.mutateAsync({ to: testEmail });
      if (result.success) {
        toast.success("Test email sent successfully!");
      } else {
        toast.error(result.error || "Failed to send test email");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send test email");
    } finally {
      setIsSending(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">Configured</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500 text-black">Optional</Badge>;
      case 'error':
        return <Badge variant="destructive">Missing</Badge>;
      default:
        return null;
    }
  };
  
  const getEnvIcon = (key: string) => {
    if (key.includes('Key')) return <Key className="h-4 w-4" />;
    if (key.includes('Email')) return <Mail className="h-4 w-4" />;
    if (key.includes('Name')) return <User className="h-4 w-4" />;
    if (key.includes('Url')) return <Globe className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Settings</h1>
          <p className="text-muted-foreground mt-1">
            Diagnose and test your email configuration
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* API Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            API Connection
          </CardTitle>
          <CardDescription>
            Brevo (Sendinblue) email service connection status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking connection...
            </div>
          ) : diagnostic ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(diagnostic.apiConnection.status)}
                <div>
                  <p className="font-medium">{diagnostic.apiConnection.message}</p>
                  {diagnostic.apiConnection.details?.email && (
                    <p className="text-sm text-muted-foreground">
                      Account: {diagnostic.apiConnection.details.email}
                    </p>
                  )}
                  {diagnostic.apiConnection.details?.error && (
                    <p className="text-sm text-red-500">
                      Error: {diagnostic.apiConnection.details.error}
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(diagnostic.apiConnection.status)}
            </div>
          ) : (
            <p className="text-muted-foreground">Unable to load diagnostic data</p>
          )}
        </CardContent>
      </Card>
      
      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Variables
          </CardTitle>
          <CardDescription>
            Required and optional configuration for email service
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading configuration...
            </div>
          ) : diagnostic ? (
            <div className="space-y-4">
              {Object.entries(diagnostic.environment).map(([key, result]) => (
                <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {getEnvIcon(key)}
                    <div>
                      <p className="font-medium">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </p>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                      {result.details?.value && (
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {result.details.value}
                        </code>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Unable to load configuration</p>
          )}
        </CardContent>
      </Card>
      
      {/* Recommendations */}
      {diagnostic && diagnostic.recommendations.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {diagnostic.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-600 font-bold">{index + 1}.</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {/* Send Test Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Test Email
          </CardTitle>
          <CardDescription>
            Send a test email to verify your configuration is working
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="testEmail" className="sr-only">Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="Enter email address"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={isSending}
              />
            </div>
            <Button 
              onClick={handleSendTest}
              disabled={isSending || !testEmail}
            >
              {isSending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            A test email will be sent to verify the Brevo configuration is working correctly.
          </p>
        </CardContent>
      </Card>
      
      {/* Last Check Timestamp */}
      {diagnostic && (
        <p className="text-sm text-muted-foreground text-center">
          Last checked: {new Date(diagnostic.timestamp).toLocaleString()}
        </p>
      )}
    </div>
  );
}
