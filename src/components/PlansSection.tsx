import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, DollarSign, Calendar, Video, FileText, Dumbbell, Utensils } from "lucide-react";

interface Plan {
  id: string;
  title: string;
  description: string | null;
  type: string;
  price: number;
  duration_weeks: number | null;
  includes_meet: boolean | null;
  includes_nutrition: boolean | null;
  includes_workout: boolean | null;
}

interface PlansSectionProps {
  onAuthRequest: () => void;
  isAuthenticated: boolean;
}

const PlansSection = ({ onAuthRequest, isAuthenticated }: PlansSectionProps) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .in('type', ['recurring', 'one-time', 'downloadable'])
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      'recurring': { color: 'bg-green-500/10 text-green-400 border-green-500/30', label: 'Recurring' },
      'one-time': { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'One-Time' },
      'downloadable': { color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', label: 'Downloadable' },
    };
    return configs[type] || { color: 'bg-gray-500/10 text-gray-400 border-gray-500/30', label: type };
  };

  if (loading) return null;
  if (plans.length === 0) return null;

  return (
    <section id="plans" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-6">
            Training <span className="text-gradient-primary">Plans</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our customized programs and pre-made plans designed to help you reach your fitness goals.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const typeConfig = getTypeConfig(plan.type);
            return (
              <Card 
                key={plan.id} 
                className="bg-gradient-card border-border hover:border-primary transition-smooth"
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className={typeConfig.color}>
                      {typeConfig.label}
                    </Badge>
                    <div className="flex items-baseline">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{plan.title}</CardTitle>
                  {plan.description && (
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.duration_weeks && plan.duration_weeks > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{plan.duration_weeks} weeks</span>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {plan.includes_meet && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Video meetings included</span>
                      </div>
                    )}
                    {plan.includes_nutrition && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Nutrition plan</span>
                      </div>
                    )}
                    {plan.includes_workout && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Workout plan</span>
                      </div>
                    )}
                    {plan.type === 'downloadable' && (
                      <div className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Instant download</span>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => isAuthenticated ? navigate('/dashboard') : onAuthRequest()}
                    className="w-full"
                  >
                    {isAuthenticated ? 'View in Dashboard' : 'Sign Up to Purchase'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
