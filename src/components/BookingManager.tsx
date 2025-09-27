import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User } from "lucide-react";

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
}

interface Service {
  id: string;
  title: string;
  type: string;
  duration_minutes: number;
  includes_meet: boolean;
}

interface Purchase {
  id: string;
  user_id: string;
  service_id: string;
  services: Service;
  profiles: Profile;
}

interface BookingManagerProps {
  onBookingCreated: () => void;
}

const BookingManager = ({ onBookingCreated }: BookingManagerProps) => {
  const [clients, setClients] = useState<Profile[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadClientsAndPurchases();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadClientServices(selectedClient);
    } else {
      setAvailableServices([]);
      setSelectedService('');
    }
  }, [selectedClient]);

  const loadClientsAndPurchases = async () => {
    console.log('🔄 loadClientsAndPurchases function called');
    try {
      // First get all purchases with services
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          id,
          user_id,
          service_id,
          payment_status,
          services:service_id (
            id,
            title,
            type,
            duration_minutes,
            includes_meet
          )
        `)
        .eq('payment_status', 'completed');

      if (purchasesError) throw purchasesError;

      console.log('Raw purchases data:', purchasesData);

      // Get all profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          full_name,
          email
        `);

      if (profilesError) throw profilesError;

      console.log('Raw profiles data:', profilesData);

      // Create a map of profiles for easy lookup
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.user_id, profile])
      );

      // Map purchases with profiles and services
      const enrichedPurchases: Purchase[] = (purchasesData || [])
        .filter((p) => {
          // Check if services join was successful
          const hasValidService = p.services &&
            typeof p.services === "object" &&
            !Array.isArray(p.services) &&
            "id" in p.services &&
            "title" in p.services;
          
          // Check if we have a profile for this user
          const hasProfile = profilesMap.has(p.user_id);
          
          console.log('Purchase:', p.id, 'Service valid:', hasValidService, 'Has profile:', hasProfile);
          
          return hasValidService && hasProfile;
        })
        .map((p) => ({
          ...p,
          services: p.services as Service,
          profiles: profilesMap.get(p.user_id) as Profile,
        }));

      setPurchases(enrichedPurchases);

      console.log('Final enriched purchases:', enrichedPurchases);

      // Unique clients
      const uniqueClients = Array.from(
        new Map(
          enrichedPurchases.map(p => [p.user_id, p.profiles])
        ).values()
      ).filter(client => client);

      console.log('Unique clients:', uniqueClients);
      setClients(uniqueClients as Profile[]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive",
      });
    }
  };

  const loadClientServices = (clientId: string) => {
    console.log('🎯 loadClientServices called for client:', clientId);
    console.log('📊 All purchases available:', purchases);
    
    // Services the client has purchased
    const clientPurchases = purchases.filter(p => p.user_id === clientId);
    console.log('Client purchases found:', clientPurchases);
    
    const clientServices = clientPurchases.map(p => p.services);
    console.log('Client services mapped:', clientServices);

    // Deduplicate services by ID
    const uniqueServices = Array.from(
      new Map(clientServices.map(service => [service.id, service])).values()
    );
    console.log('Unique services:', uniqueServices);

    setAvailableServices(uniqueServices);
    setSelectedService('');
  };

  const createBooking = async () => {
    if (!selectedClient || !selectedService || !scheduledAt) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Find the purchase record for this client/service
      const clientPurchase = purchases.find(
        p => p.user_id === selectedClient && p.service_id === selectedService
      );

      if (!clientPurchase) {
        throw new Error("Purchase record not found");
      }

      const { error } = await supabase
        .from('bookings')
        .insert({
          user_id: selectedClient,
          service_id: selectedService,
          purchase_id: clientPurchase.id,
          scheduled_at: scheduledAt,
          notes: notes || null,
          status: 'scheduled'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking created successfully",
      });

      // Reset form
      setSelectedClient('');
      setSelectedService('');
      setScheduledAt('');
      setNotes('');
      setAvailableServices([]);
      
      onBookingCreated();
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const getLocalDateTime = (date = new Date()) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Create New Booking (BookingManager Component)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Client
            </Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.user_id} value={client.user_id}>
                    {client.full_name} ({client.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Service</Label>
            <Select 
              value={selectedService} 
              onValueChange={setSelectedService}
              disabled={!selectedClient || availableServices.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !selectedClient 
                    ? "Select a client first"
                    : availableServices.length === 0 
                      ? "No purchased services"
                      : "Select a service"
                } />
              </SelectTrigger>
              <SelectContent>
                {availableServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.title} ({service.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedClient && availableServices.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                This client has no purchased services available for booking.
              </p>
            )}
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled Date & Time
          </Label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            min={getLocalDateTime()}
          />
        </div>

        <div>
          <Label>Notes (Optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes for this session..."
            rows={3}
          />
        </div>

        <Button 
          onClick={createBooking} 
          disabled={loading || !selectedClient || !selectedService || !scheduledAt}
          className="w-full bg-gradient-primary"
        >
          {loading ? "Creating..." : "Create Booking"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookingManager;
