import UserLayout from "@/components/UserLayout";
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
  
  const handleProceedToPayment = async () => {
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
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };
  
  if (planLoading || !plan) {
    return (
      <UserLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-64 rounded-xl" />
          <div className="skeleton h-48 rounded-xl" />
        </div>
      </UserLayout>
    );
  }
  
  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back Button */}
        <Link href="/plans">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Plans
          </Button>
        </Link>
        
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
            <CardDescription>Review your subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{plan.durationDays} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Connections</span>
              <span className="font-medium">{connections}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold">Total</span>
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
            
            <Button 
              className="w-full mt-6 gradient-primary"
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
                `Proceed to Payment - $${price}`
              )}
            </Button>
          </CardContent>
        </Card>
        
        {/* Payment Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complete Your Payment</DialogTitle>
              <DialogDescription>
                {isCrypto 
                  ? "Complete your payment using the widget below"
                  : "Follow the instructions to complete your payment"
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Crypto Widget */}
              {selectedMethod === "crypto-widget" && paymentWidget && (
                <div className="w-full flex justify-center rounded-lg border p-4 bg-white">
                  <iframe 
                    src={`https://nowpayments.io/embeds/payment-widget?iid=${paymentWidget.invoiceId}`}
                    width="410"
                    height="600"
                    frameBorder="0"
                    scrolling="yes"
                    className="rounded-lg"
                  >
                    Can't load widget
                  </iframe>
                </div>
              )}
              
              {/* Manual Payment Instructions */}
              {selectedPaymentMethod && selectedMethod !== "crypto-widget" && (
                <div className="space-y-4">
                  {selectedPaymentMethod.instructions && (
                    <div className="p-4 rounded-lg bg-muted">
                      <h4 className="font-medium mb-2">Payment Instructions</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {selectedPaymentMethod.instructions}
                      </p>
                    </div>
                  )}
                  
                  {selectedPaymentMethod.paymentLink && (
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => window.open(selectedPaymentMethod.paymentLink!, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Payment Link
                    </Button>
                  )}
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                <span className="text-sm text-muted-foreground">Order ID</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium">#{orderId}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(`#${orderId}`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Button 
                className="w-full gradient-primary"
                size="lg"
                onClick={handleConfirmPayment}
              >
                I Have Paid
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Click "I Have Paid" after completing your payment. 
                Our team will verify your payment within 1-2 hours.
              </p>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Confirmation Dialog with Loading Animation */}
        <Dialog open={showConfirmDialog} onOpenChange={() => {}}>
          <DialogContent className="max-w-sm text-center">
            <div className="py-8 space-y-6">
              {isProcessing ? (
                <>
                  <div className="relative mx-auto w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-muted" />
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{countdown}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Verifying Payment</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please wait while we process your confirmation...
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Payment Confirmed!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your order is now pending admin verification.
                    </p>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </UserLayout>
  );
}
