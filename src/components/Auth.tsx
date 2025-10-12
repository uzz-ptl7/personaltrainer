import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { CountrySelect } from "@/components/CountrySelect";
import { PhoneInput } from "@/components/PhoneInput";

interface AuthProps {
  onAuthChange: (user: User | null) => void;
}

const Auth = ({ onAuthChange }: AuthProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+250');
  const [country, setCountry] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [customReferralSource, setCustomReferralSource] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      onAuthChange(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        onAuthChange(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, [onAuthChange]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign In Failed",
          description: error.message,
        });
      } else if (data.user) {
        // Check if user is blocked
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('is_blocked, full_name, is_admin')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to verify account status.",
          });
          await supabase.auth.signOut();
          return;
        }

        if (profile?.is_blocked) {
          toast({
            variant: "destructive",
            title: "Account Blocked",
            description: "Your account has been blocked. Please contact support for assistance.",
          });
          await supabase.auth.signOut();
          return;
        }

        toast({
          title: "Welcome back!",
          description: `You have successfully signed in${profile?.full_name ? `, ${profile.full_name}` : ''}.`,
        });
        
        // Admins skip fitness assessment and go directly to dashboard
        if (profile?.is_admin) {
          window.location.href = '/dashboard';
          return;
        }

        // Check if user has completed fitness assessment
        try {
          const { data: assessmentData, error } = await supabase
            .from('fitness_assessments')
            .select('id')
            .eq('user_id', data.user.id)
            .single();
          
          if (assessmentData && !error) {
            // User has completed assessment, redirect to dashboard
            window.location.href = '/dashboard';
          } else {
            // No assessment found or error occurred, redirect to fitness assessment
            console.log('Assessment check result:', { assessmentData, error });
            window.location.href = '/fitness-assessment';
          }
        } catch (error) {
          // If table doesn't exist yet or other error, redirect to fitness assessment for new users
          console.log('Assessment check exception:', error);
          window.location.href = '/fitness-assessment';
        }
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName || !phone || !country || !referralSource) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (referralSource === 'other' && !customReferralSource.trim()) {
      toast({
        title: "Validation Error",
        description: "Please specify how you heard about us",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      const finalReferralSource = referralSource === 'other' ? customReferralSource : referralSource;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            phone: phone,
            phone_country_code: phoneCountryCode,
            country: country,
            referral_source: finalReferralSource,
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign Up Failed",
          description: error.message,
        });
      } else {
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account. After verification, you'll be redirected to complete your fitness assessment.",
        });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      {/* Back Button */}
      <Button 
        onClick={() => window.location.href = '/'}
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 text-foreground hover:text-primary hover:bg-accent hover:text-black"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Button>

      <Card className="w-full max-w-md bg-gradient-card border-border shadow-elevation">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-gradient-primary">
            Salim Saleh Fitness
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Access your personalized fitness journey
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:shadow-primary"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    required
                  />
                </div>
                
                <CountrySelect 
                  value={country}
                  onValueChange={setCountry}
                  required
                />
                
                <PhoneInput
                  countryCode={phoneCountryCode}
                  phoneNumber={phone}
                  onCountryCodeChange={setPhoneCountryCode}
                  onPhoneNumberChange={setPhone}
                  required
                />
                
                <div className="space-y-2">
                  <Label htmlFor="referralSource">How did you hear about us?</Label>
                  <Select value={referralSource} onValueChange={setReferralSource} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="social_media">Social Media (Instagram, Facebook, etc.)</SelectItem>
                      <SelectItem value="google_search">Google Search</SelectItem>
                      <SelectItem value="friend_family">Friend or Family Recommendation</SelectItem>
                      <SelectItem value="gym_fitness_center">Gym or Fitness Center</SelectItem>
                      <SelectItem value="online_ad">Online Advertisement</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="fitness_app">Fitness App</SelectItem>
                      <SelectItem value="health_professional">Health Professional</SelectItem>
                      <SelectItem value="word_of_mouth">Word of Mouth</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {referralSource === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="customReferralSource">Please specify</Label>
                    <Input
                      id="customReferralSource"
                      type="text"
                      placeholder="Tell us how you heard about us"
                      value={customReferralSource}
                      onChange={(e) => setCustomReferralSource(e.target.value)}
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="signupEmail">Email</Label>
                  <Input
                    id="signupEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signupPassword">Password</Label>
                  <div className="relative">
                    <Input
                      id="signupPassword"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  className="w-full bg-gradient-primary hover:shadow-primary"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;