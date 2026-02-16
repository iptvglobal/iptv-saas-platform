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
  const [paymentLinkCountdown, setPaymentLinkCountdown] = useState(0);
  const [paymentLinkOpened, setPaymentLinkOpened] = useState(false);
  const [showAutoOpenButton, setShowAutoOpenButton] = useState(false);
  

  
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
  
  // 7-second countdown before opening payment link
  useEffect(() => {
    if (paymentLinkCountdown > 0) {
      const timer = setTimeout(() => setPaymentLinkCountdown(paymentLinkCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (paymentLinkCountdown === 0 && showPaymentDialog && selectedPaymentMethod?.paymentLink && !paymentLinkOpened) {
      // Show button to let user click to open (avoids pop-up blocking)
      setShowAutoOpenButton(true);
    }
  }, [paymentLinkCountdown, showPaymentDialog, selectedPaymentMethod?.paymentLink, paymentLinkOpened]);
  
  // Start countdown when payment dialog opens
  useEffect(() => {
    if (showPaymentDialog && selectedPaymentMethod?.paymentLink && !paymentLinkOpened) {
      setPaymentLinkCountdown(7);
      setShowAutoOpenButton(false);
    }
  }, [showPaymentDialog, selectedPaymentMethod?.paymentLink, paymentLinkOpened]);
  
  // If user is already authenticated AND not in guest checkout flow, redirect to regular checkout
  useEffect(() => {
    if (isAuthenticated && accountCreated === false && planId) {
      setLocation(`/checkout/${planId}?connections=${connections}`);
    }
  }, [isAuthenticated, planId, connections, accountCreated]);
  
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
      setPaymentLinkOpened(false); // Reset for payment dialog
      setPaymentLinkCountdown(0); // Reset countdown
      setShowAutoOpenButton(false);
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
      setPaymentLinkOpened(false); // Reset for payment dialog
      setPaymentLinkCountdown(0); // Reset countdown
      setShowAutoOpenButton(false);
      setShowPaymentDialog(true);
    } catch (error) {
      toast.error("Failed to create order. Please try again.");
    }
  };
  
  const handleProceedToPayment = () => {
    if (isAuthenticated || accountCreated) {
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
  
  const openPaymentLink = () => {
    if (selectedPaymentMethod?.paymentLink) {
      window.open(selectedPaymentMethod.paymentLink, '_blank');
      setPaymentLinkOpened(true);
    }
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Connections:</span>
              <span className="font-medium">{connections}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-primary">${price}</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Account Section */}
        {!isAuthenticated && !accountCreated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>Create an account or continue as guest</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
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
        
        {/* Proceed Button */}
        <Button 
          className="w-full gradient-primary"
          size="lg"
          onClick={handleProceedToPayment}
          disabled={!selectedMethod || isCreatingAccount || createOrder.isPending}
        >
          {isCreatingAccount || createOrder.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Proceed to Payment"
          )}
        </Button>
      </div>
      

      {/* Payment Instructions Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[500px] flex flex-col max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Payment Instructions</DialogTitle>
            <DialogDescription>
              Please follow these steps to complete your payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4 overflow-y-auto flex-1">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h4 className="font-semibold text-primary mb-2">Amount to Pay: ${price}</h4>
              <p className="text-sm text-muted-foreground">
                Please send the exact amount to ensure your order is processed quickly.
              </p>
            </div>
            
            {selectedMethod === "crypto-widget" ? (
              <div className="space-y-4 w-full">
                <p className="text-sm font-medium text-center mb-4">
                  Complete your payment using the widget below
                </p>
                <div className="flex justify-center w-full overflow-x-auto">
                  <iframe 
                    src={`https://nowpayments.io/embeds/payment-widget?iid=${paymentWidget?.invoiceId}`}
                    width="410" 
                    height="696" 
                    frameBorder="0" 
                    scrolling="yes" 
                    style={{ overflow: 'auto', minWidth: '410px' }}
                    title="NOWPayments Payment Widget"
                  >
                    Can't load widget
                  </iframe>
                </div>
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
                  <div className="space-y-3">
                    {/* Countdown Timer */}
                    {paymentLinkCountdown > 0 && !paymentLinkOpened && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                        <p className="text-sm text-blue-900 font-medium">
                          Payment link will open automatically in <span className="text-lg font-bold text-blue-600">{paymentLinkCountdown}</span> seconds...
                        </p>
                      </div>
                    )}
                    
                    {/* Auto-Open Button (appears after countdown) */}
                    {showAutoOpenButton && !paymentLinkOpened && (
                      <div className="space-y-3">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                          <p className="text-sm text-green-900 font-medium mb-3">
                            Ready to open payment link!
                          </p>
                          <Button 
                            className="w-full bg-green-600 hover:bg-green-700" 
                            onClick={openPaymentLink}
                          >
                            Click Here to Open Payment Link
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Payment Link Button (always available) */}
                    {!showAutoOpenButton && !paymentLinkOpened && (
                      <Button 
                        className="w-full" 
                        onClick={openPaymentLink}
                      >
                        Open Payment Link
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t mt-4">
            <Button 
              className="w-full gradient-primary" 
              onClick={() => {
                if (selectedPaymentMethod?.paymentLink && !paymentLinkOpened) {
                  openPaymentLink();
                }
                handleConfirmPayment();
              }}
            >
              I have Complete Payment
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              By clicking "I have Complete Payment", you confirm that you have completed the payment.
            </p>
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
    </PublicLayout>
  );
}
