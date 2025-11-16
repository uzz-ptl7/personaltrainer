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
import { Plus, Edit, Trash2, DollarSign, Calendar, Check } from "lucide-react";

interface Plan {
  id: string;
  title: string;
  description: string | null;
  type: string;
  price: number;
  duration_weeks: number | null;
  includes_meet: boolean | null;
  includes_nutrition: boolean | null;
  includes_workout: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
}

const PlansManagement: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'recurring' | 'one-time' | 'downloadable'>('recurring');
  const [price, setPrice] = useState('');
  const [durationWeeks, setDurationWeeks] = useState('');
  const [includesMeet, setIncludesMeet] = useState(false);
  const [includesNutrition, setIncludesNutrition] = useState(false);
  const [includesWorkout, setIncludesWorkout] = useState(false);
  const [isActive, setIsActive] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .in('type', ['recurring', 'one-time', 'downloadable'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading plans",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setTitle(plan.title);
      setDescription(plan.description || '');
      setType(plan.type as 'recurring' | 'one-time' | 'downloadable');
      setPrice(plan.price.toString());
      setDurationWeeks(plan.duration_weeks?.toString() || '');
      setIncludesMeet(plan.includes_meet || false);
      setIncludesNutrition(plan.includes_nutrition || false);
      setIncludesWorkout(plan.includes_workout || false);
      setIsActive(plan.is_active || false);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSavePlan = async () => {
    if (!title || !price) {
      toast({
        title: "Missing information",
        description: "Please provide title and price",
        variant: "destructive",
      });
      return;
    }

    try {
      const planData = {
        title,
        description: description || null,
        type,
        price: parseFloat(price),
        duration_weeks: durationWeeks ? parseInt(durationWeeks) : null,
        duration_minutes: null,
        includes_meet: includesMeet,
        includes_nutrition: includesNutrition,
        includes_workout: includesWorkout,
        is_active: isActive,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('services')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) throw error;

        toast({
          title: "Plan updated",
          description: "Plan has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('services')
          .insert(planData);

        if (error) throw error;

        toast({
          title: "Plan created",
          description: "New plan has been created successfully",
        });
      }

      setIsModalOpen(false);
      resetForm();
      loadPlans();
    } catch (error: any) {
      toast({
        title: "Error saving plan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "Plan deleted",
        description: "Plan has been deleted successfully",
      });

      loadPlans();
    } catch (error: any) {
      toast({
        title: "Error deleting plan",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingPlan(null);
    setTitle('');
    setDescription('');
    setType('recurring');
    setPrice('');
    setDurationWeeks('');
    setIncludesMeet(false);
    setIncludesNutrition(false);
    setIncludesWorkout(false);
    setIsActive(true);
  };

  const getTypeConfig = (type: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      'recurring': { color: 'bg-green-500/10 text-green-400 border-green-500/30', label: 'Recurring' },
      'one-time': { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', label: 'One-Time' },
      'downloadable': { color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', label: 'Downloadable' },
    };
    return configs[type] || { color: 'bg-gray-500/10 text-gray-400 border-gray-500/30', label: type };
  };

  if (loading) {
    return <div className="text-center py-8">Loading plans...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Plans Management</h2>
          <p className="text-muted-foreground">Create and manage training plans</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-background border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
              <DialogDescription>
                {editingPlan ? 'Update plan information' : 'Add a new training plan'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Plan Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., 12-Week Transformation"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the plan..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Plan Type *</Label>
                  <Select value={type} onValueChange={(value: any) => setType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="recurring">Recurring</SelectItem>
                      <SelectItem value="one-time">One-Time</SelectItem>
                      <SelectItem value="downloadable">Downloadable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Price (₦) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="duration">Duration (Weeks)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                  placeholder="e.g., 12"
                />
              </div>

              <div className="space-y-3">
                <Label>Includes:</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={includesWorkout}
                    onCheckedChange={setIncludesWorkout}
                  />
                  <Label className="cursor-pointer">Workout Plans</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={includesNutrition}
                    onCheckedChange={setIncludesNutrition}
                  />
                  <Label className="cursor-pointer">Nutrition Guide</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={includesMeet}
                    onCheckedChange={setIncludesMeet}
                  />
                  <Label className="cursor-pointer">Video Sessions</Label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label className="cursor-pointer">Active (visible to clients)</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSavePlan}>
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {plans.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No plans yet. Create your first plan!</p>
            </CardContent>
          </Card>
        ) : (
          plans.map((plan) => {
            const typeConfig = getTypeConfig(plan.type);
            return (
              <Card key={plan.id} className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{plan.title}</CardTitle>
                        {!plan.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {plan.description && (
                        <CardDescription>{plan.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenModal(plan)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Type</p>
                      <Badge variant="outline" className={typeConfig.color}>
                        {typeConfig.label}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Price</p>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{plan.price}</span>
                      </div>
                    </div>
                    {plan.duration_weeks && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Duration</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{plan.duration_weeks} weeks</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Includes</p>
                      <div className="flex gap-1">
                        {plan.includes_workout && (
                          <Badge variant="outline" className="text-xs">Workout</Badge>
                        )}
                        {plan.includes_nutrition && (
                          <Badge variant="outline" className="text-xs">Nutrition</Badge>
                        )}
                        {plan.includes_meet && (
                          <Badge variant="outline" className="text-xs">Video</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PlansManagement;
