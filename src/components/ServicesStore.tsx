import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ServicePurchase from "./ServicePurchase";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

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

interface ServicesStoreProps {
  user: any;
  onBack: () => void;
}

const ServicesStore = ({ user, onBack }: ServicesStoreProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true });

      if (error) throw error;

      setServices(data || []);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load services.",
      });
    }

    setLoading(false);
  };

  const servicesByType = {
    program: services.filter(s => s.type === 'program'),
    consultation: services.filter(s => s.type === 'consultation'),
    session: services.filter(s => s.type === 'session')
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">SSF Services</h1>
              <p className="text-muted-foreground">Choose your fitness transformation program</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="programs" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="programs">Training Programs</TabsTrigger>
            <TabsTrigger value="consultations">Consultations</TabsTrigger>
            <TabsTrigger value="sessions">Personal Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="programs" className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {servicesByType.program.length > 0 ? (
                servicesByType.program.map((service) => (
                  <ServicePurchase key={service.id} service={service} user={user} />
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No training programs available at the moment.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="consultations" className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {servicesByType.consultation.length > 0 ? (
                servicesByType.consultation.map((service) => (
                  <ServicePurchase key={service.id} service={service} user={user} />
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No consultation services available at the moment.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {servicesByType.session.length > 0 ? (
                servicesByType.session.map((service) => (
                  <ServicePurchase key={service.id} service={service} user={user} />
                ))
              ) : (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No personal training sessions available at the moment.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <Card className="bg-gradient-card border-border max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-gradient-primary">Need Help Choosing?</CardTitle>
              <CardDescription>
                Not sure which program is right for you? Book a free consultation to get personalized recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.href = '#contact'}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Contact Salim
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ServicesStore;