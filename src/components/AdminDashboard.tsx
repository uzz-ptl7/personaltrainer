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
  X,
  Download,
  ShoppingBag,
  Menu,
  Home,
  Activity,
  Save,
  FileText
} from "lucide-react";
import * as XLSX from 'xlsx';
import logo from "@/assets/ssf-logo.jpg";
import BookingManager from "./BookingManager";
import ConsultationManager from "./ConsultationManager";
import ServicePlanManager from "./ServicePlanManager";

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
  referral_source: string | null;
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

interface TextTestimonial {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  company?: string;
  content: string;
  rating: number;
  website?: string;
  email: string;
  phone: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

interface NewsletterSubscriber {
  id: string;
  name: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
  created_at: string;
  processed?: boolean;
}

interface OneTimeRequest {
  id: string;
  name: string;
  email: string;
  goal?: string;
  fitness_level?: string;
  allergies?: string;
  notes?: string;
  source?: string;
  created_at: string;
  processed?: boolean;
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
  created_at: string;
  updated_at: string;
  profiles?: Profile;
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

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onSignOut }) => {
  const { toast } = useToast();
  const [clients, setClients] = useState<Profile[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [textTestimonials, setTextTestimonials] = useState<TextTestimonial[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [fitnessAssessments, setFitnessAssessments] = useState<FitnessAssessment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [oneTimeRequests, setOneTimeRequests] = useState<OneTimeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [newBooking, setNewBooking] = useState({
    user_id: '',
    service_id: '',
    scheduled_at: '',
    notes: '',
    meet_link: ''
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

  const [editingService, setEditingService] = useState<string | null>(null);
  const [editServiceData, setEditServiceData] = useState<any>({});
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Assessment editing state
  const [editingAssessment, setEditingAssessment] = useState<string | null>(null);
  const [editAssessmentData, setEditAssessmentData] = useState<any>({});

  // State for available services for selected client
  const [availableServices, setAvailableServices] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    const fetchClientServices = async () => {
      if (!newBooking.user_id) {
        setAvailableServices([]);
        return;
      }

      console.log('🔍 AdminDashboard: Fetching services for client:', newBooking.user_id);

      try {
        // First, let's check ALL purchases for this user (regardless of payment status)
        const { data: allPurchasesData, error: allPurchasesError } = await supabase
          .from('purchases')
          .select('id, service_id, payment_status, user_id')
          .eq('user_id', newBooking.user_id);

        console.log('🔍 ALL purchases for this user (any status):', allPurchasesData);

        // If there are pending purchases, let's log them for manual update
        if (allPurchasesData && allPurchasesData.length > 0) {
          const pendingPurchases = allPurchasesData.filter(p => p.payment_status === 'pending');
          if (pendingPurchases.length > 0) {
            console.log('⚠️ Found pending purchases that could be marked as completed:');
            pendingPurchases.forEach(p => {
              console.log(`- Purchase ID: ${p.id}, Service ID: ${p.service_id}, Status: ${p.payment_status}`);
            });
            console.log('💡 You can update these to "completed" status in the database or using the function below');
            console.log('🔧 To fix this, run in console: window.updatePurchaseStatus("161a8654-c76d-48e8-b89f-b22e4b9c2c7f", "completed")');
          }
        }

        // Get client's completed purchases
        const { data: purchasesData, error: purchasesError } = await supabase
          .from('purchases')
          .select('id, service_id, payment_status, user_id')
          .eq('user_id', newBooking.user_id)
          .eq('payment_status', 'completed');

        if (purchasesError) throw purchasesError;
        console.log('🛒 Client purchases (completed only):', purchasesData);

        if (!purchasesData || purchasesData.length === 0) {
          setAvailableServices([]);
          return;
        }

        // Get services for these purchases
        const serviceIds = purchasesData.map(p => p.service_id);
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, title')
          .in('id', serviceIds);

        if (servicesError) throw servicesError;
        console.log('🎯 Available services for client:', servicesData);

        setAvailableServices(servicesData || []);
      } catch (error) {
        console.error('Error fetching services for client:', error);
        setAvailableServices([]);
      }
    };
    fetchClientServices();
  }, [newBooking.user_id]);

  // Get available services for selected client
  const getAvailableServicesForClient = (clientId: string) => {
    const clientPurchases = purchases.filter(p =>
      p.user_id === clientId &&
      p.payment_status === 'completed'
    );

    return services.filter(service =>
      clientPurchases.some(purchase => purchase.service_id === service.id)
    );
  };

  // Temporary helper function to update purchase status
  const updatePurchaseStatus = async (purchaseId: string, newStatus: 'completed' | 'pending' | 'failed' | 'refunded') => {
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ payment_status: newStatus })
        .eq('id', purchaseId);

      if (error) throw error;

      console.log(`✅ Updated purchase ${purchaseId} to ${newStatus} status`);
      toast({
        title: "Success",
        description: `Purchase status updated to ${newStatus}`,
      });

      // Reload data
      loadData();
    } catch (error) {
      console.error('Error updating purchase status:', error);
      toast({
        title: "Error",
        description: "Failed to update purchase status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadData();
    const cleanup = setupRealtimeSubscriptions();

    // Add helper function to window for console access
    (window as any).updatePurchaseStatus = updatePurchaseStatus;

    return cleanup;
  }, []);

  // Handle body scroll when sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileSidebarOpen]);

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

      // Load text testimonials separately
      const { data: testimonialsData } = await supabase
        .from('text_testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      // Load newsletter subscribers
      const { data: subscribersData } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      // Load contact form submissions (if table exists)
      let contactsData: any[] = [];
      try {
        const { data: cData } = await supabase
          .from('contacts' as any)
          .select('*')
          .order('created_at', { ascending: false });
        contactsData = cData || [];
      } catch (err) {
        console.log('Contacts table not available yet');
      }

      // Load one-time requests (if table exists)
      let oneTimeData: any[] = [];
      try {
        const { data: rData } = await supabase
          .from('one_time_requests' as any)
          .select('*')
          .order('created_at', { ascending: false });
        oneTimeData = rData || [];
      } catch (err) {
        console.log('one_time_requests table not available yet');
      }

      // Load fitness assessments
      let fitnessAssessmentsData: any[] = [];
      try {
        const { data: assessmentsData } = await supabase
          .from('fitness_assessments')
          .select('*')
          .order('created_at', { ascending: false });
        fitnessAssessmentsData = assessmentsData || [];
      } catch (error) {
        console.log('Fitness assessments table not available yet');
      }

      // Manually join data
      const enrichedPurchases = (purchasesData || []).map(purchase => ({
        ...purchase,
        purchased_at: purchase.purchased_at ?? '',
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

      const enrichedAssessments = (fitnessAssessmentsData || []).map(assessment => ({
        ...assessment,
        profiles: clientsData?.find(c => c.user_id === assessment.user_id) || null
      }));

      setClients(
        (clientsData || []).map((c) => ({
          ...c,
          full_name: c.full_name ?? '',
          email: c.email ?? '',
          phone: c.phone ?? '',
          phone_country_code: c.phone_country_code ?? '',
          country: c.country ?? '',
          referral_source: c.referral_source ?? '',
          is_blocked: c.is_blocked ?? false,
          is_online: c.is_online ?? false,
          last_seen: c.last_seen ?? '',
          created_at: c.created_at ?? '',
        }))
      );
      setPurchases(
        enrichedPurchases.map((purchase) => ({
          ...purchase,
          purchased_at: purchase.purchased_at ?? '',
          profiles: purchase.profiles
            ? {
              ...purchase.profiles,
              full_name: purchase.profiles.full_name ?? '',
              email: purchase.profiles.email ?? '',
              phone: purchase.profiles.phone ?? '',
              phone_country_code: purchase.profiles.phone_country_code ?? '',
              country: purchase.profiles.country ?? '',
              last_seen: purchase.profiles.last_seen ?? '',
              created_at: purchase.profiles.created_at ?? '',
              is_blocked: purchase.profiles.is_blocked ?? false,
              is_online: purchase.profiles.is_online ?? false,
            }
            : undefined,
          service: {
            ...purchase.service,
            title: purchase.service?.title ?? 'Unknown Service',
            type: purchase.service?.type ?? 'unknown',
          },
          amount: Number(purchase.amount),
          payment_status: purchase.payment_status ?? 'pending',
          user_id: purchase.user_id,
          id: purchase.id,
          service_id: purchase.service_id,
        }))
      );
      setBookings(
        enrichedBookings.map((booking) => ({
          ...booking,
          notes: booking.notes ?? '',
          scheduled_at: booking.scheduled_at ?? '',
          status: booking.status ?? 'scheduled',
          meet_link: booking.meet_link ?? '',
          profiles: booking.profiles
            ? {
              ...booking.profiles,
              full_name: booking.profiles.full_name ?? '',
              email: booking.profiles.email ?? '',
              phone: booking.profiles.phone ?? '',
              phone_country_code: booking.profiles.phone_country_code ?? '',
              country: booking.profiles.country ?? '',
              last_seen: booking.profiles.last_seen ?? '',
              created_at: booking.profiles.created_at ?? '',
              is_blocked: booking.profiles.is_blocked ?? false,
              is_online: booking.profiles.is_online ?? false,
            }
            : undefined,
          service: {
            ...booking.service,
            title: booking.service?.title ?? 'Unknown Service',
            type: booking.service?.type ?? 'unknown',
            includes_meet: booking.service?.includes_meet ?? false,
          },
          user_id: booking.user_id,
          id: booking.id,
          service_id: booking.service_id,
        }))
      );
      setServices(
        (servicesData || []).map((service) => ({
          ...service,
          title: service.title ?? '',
          description: service.description ?? '',
          type: service.type ?? 'session',
          price: Number(service.price ?? 0),
          duration_weeks: Number(service.duration_weeks ?? 0),
          duration_minutes: Number(service.duration_minutes ?? 0),
          includes_nutrition: service.includes_nutrition ?? false,
          includes_workout: service.includes_workout ?? false,
          includes_meet: service.includes_meet ?? false,
          is_active: service.is_active ?? true,
          id: service.id,
        }))
      );
      setNotifications(
        (notificationsData || []).map((notification) => ({
          ...notification,
          is_read: notification.is_read ?? false,
          created_at: notification.created_at ?? '',
        }))
      );
      setTextTestimonials(
        enrichedTestimonials.map((testimonial) => ({
          ...testimonial,
          content: testimonial.content ?? '',
          name: testimonial.name ?? '',
          role: testimonial.role ?? '',
          company: testimonial.company ?? '',
          rating: Number(testimonial.rating ?? 5),
          website: testimonial.website ?? '',
          email: testimonial.email ?? '',
          phone: testimonial.phone ?? '',
          is_approved: testimonial.is_approved ?? false,
          is_featured: testimonial.is_featured ?? false,
          created_at: testimonial.created_at ?? '',
          updated_at: testimonial.updated_at ?? '',
          profiles: testimonial.profiles
            ? {
              ...testimonial.profiles,
              full_name: testimonial.profiles.full_name ?? '',
              email: testimonial.profiles.email ?? '',
              phone: testimonial.profiles.phone ?? '',
              phone_country_code: testimonial.profiles.phone_country_code ?? '',
              country: testimonial.profiles.country ?? '',
              last_seen: testimonial.profiles.last_seen ?? '',
              created_at: testimonial.profiles.created_at ?? '',
              is_blocked: testimonial.profiles.is_blocked ?? false,
              is_online: testimonial.profiles.is_online ?? false,
            }
            : undefined,
        }))
      );
      setNewsletterSubscribers(
        (subscribersData || []).map((subscriber) => ({
          ...subscriber,
          subscribed_at: subscriber.subscribed_at ?? '',
          is_active: subscriber.is_active ?? false,
        }))
      );
      setContacts((contactsData || []).map((c) => ({
        ...c,
        name: c.name ?? '',
        email: c.email ?? '',
        phone: c.phone ?? '',
        message: c.message ?? '',
        source: c.source ?? '',
        created_at: c.created_at ?? '',
      })));

      setOneTimeRequests((oneTimeData || []).map((r) => ({
        ...r,
        name: r.name ?? '',
        email: r.email ?? '',
        goal: r.goal ?? '',
        fitness_level: r.fitness_level ?? '',
        allergies: r.allergies ?? '',
        notes: r.notes ?? '',
        source: r.source ?? '',
        created_at: r.created_at ?? '',
      })));
      setFitnessAssessments(
        enrichedAssessments.map((assessment) => ({
          ...assessment,
          weight_kg: Number(assessment.weight_kg ?? 0),
          bmi: Number(assessment.bmi ?? 0),
          body_fat_percentage: Number(assessment.body_fat_percentage ?? 0),
          heart_rate_bpm: Number(assessment.heart_rate_bpm ?? 0),
          muscle_mass_kg: Number(assessment.muscle_mass_kg ?? 0),
          bmr_kcal: Number(assessment.bmr_kcal ?? 0),
          water_percentage: Number(assessment.water_percentage ?? 0),
          body_fat_mass_kg: Number(assessment.body_fat_mass_kg ?? 0),
          lean_body_mass_kg: Number(assessment.lean_body_mass_kg ?? 0),
          bone_mass_kg: Number(assessment.bone_mass_kg ?? 0),
          visceral_fat: Number(assessment.visceral_fat ?? 0),
          protein_percentage: Number(assessment.protein_percentage ?? 0),
          skeletal_muscle_mass_kg: Number(assessment.skeletal_muscle_mass_kg ?? 0),
          subcutaneous_fat_percentage: Number(assessment.subcutaneous_fat_percentage ?? 0),
          body_age: Number(assessment.body_age ?? 0),
          body_type: assessment.body_type ?? '',
          created_at: assessment.created_at ?? '',
          updated_at: assessment.updated_at ?? '',
          profiles: assessment.profiles
            ? {
              ...assessment.profiles,
              full_name: assessment.profiles.full_name ?? '',
              email: assessment.profiles.email ?? '',
              phone: assessment.profiles.phone ?? '',
              phone_country_code: assessment.profiles.phone_country_code ?? '',
              country: assessment.profiles.country ?? '',
              last_seen: assessment.profiles.last_seen ?? '',
              created_at: assessment.profiles.created_at ?? '',
              is_blocked: assessment.profiles.is_blocked ?? false,
              is_online: assessment.profiles.is_online ?? false,
            }
            : undefined,
        }))
      );
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
      .channel('admin-text-testimonials')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'text_testimonials' },
        () => loadData()
      )
      .subscribe();

    const subscribersChannel = supabase
      .channel('admin-newsletter-subscribers')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'newsletter_subscribers' },
        () => loadData()
      )
      .subscribe();

    const contactsChannel = supabase
      .channel('admin-contacts')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        () => loadData()
      )
      .subscribe();

    const oneTimeChannel = supabase
      .channel('admin-one-time-requests')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'one_time_requests' },
        () => loadData()
      )
      .subscribe();

    const assessmentsChannel = supabase
      .channel('admin-fitness-assessments')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'fitness_assessments' },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(purchasesChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(testimonialsChannel);
      supabase.removeChannel(subscribersChannel);
      supabase.removeChannel(contactsChannel);
      supabase.removeChannel(oneTimeChannel);
      supabase.removeChannel(assessmentsChannel);
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
          meet_link: newBooking.meet_link || null,
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

      setNewBooking({ user_id: '', service_id: '', scheduled_at: '', notes: '', meet_link: '' });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule booking",
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
    setEditingService(service.id);
    setEditServiceData(service);
  };

  const updateService = async () => {
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from('services')
        .update(editServiceData)
        .eq('id', editingService);

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
    if (!confirm('Are you sure you want to delete this service? This will also delete all related purchases and bookings.')) {
      return;
    }

    try {
      // Delete related data first due to foreign key constraints
      await supabase.from('bookings').delete().eq('service_id', serviceId);
      await supabase.from('purchases').delete().eq('service_id', serviceId);

      // Delete the service
      const { error } = await supabase.from('services').delete().eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Service and all related data deleted successfully",
      });

      loadData();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  // Admin helper: seed default plans requested by client
  const seedDefaultPlans = async () => {
    if (!confirm('Create default plans (90-day recurring + one-time plans)?')) return;
    try {
      const plans = [
        {
          title: '90-Day Customized Program',
          description: '90-day personalized coaching (recurring). Includes assessment, personalized workout & diet plan, weekly check-ins, daily accountability and downloadable PDFs. Billing: $250 per month.',
          type: 'program',
          price: 250,
          duration_weeks: 12,
          duration_minutes: 0,
          includes_nutrition: true,
          includes_workout: true,
          includes_meet: true,
          is_active: true
        },
        {
          title: 'One-time Customized Diet Plan',
          description: 'Custom diet plan delivered as PDF. One-time purchase. No ongoing coaching.',
          type: 'program',
          price: 25,
          duration_weeks: 0,
          duration_minutes: 0,
          includes_nutrition: true,
          includes_workout: false,
          includes_meet: false,
          is_active: true
        },
        {
          title: 'One-time Customized Workout Plan',
          description: 'Custom workout plan delivered as PDF. One-time purchase. No ongoing coaching.',
          type: 'program',
          price: 49.99,
          duration_weeks: 0,
          duration_minutes: 0,
          includes_nutrition: false,
          includes_workout: true,
          includes_meet: false,
          is_active: true
        },
        {
          title: 'Ultimate Weight Loss Diet Plan (Pre-made)',
          description: 'Pre-made diet plan for weight loss. Immediate download after purchase.',
          type: 'program',
          price: 25,
          duration_weeks: 0,
          duration_minutes: 0,
          includes_nutrition: true,
          includes_workout: false,
          includes_meet: false,
          is_active: true
        },
        {
          title: '30-Day Strength Builder (Pre-made)',
          description: '30 day pre-made strength program. Immediate download after purchase.',
          type: 'program',
          price: 25,
          duration_weeks: 4,
          duration_minutes: 0,
          includes_nutrition: false,
          includes_workout: true,
          includes_meet: false,
          is_active: true
        }
      ];

      const { error } = await supabase.from('services').insert(plans);
      if (error) throw error;

      toast({ title: 'Success', description: 'Default plans created' });
      loadData();
    } catch (err) {
      console.error('Error seeding default plans:', err);
      toast({ title: 'Error', description: 'Failed to create default plans', variant: 'destructive' });
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
        .from('text_testimonials')
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
        .from('text_testimonials')
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
        .from('text_testimonials')
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
        .from('text_testimonials')
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

  const exportContacts = () => {
    const dataForExport = contacts.map(c => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone || '',
      Message: c.message,
      Source: c.source || '',
      'Submitted At': new Date(c.created_at).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
    const fileName = `contacts_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({ title: 'Success', description: `Exported ${dataForExport.length} contacts to Excel` });
  };

  const exportOneTimeRequests = () => {
    const dataForExport = oneTimeRequests.map(r => ({
      Name: r.name,
      Email: r.email,
      Goal: r.goal || '',
      FitnessLevel: r.fitness_level || '',
      Allergies: r.allergies || '',
      Notes: r.notes || '',
      Source: r.source || '',
      'Submitted At': new Date(r.created_at).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OneTimeRequests');
    const fileName = `one_time_requests_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({ title: 'Success', description: `Exported ${dataForExport.length} requests to Excel` });
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Delete this contact submission?')) return;
    try {
      const { error } = await supabase.from('contacts' as any).delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Contact removed' });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete contact', variant: 'destructive' });
    }
  };

  const toggleProcessedContact = async (id: string, processed: boolean) => {
    try {
      const { error } = await supabase.from('contacts' as any).update({ processed }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Updated', description: `Contact marked ${processed ? 'processed' : 'unprocessed'}` });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update contact', variant: 'destructive' });
    }
  };

  const toggleProcessedOneTimeRequest = async (id: string, processed: boolean) => {
    try {
      const { error } = await supabase.from('one_time_requests' as any).update({ processed }).eq('id', id);
      if (error) throw error;
      toast({ title: 'Updated', description: `Request marked ${processed ? 'processed' : 'unprocessed'}` });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update request', variant: 'destructive' });
    }
  };

  const deleteOneTimeRequest = async (id: string) => {
    if (!confirm('Delete this one-time request?')) return;
    try {
      const { error } = await supabase.from('one_time_requests' as any).delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Request removed' });
      loadData();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete request', variant: 'destructive' });
    }
  };

  const exportNewsletterSubscribers = () => {
    const dataForExport = newsletterSubscribers.map(subscriber => ({
      Name: subscriber.name,
      Email: subscriber.email,
      'Subscribed Date': new Date(subscriber.subscribed_at).toLocaleDateString(),
      Status: subscriber.is_active ? 'Active' : 'Inactive'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataForExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Newsletter Subscribers');

    const fileName = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Success",
      description: `Exported ${dataForExport.length} subscribers to Excel`,
    });
  };

  // Assessment management functions
  const handleEditAssessment = (assessment: FitnessAssessment) => {
    setEditingAssessment(assessment.id);
    setEditAssessmentData(assessment);
  };

  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm('Are you sure you want to delete this fitness assessment? The user will need to complete it again when they log in.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('fitness_assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fitness assessment deleted successfully. User will need to complete assessment again.",
      });

      loadData();
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to delete assessment",
        variant: "destructive",
      });
    }
  };

  const updateAssessment = async () => {
    if (!editingAssessment) return;

    try {
      const { error } = await supabase
        .from('fitness_assessments')
        .update(editAssessmentData)
        .eq('id', editingAssessment);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Assessment updated successfully",
      });

      setEditingAssessment(null);
      setEditAssessmentData({});
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assessment",
        variant: "destructive",
      });
    }
  };

  // Delete functions
  const deleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This will also delete all their purchases and bookings.')) {
      return;
    }

    try {
      // Delete related data first due to foreign key constraints
      await supabase.from('bookings').delete().eq('user_id', clientId);
      await supabase.from('purchases').delete().eq('user_id', clientId);
      await supabase.from('text_testimonials').delete().eq('user_id', clientId);

      // Delete the profile
      const { error } = await supabase.from('profiles').delete().eq('user_id', clientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client and all related data deleted successfully",
      });

      loadData();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete client",
      });
    }
  };

  const deletePurchase = async (purchaseId: string) => {
    if (!confirm('Are you sure you want to delete this purchase?')) {
      return;
    }

    try {
      const { error } = await supabase.from('purchases').delete().eq('id', purchaseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Purchase deleted successfully",
      });

      loadData();
    } catch (error) {
      console.error('Error deleting purchase:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete purchase",
      });
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      const { error } = await supabase.from('bookings').delete().eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });

      loadData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete booking",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${new Intl.NumberFormat('en-US').format(amount)}`;
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

  const pendingTestimonials = textTestimonials.filter(t => !t.is_approved);
  const approvedTestimonials = textTestimonials.filter(t => t.is_approved);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isMobileSidebarOpen ? 'overflow-hidden' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="SSF Logo" className="h-8 w-8 rounded-full object-cover" />
              <div>
                <h1 className="font-heading font-bold lg:text-lg md:text-lg text-sm text-foreground">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">Salim Saleh Fitness</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: Settings },
              { id: 'clients', label: 'Clients', icon: Users },
              { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
              { id: 'sessions', label: 'Sessions', icon: CalendarIcon },
              { id: 'services', label: 'Services', icon: DollarSign },
              { id: 'assessments', label: 'Fitness Assessments', icon: Activity },
              { id: 'testimonials', label: 'Testimonials', icon: Video },
              { id: 'newsletter', label: 'Newsletter', icon: Mail },
              { id: 'contacts', label: 'Contacts', icon: Mail },
              { id: 'one_time_requests', label: 'One-time Requests', icon: FileText },
              { id: 'consultations', label: 'Consultations', icon: Clock },
              { id: 'dietplans', label: 'Diet Plans', icon: FileText },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
          <Button
            onClick={() => window.location.href = '/'}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Home className="h-5 w-5 mr-3" />
            Home
          </Button>
          <Button
            onClick={onSignOut}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <img src={logo} alt="SSF Logo" className="h-10 w-10 rounded-full object-cover" />
              <div>
                <h1 className="font-heading font-bold lg:text-xl text-lg text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Salim Saleh Fitness</p>
              </div>
            </div>

            {/* Desktop Navigation Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="border-muted-foreground text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
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
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-x-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full overflow-hidden">
          {/* Desktop Tabs */}
          <div className="hidden lg:block w-full overflow-x-auto">
            {/* Use inline-flex so tabs scroll horizontally cleanly on smaller desktop widths */}
            <TabsList className="inline-flex items-center space-x-2 py-2 px-1 w-max">
              <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
              <TabsTrigger value="clients" className="whitespace-nowrap">Clients</TabsTrigger>
              <TabsTrigger value="purchases" className="whitespace-nowrap">Purchases</TabsTrigger>
              <TabsTrigger value="sessions" className="whitespace-nowrap">Sessions</TabsTrigger>
              <TabsTrigger value="services" className="whitespace-nowrap">Services</TabsTrigger>
              <TabsTrigger value="assessments" className="whitespace-nowrap">Assessments</TabsTrigger>
              <TabsTrigger value="testimonials" className="whitespace-nowrap">Testimonials</TabsTrigger>
              <TabsTrigger value="newsletter" className="whitespace-nowrap">Newsletter</TabsTrigger>
              <TabsTrigger value="contacts" className="whitespace-nowrap">Contacts</TabsTrigger>
              <TabsTrigger value="one_time_requests" className="whitespace-nowrap">One-time Requests</TabsTrigger>
              <TabsTrigger value="consultations" className="whitespace-nowrap">Consultations</TabsTrigger>
              <TabsTrigger value="dietplans" className="whitespace-nowrap">Service Plans</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6 w-full overflow-x-hidden">
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
                        {formatCurrency(purchases.reduce((sum, purchase) => sum + Number(purchase.amount), 0))}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Mail className="h-8 w-8 text-primary" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Newsletter Subscribers</p>
                      <p className="text-2xl font-bold text-foreground">{newsletterSubscribers.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-primary" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-muted-foreground">Online Clients</p>
                      <p className="text-2xl font-bold text-foreground">{clients.filter(c => c.is_online).length}</p>
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
                      <div key={notification.id} className={`p-3 rounded-lg border ${notification.is_read ? 'bg-muted/50' : 'bg-primary/5 border-primary/20'
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

          <TabsContent value="contacts" className="space-y-6 w-full overflow-x-hidden">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Submissions
                </CardTitle>
                <CardDescription>Messages submitted via the contact form</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <Button onClick={exportContacts} className="mr-2">Export to Excel</Button>
                </div>
                <div className="space-y-3">
                  {contacts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No contacts found.</p>
                  ) : (
                    contacts.map((c) => (
                      <div key={c.id} className="p-4 border border-border rounded-lg flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-medium text-foreground">{c.name} {c.processed ? <Badge className="ml-2">Processed</Badge> : null}</h4>
                          <p className="text-sm text-muted-foreground">{c.email} • {c.phone}</p>
                          <p className="text-sm text-muted-foreground mt-2">{c.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">Submitted: {formatDate(c.created_at)}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant={c.processed ? 'outline' : 'default'} onClick={() => toggleProcessedContact(c.id, !c.processed)}>
                            {c.processed ? 'Mark Unprocessed' : 'Mark Processed'}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteContact(c.id)}>Delete</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="one_time_requests" className="space-y-6 w-full overflow-x-hidden">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  One-time Requests
                </CardTitle>
                <CardDescription>Custom plan requests submitted by buyers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex gap-2">
                  <Button onClick={exportOneTimeRequests} className="mr-2">Export to Excel</Button>
                </div>
                <div className="space-y-3">
                  {oneTimeRequests.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No requests found.</p>
                  ) : (
                    oneTimeRequests.map((r) => (
                      <div key={r.id} className="p-4 border border-border rounded-lg flex justify-between items-start gap-4">
                        <div>
                          <h4 className="font-medium text-foreground">{r.name} {r.processed ? <Badge className="ml-2">Processed</Badge> : null}</h4>
                          <p className="text-sm text-muted-foreground">{r.email} • {r.fitness_level}</p>
                          <p className="text-sm text-muted-foreground mt-2">Goal: {r.goal}</p>
                          {r.notes && <p className="text-sm text-muted-foreground mt-2">Notes: {r.notes}</p>}
                          <p className="text-xs text-muted-foreground mt-2">Submitted: {formatDate(r.created_at)}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant={r.processed ? 'outline' : 'default'} onClick={() => toggleProcessedOneTimeRequest(r.id, !r.processed)}>
                            {r.processed ? 'Mark Unprocessed' : 'Mark Processed'}
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteOneTimeRequest(r.id)}>Delete</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6 w-full overflow-x-hidden">
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
                    <div key={client.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg gap-4">
                      <div className="flex items-center space-x-4 min-w-0 flex-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <h3 className="font-semibold text-foreground truncate">{client.full_name}</h3>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${client.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                              <span className="text-xs text-muted-foreground">
                                {client.is_online ? 'Online' : `Last seen ${formatDate(client.last_seen)}`}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.phone_country_code} {client.phone} • {client.country}
                          </p>
                          {client.referral_source && (
                            <p className="text-xs text-muted-foreground">
                              Heard about us: {client.referral_source}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <a
                          href={`mailto:${client.email}`}
                          className="p-2 text-muted-foreground hover:text-primary transition-smooth"
                          title={`Send email to ${client.full_name}`}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                        <a
                          href={`tel:${client.phone_country_code}${client.phone}`}
                          className="p-2 text-muted-foreground hover:text-primary transition-smooth"
                          title={`Call ${client.full_name}`}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <a
                          href={`https://wa.me/${client.phone_country_code}${client.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-muted-foreground hover:text-primary transition-smooth"
                          title={`WhatsApp ${client.full_name}`}
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
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteClient(client.user_id)}
                          title="Delete client and all related data"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchases" className="space-y-6 w-full overflow-x-hidden">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Purchase Management
                </CardTitle>
                <CardDescription>
                  Manage client purchases and payment statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {purchases.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No purchases found.
                    </p>
                  ) : (
                    purchases.map((purchase) => (
                      <div key={purchase.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground truncate">
                              {purchase.profiles?.full_name || 'Unknown Client'}
                            </h3>
                            <Badge variant={
                              purchase.payment_status === 'completed' ? 'default' :
                                purchase.payment_status === 'pending' ? 'secondary' :
                                  purchase.payment_status === 'failed' ? 'destructive' : 'outline'
                            } className="w-fit">
                              {purchase.payment_status}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-foreground font-medium truncate">
                              {purchase.service?.title || 'Unknown Service'} ({purchase.service?.type})
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {purchase.profiles?.email || 'No email'} • {formatCurrency(purchase.amount)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Purchased: {formatDate(purchase.purchased_at)} • ID: {purchase.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Select
                            value={purchase.payment_status}
                            onValueChange={(newStatus) => updatePurchaseStatus(purchase.id, newStatus as any)}
                          >
                            <SelectTrigger className="w-full sm:w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deletePurchase(purchase.id)}
                            title="Delete purchase"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6 w-full overflow-x-hidden">
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
                    <Select
                      value={newBooking.user_id}
                      onValueChange={(value) => {
                        setNewBooking({ ...newBooking, user_id: value, service_id: '' });
                        setSelectedClient(clients.find(c => c.user_id === value) || null);
                      }}
                    >
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
                    <Select
                      value={newBooking.service_id}
                      onValueChange={(value) => setNewBooking({ ...newBooking, service_id: value })}
                      disabled={!newBooking.user_id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {newBooking.user_id && availableServices.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        This client hasn’t purchased any services yet
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={newBooking.scheduled_at}
                    onChange={(e) => setNewBooking({ ...newBooking, scheduled_at: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Meeting Link <span className="text-red-500">*</span></Label>
                  <Input
                    type="url"
                    value={newBooking.meet_link}
                    onChange={(e) => setNewBooking({ ...newBooking, meet_link: e.target.value })}
                    placeholder="https://meet.google.com/... or https://zoom.us/..."
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste the Google Meet, Zoom, or other meeting link here. Client will use this to join the session.
                  </p>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                    placeholder="Session notes or special instructions"
                  />
                </div>

                <Button
                  onClick={scheduleBooking}
                  disabled={!newBooking.user_id || !newBooking.service_id || !newBooking.scheduled_at || !newBooking.meet_link}
                >
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
                    <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {booking.profiles?.full_name || 'Unknown Client'}
                          </h3>
                          <Badge className={`${getStatusColor(booking.status)} w-fit`}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {booking.service.title} • {formatDate(booking.scheduled_at)}
                        </p>
                        {booking.notes && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">Notes: {booking.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
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
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteBooking(booking.id)}
                          title="Delete booking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6 w-full overflow-x-hidden">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Service
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 overflow-hidden">
                <div className="flex justify-end mb-2">
                  <Button size="sm" variant="outline" onClick={seedDefaultPlans} className="mr-2">
                    Seed Default Plans
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={newService.title}
                      onChange={(e) => setNewService({ ...newService, title: e.target.value })}
                      placeholder="Service title"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={newService.type} onValueChange={(value) => setNewService({ ...newService, type: value })}>
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
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Service description"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Price (USD)</Label>
                    <Input
                      type="number"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Duration (weeks)</Label>
                    <Input
                      type="number"
                      value={newService.duration_weeks}
                      onChange={(e) => setNewService({ ...newService, duration_weeks: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Session Length (minutes)</Label>
                    <Input
                      type="number"
                      value={newService.duration_minutes}
                      onChange={(e) => setNewService({ ...newService, duration_minutes: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex lg:flex-row md:flex-row flex-col gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newService.includes_nutrition}
                      onChange={(e) => setNewService({ ...newService, includes_nutrition: e.target.checked })}
                    />
                    Includes Nutrition
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newService.includes_workout}
                      onChange={(e) => setNewService({ ...newService, includes_workout: e.target.checked })}
                    />
                    Includes Workout
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newService.includes_meet}
                      onChange={(e) => setNewService({ ...newService, includes_meet: e.target.checked })}
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
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Title and Description */}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="break-words text-base sm:text-lg">{service.title}</CardTitle>
                        <CardDescription className="break-words text-sm mt-1">{service.description}</CardDescription>
                      </div>

                      {/* Action Buttons - Stack on mobile, horizontal on large screens */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:flex-shrink-0">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingService(service.id);
                              setEditServiceData(service);
                            }}
                            className="w-full sm:w-auto lg:w-auto whitespace-nowrap"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant={service.is_active ? "destructive" : "default"}
                            onClick={() => toggleServiceStatus(service.id, !service.is_active)}
                            className="w-full sm:w-auto lg:w-auto whitespace-nowrap"
                          >
                            {service.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteService(service.id)}
                            className="w-full sm:w-auto lg:w-auto whitespace-nowrap"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>

                        {/* Status and Price */}
                        <div className="flex items-center justify-between sm:justify-start lg:justify-between gap-2 mt-2 lg:mt-2">
                          <Badge variant={service.is_active ? "default" : "secondary"} className="text-xs whitespace-nowrap">
                            {service.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <span className="text-base sm:text-lg font-bold text-primary whitespace-nowrap">
                            {formatCurrency(service.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs whitespace-nowrap">{service.type}</Badge>
                      {service.duration_weeks > 0 && (
                        <Badge variant="outline" className="text-xs whitespace-nowrap">{service.duration_weeks} weeks</Badge>
                      )}
                      {service.duration_minutes > 0 && (
                        <Badge variant="outline" className="text-xs whitespace-nowrap">{service.duration_minutes} min</Badge>
                      )}
                      {service.includes_nutrition && <Badge variant="outline" className="text-xs whitespace-nowrap">Nutrition</Badge>}
                      {service.includes_workout && <Badge variant="outline" className="text-xs whitespace-nowrap">Workout</Badge>}
                      {service.includes_meet && <Badge variant="outline" className="text-xs whitespace-nowrap">Video Call</Badge>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Service Edit Modal */}
            {editingService && (
              <Dialog open={true} onOpenChange={() => setEditingService(null)}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Service</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Title</Label>
                        <Input
                          value={editServiceData.title || ''}
                          onChange={(e) => setEditServiceData({ ...editServiceData, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={editServiceData.type} onValueChange={(value) => setEditServiceData({ ...editServiceData, type: value })}>
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
                        onChange={(e) => setEditServiceData({ ...editServiceData, description: e.target.value })}
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label>Price (USD)</Label>
                        <Input
                          type="number"
                          value={editServiceData.price || 0}
                          onChange={(e) => setEditServiceData({ ...editServiceData, price: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Duration (weeks)</Label>
                        <Input
                          type="number"
                          value={editServiceData.duration_weeks || 0}
                          onChange={(e) => setEditServiceData({ ...editServiceData, duration_weeks: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={editServiceData.duration_minutes || 0}
                          onChange={(e) => setEditServiceData({ ...editServiceData, duration_minutes: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editServiceData.includes_nutrition || false}
                          onChange={(e) => setEditServiceData({ ...editServiceData, includes_nutrition: e.target.checked })}
                        />
                        Includes Nutrition
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editServiceData.includes_workout || false}
                          onChange={(e) => setEditServiceData({ ...editServiceData, includes_workout: e.target.checked })}
                        />
                        Includes Workout
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editServiceData.includes_meet || false}
                          onChange={(e) => setEditServiceData({ ...editServiceData, includes_meet: e.target.checked })}
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
          </TabsContent>

          <TabsContent value="newsletter" className="space-y-6 w-full overflow-x-hidden">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Newsletter Subscribers ({newsletterSubscribers.length})
                  </div>
                  <Button
                    onClick={exportNewsletterSubscribers}
                    className="bg-gradient-primary hover:shadow-primary"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export to Excel
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {newsletterSubscribers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No newsletter subscribers yet</p>
                  ) : (
                    <div className="grid gap-4">
                      {newsletterSubscribers.map((subscriber) => (
                        <div key={subscriber.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                          <div className="flex-1">
                            <div className="font-medium text-foreground">{subscriber.name}</div>
                            <div className="text-sm text-muted-foreground">{subscriber.email}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Subscribed: {new Date(subscriber.subscribed_at).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant={subscriber.is_active ? "default" : "secondary"}>
                            {subscriber.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-6 w-full overflow-x-hidden">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Fitness Assessments ({fitnessAssessments.length})
                </CardTitle>
                <CardDescription>
                  View all client fitness assessment data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fitnessAssessments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No fitness assessments completed yet.
                    </p>
                  ) : (
                    <div className="grid gap-6">
                      {fitnessAssessments.map((assessment) => (
                        <Card key={assessment.id} className="bg-card border-border">
                          <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div>
                                <CardTitle className="text-lg">
                                  {assessment.profiles?.full_name || 'Unknown Client'}
                                </CardTitle>
                                <CardDescription>
                                  {assessment.profiles?.email} • Completed: {formatDate(assessment.created_at)}
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {assessment.body_type}
                                </Badge>
                                <Badge variant="outline">
                                  {assessment.body_age} years old
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditAssessment(assessment)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteAssessment(assessment.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Weight</p>
                                <p className="text-lg font-semibold">{assessment.weight_kg} kg</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">BMI</p>
                                <p className="text-lg font-semibold">{assessment.bmi}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Body Fat</p>
                                <p className="text-lg font-semibold">{assessment.body_fat_percentage}%</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Heart Rate</p>
                                <p className="text-lg font-semibold">{assessment.heart_rate_bpm} bpm</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Muscle Mass</p>
                                <p className="text-lg font-semibold">{assessment.muscle_mass_kg} kg</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">BMR</p>
                                <p className="text-lg font-semibold">{assessment.bmr_kcal} kcal</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Water</p>
                                <p className="text-lg font-semibold">{assessment.water_percentage}%</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Visceral Fat</p>
                                <p className="text-lg font-semibold">{assessment.visceral_fat}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Body Fat Mass</p>
                                <p className="text-lg font-semibold">{assessment.body_fat_mass_kg} kg</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Lean Body Mass</p>
                                <p className="text-lg font-semibold">{assessment.lean_body_mass_kg} kg</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Bone Mass</p>
                                <p className="text-lg font-semibold">{assessment.bone_mass_kg} kg</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Protein</p>
                                <p className="text-lg font-semibold">{assessment.protein_percentage}%</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Skeletal Muscle</p>
                                <p className="text-lg font-semibold">{assessment.skeletal_muscle_mass_kg} kg</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-sm font-medium text-muted-foreground">Subcutaneous Fat</p>
                                <p className="text-lg font-semibold">{assessment.subcutaneous_fat_percentage}%</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessment Edit Modal */}
          {editingAssessment && (
            <Dialog open={true} onOpenChange={() => setEditingAssessment(null)}>
              <DialogContent className="sm:max-w-4xl max-h-screen overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Fitness Assessment</DialogTitle>
                  <DialogDescription>
                    Update client fitness assessment data
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <div>
                      <Label>Weight (KG)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editAssessmentData.weight_kg || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, weight_kg: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>BMI</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editAssessmentData.bmi || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, bmi: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Body Fat (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editAssessmentData.body_fat_percentage || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, body_fat_percentage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Heart Rate (BPM)</Label>
                      <Input
                        type="number"
                        value={editAssessmentData.heart_rate_bpm || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, heart_rate_bpm: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Muscle Mass (KG)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editAssessmentData.muscle_mass_kg || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, muscle_mass_kg: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>BMR (KCAL)</Label>
                      <Input
                        type="number"
                        value={editAssessmentData.bmr_kcal || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, bmr_kcal: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Water (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editAssessmentData.water_percentage || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, water_percentage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Visceral Fat</Label>
                      <Input
                        type="number"
                        value={editAssessmentData.visceral_fat || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, visceral_fat: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Body Fat Mass (KG)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editAssessmentData.body_fat_mass_kg || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, body_fat_mass_kg: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Lean Body Mass (KG)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editAssessmentData.lean_body_mass_kg || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, lean_body_mass_kg: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Bone Mass (KG)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editAssessmentData.bone_mass_kg || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, bone_mass_kg: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Protein (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editAssessmentData.protein_percentage || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, protein_percentage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Skeletal Muscle Mass (KG)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editAssessmentData.skeletal_muscle_mass_kg || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, skeletal_muscle_mass_kg: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Subcutaneous Fat (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editAssessmentData.subcutaneous_fat_percentage || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, subcutaneous_fat_percentage: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Body Age</Label>
                      <Input
                        type="number"
                        value={editAssessmentData.body_age || ''}
                        onChange={(e) => setEditAssessmentData({ ...editAssessmentData, body_age: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Body Type</Label>
                      <Select
                        value={editAssessmentData.body_type || ''}
                        onValueChange={(value) => setEditAssessmentData({ ...editAssessmentData, body_type: value })}
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
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setEditingAssessment(null)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={updateAssessment}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <TabsContent value="testimonials" className="space-y-6 w-full overflow-x-hidden">
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Text Testimonials Management
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
                          <div key={testimonial.id} className="flex items-start justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{testimonial.name}</div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {testimonial.role} {testimonial.company && `at ${testimonial.company}`} •
                                Rating: {testimonial.rating}/5 • {new Date(testimonial.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-sm text-foreground bg-muted p-2 rounded max-w-lg">
                                "{testimonial.content}"
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Contact: {testimonial.email} • {testimonial.phone}
                                {testimonial.website && ` • ${testimonial.website}`}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
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
                          <div key={testimonial.id} className="flex items-start justify-between p-4 border rounded-lg bg-card/50">
                            <div className="flex-1">
                              <div className="font-medium">{testimonial.name}</div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {testimonial.role} {testimonial.company && `at ${testimonial.company}`} •
                                Rating: {testimonial.rating}/5 • Featured: {testimonial.is_featured ? 'Yes' : 'No'}
                              </div>
                              <div className="text-sm text-foreground bg-muted p-2 rounded max-w-lg">
                                "{testimonial.content}"
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
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

          <TabsContent value="consultations" className="space-y-6 w-full overflow-x-hidden">
            <ConsultationManager clients={clients} />
          </TabsContent>

          <TabsContent value="dietplans" className="space-y-6 w-full overflow-x-hidden">
            <ServicePlanManager currentUserId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
