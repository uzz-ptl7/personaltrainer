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
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, DollarSign, Calendar } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string | null;
  type: string;
  price: number;
  duration_weeks: number | null;
  duration_minutes: number | null;
  includes_meet: boolean | null;
  includes_nutrition: boolean | null;
  includes_workout: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
}

const ServicesManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('program');
  const [price, setPrice] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [includesMeet, setIncludesMeet] = useState(false);
  const [includesNutrition, setIncludesNutrition] = useState(false);
  const [includesWorkout, setIncludesWorkout] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .not('type', 'in', '(recurring,one-time,downloadable)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading services",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setTitle(service.title);
      setDescription(service.description || '');
      setType(service.type);
      setPrice(service.price.toString());
      setDurationWeeks(service.duration_weeks?.toString() || '');
      setDurationMinutes(service.duration_minutes?.toString() || '60');
      setIncludesMeet(service.includes_meet || false);
      setIncludesNutrition(service.includes_nutrition || false);
      setIncludesWorkout(service.includes_workout || false);
      setIsActive(service.is_active || false);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSaveService = async () => {
    if (!title || !price) {
      toast({
        title: "Missing information",
        description: "Please provide title and price",
        variant: "destructive",
      });
      return;
    }

    try {
      const serviceData = {
        title,
        description: description || null,
        type,
        price: parseFloat(price),
        duration_weeks: durationWeeks ? parseInt(durationWeeks) : null,
        duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
        includes_meet: includesMeet,
        includes_nutrition: includesNutrition,
        includes_workout: includesWorkout,
        is_active: isActive,
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;

        toast({
          title: "Service updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('services')
          .insert(serviceData);

        if (error) throw error;

        toast({
          title: "Service created successfully",
        });
      }

      setIsModalOpen(false);
      resetForm();
      loadServices();

    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service? This will also remove all related data.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: "Service deleted successfully",
      });

      loadServices();

    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Service deactivated" : "Service activated",
      });

      loadServices();

    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingService(null);
    setTitle('');
    setDescription('');
    setType('program');
    setPrice('');
    setDurationWeeks('');
    setDurationMinutes('60');
    setIncludesMeet(false);
    setIncludesNutrition(false);
    setIncludesWorkout(false);
    setIsActive(true);
  };

  const getServiceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'consultation': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      'session': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      'program': 'bg-green-500/10 text-green-400 border-green-500/30',
    };
    return colors[type] || 'bg-gray-500/10 text-gray-400 border-gray-500/30';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading services...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold break-words">Services Management</h2>
          <p className="text-muted-foreground text-sm break-words">Create and manage one-time services (consultations, sessions, programs)</p>
        </div>
        <Button onClick={() => handleOpenModal()} size="sm" className="w-full sm:w-auto flex-shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Service
        </Button>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4">
        {services.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No services found</p>
            </CardContent>
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service.id} className={!service.is_active ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg break-words">{service.title}</h3>
                      <Badge variant="outline" className={`${getServiceTypeColor(service.type)} flex-shrink-0`}>
                        {service.type}
                      </Badge>
                      {!service.is_active && (
                        <Badge variant="secondary" className="flex-shrink-0">Inactive</Badge>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mb-3 break-words">{service.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium">${service.price}</span>
                      </div>
                      {service.duration_weeks && service.duration_weeks > 0 && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span>{service.duration_weeks} weeks</span>
                        </div>
                      )}
                      {service.includes_meet && (
                        <Badge variant="outline" className="flex-shrink-0">Includes Meet</Badge>
                      )}
                      {service.includes_nutrition && (
                        <Badge variant="outline" className="flex-shrink-0">Nutrition</Badge>
                      )}
                      {service.includes_workout && (
                        <Badge variant="outline" className="flex-shrink-0">Workout</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleServiceStatus(service.id, service.is_active || false)}
                      className="flex-1 sm:flex-initial"
                    >
                      {service.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenModal(service)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteService(service.id)}
                      className="flex-1 sm:flex-initial"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Create New Service'}</DialogTitle>
            <DialogDescription>
              Configure the service details and pricing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., 90-Day Customized Program"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the service..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="session">Session</SelectItem>
                    <SelectItem value="program">Program</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration-weeks">Duration (Weeks)</Label>
                <Input
                  id="duration-weeks"
                  type="number"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                  placeholder="0 for no duration"
                />
              </div>

              <div>
                <Label htmlFor="duration-minutes">Session Duration (Minutes)</Label>
                <Input
                  id="duration-minutes"
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label>Includes</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="includes-meet"
                  checked={includesMeet}
                  onCheckedChange={setIncludesMeet}
                />
                <label htmlFor="includes-meet" className="text-sm cursor-pointer">
                  Video Meetings
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="includes-nutrition"
                  checked={includesNutrition}
                  onCheckedChange={setIncludesNutrition}
                />
                <label htmlFor="includes-nutrition" className="text-sm cursor-pointer">
                  Nutrition Plan
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="includes-workout"
                  checked={includesWorkout}
                  onCheckedChange={setIncludesWorkout}
                />
                <label htmlFor="includes-workout" className="text-sm cursor-pointer">
                  Workout Plan
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <label htmlFor="is-active" className="text-sm cursor-pointer">
                  Active (visible to clients)
                </label>
              </div>
            </div>

            <Button
              onClick={handleSaveService}
              className="w-full"
            >
              {editingService ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesManagement;
