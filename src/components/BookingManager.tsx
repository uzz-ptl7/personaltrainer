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
  service: Service;
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
    try {
      // Load all purchases with client and service information
      const { data: purchasesData, error } = await supabase
        .from('purchases')
        .select(`
          *,
          services(*)
        `)
        .eq('payment_status', 'completed');

      if (error) throw error;

      // Load profiles separately
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      // Combine the data
      const enrichedPurchases = (purchasesData || []).map(purchase => ({
        ...purchase,
        service: purchase.services,
        profiles: profilesData?.find(p => p.user_id === purchase.user_id)
      }));

      setPurchases(enrichedPurchases);

      // Get unique clients who have made purchases
      const uniqueClients = Array.from(
        new Map(
          enrichedPurchases.map(purchase => [
            purchase.user_id,
            purchase.profiles
          ])
        ).values()
      ).filter(client => client); // Filter out null/undefined clients

      setClients(uniqueClients);
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
    // Get services that the selected client has purchased
    const clientPurchases = purchases.filter(p => p.user_id === clientId);
    const clientServices = clientPurchases.map(p => p.service);
    
    // Remove duplicates based on service ID
    const uniqueServices = Array.from(
      new Map(clientServices.map(service => [service.id, service])).values()
    );

    setAvailableServices(uniqueServices);
    setSelectedService(''); // Reset service selection when client changes
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
      // Find the purchase record to get the purchase_id
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

  const formatDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <Card className="bg-gradient-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Create New Booking
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
            min={formatDateTime()}
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