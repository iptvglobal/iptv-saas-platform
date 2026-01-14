import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute, Link } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  CreditCard, 
  Wallet,
  CheckCircle,
  Loader2,
  ExternalLink,
  Copy,
  Bitcoin
} from "lucide-react";

export default function Checkout() {
  const [, params] = useRoute("/checkout/:planId");
  const [location, setLocation] = useLocation();
  const planId = params?.planId ? parseInt(params.planId) : null;
  
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
  
  const createOrder = trpc.orders.create.useMutation();
  const confirmPayment = trpc.orders.confirmPayment.useMutation();
  
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [orderId, setOrderId] = useState<number | null>(null);
  
  // Credentials selection state
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [selectedCredentialsType, setSelectedCredentialsType] = useState<string>("xtream");
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
  
  const validateMacAddress = (mac: string) => {
    // Flexible MAC address validation:
    // 1. Remove all non-alphanumeric characters (colons, hyphens, spaces, dots, etc.)
    const cleanMac = mac.replace(/[^0-9A-Z]/gi, '').toUpperCase();
    // 2. Check if it's exactly 12 alphanumeric characters (A-Z and 0-9)
    return /^[0-9A-Z]{12}$/.test(cleanMac);
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
    
    // After credentials selection, proceed to order creation
    handleCreateOrder();
  };
  
  const handleProceedToPayment = () => {
    if (!selectedMethod) {
      toast.error("Please select a payment method");
      return;
    }
    
    // Show credentials dialog first
    if (!credentialsSubmitted) {
      setShowCredentialsDialog(true);
      return;
    }
    
    handleCreateOrder();
  };

  const handleCreateOrder = async () => {
    try {
      const result = await createOrder.mutateAsync({
        planId: planId!,
        connections,
        price,
        paymentMethodId: selectedMethod !== "crypto-widget" ? parseInt(selectedMethod) : undefined,
        paymentWidgetId: selectedMethod === "crypto-widget" ? paymentWidget?.id : undefined,
        paymentMethodName: selectedMethod === "crypto-widget" ? "Cryptocurrency" : selectedPaymentMethod?.name,
        paymentMethodType: selectedMethod === "crypto-widget" ? "crypto" : selectedPaymentMethod?.type,
        credentialsType: selectedCredentialsType as any,
        macAddress: selectedCredentialsType === "mag" ? macAddress : undefined,
      });
      
      setOrderId(result.orderId || null);
      setShowPaymentDialog(true);
    } catch (error) {
      toast.error("Failed to create order. Please try again.");
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
        setLocation("/orders");
      } catch (error) {
        toast.error("Failed to confirm payment. Please contact support.");
      }
    }
    setIsProcessing(false);
    setShowConfirmDialog(false);
  };
  
  if (planLoading || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading plan details...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/plans">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground mt-2">Complete your subscription</p>
        </div>
        
        {/* Order Summary */}
        <Card className="mb-6">
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
        
        {/* Action Button */}
        <Button 
          className="w-full gradient-primary"
          size="lg"
          onClick={handleProceedToPayment}
          disabled={!selectedMethod || createOrder.isPending}
        >
          {createOrder.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Proceed to Payment"
          )}
        </Button>
        
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
              <RadioGroup value={selectedCredentialsType} onValueChange={setSelectedCredentialsType}>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="xtream" id="xtream" />
                  <Label htmlFor="xtream" className="flex-1 cursor-pointer">
                    <div className="font-medium">Xtream Codes</div>
                    <div className="text-xs text-muted-foreground">Username, Password & Server URL</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="m3u" id="m3u" />
                  <Label htmlFor="m3u" className="flex-1 cursor-pointer">
                    <div className="font-medium">M3U Playlist</div>
                    <div className="text-xs text-muted-foreground">Playlist URL & EPG URL</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="mag" id="mag" />
                  <Label htmlFor="mag" className="flex-1 cursor-pointer">
                    <div className="font-medium">MAG / Portal</div>
                    <div className="text-xs text-muted-foreground">For MAG boxes (requires MAC address)</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="enigma2" id="enigma2" />
                  <Label htmlFor="enigma2" className="flex-1 cursor-pointer">
                    <div className="font-medium">Enigma2</div>
                    <div className="text-xs text-muted-foreground">For Enigma2 devices</div>
                  </Label>
                </div>
              </RadioGroup>
              
              {selectedCredentialsType === "mag" && (
                <div className="space-y-2 mt-2">
                  <Label htmlFor="mac">MAC Address</Label>
                  <input
                    id="mac"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                          onClick={() => {
                            navigator.clipboard.writeText(selectedPaymentMethod.paymentLink!);
                            toast.success("Link copied");
                          }}
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
    </div>
  );
}
