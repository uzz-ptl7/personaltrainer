import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, Plus, User, Edit, Trash2, CheckCircle, X } from "lucide-react";

interface Consultation {
  id: string;
  user_id: string;
  consultation_type: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string | null;
  notes: string | null;
  meet_link: string;
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    user_id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    phone_country_code: string | null;
  };
}

interface ConsultationManagerProps {
  clients: any[];
}

const ConsultationManager: React.FC<ConsultationManagerProps> = ({ clients }) => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [consultationType, setConsultationType] = useState<'initial' | 'weekly_checkup'>('initial');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<Consultation | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      const { data: consultationsData, error: consultationsError } = await supabase
        .from('consultations')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (consultationsError) throw consultationsError;

      // Get profile data separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, phone, phone_country_code');

      if (profilesError) throw profilesError;

      // Combine the data
      const enrichedConsultations = (consultationsData || []).map(consultation => ({
        ...consultation,
        meet_link: consultation.meet_link || '',
        profiles: profilesData?.find(profile => profile.user_id === consultation.user_id)
      }));

      setConsultations(enrichedConsultations);
    } catch (error) {
      console.error('Error loading consultations:', error);
      toast({
        title: "Error",
        description: "Failed to load consultations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !scheduledAt || !meetLink) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including the meeting link",
        variant: "destructive"
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('consultations')
        .insert({
          user_id: selectedClientId,
          consultation_type: consultationType,
          scheduled_at: scheduledAt,
          notes,
          meet_link: meetLink,
          duration_minutes: 30
        });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Consultation scheduled successfully"
      });
      setIsCreateModalOpen(false);
      setSelectedClientId('');
      setScheduledAt('');
      setNotes('');
      setMeetLink('');
      loadConsultations();
    } catch (error) {
      console.error('Error creating consultation:', error);
      toast({
        title: "Error",
        description: "Failed to schedule consultation",
        variant: "destructive"
      });
    }
  };

  const updateConsultationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Consultation status updated"
      });

      loadConsultations();
    } catch (error) {
      console.error('Error updating consultation:', error);
      toast({
        title: "Error",
        description: "Failed to update consultation",
        variant: "destructive"
      });
    }
  };

  const deleteConsultation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this consultation?')) return;

    try {
      const { error } = await supabase
        .from('consultations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Consultation deleted successfully"
      });

      loadConsultations();
    } catch (error) {
      console.error('Error deleting consultation:', error);
      toast({
        title: "Error",
        description: "Failed to delete consultation",
        variant: "destructive"
      });
    }
  };

  const startEditConsultation = (consultation: Consultation) => {
    setEditingConsultation(consultation);
    setSelectedClientId(consultation.user_id);
    setConsultationType(consultation.consultation_type as 'initial' | 'weekly_checkup');
    setScheduledAt(new Date(consultation.scheduled_at).toISOString().slice(0, 16));
    setNotes(consultation.notes || '');
    setMeetLink(consultation.meet_link || '');
    setIsEditModalOpen(true);
  };

  const updateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingConsultation || !selectedClientId || !scheduledAt || !meetLink) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including the meeting link",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('consultations')
        .update({
          user_id: selectedClientId,
          consultation_type: consultationType,
          scheduled_at: scheduledAt,
          notes,
          meet_link: meetLink,
          duration_minutes: 30
        })
        .eq('id', editingConsultation.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Consultation updated successfully"
      });

      setIsEditModalOpen(false);
      setEditingConsultation(null);
      setSelectedClientId('');
      setScheduledAt('');
      setNotes('');
      setMeetLink('');
      loadConsultations();
    } catch (error) {
      console.error('Error updating consultation:', error);
      toast({
        title: "Error",
        description: "Failed to update consultation",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: 'default',
      completed: 'default',
      cancelled: 'destructive',
      no_show: 'secondary'
    } as const;

    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Consultation Management</h2>
          <p className="text-muted-foreground">Schedule and manage client consultations</p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Consultation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Consultation</DialogTitle>
              <DialogDescription>
                Schedule a free 30-minute consultation for a client
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={createConsultation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
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

              <div className="space-y-2">
                <Label htmlFor="type">Consultation Type</Label>
                <Select value={consultationType} onValueChange={(value: 'initial' | 'weekly_checkup') => setConsultationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initial Consultation</SelectItem>
                    <SelectItem value="weekly_checkup">Weekly Checkup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Date & Time</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetLink">Meeting Link <span className="text-red-500">*</span></Label>
                <Input
                  id="meetLink"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Paste the Google Meet or Zoom link here. Clients will use this to join the session.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">Schedule Consultation</Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Consultation Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Consultation</DialogTitle>
              <DialogDescription>
                Update consultation details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={updateConsultation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editClient">Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
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

              <div className="space-y-2">
                <Label htmlFor="editType">Consultation Type</Label>
                <Select value={consultationType} onValueChange={(value: 'initial' | 'weekly_checkup') => setConsultationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initial Consultation</SelectItem>
                    <SelectItem value="weekly_checkup">Weekly Checkup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editScheduledAt">Date & Time</Label>
                <Input
                  id="editScheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editMeetLink">Meeting Link <span className="text-red-500">*</span></Label>
                <Input
                  id="editMeetLink"
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetLink}
                  onChange={(e) => setMeetLink(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Paste the Google Meet or Zoom link here. Clients will use this to join the session.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editNotes">Notes (Optional)</Label>
                <Textarea
                  id="editNotes"
                  placeholder="Any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">Update Consultation</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingConsultation(null);
                  setSelectedClientId('');
                  setScheduledAt('');
                  setNotes('');
                  setMeetLink('');
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {consultations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              No consultations scheduled yet
            </CardContent>
          </Card>
        ) : (
          consultations.map((consultation) => (
            <Card key={consultation.id} className="bg-gradient-card border-border shadow-elevation">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">
                        {consultation.profiles?.full_name || 'Unknown Client'}
                      </h3>
                      {getStatusBadge(consultation.status || 'scheduled')}
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateTime(consultation.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{consultation.duration_minutes} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {consultation.consultation_type.replace('_', ' ')}
                        </Badge>
                      </div>
                      {consultation.meet_link && (
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          <a
                            href={consultation.meet_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Join Meeting
                          </a>
                        </div>
                      )}
                      {consultation.notes && (
                        <p className="mt-2 text-foreground">{consultation.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEditConsultation(consultation)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteConsultation(consultation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {consultation.status === 'scheduled' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateConsultationStatus(consultation.id, 'completed')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateConsultationStatus(consultation.id, 'cancelled')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ConsultationManager;