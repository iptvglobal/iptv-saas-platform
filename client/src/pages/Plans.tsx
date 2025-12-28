import UserLayout from "@/components/UserLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState } from "react";
import { 
  Check, 
  Tv, 
  Zap,
  Globe,
  Clock,
  Users
} from "lucide-react";

export default function Plans() {
  const { data: plans, isLoading } = trpc.plans.list.useQuery({ activeOnly: true });
  const [selectedConnections, setSelectedConnections] = useState<Record<number, number>>({});
  
  const getPrice = (plan: NonNullable<typeof plans>[0], connections: number) => {
    const pricing = plan.pricing?.find(p => p.connections === connections);
    return pricing?.price || "0.00";
  };
  
  const getConnections = (planId: number, maxConnections: number) => {
    return selectedConnections[planId] || 1;
  };
  
  const handleConnectionChange = (planId: number, value: number[]) => {
    setSelectedConnections(prev => ({
      ...prev,
      [planId]: value[0]
    }));
  };
  
  if (isLoading) {
    return (
      <UserLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Subscription Plans</h1>
            <p className="text-muted-foreground">Choose the perfect plan for your needs</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-96 rounded-xl" />
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
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Select the number of connections you need. All plans include premium channels, 
            HD quality, and 24/7 support.
          </p>
        </div>
        
        {/* Features Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Tv className="h-4 w-4 text-primary" />
            </div>
            <span>10,000+ Channels</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span>HD & 4K Quality</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <span>Global Content</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-full bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <span>24/7 Support</span>
          </div>
        </div>
        
        {/* Plans Grid */}
        {!plans || plans.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <Tv className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold mb-2">No Plans Available</h3>
              <p className="text-muted-foreground text-sm">
                Please check back later or contact support for assistance.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const connections = getConnections(plan.id, plan.maxConnections);
              const price = getPrice(plan, connections);
              const isPopular = index === 1;
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative card-hover ${isPopular ? "border-primary shadow-lg shadow-primary/10" : ""}`}
                >
                  {plan.promoText && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-red-500 hover:bg-red-600 text-white">{plan.promoText}</Badge>
                    </div>
                  )}                 
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Price Display */}
                    <div className="text-center">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-muted-foreground">/{plan.durationDays} days</span>
                      </div>
                    </div>
                    
                    {/* Connection Slider */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Connections</span>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-bold text-primary">{connections}</span>
                        </div>
                      </div>
                      <Slider
                        value={[connections]}
                        onValueChange={(value) => handleConnectionChange(plan.id, value)}
                        min={1}
                        max={plan.maxConnections}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>1</span>
                        <span>{plan.maxConnections}</span>
                      </div>
                    </div>
                    
                    {/* Features */}
                    <div className="space-y-2">
                      {(plan.features as string[] || []).map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{connections} simultaneous {connections === 1 ? "device" : "devices"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span>{plan.durationDays} days validity</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Link 
                      href={`/checkout/${plan.id}?connections=${connections}`}
                      className="w-full"
                    >
                      <Button 
                        className={`w-full ${isPopular ? "gradient-primary" : ""}`}
                        variant={isPopular ? "default" : "outline"}
                      >
                        Select Plan
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* FAQ or Info Section */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-lg">Need Help Choosing?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>1 Connection:</strong> Perfect for individual use on a single device.
            </p>
            <p>
              <strong>2-4 Connections:</strong> Ideal for couples or small families.
            </p>
            <p>
              <strong>5+ Connections:</strong> Best for large families or sharing with friends.
            </p>
            <p className="pt-2">
              All plans support Smart TVs, Android boxes, iOS, Windows, and more. 
              Contact our support team if you need assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
