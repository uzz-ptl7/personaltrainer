import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ServicePurchase from "./ServicePurchase";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/ssf-logo.jpg";

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

interface ServicesStoreProps {
  user: any;
  onBack: () => void;
}

const ServicesStore = ({ user, onBack }: ServicesStoreProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("programs");
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
    session: services.filter(s => s.type === 'session'),
    plans: services.filter(s => ['recurring', 'one-time', 'downloadable'].includes(s.type))
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
          <div className="flex items-center gap-3 mb-4">
            <img src={logo} alt="SSF Logo" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gradient-primary break-words">SSF Services</h1>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">Choose your fitness transformation program</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onBack} className="w-full sm:w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Category Filter */}
        <div className="mb-6">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">Filter by Category</label>
          <Select value={activeCategory} onValueChange={setActiveCategory}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="programs">Training Programs</SelectItem>
              <SelectItem value="consultations">Consultations</SelectItem>
              <SelectItem value="sessions">Personal Sessions</SelectItem>
              <SelectItem value="plans">Plans</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Training Programs */}
        {activeCategory === "programs" && (
          <div>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>
        )}

        {/* Consultations */}
        {activeCategory === "consultations" && (
          <div>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>
        )}

        {/* Personal Sessions */}
        {activeCategory === "sessions" && (
          <div>
                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
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
          </div>
        )}

        {/* Plans */}
        {activeCategory === "plans" && (
          <div>
            <div className="text-center mb-6 px-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 break-words">Customized & Pre-Made Plans</h3>
                  <p className="text-sm sm:text-base text-muted-foreground break-words">Choose from recurring programs, one-time customized plans, or downloadable resources</p>
                </div>

                {servicesByType.plans.length === 0 ? (
                  <Card className="bg-gradient-card border-border">
                    <CardContent className="flex items-center justify-center py-12">
                      <p className="text-muted-foreground">No plans available at the moment.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
                    {servicesByType.plans.map((service) => (
                      <ServicePurchase key={service.id} service={service} user={user} />
                    ))}
                  </div>
                )}
          </div>
        )}

        <div className="mt-8 text-center px-2">
          <Card className="bg-gradient-card border-border max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-gradient-primary break-words">Need Help Choosing?</CardTitle>
              <CardDescription className="text-sm sm:text-base break-words">
                Not sure which program is right for you? Book a free consultation to get personalized recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.location.href = '#contact'}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground w-full sm:w-auto"
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