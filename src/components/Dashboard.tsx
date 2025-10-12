import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Download, LogOut, Video, User as UserIcon, Clock, CheckCircle, ShoppingBag, ExternalLink, Mail, Phone, MessageCircle, Activity, Edit, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ServicesStore from "./ServicesStore";
import AdminDashboard from "./AdminDashboard";
import logo from "@/assets/ssf-logo.jpg";

interface DashboardProps {
  user: any;
  onSignOut: () => void;
}

interface Purchase {
  id: string;
  service: {
    id: string;
    title: string;
    description: string;
    type: string;
    includes_meet: boolean;
    includes_nutrition: boolean;
    includes_workout: boolean;
  };
  amount: number;
  payment_status: string;
  purchased_at: string;
}

interface Booking {
  id: string;
  service: {
    title: string;
    type: string;
  };
  scheduled_at: string;
  duration_minutes: number;
  meet_link: string | null;
  status: string;
  notes: string | null;
}

interface FitnessAssessment {
  id: string;
  user_id: string;
  weight_kg: number;
  bmi: number;
  body_fat_percentage: number;
  heart_rate_bpm: number;
  muscle_mass_kg: number;
  bmr_kcal: number;
  water_percentage: number;
  body_fat_mass_kg: number;
  lean_body_mass_kg: number;
  bone_mass_kg: number;
  visceral_fat: number;
  protein_percentage: number;
  skeletal_muscle_mass_kg: number;
  subcutaneous_fat_percentage: number;
  body_age: number;
  body_type: string;
  created_at: string | null;
  updated_at: string | null;
}

