import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Activity, Scale, Heart, Zap, MessageCircle, SkipForward } from "lucide-react";

interface FitnessAssessmentProps {
  user: User;
  onComplete: () => void;
}

interface AssessmentData {
  weight_kg: string;
  bmi: string;
  body_fat_percentage: string;
  heart_rate_bpm: string;
  muscle_mass_kg: string;
  bmr_kcal: string;
  water_percentage: string;
  body_fat_mass_kg: string;
  lean_body_mass_kg: string;
  bone_mass_kg: string;
  visceral_fat: string;
  protein_percentage: string;
  skeletal_muscle_mass_kg: string;
  subcutaneous_fat_percentage: string;
  body_age: string;
  body_type: string;
}

const FitnessAssessment = ({ user, onComplete }: FitnessAssessmentProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AssessmentData>({
    weight_kg: '',
    bmi: '',
    body_fat_percentage: '',
    heart_rate_bpm: '',
    muscle_mass_kg: '',
    bmr_kcal: '',
    water_percentage: '',
    body_fat_mass_kg: '',
    lean_body_mass_kg: '',
    bone_mass_kg: '',
    visceral_fat: '',
    protein_percentage: '',
    skeletal_muscle_mass_kg: '',
    subcutaneous_fat_percentage: '',
    body_age: '',
    body_type: ''
  });
  const { toast } = useToast();

  // Check if user already has assessment on component mount
  useEffect(() => {
    checkExistingAssessment();
  }, [user]);

  const checkExistingAssessment = async () => {
    try {
      const { data: existingAssessment, error } = await supabase
        .from('fitness_assessments')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existingAssessment && !error) {
        // User already has assessment, redirect to dashboard
        window.location.href = '/dashboard';
      }
      
      if (error) {
        console.log('Assessment check error:', error);
        // If it's a policy error or 406, we'll continue with the form
        // The user probably just doesn't have an assessment yet
      }
    } catch (error) {
      console.log('Assessment check exception:', error);
      // No existing assessment found, continue with form
    }
  };

  const handleInputChange = (field: keyof AssessmentData, value: string) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNeedHelp = () => {
    const whatsappMessage = "Hi! I need help completing my fitness assessment. Could we schedule a meeting to go through it together?";
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/250789842205?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSkipForNow = () => {
    if (confirm('Are you sure you want to skip the fitness assessment for now? You can complete it later from your dashboard.')) {
      // Redirect to dashboard without saving assessment
      window.location.href = '/dashboard';
    }
  };

  const validateForm = () => {
    const requiredFields = Object.keys(data) as (keyof AssessmentData)[];
    const emptyFields = requiredFields.filter(field => !data[field].trim());
    
    if (emptyFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all fields to complete your fitness assessment.",
      });
      return false;
    }

    // Validate numeric fields
    const numericFields = [
      'weight_kg', 'bmi', 'body_fat_percentage', 'heart_rate_bpm', 
      'muscle_mass_kg', 'bmr_kcal', 'water_percentage', 'body_fat_mass_kg',
      'lean_body_mass_kg', 'bone_mass_kg', 'visceral_fat', 'protein_percentage',
      'skeletal_muscle_mass_kg', 'subcutaneous_fat_percentage', 'body_age'
    ];

    for (const field of numericFields) {
      const value = parseFloat(data[field]);
      if (isNaN(value) || value <= 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: `Please enter a valid number for ${field.replace(/_/g, ' ')}.`,
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const assessmentData = {
        user_id: user.id,
        weight_kg: parseFloat(data.weight_kg),
        bmi: parseFloat(data.bmi),
        body_fat_percentage: parseFloat(data.body_fat_percentage),
        heart_rate_bpm: parseInt(data.heart_rate_bpm),
        muscle_mass_kg: parseFloat(data.muscle_mass_kg),
        bmr_kcal: parseInt(data.bmr_kcal),
        water_percentage: parseFloat(data.water_percentage),
        body_fat_mass_kg: parseFloat(data.body_fat_mass_kg),
        lean_body_mass_kg: parseFloat(data.lean_body_mass_kg),
        bone_mass_kg: parseFloat(data.bone_mass_kg),
        visceral_fat: parseInt(data.visceral_fat),
        protein_percentage: parseFloat(data.protein_percentage),
        skeletal_muscle_mass_kg: parseFloat(data.skeletal_muscle_mass_kg),
        subcutaneous_fat_percentage: parseFloat(data.subcutaneous_fat_percentage),
        body_age: parseInt(data.body_age),
        body_type: data.body_type
      };

      const { error } = await supabase
        .from('fitness_assessments')
        .insert([assessmentData]);

      if (error) {
        console.error('Assessment save error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to save your fitness assessment: ${error.message}. Please try again.`,
        });
      } else {
        toast({
          title: "Assessment Complete!",
          description: "Your fitness assessment has been saved successfully.",
        });
        onComplete();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    }

    setLoading(false);
  };

  const bodyTypes = [
    "Ectomorph",
    "Mesomorph", 
    "Endomorph",
    "Ecto-Mesomorph",
    "Meso-Endomorph"
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-gradient-card border-border shadow-elevation">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gradient-primary">
              Fitness Assessment
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Complete your fitness assessment to get started with your personalized training journey. 
              This information helps us create the perfect program for you.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Metrics */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Scale className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Basic Metrics</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="weight_kg">Weight (KG)</Label>
                    <Input
                      id="weight_kg"
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      value={data.weight_kg}
                      onChange={(e) => handleInputChange('weight_kg', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bmi">BMI</Label>
                    <Input
                      id="bmi"
                      type="number"
                      step="0.1"
                      placeholder="22.5"
                      value={data.bmi}
                      onChange={(e) => handleInputChange('bmi', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="body_age">Body Age</Label>
                    <Input
                      id="body_age"
                      type="number"
                      placeholder="25"
                      value={data.body_age}
                      onChange={(e) => handleInputChange('body_age', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="body_type">Body Type</Label>
                    <Select value={data.body_type} onValueChange={(value) => handleInputChange('body_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select body type" />
                      </SelectTrigger>
                      <SelectContent>
                        {bodyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Body Composition */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Zap className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Body Composition</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="body_fat_percentage">Body Fat (%)</Label>
                    <Input
                      id="body_fat_percentage"
                      type="number"
                      step="0.1"
                      placeholder="15.5"
                      value={data.body_fat_percentage}
                      onChange={(e) => handleInputChange('body_fat_percentage', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="muscle_mass_kg">Muscle Mass (KG)</Label>
                    <Input
                      id="muscle_mass_kg"
                      type="number"
                      step="0.1"
                      placeholder="45.2"
                      value={data.muscle_mass_kg}
                      onChange={(e) => handleInputChange('muscle_mass_kg', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="water_percentage">Water (%)</Label>
                    <Input
                      id="water_percentage"
                      type="number"
                      step="0.1"
                      placeholder="60.0"
                      value={data.water_percentage}
                      onChange={(e) => handleInputChange('water_percentage', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="body_fat_mass_kg">Body Fat Mass (KG)</Label>
                    <Input
                      id="body_fat_mass_kg"
                      type="number"
                      step="0.1"
                      placeholder="12.3"
                      value={data.body_fat_mass_kg}
                      onChange={(e) => handleInputChange('body_fat_mass_kg', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lean_body_mass_kg">Lean Body Mass (KG)</Label>
                    <Input
                      id="lean_body_mass_kg"
                      type="number"
                      step="0.1"
                      placeholder="58.2"
                      value={data.lean_body_mass_kg}
                      onChange={(e) => handleInputChange('lean_body_mass_kg', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bone_mass_kg">Bone Mass (KG)</Label>
                    <Input
                      id="bone_mass_kg"
                      type="number"
                      step="0.1"
                      placeholder="3.2"
                      value={data.bone_mass_kg}
                      onChange={(e) => handleInputChange('bone_mass_kg', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="protein_percentage">Protein (%)</Label>
                    <Input
                      id="protein_percentage"
                      type="number"
                      step="0.1"
                      placeholder="18.5"
                      value={data.protein_percentage}
                      onChange={(e) => handleInputChange('protein_percentage', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="skeletal_muscle_mass_kg">Skeletal Muscle Mass (KG)</Label>
                    <Input
                      id="skeletal_muscle_mass_kg"
                      type="number"
                      step="0.1"
                      placeholder="35.8"
                      value={data.skeletal_muscle_mass_kg}
                      onChange={(e) => handleInputChange('skeletal_muscle_mass_kg', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subcutaneous_fat_percentage">Subcutaneous Fat (%)</Label>
                    <Input
                      id="subcutaneous_fat_percentage"
                      type="number"
                      step="0.1"
                      placeholder="12.5"
                      value={data.subcutaneous_fat_percentage}
                      onChange={(e) => handleInputChange('subcutaneous_fat_percentage', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Health Metrics */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold text-foreground">Health Metrics</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="heart_rate_bpm">Heart Rate (BPM)</Label>
                    <Input
                      id="heart_rate_bpm"
                      type="number"
                      placeholder="72"
                      value={data.heart_rate_bpm}
                      onChange={(e) => handleInputChange('heart_rate_bpm', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bmr_kcal">BMR (KCAL)</Label>
                    <Input
                      id="bmr_kcal"
                      type="number"
                      placeholder="1800"
                      value={data.bmr_kcal}
                      onChange={(e) => handleInputChange('bmr_kcal', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="visceral_fat">Visceral Fat</Label>
                    <Input
                      id="visceral_fat"
                      type="number"
                      placeholder="5"
                      value={data.visceral_fat}
                      onChange={(e) => handleInputChange('visceral_fat', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-primary hover:shadow-primary"
                  disabled={loading}
                >
                  {loading ? "Saving Assessment..." : "Complete Assessment"}
                </Button>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleNeedHelp}
                    className="flex-shrink-0"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Need Help?
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSkipForNow}
                    className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip for Now
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FitnessAssessment;