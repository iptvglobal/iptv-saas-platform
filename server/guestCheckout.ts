import PublicLayout from "@/components/PublicLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute, Link } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  ArrowLeft, 
  CreditCard, 
  Wallet,
  CheckCircle,
  Loader2,
  ExternalLink,
  Copy,
  Bitcoin,
  Mail,
  Lock,
  User,
  Tv,
  Smartphone,
  Code
} from "lucide-react";

type CredentialsType = "xtream" | "mag" | "m3u" | "enigma2" | null;

export default function GuestCheckout() {
  const [, params] = useRoute("/order/:planId");
  const [location, setLocation] = useLocation();
  const planId = params?.planId ? parseInt(params.planId) : null;
  const { isAuthenticated, user, refresh } = useAuth();
  
  // Get connections from URL query
  const searchParams = new URLSearchParams(window.location.search);
  const connections = parseInt(searchParams.get("connections") || "1");
  
  const { data: plan, isLoading: planLoading } = trpc.plans.getById.useQuery(
    { id: planId! },
    { enabled: !!planId }
  );
  const { data: paymentMethods } = trpc.paymentMethods.getForPlan.useQuery(
    { planId: planId!, connections },
    { enabled: !!planId }
  );
  const { data: paymentWidget } = trpc.paymentWidgets.getForPlan.useQuery(
    { planId: planId!, connections },
    { enabled: !!planId }
  );
  
  // For authenticated users
  const createOrder = trpc.orders.create.useMutation();
  const confirmPayment = trpc.orders.confirmPayment.useMutation();
  
  // Guest checkout state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [orderId, setOrderId] = useState<number | null>(null);
  
  // Credentials selection state
  const [selectedCredentialsType, setSelectedCredentialsType] = useState<CredentialsType>(null);
  const [macAddress, setMacAddress] = useState("");
  const [credentialsSubmitted, setCredentialsSubmitted] = useState(false);
  
  const price = plan?.pricing?.find(p => p.connections === connections)?.price || "0.00";
  
  const selectedPaymentMethod = paymentMethods?.find(m => m.id.toString() === selectedMethod);
  const isCrypto = selectedPaymentMethod?.type === "crypto" || selectedMethod === "crypto-widget";
  
  // Countdown effect for payment confirmation
  useEffect(() => {
    if (isProcessing && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isProcessing && countdown === 0) {
      handlePaymentComplete();
    }
  }, [isProcessing, countdown]);
  
  // If user is already authenticated AND not in guest checkout flow, redirect to regular checkout
  useEffect(() => {
    if (isAuthenticated && accountCreated === false && planId) {
      setLocation(`/checkout/${planId}?connections=${connections}`);
    }
  }, [isAuthenticated, planId, connections, accountCreated]);
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  const validateMacAddress = (mac: string) => {
    // Improved MAC address validation:
    // 1. Remove all non-hex characters (colons, hyphens, spaces, etc.)
    const cleanMac = mac.replace(/[^0-9A-F]/gi, '').toUpperCase();
    // 2. Check if it's exactly 12 hex characters
    return /^[0-9A-F]{12}$/.test(cleanMac);
  };
  
  const handleGuestCheckout = async () => {
    // Validate inputs
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }
    
    setIsCreatingAccount(true);
    
    try {
      // Call the guest checkout API endpoint
      const response = await fetch("/api/guest-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: name || email.split("@")[0],
          planId: planId!,
          connections,
          price,
          paymentMethodId: selectedMethod !== "crypto-widget" ? parseInt(selectedMethod) : undefined,
          paymentWidgetId: selectedMethod === "crypto-widget" ? paymentWidget?.id : undefined,
          paymentMethodName: selectedMethod === "crypto-widget" ? "Cryptocurrency" : selectedPaymentMethod?.name,
          paymentMethodType: selectedMethod === "crypto-widget" ? "crypto" : selectedPaymentMethod?.type,
          credentialsType: selectedCredentialsType,
          macAddress: selectedCredentialsType === "mag" ? macAddress : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        toast.error(data.error || "Failed to process checkout");
        setIsCreatingAccount(false);
        return;
      }
      
      setAccountCreated(true);
      setOrderId(data.orderId);
      setCredentialsSubmitted(true);
      setShowPaymentDialog(true);
      
      // Refresh auth state to get the new session
      await refresh();
      
    } catch (error) {
      console.error("Guest checkout error:", error);
      toast.error("Failed to process checkout. Please try again.");
    } finally {
      setIsCreatingAccount(false);
    }
  };
  
  const handleAuthenticatedCheckout = async () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }
    
    try {
      const result = await createOrder.mutateAsync({
        planId: planId!,
        connections,
        price,
        paymentMethodId: selectedMethod !== "crypto-widget" ? parseInt(selectedMethod) : undefined,
        paymentWidgetId: selectedMethod === "crypto-widget" ? paymentWidget?.id : undefined,
        paymentMethodName: selectedMethod === "crypto-widget" ? "Cryptocurrency" : selectedPaymentMethod?.name,
        paymentMethodType: selectedMethod === "crypto-widget" ? "crypto" : selectedPaymentMethod?.type,
      });
      
      setOrderId(result.orderId || null);
      setShowPaymentDialog(true);
    } catch (error) {
      toast.error("Failed to create order. Please try again.");
    }
  };
  
  const handleProceedToPayment = () => {
    // Show credentials dialog if not already submitted (for both new and existing users)
    if (!credentialsSubmitted) {
      setShowCredentialsDialog(true);
      return;
    }
    
    if (isAuthenticated || accountCreated) {
      handleAuthenticatedCheckout();
    } else {
      handleGuestCheckout();
    }
  };
  
  const handleCredentialsSelection = () => {
    if (!selectedCredentialsType) {
      toast.error("Please select a credentials type");
      return;
    }
    
    if (selectedCredentialsType === "mag" && !macAddress) {
      toast.error("Please enter your MAC address");
      return;
    }
    
    if (selectedCredentialsType === "mag" && !validateMacAddress(macAddress)) {
      toast.error("Invalid MAC address. Please use format XX:XX:XX:XX:XX:XX");
      return;
    }
    
    setShowCredentialsDialog(false);
    setCredentialsSubmitted(true);
    
    // If already authenticated, proceed to authenticated checkout
    // Otherwise, proceed to guest checkout
    if (isAuthenticated) {
      handleAuthenticatedCheckout();
    } else {
      handleGuestCheckout();
    }
  };
  
  const handleConfirmPayment = () => {
    setShowPaymentDialog(false);
    setShowConfirmDialog(true);
    setIsProcessing(true);
    setCountdown(10);
  };
  
  const handlePaymentComplete = async () => {
    if (orderId) {
      try {
        await confirmPayment.mutateAsync({ orderId });
        toast.success("Payment confirmed! Your order is now pending verification.");
        
        // Redirect to orders page
        setLocation("/orders");
      } catch (error) {
        toast.error("Failed to confirm payment. Please contact support.");
      }
    }
    setIsProcessing(false);
    setShowConfirmDialog(false);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };
  
  if (planLoading || !plan) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </PublicLayout>
    );
  }
  
  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Link href="/pricing">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
        </Link>
        
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>You are purchasing {plan.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Tv className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{plan.name}</div>
                  <div className="text-sm text-muted-foreground">{connections} Connection{connections > 1 ? 's' : ''}</div>
                </div>
              </div>
              <div className="text-xl font-bold text-primary">${price}</div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Plan Features:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {plan.features?.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Guest Info / Account Creation */}
        {!isAuthenticated && !accountCreated && (
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Enter your details to create an account and track your order</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name (Optional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      className="pl-10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="john@example.com" 
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Minimum 6 characters. You'll use this to log in later.</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Select how you'd like to pay</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="grid gap-4">
              {/* Crypto Widget Option */}
              {paymentWidget && (
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="crypto-widget" id="crypto-widget" />
                  <Label htmlFor="crypto-widget" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10">
                        <Bitcoin className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <div className="font-medium">Cryptocurrency</div>
                        <div className="text-sm text-muted-foreground">Pay with Bitcoin, Ethereum, and more</div>
                      </div>
                    </div>
                  </Label>
                </div>
              )}
              
              {/* Other Payment Methods */}
              {paymentMethods?.map(method => (
                <div 
                  key={method.id}
                  className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <RadioGroupItem value={method.id.toString()} id={`method-${method.id}`} />
                  <Label htmlFor={`method-${method.id}`} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {method.type === "card" && <CreditCard className="h-5 w-5 text-primary" />}
                        {method.type === "paypal" && <Wallet className="h-5 w-5 text-blue-500" />}
                        {method.type === "crypto" && <Bitcoin className="h-5 w-5 text-amber-500" />}
                        {method.type === "custom" && <CreditCard className="h-5 w-5 text-primary" />}
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
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
        
        {/* Action Button */}
        <Button 
          className="w-full gradient-primary h-12 text-lg"
          onClick={handleProceedToPayment}
          disabled={!selectedMethod || isCreatingAccount}
        >
          {isCreatingAccount ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            "Complete Order"
          )}
        </Button>
        
        <p className="text-center text-xs text-muted-foreground">
          By completing this order, you agree to our Terms of Service and Privacy Policy.
        </p>
        
        {/* Credentials Dialog */}
        <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Select Credentials Type</DialogTitle>
              <DialogDescription>
                Choose how you want to access your IPTV service
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <RadioGroup value={selectedCredentialsType || ""} onValueChange={(v) => setSelectedCredentialsType(v as CredentialsType)}>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="xtream" id="xtream" />
                  <Label htmlFor="xtream" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <div className="font-medium">Xtream Codes</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Username, Password & Server URL</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="m3u" id="m3u" />
                  <Label htmlFor="m3u" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Tv className="h-4 w-4 text-primary" />
                      <div className="font-medium">M3U Playlist</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Playlist URL & EPG URL</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="mag" id="mag" />
                  <Label htmlFor="mag" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Tv className="h-4 w-4 text-primary" />
                      <div className="font-medium">MAG / Portal</div>
                    </div>
                    <div className="text-xs text-muted-foreground">For MAG boxes (requires MAC address)</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="enigma2" id="enigma2" />
                  <Label htmlFor="enigma2" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-primary" />
                      <div className="font-medium">Enigma2</div>
                    </div>
                    <div className="text-xs text-muted-foreground">For Enigma2 devices</div>
                  </Label>
                </div>
              </RadioGroup>
              
              {selectedCredentialsType === "mag" && (
                <div className="space-y-2 mt-2">
                  <Label htmlFor="mac">MAC Address</Label>
                  <Input
                    id="mac"
                    placeholder="XX:XX:XX:XX:XX:XX"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
                  </p>
                </div>
              )}
            </div>
            <Button onClick={handleCredentialsSelection} className="w-full gradient-primary">
              Confirm & Continue
            </Button>
          </DialogContent>
        </Dialog>
        
        {/* Payment Instructions Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Payment Instructions</DialogTitle>
              <DialogDescription>
                Please follow these steps to complete your payment
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <h4 className="font-semibold text-primary mb-2">Amount to Pay: ${price}</h4>
                <p className="text-sm text-muted-foreground">
                  Please send the exact amount to ensure your order is processed quickly.
                </p>
              </div>
              
              {selectedMethod === "crypto-widget" ? (
                <div className="space-y-4">
                  <p className="text-sm">
                    Click the button below to open the secure payment gateway.
                  </p>
                  <Button 
                    className="w-full" 
                    onClick={() => window.open(`https://nowpayments.io/payment?iid=${paymentWidget?.invoiceId}`, '_blank')}
                  >
                    Open Payment Gateway
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Instructions</Label>
                    <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                      {selectedPaymentMethod?.instructions}
                    </div>
                  </div>
                  
                  {selectedPaymentMethod?.paymentLink && (
                    <div className="space-y-2">
                      <Label>Payment Link</Label>
                      <div className="flex gap-2">
                        <div className="flex-1 p-2 bg-muted rounded-md text-xs truncate">
                          {selectedPaymentMethod.paymentLink}
                        </div>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(selectedPaymentMethod.paymentLink!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="outline" 
                          className="h-8 w-8"
                          onClick={() => window.open(selectedPaymentMethod.paymentLink!, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-4">
                <Button className="w-full gradient-primary" onClick={handleConfirmPayment}>
                  I Have Paid
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  By clicking "I Have Paid", you confirm that you have sent the payment.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Confirmation Processing Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={(open) => !isProcessing && setShowConfirmDialog(open)}>
          <DialogContent className="sm:max-w-[425px] text-center py-10">
            <div className="flex flex-col items-center gap-4">
              {isProcessing ? (
                <>
                  <div className="relative h-20 w-20">
                    <Loader2 className="h-20 w-20 animate-spin text-primary" />
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">
                      {countdown}
                    </div>
                  </div>
                  <DialogTitle>Verifying Payment</DialogTitle>
                  <DialogDescription>
                    Please wait while we verify your transaction...
                  </DialogDescription>
                </>
              ) : (
                <>
                  <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <DialogTitle>Payment Submitted</DialogTitle>
                  <DialogDescription>
                    Your payment has been submitted for manual verification.
                  </DialogDescription>
                  <Button className="w-full mt-4" onClick={() => setLocation("/orders")}>
                    View My Orders
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PublicLayout>
  );
}
