import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Calendar as CalendarIcon, 
  Settings, 
  Bell, 
  UserX, 
  Phone, 
  Mail, 
  MessageCircle,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  LogOut,
  Video,
  X
} from "lucide-react";
import logo from "@/assets/ssf-logo.jpg";

interface AdminDashboardProps {
  user: any;
  onSignOut: () => void;
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  phone_country_code: string;
  country: string;
  is_blocked: boolean;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

interface Purchase {
  id: string;
  user_id: string;
  service_id: string;
  amount: number;
  payment_status: string;
  purchased_at: string;
  service: {
    title: string;
    type: string;
  };
  profiles?: Profile;
}

interface Booking {
  id: string;
  user_id: string;
  service_id: string;
  scheduled_at: string;
  status: string;
  notes: string;
  meet_link: string;
  profiles?: Profile;
  service: {
    title: string;
    type: string;
    includes_meet: boolean;
  };
}

interface Service {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  duration_weeks: number;
  duration_minutes: number;
  includes_nutrition: boolean;
  includes_workout: boolean;
  includes_meet: boolean;
  is_active: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

interface VideoTestimonial {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  profiles?: Profile;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onSignOut }) => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Profile[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [videoTestimonials, setVideoTestimonials] = useState<VideoTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [newBooking, setNewBooking] = useState({
    user_id: '',
    service_id: '',
    scheduled_at: '',
    notes: ''
  });
  const [newService, setNewService] = useState({
    title: '',
    description: '',
    type: 'session',
    price: 0,
    duration_weeks: 0,
    duration_minutes: 60,
    includes_nutrition: false,
    includes_workout: false,
    includes_meet: false
  });

  useEffect(() => {
    loadData();
    setupRealtimeSubscriptions();
  }, []);

  const loadData = async () => {
    try {
      // Load clients
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_admin', false);
      
      // Load purchases with profiles and services - using simpler approach
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('*, service:services(title, type)')
        .order('purchased_at', { ascending: false });
      
      // Load bookings with profiles and services - using simpler approach  
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*, service:services(title, type, includes_meet)')
        .order('scheduled_at', { ascending: true });
      
      // Load services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Load notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Load video testimonials with profiles
      const { data: testimonialsData } = await supabase
        .from('video_testimonials')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });

      setClients(clientsData || []);
      setPurchases(purchasesData || []);
      setBookings(bookingsData || []);
      setServices(servicesData || []);
      setNotifications(notificationsData || []);
      setVideoTestimonials(testimonialsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const profilesChannel = supabase
      .channel('admin-profiles')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadData()
      )
      .subscribe();

    const purchasesChannel = supabase
      .channel('admin-purchases')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'purchases' },
        () => loadData()
      )
      .subscribe();

    const bookingsChannel = supabase
      .channel('admin-bookings')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => loadData()
      )
      .subscribe();

    const notificationsChannel = supabase
      .channel('admin-notifications')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => loadData()
      )
      .subscribe();

    const testimonialsChannel = supabase
      .channel('admin-video-testimonials')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'video_testimonials' },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(purchasesChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(testimonialsChannel);
    };
  };

  const blockClient = async (clientId: string, blocked: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: blocked })
        .eq('user_id', clientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Client ${blocked ? 'blocked' : 'unblocked'} successfully`,
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update client status",
        variant: "destructive",
      });
    }
  };

  const scheduleBooking = async () => {
    try {
      // Find an active purchase for this user and service
      const purchase = purchases.find(p => 
        p.user_id === newBooking.user_id && 
        p.service_id === newBooking.service_id &&
        p.payment_status === 'completed'
      );

      if (!purchase) {
        toast({
          title: "Error",
          description: "Client must purchase this service first",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: newBooking.user_id,
          service_id: newBooking.service_id,
          purchase_id: purchase.id,
          scheduled_at: newBooking.scheduled_at,
          notes: newBooking.notes,
          duration_minutes: services.find(s => s.id === newBooking.service_id)?.duration_minutes || 60
        });

      if (error) throw error;

      // Send notification to client
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: newBooking.user_id,
          title: 'New Session Scheduled',
          message: `Your session has been scheduled for ${new Date(newBooking.scheduled_at).toLocaleString()}`,
          type: 'info'
        }
      });

      toast({
        title: "Success",
        description: "Booking scheduled successfully",
      });

      setNewBooking({ user_id: '', service_id: '', scheduled_at: '', notes: '' });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule booking",
        variant: "destructive",
      });
    }
  };

  const createGoogleMeet = async (bookingId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-google-meet', {
        body: { bookingId }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Google Meet link created successfully",
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create Google Meet link",
        variant: "destructive",
      });
    }
  };

  const createService = async () => {
    try {
      const { error } = await supabase
        .from('services')
        .insert(newService);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service created successfully",
      });

      setNewService({
        title: '',
        description: '',
        type: 'session',
        price: 0,
        duration_weeks: 0,
        duration_minutes: 60,
        includes_nutrition: false,
        includes_workout: false,
        includes_meet: false
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create service",
        variant: "destructive",
      });
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      loadData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="SSF Logo" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-gradient-primary">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Salim Saleh Fitness</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="h-6 w-6 text-muted-foreground" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {notifications.filter(n => !n.is_read).length}
                </Badge>
              )}
            </div>
            <Button onClick={onSignOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="bookings">Sessions</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <div className="grid gap-6">
              {clients.map((client) => (
                <Card key={client.user_id} className="bg-gradient-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {client.full_name}
                          <Badge variant={client.is_online ? "default" : "secondary"}>
                            {client.is_online ? "Online" : "Offline"}
                          </Badge>
                          {client.is_blocked && (
                            <Badge variant="destructive">Blocked</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          {client.email} • {client.phone_country_code} {client.phone}
                        </CardDescription>
                        <p className="text-sm text-muted-foreground">
                          {client.country} • Joined {formatDate(client.created_at)}
                        </p>
                        {!client.is_online && (
                          <p className="text-sm text-muted-foreground">
                            Last seen: {formatDate(client.last_seen)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`mailto:${client.email}`)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`tel:${client.phone_country_code}${client.phone}`)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(`https://wa.me/${client.phone_country_code.replace('+', '')}${client.phone}`)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant={client.is_blocked ? "default" : "destructive"}
                          onClick={() => blockClient(client.user_id, !client.is_blocked)}
                        >
                          {client.is_blocked ? <CheckCircle className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Purchases</h4>
                        {purchases
                          .filter(p => p.user_id === client.user_id)
                          .map(purchase => (
                            <div key={purchase.id} className="text-sm text-muted-foreground">
                              {purchase.service.title} - {formatCurrency(purchase.amount)}
                              <Badge 
                                variant={purchase.payment_status === 'completed' ? "default" : "secondary"}
                                className="ml-2"
                              >
                                {purchase.payment_status}
                              </Badge>
                            </div>
                          ))}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Upcoming Sessions</h4>
                        {bookings
                          .filter(b => b.user_id === client.user_id && new Date(b.scheduled_at) > new Date())
                          .map(booking => (
                            <div key={booking.id} className="text-sm text-muted-foreground">
                              {booking.service.title} - {formatDate(booking.scheduled_at)}
                            </div>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>Schedule New Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Client</Label>
                    <Select value={newBooking.user_id} onValueChange={(value) => setNewBooking({...newBooking, user_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.user_id} value={client.user_id}>
                            {client.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Service</Label>
                    <Select value={newBooking.service_id} onValueChange={(value) => setNewBooking({...newBooking, service_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.filter(s => s.is_active).map(service => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Scheduled Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={newBooking.scheduled_at}
                    onChange={(e) => setNewBooking({...newBooking, scheduled_at: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                    placeholder="Session notes..."
                  />
                </div>
                <Button onClick={scheduleBooking}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {bookings.map((booking) => (
                <Card key={booking.id} className="bg-gradient-card border-border">
                  <CardHeader>
                  <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{booking.profiles.full_name}</CardTitle>
                        <CardDescription>
                          {booking.service.title} • {formatDate(booking.scheduled_at)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={booking.status === 'completed' ? "default" : "secondary"}>
                          {booking.status}
                        </Badge>
                        {!booking.meet_link && booking.service.includes_meet && (
                          <Button size="sm" onClick={() => createGoogleMeet(booking.id)}>
                            Create Meet
                          </Button>
                        )}
                        {booking.meet_link && (
                          <Button size="sm" variant="outline" onClick={() => window.open(booking.meet_link)}>
                            Join Meet
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {booking.notes && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{booking.notes}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>Create New Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={newService.title}
                      onChange={(e) => setNewService({...newService, title: e.target.value})}
                      placeholder="Service title"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={newService.type} onValueChange={(value) => setNewService({...newService, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="program">Training Program</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="session">Personal Session</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newService.description}
                    onChange={(e) => setNewService({...newService, description: e.target.value})}
                    placeholder="Service description..."
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({...newService, price: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Duration (weeks)</Label>
                    <Input
                      type="number"
                      value={newService.duration_weeks}
                      onChange={(e) => setNewService({...newService, duration_weeks: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Session Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={newService.duration_minutes}
                      onChange={(e) => setNewService({...newService, duration_minutes: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newService.includes_nutrition}
                      onChange={(e) => setNewService({...newService, includes_nutrition: e.target.checked})}
                    />
                    Includes Nutrition
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newService.includes_workout}
                      onChange={(e) => setNewService({...newService, includes_workout: e.target.checked})}
                    />
                    Includes Workout
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newService.includes_meet}
                      onChange={(e) => setNewService({...newService, includes_meet: e.target.checked})}
                    />
                    Includes Video Call
                  </label>
                </div>
                <Button onClick={createService}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Service
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {services.map((service) => (
                <Card key={service.id} className="bg-gradient-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{service.title}</CardTitle>
                        <CardDescription>{service.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={service.is_active ? "default" : "secondary"}>
                          {service.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(service.price)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{service.type}</Badge>
                      {service.duration_weeks > 0 && (
                        <Badge variant="outline">{service.duration_weeks} weeks</Badge>
                      )}
                      {service.duration_minutes > 0 && (
                        <Badge variant="outline">{service.duration_minutes} minutes</Badge>
                      )}
                      {service.includes_nutrition && <Badge variant="outline">Nutrition</Badge>}
                      {service.includes_workout && <Badge variant="outline">Workout</Badge>}
                      {service.includes_meet && <Badge variant="outline">Video Call</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Testimonials Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Pending Approval */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Pending Approval ({pendingTestimonials.length})</h4>
                    {pendingTestimonials.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No testimonials pending approval</p>
                    ) : (
                      <div className="space-y-2">
                        {pendingTestimonials.map((testimonial) => (
                          <div key={testimonial.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{testimonial.title}</div>
                              <div className="text-sm text-muted-foreground">
                                by {testimonial.profiles?.full_name || 'Anonymous'} • {new Date(testimonial.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => approveTestimonial(testimonial.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => rejectTestimonial(testimonial.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Approved Testimonials */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Approved ({approvedTestimonials.length})</h4>
                    {approvedTestimonials.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No approved testimonials</p>
                    ) : (
                      <div className="space-y-2">
                        {approvedTestimonials.map((testimonial) => (
                          <div key={testimonial.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                            <div className="flex-1">
                              <div className="font-medium">{testimonial.title}</div>
                              <div className="text-sm text-muted-foreground">
                                by {testimonial.profiles?.full_name || 'Anonymous'} • Featured: {testimonial.is_featured ? 'Yes' : 'No'}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => toggleFeature(testimonial.id, !testimonial.is_featured)}
                              >
                                {testimonial.is_featured ? 'Unfeature' : 'Feature'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteTestimonial(testimonial.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(purchases.reduce((sum, p) => sum + p.amount, 0))}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Total Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{clients.length}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Sessions This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">
                    {bookings.filter(b => {
                      const bookingDate = new Date(b.scheduled_at);
                      const now = new Date();
                      return bookingDate.getMonth() === now.getMonth() && 
                             bookingDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>Recent Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {purchases
                    .sort((a, b) => new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime())
                    .slice(0, 10)
                    .map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <p className="font-semibold">{purchase.profiles.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {purchase.service.title} • {formatDate(purchase.purchased_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{formatCurrency(purchase.amount)}</p>
                          <Badge variant={purchase.payment_status === 'completed' ? "default" : "secondary"}>
                            {purchase.payment_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testimonials" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Video Testimonials Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Pending Approval */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Pending Approval ({pendingTestimonials.length})</h4>
                    {pendingTestimonials.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No testimonials pending approval</p>
                    ) : (
                      <div className="space-y-2">
                        {pendingTestimonials.map((testimonial) => (
                          <div key={testimonial.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{testimonial.title}</div>
                              <div className="text-sm text-muted-foreground">
                                by {testimonial.profiles?.full_name || 'Anonymous'} • {new Date(testimonial.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => approveTestimonial(testimonial.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => rejectTestimonial(testimonial.id)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Approved Testimonials */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Approved ({approvedTestimonials.length})</h4>
                    {approvedTestimonials.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No approved testimonials</p>
                    ) : (
                      <div className="space-y-2">
                        {approvedTestimonials.map((testimonial) => (
                          <div key={testimonial.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                            <div className="flex-1">
                              <div className="font-medium">{testimonial.title}</div>
                              <div className="text-sm text-muted-foreground">
                                by {testimonial.profiles?.full_name || 'Anonymous'} • Featured: {testimonial.is_featured ? 'Yes' : 'No'}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => toggleFeature(testimonial.id, !testimonial.is_featured)}
                              >
                                {testimonial.is_featured ? 'Unfeature' : 'Feature'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => deleteTestimonial(testimonial.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`bg-gradient-card border-border cursor-pointer ${!notification.is_read ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => !notification.is_read && markNotificationRead(notification.id)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {notification.type === 'info' && <AlertCircle className="h-5 w-5 text-blue-500" />}
                        {notification.type === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-500" />}
                        {notification.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <Badge variant="destructive" className="text-xs">New</Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(notification.created_at)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{notification.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;