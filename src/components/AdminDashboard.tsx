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
import BookingManager from "./BookingManager";

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
  
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editServiceData, setEditServiceData] = useState<any>({});

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
      
      // Load purchases and services separately, then join manually
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('*')
        .order('purchased_at', { ascending: false });

      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Load bookings separately
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .order('scheduled_at', { ascending: true });
      
      // Load notifications
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Load video testimonials separately
      const { data: testimonialsData } = await supabase
        .from('video_testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      // Manually join data
      const enrichedPurchases = (purchasesData || []).map(purchase => ({
        ...purchase,
        service: servicesData?.find(s => s.id === purchase.service_id) || { title: 'Unknown Service', type: 'unknown' },
        profiles: clientsData?.find(c => c.user_id === purchase.user_id) || null
      }));

      const enrichedBookings = (bookingsData || []).map(booking => ({
        ...booking,
        service: servicesData?.find(s => s.id === booking.service_id) || { title: 'Unknown Service', type: 'unknown', includes_meet: false },
        profiles: clientsData?.find(c => c.user_id === booking.user_id) || null
      }));

      const enrichedTestimonials = (testimonialsData || []).map(testimonial => ({
        ...testimonial,
        profiles: clientsData?.find(c => c.user_id === testimonial.user_id) || null
      }));

      setClients(clientsData || []);
      setPurchases(enrichedPurchases);
      setBookings(enrichedBookings);
      setServices(servicesData || []);
      setNotifications(notificationsData || []);
      setVideoTestimonials(enrichedTestimonials);
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
        body: { booking_id: bookingId }
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
        .insert([newService]);

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

  const editService = (service: Service) => {
    setEditingService(service);
    setEditServiceData(service);
  };

  const updateService = async () => {
    if (!editingService) return;
    
    try {
      const { error } = await supabase
        .from('services')
        .update(editServiceData)
        .eq('id', editingService.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service updated successfully",
      });

      setEditingService(null);
      setEditServiceData({});
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    }
  };

  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service deactivated successfully",
      });

      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deactivate service",
        variant: "destructive",
      });
    }
  };

  const toggleServiceStatus = async (serviceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: isActive })
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Service ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update service status",
        variant: "destructive",
      });
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const approveTestimonial = async (testimonialId: string) => {
    try {
      const { error } = await supabase
        .from('video_testimonials')
        .update({ is_approved: true })
        .eq('id', testimonialId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Testimonial approved successfully",
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve testimonial",
        variant: "destructive",
      });
    }
  };

  const rejectTestimonial = async (testimonialId: string) => {
    try {
      const { error } = await supabase
        .from('video_testimonials')
        .delete()
        .eq('id', testimonialId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Testimonial rejected and removed",
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject testimonial",
        variant: "destructive",
      });
    }
  };

  const toggleFeature = async (testimonialId: string, featured: boolean) => {
    try {
      const { error } = await supabase
        .from('video_testimonials')
        .update({ is_featured: featured })
        .eq('id', testimonialId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Testimonial ${featured ? 'featured' : 'unfeatured'} successfully`,
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update testimonial",
        variant: "destructive",
      });
    }
  };

  const deleteTestimonial = async (testimonialId: string) => {
    try {
      const { error } = await supabase
        .from('video_testimonials')
        .delete()
        .eq('id', testimonialId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Testimonial deleted successfully",
      });
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete testimonial",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `RWF ${new Intl.NumberFormat('rw-RW').format(amount)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const upcomingSessions = bookings.filter(booking => 
    new Date(booking.scheduled_at) > new Date() && booking.status !== 'cancelled'
  );

  const pendingTestimonials = videoTestimonials.filter(t => !t.is_approved);
  const approvedTestimonials = videoTestimonials.filter(t => t.is_approved);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="SSF Logo" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <h1 className="font-heading font-bold text-xl text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Salim Saleh Fitness</p>
              </div>
            </div>
            <Button
              onClick={onSignOut}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-primary" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                      <p className="text-2xl font-bold text-foreground">{clients.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CalendarIcon className="h-8 w-8 text-primary" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Upcoming Sessions</p>
                      <p className="text-2xl font-bold text-foreground">{upcomingSessions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-primary" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold text-foreground">
                        ${purchases.reduce((sum, purchase) => sum + Number(purchase.amount), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Video className="h-8 w-8 text-primary" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Testimonials</p>
                      <p className="text-2xl font-bold text-foreground">{approvedTestimonials.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activities */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`p-3 rounded-lg border ${
                        notification.is_read ? 'bg-muted/50' : 'bg-primary/5 border-primary/20'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markNotificationRead(notification.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No notifications</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Upcoming Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingSessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="p-3 border border-border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              {session.profiles?.full_name || 'Unknown Client'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {session.service.title} • {formatDate(session.scheduled_at)}
                            </p>
                          </div>
                          <Badge className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {upcomingSessions.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No upcoming sessions</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Client Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {clients.map((client) => (
                    <div key={client.user_id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{client.full_name}</h3>
                            <div className={`w-2 h-2 rounded-full ${client.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-xs text-muted-foreground">
                              {client.is_online ? 'Online' : `Last seen ${formatDate(client.last_seen)}`}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.phone_country_code} {client.phone} • {client.country}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${client.email}`}
                          className="p-2 text-muted-foreground hover:text-primary transition-smooth"
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                        <a
                          href={`tel:${client.phone_country_code}${client.phone}`}
                          className="p-2 text-muted-foreground hover:text-primary transition-smooth"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <a
                          href={`https://wa.me/${client.phone_country_code}${client.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-muted-foreground hover:text-primary transition-smooth"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                        <Button
                          size="sm"
                          variant={client.is_blocked ? "default" : "destructive"}
                          onClick={() => blockClient(client.user_id, !client.is_blocked)}
                        >
                          {client.is_blocked ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Unblock
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Block
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Schedule New Session
                </CardTitle>
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
                        {clients.map((client) => (
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
                        {services.filter(s => s.is_active).map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Date & Time</Label>
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
                    placeholder="Session notes or special instructions"
                  />
                </div>
                <Button onClick={scheduleBooking}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Session
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  All Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">
                            {booking.profiles?.full_name || 'Unknown Client'}
                          </h3>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.service.title} • {formatDate(booking.scheduled_at)}
                        </p>
                        {booking.notes && (
                          <p className="text-sm text-muted-foreground mt-1">Notes: {booking.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.service.includes_meet && !booking.meet_link && (
                          <Button
                            size="sm"
                            onClick={() => createGoogleMeet(booking.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Create Meet
                          </Button>
                        )}
                        {booking.meet_link && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(booking.meet_link, '_blank')}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Join Meet
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Service
                </CardTitle>
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
                        <SelectItem value="session">Session</SelectItem>
                        <SelectItem value="program">Program</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newService.description}
                    onChange={(e) => setNewService({...newService, description: e.target.value})}
                    placeholder="Service description"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Price (RWF)</Label>
                    <Input
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({...newService, price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Duration (weeks)</Label>
                    <Input
                      type="number"
                      value={newService.duration_weeks}
                      onChange={(e) => setNewService({...newService, duration_weeks: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label>Session Length (minutes)</Label>
                    <Input
                      type="number"
                      value={newService.duration_minutes}
                      onChange={(e) => setNewService({...newService, duration_minutes: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div className="flex gap-6">
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

                  {/* Service Edit Modal */}
                  {editingService && (
                    <Dialog open={true} onOpenChange={() => setEditingService(null)}>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Edit Service</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={editServiceData.title || ''}
                                onChange={(e) => setEditServiceData({...editServiceData, title: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label>Type</Label>
                              <Select value={editServiceData.type} onValueChange={(value) => setEditServiceData({...editServiceData, type: value})}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="session">Session</SelectItem>
                                  <SelectItem value="program">Program</SelectItem>
                                  <SelectItem value="consultation">Consultation</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={editServiceData.description || ''}
                              onChange={(e) => setEditServiceData({...editServiceData, description: e.target.value})}
                            />
                          </div>
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <Label>Price (RWF)</Label>
                              <Input
                                type="number"
                                value={editServiceData.price || 0}
                                onChange={(e) => setEditServiceData({...editServiceData, price: Number(e.target.value)})}
                              />
                            </div>
                            <div>
                              <Label>Duration (weeks)</Label>
                              <Input
                                type="number"
                                value={editServiceData.duration_weeks || 0}
                                onChange={(e) => setEditServiceData({...editServiceData, duration_weeks: Number(e.target.value)})}
                              />
                            </div>
                            <div>
                              <Label>Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={editServiceData.duration_minutes || 0}
                                onChange={(e) => setEditServiceData({...editServiceData, duration_minutes: Number(e.target.value)})}
                              />
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editServiceData.includes_nutrition || false}
                                onChange={(e) => setEditServiceData({...editServiceData, includes_nutrition: e.target.checked})}
                              />
                              Includes Nutrition
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editServiceData.includes_workout || false}
                                onChange={(e) => setEditServiceData({...editServiceData, includes_workout: e.target.checked})}
                              />
                              Includes Workout
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editServiceData.includes_meet || false}
                                onChange={(e) => setEditServiceData({...editServiceData, includes_meet: e.target.checked})}
                              />
                              Includes Video Call
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={updateService} className="flex-1">
                              Update Service
                            </Button>
                            <Button variant="outline" onClick={() => setEditingService(null)} className="flex-1">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
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
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;