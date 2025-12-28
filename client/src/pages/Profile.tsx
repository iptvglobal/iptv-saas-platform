import UserLayout from "@/components/UserLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/_core/hooks/useAuth";
import { format } from "date-fns";
import { 
  User, 
  Mail, 
  Calendar,
  Shield,
  Clock
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  
  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <h1 className="text-2xl font-bold">{user?.name || "User"}</h1>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge className="mt-2" variant="outline">
                {user?.role?.toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{user?.name || "Not set"}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{user?.email || "Not set"}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <div className="font-medium capitalize">{user?.role || "User"}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Member Since</div>
                <div className="font-medium">
                  {user?.createdAt 
                    ? format(new Date(user.createdAt), "MMMM d, yyyy")
                    : "Unknown"
                  }
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Sign In</div>
                <div className="font-medium">
                  {user?.lastSignedIn 
                    ? format(new Date(user.lastSignedIn), "MMMM d, yyyy 'at' h:mm a")
                    : "Unknown"
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Help */}
        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
            <CardDescription>Contact our support team for assistance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If you need to update your account information or have any questions, 
              please contact our support team through the chat feature.
            </p>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
