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
  description: string;
  type: string;
  price: number;
  duration_weeks?: number;
  duration_minutes?: number;
  includes_nutrition: boolean;
  includes_workout: boolean;
  includes_meet: boolean;
}

interface ServicePurchaseProps {
  service: Service;
  user: any;
}

const ServicePurchase = ({ service, user }: ServicePurchaseProps) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const { toast } = useToast();

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
      // Create purchase record
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

      // For development purposes, we'll mark it as completed immediately
      // In production, you'd integrate with actual payment processors
      const { error: updateError } = await supabase
        .from('purchases')
        .update({ payment_status: 'completed' })
        .eq('id', purchase.id);

      if (updateError) throw updateError;

      toast({
        title: "Purchase Successful!",
        description: "Your service has been added to your dashboard.",
      });

      // Refresh the page to show updated purchases
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