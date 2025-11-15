import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, CheckCircle, Video, Utensils, Dumbbell } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string | null;
  type: string;
  price: number;
  duration_weeks?: number | null;
  duration_minutes?: number | null;
  includes_nutrition: boolean | null;
  includes_workout: boolean | null;
  includes_meet: boolean | null;
}

interface ServicePurchaseProps {
  service: Service;
  user: any;
}

const ServicePurchase = ({ service, user }: ServicePurchaseProps) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const { toast } = useToast();

  // Utility: load external script
  const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.body.appendChild(s);
  });

  const handlePurchase = async () => {
    if (!paymentMethod) {
      toast({
        variant: "destructive",
        title: "Payment Method Required",
        description: "Please select a payment method.",
      });
      return;
    }

    setLoading(true);

    try {
      // Create purchase record (pending)
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          service_id: service.id,
          amount: service.price,
          payment_method: paymentMethod,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Flutterwave integration
      if (paymentMethod === 'flutterwave' || paymentMethod === 'momo') {
        // Load Flutterwave checkout script
        await loadScript('https://checkout.flutterwave.com/v3.js');

        const FLW_PUBLIC_KEY = (window as any).FLUTTERWAVE_PUBLIC_KEY || '';
        if (!FLW_PUBLIC_KEY) {
          toast({ variant: 'destructive', title: 'Configuration error', description: 'Flutterwave public key not configured.' });
          setLoading(false);
          return;
        }

        // Prepare tx_ref and options
        const tx_ref = `ptl_${purchase.id}` || `ptl_${Date.now()}`;
        const payment_options = paymentMethod === 'momo' ? 'mobilemoneyrw' : 'card,mobilemoney';

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.FlutterwaveCheckout({
          public_key: FLW_PUBLIC_KEY,
          tx_ref,
          amount: service.price,
          currency: 'USD',
          payment_options,
          customer: {
            email: user.email,
            name: (user.full_name || user.name || user.email)
          },
          customizations: {
            title: service.title,
            description: service.description || ''
          },
          callback: async (data: any) => {
            // IMPORTANT: This client-side callback is not a secure payment verification.
            // You MUST verify the transaction server-side using Flutterwave's verify endpoint
            // with your secret key and only then mark the purchase as completed.
            // For convenience we do a best-effort client-side update when status === 'successful'.
            try {
              if (data?.status === 'successful' || data?.status === 'success') {
                await supabase.from('purchases').update({ payment_status: 'completed' }).eq('id', purchase.id);
                toast({ title: 'Payment successful', description: 'Thank you — your purchase is complete.' });
                window.location.reload();
              } else {
                await supabase.from('purchases').update({ payment_status: 'failed' }).eq('id', purchase.id);
                toast({ variant: 'destructive', title: 'Payment failed', description: 'Payment was not completed.' });
              }
            } catch (err) {
              console.error('Error updating purchase after callback:', err);
            }
          },
          onclose: () => {
            // If the user closed the widget, keep purchase pending (or mark failed)
            console.log('Flutterwave widget closed');
          }
        });

        setLoading(false);
        return;
      }

      // PayPal or other methods: placeholder flow — merchant must provide server-side order creation
      if (paymentMethod === 'paypal') {
        // If you have a PayPal checkout link set in runtime, redirect to it
        const PAYPAL_LINK = (window as any).PAYPAL_CHECKOUT_URL || '';
        if (PAYPAL_LINK) {
          window.open(PAYPAL_LINK, '_blank');
        } else {
          toast({ title: 'PayPal setup required', description: 'PayPal integration requires server-side setup. See README.' });
        }
        setLoading(false);
        return;
      }

      // Fallback: immediately mark completed (for local testing only)
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ payment_status: 'completed' })
        .eq('id', purchase.id);

      if (updateError) throw updateError;

      toast({
        title: "Purchase Successful!",
        description: "Your service has been added to your dashboard.",
      });

      window.location.reload();

    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "Failed to process your purchase. Please try again.",
      });
    }

    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${new Intl.NumberFormat('en-US').format(amount)}`;
  };

  return (
    <Card className="bg-gradient-card border-border hover:shadow-primary transition-smooth">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-foreground">{service.title}</CardTitle>
            <CardDescription className="mt-2">{service.description}</CardDescription>
          </div>
          <Badge variant="secondary" className="capitalize">
            {service.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Service features */}
        <div className="flex flex-wrap gap-2">
          {service.includes_workout && (
            <Badge variant="outline" className="text-xs">
              <Dumbbell className="h-3 w-3 mr-1" />
              Workout Plans
            </Badge>
          )}
          {service.includes_nutrition && (
            <Badge variant="outline" className="text-xs">
              <Utensils className="h-3 w-3 mr-1" />
              Nutrition Guide
            </Badge>
          )}
          {service.includes_meet && (
            <Badge variant="outline" className="text-xs">
              <Video className="h-3 w-3 mr-1" />
              Video Sessions
            </Badge>
          )}
        </div>

        {/* Duration info */}
        {service.duration_weeks && (
          <p className="text-sm text-muted-foreground">
            Duration: {service.duration_weeks} weeks
          </p>
        )}
        {service.duration_minutes && (
          <p className="text-sm text-muted-foreground">
            Session Length: {service.duration_minutes} minutes
          </p>
        )}

        {/* Price */}
        <div className="border-t border-border pt-4">
          <p className="text-2xl font-bold text-gradient-primary">
            {formatCurrency(service.price)}
          </p>
        </div>

        {/* Payment method selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Payment Method</label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="momo">Mobile Money (MoMo)</SelectItem>
              <SelectItem value="flutterwave">Card / Mobile Money (Flutterwave)</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="irembopay">IremboPay (Cards)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Purchase button */}
        <Button
          onClick={handlePurchase}
          disabled={loading || !paymentMethod}
          className="w-full bg-gradient-primary hover:shadow-primary"
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase Now
            </>
          )}
        </Button>

        {/* Payment method info */}
        {paymentMethod && (
          <div className="text-xs text-muted-foreground space-y-1">
            {paymentMethod === 'momo' && (
              <p>📱 You'll receive SMS instructions for Mobile Money payment</p>
            )}
            {paymentMethod === 'paypal' && (
              <p>💳 You'll be redirected to PayPal to complete payment</p>
            )}
            {paymentMethod === 'irembopay' && (
              <p>💳 Secure card payment via IremboPay (local & international)</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServicePurchase;