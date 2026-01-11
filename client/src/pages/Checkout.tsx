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
    const cleanMac = mac.replace(/[:-]/g, '').toUpperCase();
    return /^[0-9A-F]{12}$/.test(cleanMac);
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
      toast.error("Please enter a valid MAC address (format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX)");
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
            <CardTitle>Select Payment Method</CardTitle>
            <CardDescription>Choose how you want to pay</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods && paymentMethods.length > 0 ? (
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                  >
                    <RadioGroupItem value={method.id.toString()} id={`method-${method.id}`} />
                    <Label htmlFor={`method-${method.id}`} className="cursor-pointer flex-1">
                      <div className="font-medium">{method.name}</div>
                      {method.instructions && (
                        <div className="text-sm text-muted-foreground">{method.instructions}</div>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No payment methods available for this plan
              </div>
            )}
            
            {paymentWidget && (
              <>
                <Separator />
                <div
                  className="flex items-center space-x-2 p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                >
                  <RadioGroupItem value="crypto-widget" id="crypto-widget" />
                  <Label htmlFor="crypto-widget" className="cursor-pointer flex-1">
                    <div className="flex items-center gap-2">
                      <Bitcoin className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="font-medium">Cryptocurrency</div>
                        <div className="text-sm text-muted-foreground">Pay with Bitcoin, Ethereum, and other cryptocurrencies</div>
                      </div>
                    </div>
                  </Label>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        
        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <Link href="/plans" className="flex-1">
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button 
            onClick={handleProceedToPayment}
            disabled={!selectedMethod}
            className="flex-1"
          >
            Proceed to Payment
          </Button>
        </div>
      </div>
      
      {/* Credentials Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Credentials Type</DialogTitle>
            <DialogDescription>
              Choose how you want to receive your IPTV credentials
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <RadioGroup value={selectedCredentialsType} onValueChange={setSelectedCredentialsType}>
              <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                <RadioGroupItem value="xtream" id="xtream" />
                <Label htmlFor="xtream" className="cursor-pointer flex-1">
                  <div className="font-medium">Xtream Codes API</div>
                  <div className="text-xs text-muted-foreground">For developers and advanced users</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                <RadioGroupItem value="mag" id="mag" />
                <Label htmlFor="mag" className="cursor-pointer flex-1">
                  <div className="font-medium">MAG Portal</div>
                  <div className="text-xs text-muted-foreground">For MAG boxes (requires MAC address)</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                <RadioGroupItem value="m3u" id="m3u" />
                <Label htmlFor="m3u" className="cursor-pointer flex-1">
                  <div className="font-medium">M3U / M3U8 Playlist</div>
                  <div className="text-xs text-muted-foreground">For VLC, Kodi, and other players</div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 p-3 rounded-lg border cursor-pointer hover:bg-accent">
                <RadioGroupItem value="enigma2" id="enigma2" />
                <Label htmlFor="enigma2" className="cursor-pointer flex-1">
                  <div className="font-medium">Enigma2 (E2) / Dreambox</div>
                  <div className="text-xs text-muted-foreground">For Dreambox receivers</div>
                </Label>
              </div>
            </RadioGroup>
            
            {selectedCredentialsType === "mag" && (
              <div className="space-y-2">
                <Label htmlFor="mac">MAC Address</Label>
                <input
                  id="mac"
                  type="text"
                  placeholder="XX:XX:XX:XX:XX:XX"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Format: XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX
                </p>
              </div>
            )}
          </div>
          
          <Button onClick={handleCredentialsSelection} className="w-full">
            Continue
          </Button>
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Instructions</DialogTitle>
            <DialogDescription>
              Order #{orderId}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPaymentMethod && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="font-semibold mb-2">{selectedPaymentMethod.name}</div>
                {selectedPaymentMethod.instructions && (
                  <div className="text-sm whitespace-pre-wrap">{selectedPaymentMethod.instructions}</div>
                )}
                {selectedPaymentMethod.paymentLink && (
                  <a 
                    href={selectedPaymentMethod.paymentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline mt-3"
                  >
                    Open Payment Link
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-sm">
                  <strong>Amount:</strong> ${price}
                </div>
              </div>
            </div>
          )}
          
          {selectedMethod === "crypto-widget" && paymentWidget && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="text-sm mb-3">
                  <strong>Cryptocurrency Payment</strong>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  You will be redirected to our payment processor to complete the transaction securely.
                </p>
                <a 
                  href={`https://nowpayments.io/payment/?iid=${paymentWidget.invoiceId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  Pay with Cryptocurrency
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          )}
          
          <Button onClick={handleConfirmPayment} className="w-full">
            I Have Paid
          </Button>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Payment Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Confirmed</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
            <div>
              <div className="font-semibold mb-2">Payment Received</div>
              <p className="text-sm text-muted-foreground">
                Your order has been received and is pending verification. You will receive an email confirmation shortly.
              </p>
            </div>
            
            {isProcessing && (
              <div className="p-4 rounded-lg bg-blue-500/10">
                <p className="text-sm">
                  Redirecting in {countdown} seconds...
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
