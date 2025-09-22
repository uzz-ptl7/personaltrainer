import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Download, LogOut, Video, User as UserIcon, Clock, CheckCircle, ShoppingBag } from "lucide-react";
import ServicesStore from "./ServicesStore";

interface DashboardProps {
  user: User;
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

const Dashboard = ({ user, onSignOut }: DashboardProps) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStore, setShowStore] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    setLoading(true);

    try {
      // Load purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          *,
          service:services (
            id,
            title,
            description,
            type,
            includes_meet,
            includes_nutrition,
            includes_workout
          )
        `)
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')
        .order('purchased_at', { ascending: false });

      if (purchasesError) throw purchasesError;

      setPurchases(purchasesData || []);

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

      setBookings(bookingsData || []);
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out.",
      });
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('rw-RW', {
      style: 'currency',
      currency: 'RWF'
    }).format(amount);
  };

  if (showStore) {
    return <ServicesStore user={user} onBack={() => setShowStore(false)} />;
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
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gradient-primary">SSF Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.user_metadata?.full_name || user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowStore(true)}
              className="bg-gradient-primary hover:shadow-primary"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Browse Services
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">My Services</TabsTrigger>
            <TabsTrigger value="sessions">Upcoming Sessions</TabsTrigger>
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
                        onClick={() => setShowStore(true)}
                        className="mt-4 bg-gradient-primary hover:shadow-primary"
                      >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Browse Services
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
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
                          <div className="flex flex-wrap gap-2 mb-4">
                            {purchase.service.includes_workout && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Workout Plans
                              </Badge>
                            )}
                            {purchase.service.includes_nutrition && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Nutrition Guide
                              </Badge>
                            )}
                            {purchase.service.includes_meet && (
                              <Badge variant="outline" className="text-xs">
                                <Video className="h-3 w-3 mr-1" />
                                Video Sessions
                              </Badge>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Purchased: {formatDate(purchase.purchased_at)}
                              </p>
                              <p className="font-semibold">{formatCurrency(purchase.amount)}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-2" />
                              Access Program
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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

          <TabsContent value="profile" className="mt-8">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="mt-1">{user.user_metadata?.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="mt-1">{user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                    <p className="mt-1">{formatDate(user.created_at)}</p>
                  </div>
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