const bodyTypes = [
  "Hidden Obese",
  "Obese", 
  "Solidly-built",
  "Under exercised",
  "Standard",
  "Standard Muscular",
  "Thin",
  "Thin and Muscular",
  "Very Muscular"
];

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fitnessAssessment, setFitnessAssessment] = useState<FitnessAssessment | null>(null);
  const [isEditingAssessment, setIsEditingAssessment] = useState(false);
  const [editAssessmentData, setEditAssessmentData] = useState<Partial<FitnessAssessment>>({});
  const [loading, setLoading] = useState(true);
  const [showServicesStore, setShowServicesStore] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      // Load user profile to check admin status
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setProfile(profileData);
      setIsAdmin(profileData?.is_admin || false);
      
      // Update user's online status
      await supabase
        .from('profiles')
        .update({ 
          is_online: true, 
          last_seen: new Date().toISOString() 
        })
        .eq('user_id', user.id);

      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          *,
          service:services (*)
        `)
        .eq('user_id', user.id);

      if (purchasesError) throw purchasesError;

      setPurchases(
        (purchasesData || []).map((purchase: any) => ({
          ...purchase,
          service: {
            ...purchase.service,
            description: purchase.service.description ?? "",
          },
        }))
      );

      // Load bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services (
            title,
            type
          )
        `)
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });

      if (bookingsError) throw bookingsError;

      setBookings(
        (bookingsData || []).map((booking: any) => ({
          ...booking,
          duration_minutes: booking.duration_minutes ?? 0,
        }))
      );

      // Load fitness assessment
      const { data: assessmentData } = await supabase
        .from('fitness_assessments')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (assessmentData) {
        setFitnessAssessment(assessmentData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your data. Please refresh the page.",
      });
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    // Update user's offline status
    await supabase
      .from('profiles')
      .update({ 
        is_online: false, 
        last_seen: new Date().toISOString() 
      })
      .eq('user_id', user.id);
      
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    } else {
      onSignOut();
    }
  };

  const createMeetingForBooking = async (bookingId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-google-meet', {
        body: { bookingId }
      });

      if (error) throw error;

      toast({
        title: "Meeting Created",
        description: "Google Meet link has been generated for your session.",
      });

      // Refresh bookings to get the updated meet link
      loadUserData();
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create Google Meet link.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `$${new Intl.NumberFormat('en-US').format(amount)}`;
  };
  
  const handleContactSupport = () => {
    const adminEmail = "salim@ssf.com";
    const subject = "Support Request";
    const body = `Hi Salim,\n\nI need assistance with:\n\n[Please describe your issue or question here]\n\nBest regards,\n${profile?.full_name || user.email}`;
    
    window.open(`mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handleEditAssessment = () => {
    if (fitnessAssessment) {
      setEditAssessmentData(fitnessAssessment);
      setIsEditingAssessment(true);
    }
  };

  const handleSaveAssessment = async () => {
    try {
      const { error } = await supabase
        .from('fitness_assessments')
        .update(editAssessmentData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Assessment Updated",
        description: "Your fitness assessment has been updated successfully.",
      });

      setFitnessAssessment({ ...fitnessAssessment!, ...editAssessmentData });
      setIsEditingAssessment(false);
      setEditAssessmentData({});
    } catch (error) {
      console.error('Error updating assessment:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your fitness assessment.",
      });
    }
  };

  const bodyTypes = [
    "Ectomorph",
    "Mesomorph", 
    "Endomorph",
    "Ecto-Mesomorph",
    "Meso-Endomorph"
  ];

  if (isAdmin) {
    return <AdminDashboard user={user} onSignOut={handleSignOut} />;
  }
  
  if (showServicesStore) {
    return <ServicesStore user={user} onBack={() => setShowServicesStore(false)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="SSF Logo" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {profile?.full_name || user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => window.location.href = '/'} variant="ghost" size="sm">
              Home
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services">My Services</TabsTrigger>
            <TabsTrigger value="sessions">Upcoming Sessions</TabsTrigger>
            <TabsTrigger value="assessment">Fitness Assessment</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-8">
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Your Purchased Services</h2>
                {purchases.length === 0 ? (
                  <Card className="bg-gradient-card">
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">You haven't purchased any services yet.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Browse our programs and start your fitness journey today!
                      </p>
                      <Button 
                        onClick={() => setShowServicesStore(true)}
                        className="mt-4 bg-gradient-primary hover:shadow-primary"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Browse Services
                      </Button>
                    </CardContent>
                  </Card>
                 ) : (
                   <div className="space-y-4">
                     <div className="grid gap-4">
                       {purchases.map((purchase) => (
                         <Card key={purchase.id} className="bg-gradient-card border-border">
                           <CardHeader>
                             <div className="flex justify-between items-start">
                               <div>
                                 <CardTitle className="text-lg">{purchase.service.title}</CardTitle>
                                 <CardDescription>{purchase.service.description}</CardDescription>
                               </div>
                               <Badge variant="secondary" className="capitalize">
                                 {purchase.service.type}
                               </Badge>
                             </div>
                           </CardHeader>
                           <CardContent>
...
                           </CardContent>
                         </Card>
                       ))}
                     </div>
                     {/* Browse More Services Button */}
                     <div className="text-center pt-4 border-t border-border">
                       <Button 
                         onClick={() => setShowServicesStore(true)}
                         variant="outline"
                         className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                       >
                         <ShoppingBag className="h-4 w-4 mr-2" />
                         Browse More Services
                       </Button>
                     </div>
                   </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="mt-8">
            <div className="grid gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
                {bookings.length === 0 ? (
                  <Card className="bg-gradient-card">
                    <CardContent className="py-8 text-center">
                      <p className="text-muted-foreground">No upcoming sessions scheduled.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Book a session to get started with your training!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id} className="bg-gradient-card border-border">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{booking.service.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(booking.scheduled_at)}
                                </p>
                              </div>
                            </div>
                            <Badge 
                              variant={booking.status === 'scheduled' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 mb-4">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              Duration: {booking.duration_minutes} minutes
                            </p>
                          </div>
                          
                          {booking.notes && (
                            <p className="text-sm text-muted-foreground mb-4">
                              Notes: {booking.notes}
                            </p>
                          )}
                          
                          <div className="flex justify-between items-center">
                            {booking.meet_link ? (
                              <Button 
                                size="sm" 
                                className="bg-gradient-primary"
                                onClick={() => window.open(booking.meet_link!, '_blank')}
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Join Meeting
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => createMeetingForBooking(booking.id)}
                              >
                                <Video className="h-4 w-4 mr-2" />
                                Generate Meet Link
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assessment" className="mt-8">
            <div className="grid gap-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Fitness Assessment</h2>
                  {fitnessAssessment && !isEditingAssessment && (
                    <Button onClick={handleEditAssessment} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Assessment
                    </Button>
                  )}
                  {isEditingAssessment && (
                    <div className="flex gap-2">
                      <Button onClick={handleSaveAssessment} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsEditingAssessment(false);
                          setEditAssessmentData({});
                        }} 
                        variant="outline" 
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                
                {!fitnessAssessment ? (
                  <Card className="bg-gradient-card">
                    <CardContent className="py-8 text-center">
                      <Activity className="h-12 w-12 text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">No fitness assessment completed yet.</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Complete your fitness assessment to get personalized training recommendations.
                      </p>
                      <Button 
                        onClick={() => window.location.href = '/fitness-assessment'}
                        className="mt-4 bg-gradient-primary hover:shadow-primary"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Complete Assessment
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gradient-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Your Fitness Assessment
                      </CardTitle>
                      <CardDescription>
                        Last updated: {fitnessAssessment.updated_at ? formatDate(fitnessAssessment.updated_at) : 'N/A'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Basic Metrics */}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Weight (KG)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editAssessmentData.weight_kg || fitnessAssessment.weight_kg}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, weight_kg: parseFloat(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.weight_kg} kg</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">BMI</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editAssessmentData.bmi || fitnessAssessment.bmi}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, bmi: parseFloat(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.bmi}</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Body Fat (%)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editAssessmentData.body_fat_percentage || fitnessAssessment.body_fat_percentage}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, body_fat_percentage: parseFloat(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.body_fat_percentage}%</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Heart Rate (BPM)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              value={editAssessmentData.heart_rate_bpm || fitnessAssessment.heart_rate_bpm}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, heart_rate_bpm: parseInt(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.heart_rate_bpm} bpm</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Muscle Mass (KG)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editAssessmentData.muscle_mass_kg || fitnessAssessment.muscle_mass_kg}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, muscle_mass_kg: parseFloat(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.muscle_mass_kg} kg</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">BMR (KCAL)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              value={editAssessmentData.bmr_kcal || fitnessAssessment.bmr_kcal}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, bmr_kcal: parseInt(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.bmr_kcal} kcal</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Water (%)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editAssessmentData.water_percentage || fitnessAssessment.water_percentage}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, water_percentage: parseFloat(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.water_percentage}%</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Visceral Fat</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              value={editAssessmentData.visceral_fat || fitnessAssessment.visceral_fat}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, visceral_fat: parseInt(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.visceral_fat}</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Body Fat Mass (KG)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editAssessmentData.body_fat_mass_kg || fitnessAssessment.body_fat_mass_kg}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, body_fat_mass_kg: parseFloat(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.body_fat_mass_kg} kg</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Lean Body Mass (KG)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editAssessmentData.lean_body_mass_kg || fitnessAssessment.lean_body_mass_kg}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, lean_body_mass_kg: parseFloat(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.lean_body_mass_kg} kg</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Bone Mass (KG)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editAssessmentData.bone_mass_kg || fitnessAssessment.bone_mass_kg}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, bone_mass_kg: parseFloat(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.bone_mass_kg} kg</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Protein (%)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editAssessmentData.protein_percentage || fitnessAssessment.protein_percentage}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, protein_percentage: parseFloat(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.protein_percentage}%</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Skeletal Muscle Mass (KG)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editAssessmentData.skeletal_muscle_mass_kg || fitnessAssessment.skeletal_muscle_mass_kg}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, skeletal_muscle_mass_kg: parseFloat(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.skeletal_muscle_mass_kg} kg</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Subcutaneous Fat (%)</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={editAssessmentData.subcutaneous_fat_percentage || fitnessAssessment.subcutaneous_fat_percentage}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, subcutaneous_fat_percentage: parseFloat(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.subcutaneous_fat_percentage}%</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Body Age</p>
                          {isEditingAssessment ? (
                            <Input
                              type="number"
                              value={editAssessmentData.body_age || fitnessAssessment.body_age}
                              onChange={(e) => setEditAssessmentData({...editAssessmentData, body_age: parseInt(e.target.value)})}
                            />
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.body_age} years</p>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-muted-foreground">Body Type</p>
                          {isEditingAssessment ? (
                            <Select 
                              value={editAssessmentData.body_type || fitnessAssessment.body_type} 
                              onValueChange={(value) => setEditAssessmentData({...editAssessmentData, body_type: value})}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {bodyTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-lg font-semibold">{fitnessAssessment.body_type}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
              <Card className="bg-gradient-card border-border shadow-elevation">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gradient-primary">
                    <UserIcon className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium text-foreground">{profile?.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">
                      {profile?.phone ? `${profile?.phone_country_code} ${profile?.phone}` : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Country</p>
                    <p className="font-medium text-foreground">{profile?.country || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Member since</p>
                    <p className="font-medium text-foreground">
                      {formatDate(user.created_at)}
                    </p>
                  </div>
                  <div className="pt-4 space-y-2">
                    <Button 
                      onClick={handleContactSupport}
                      variant="outline" 
                      className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                    {profile?.phone && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => window.open(`tel:${profile.phone_country_code}${profile.phone}`)}
                          variant="outline" 
                          className="flex-1"
                        >
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </Button>
                        <Button 
                          onClick={() => window.open(`https://wa.me/${profile.phone_country_code.replace('+', '')}${profile.phone}`)}
                          variant="outline" 
                          className="flex-1"
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          WhatsApp
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;