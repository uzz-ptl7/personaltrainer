import { useState, useEffect } from "react";
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const { toast } = useToast();

  // Countdown effect
  useEffect(() => {
    if (showSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showSuccess && countdown === 0) {
      window.location.reload();
    }
  }, [showSuccess, countdown]);

  // (No external checkout integrations) — client creates a pending purchase record

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
      // Calculate expiry date based on service type
      let expiresAt: string | null = null;
      let isActive = true;

      if (service.type === 'recurring' && service.duration_weeks) {
        // Recurring plans expire after duration
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (service.duration_weeks * 7));
        expiresAt = expiryDate.toISOString();
      } else if (service.type === 'program' && service.duration_weeks) {
        // Programs expire after duration
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (service.duration_weeks * 7));
        expiresAt = expiryDate.toISOString();
      }
      // one-time and downloadable services don't expire (lifetime access)

      // Create purchase record (pending)
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          service_id: service.id,
          amount: service.price,
          payment_method: paymentMethod,
          payment_status: 'pending',
          expires_at: expiresAt,
          is_active: isActive
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // For supported client-side methods (mobile money or bank transfer) we create a pending purchase
      // and instruct the user to complete payment via their selected channel. Admin will mark completed.

      // Notify user and admins that a purchase was created and is pending payment
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            user_id: user?.id,
            title: 'Purchase Created',
            message: `A pending purchase for ${service.title} has been created. Please complete payment via ${paymentMethod === 'momo' ? 'Mobile Money' : 'Bank Transfer'}.`,
            type: 'info'
          }
        });

        const { data: adminProfiles } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('is_admin', true);

        if (adminProfiles) {
          await Promise.all(adminProfiles.map(admin =>
            supabase.functions.invoke('send-notification', {
              body: {
                user_id: admin.user_id,
                title: 'New Pending Purchase',
                message: `${user?.email} created a pending purchase for ${service.title} (amount: ${service.price}). Payment method: ${paymentMethod}.`,
                type: 'info'
              }
            })
          ));
        }
      } catch (notifError) {
        console.error('Error sending notifications:', notifError);
      }

      // Show success message with countdown
      setShowSuccess(true);
      setCountdown(7);

      // Leave purchase as pending for admin verification
      // Page will reload after countdown completes (managed by useEffect)

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
    <>
      {/* Success overlay with countdown */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="max-w-md w-full mx-4 bg-gradient-card border-border shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-green-500/20 p-3">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">Purchase Created!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                A pending purchase was created for <strong>{service.title}</strong>.
              </p>
              <p className="text-muted-foreground">
                Please complete payment via <strong>{paymentMethod === 'momo' ? 'Mobile Money' : 'Bank Transfer'}</strong>.
              </p>
              <p className="text-muted-foreground">
                Admin will confirm once payment is received.
              </p>

              {/* Payment method instructions */}
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                {paymentMethod === 'momo' && (
                  <p className="break-words">📱 You will shortly be contacted (on any of your listed contacts during signup) on how to complete the Mobile Money Transfer.</p>
                )}
                {paymentMethod === 'bank' && (
                  <p className="break-words">🏦 You will shortly be contacted (on any of your listed contacts during signup) on how to complete the Bank Transfer.</p>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page will refresh in <span className="text-lg font-bold text-gradient-primary">{countdown}</span> second{countdown !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-gradient-card border-border hover:shadow-primary transition-smooth">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-xl text-foreground break-words">{service.title}</CardTitle>
              <CardDescription className="mt-2 break-words">{service.description}</CardDescription>
            </div>
            <Badge variant="secondary" className="capitalize w-fit flex-shrink-0">
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
            <p className="text-sm text-muted-foreground break-words">
              Duration: {service.duration_weeks} weeks
            </p>
          )}
          {service.duration_minutes && (
            <p className="text-sm text-muted-foreground break-words">
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
                <SelectItem value="bank">Bank Transfer</SelectItem>
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
                <p className="break-words">📱 Please Purchase and you will shortly be contacted (on any of your listed contacts during signup) on how to complete the Mobile Money Transfer.</p>
              )}
              {paymentMethod === 'bank' && (
                <p className="break-words">🏦 Please Purchase and you will shortly be contacted (on any of your listed contacts during signup) on how to complete the Bank Transfer.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default ServicePurchase;