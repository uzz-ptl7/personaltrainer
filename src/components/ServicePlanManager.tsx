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
import { Upload, Download, Plus, User, FileText, Trash2, Eye, CheckCircle, Dumbbell, Apple, Heart, Target } from "lucide-react";

interface ServicePlan {
  id: string;
  user_id: string;
  purchase_id: string;
  service_id: string;
  consultation_id: string | null;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  uploaded_by: string;
  plan_type: string;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    user_id: string;
    full_name: string | null;
    email: string | null;
  };
  services?: {
    id: string;
    title: string;
    type: string;
  };
  purchases?: {
    amount: number;
    service_id: string;
    payment_status: string;
  };
}

interface Purchase {
  id: string;
  user_id: string;
  service_id: string;
  payment_status: string;
  amount: number;
  created_at: string | null;
  payment_method: string | null;
  purchased_at: string | null;
  transaction_id: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
  service?: {
    id: string;
    title: string;
    type: string;
  };
}

interface ServicePlanManagerProps {
  currentUserId: string;
}

const planTypeIcons = {
  diet: Apple,
  workout: Dumbbell,
  nutrition: Apple,
  fitness: Heart,
  custom: Target,
  default: FileText
};

const planTypeColors = {
  diet: 'text-green-400 bg-green-500/20 border-green-500/30',
  workout: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  nutrition: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  fitness: 'text-red-400 bg-red-500/20 border-red-500/30',
  custom: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  default: 'text-gray-400 bg-gray-500/20 border-gray-500/30'
};

const ServicePlanManager: React.FC<ServicePlanManagerProps> = ({ currentUserId }) => {
  const [servicePlans, setServicePlans] = useState<ServicePlan[]>([]);
  const [completedPurchases, setCompletedPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [planType, setPlanType] = useState('custom');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load completed purchases that don't have service plans yet
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('payment_status', 'completed');

      if (purchasesError) throw purchasesError;

      // Load existing service plans
      const { data: servicePlansData, error: servicePlansError } = await supabase
        .from('service_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (servicePlansError) throw servicePlansError;

      // Get profile data for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profilesError) throw profilesError;

      // Get purchase data for service plans with service information
      const { data: purchaseDetailData, error: purchaseDetailError } = await supabase
        .from('purchases')
        .select('id, amount, service_id, payment_status');

      if (purchaseDetailError) throw purchaseDetailError;

      // Get service data
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, title, type');

      if (servicesError) throw servicesError;

      // Enrich service plans with profile and service data
      const enrichedServicePlans = (servicePlansData || []).map(plan => ({
        ...plan,
        profiles: profilesData?.find(profile => profile.user_id === plan.user_id),
        services: servicesData?.find(service => service.id === plan.service_id),
        purchases: purchaseDetailData?.find(purchase => purchase.id === plan.purchase_id)
      }));

      // Enrich purchases with profile and service data
      const enrichedPurchases = (purchasesData || []).map(purchase => ({
        ...purchase,
        profiles: profilesData?.find(profile => profile.user_id === purchase.user_id),
        service: servicesData?.find(service => service.id === purchase.service_id)
      }));

      // Filter purchases that already have service plans
      const existingPurchaseIds = new Set((servicePlansData || []).map(plan => plan.purchase_id));
      const availablePurchases = enrichedPurchases.filter(purchase =>
        !existingPurchaseIds.has(purchase.id)
      );

      setServicePlans(enrichedServicePlans);
      setCompletedPurchases(availablePurchases);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadServicePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPurchaseId || !title || !selectedFile || !planType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields and select a file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `service-plans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('service-plans')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('service-plans')
        .getPublicUrl(filePath);

      // Find the selected purchase to get user_id and service_id
      const selectedPurchase = completedPurchases.find(p => p.id === selectedPurchaseId);
      if (!selectedPurchase) throw new Error('Selected purchase not found');

      // Save service plan record
      const { error: insertError } = await supabase
        .from('service_plans')
        .insert({
          user_id: selectedPurchase.user_id,
          purchase_id: selectedPurchaseId,
          service_id: selectedPurchase.service_id,
          title,
          description: description || null,
          file_url: publicUrl,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          uploaded_by: currentUserId,
          plan_type: planType,
          is_active: true
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Service plan uploaded successfully"
      });

      // Reset form
      setIsUploadModalOpen(false);
      setSelectedPurchaseId('');
      setTitle('');
      setDescription('');
      setPlanType('custom');
      setSelectedFile(null);

      // Reload data
      loadData();
    } catch (error) {
      console.error('Error uploading service plan:', error);
      toast({
        title: "Error",
        description: "Failed to upload service plan",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteServicePlan = async (id: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this service plan?')) return;

    try {
      // Delete from database
      const { error: deleteError } = await supabase
        .from('service_plans')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Delete file from storage
      const filePath = fileUrl.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('service-plans')
          .remove([`service-plans/${filePath}`]);
      }

      toast({
        title: "Success",
        description: "Service plan deleted successfully"
      });

      loadData();
    } catch (error) {
      console.error('Error deleting service plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete service plan",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getPlanTypeIcon = (type: string) => {
    const IconComponent = planTypeIcons[type as keyof typeof planTypeIcons] || planTypeIcons.default;
    return IconComponent;
  };

  const getPlanTypeColor = (type: string) => {
    return planTypeColors[type as keyof typeof planTypeColors] || planTypeColors.default;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-foreground break-words">Service Plan Management</h2>
          <p className="text-muted-foreground text-sm break-words">Upload personalized plans for clients based on consultation outcomes</p>
        </div>

        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary w-full sm:w-auto flex-shrink-0" size="sm" disabled={completedPurchases.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Service Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Service Plan</DialogTitle>
              <DialogDescription>
                Upload a personalized plan for a client based on their consultation and purchased service
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={uploadServicePlan} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purchase">Client & Service</Label>
                <Select value={selectedPurchaseId} onValueChange={setSelectedPurchaseId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client and service" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedPurchases.map((purchase) => (
                      <SelectItem key={purchase.id} value={purchase.id}>
                        {purchase.profiles?.full_name || 'Unknown'} - {purchase.service?.title || 'Unknown Service'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="planType">Plan Type</Label>
                <Select value={planType} onValueChange={setPlanType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diet">Diet Plan</SelectItem>
                    <SelectItem value="workout">Workout Plan</SelectItem>
                    <SelectItem value="nutrition">Nutrition Plan</SelectItem>
                    <SelectItem value="fitness">Fitness Plan</SelectItem>
                    <SelectItem value="custom">Custom Plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Plan Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Personalized Weight Loss Plan"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the plan..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Plan File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX, TXT
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Plan"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {completedPurchases.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-primary break-words">Available for Service Plans</CardTitle>
            <CardDescription className="break-words">
              Clients with completed service payments ready for personalized plan delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedPurchases.map((purchase) => (
                <div key={purchase.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-card/50 rounded-lg border border-border shadow-sm backdrop-blur-sm gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground break-words">
                      {purchase.profiles?.full_name || 'Unknown Client'}
                    </p>
                    <p className="text-sm text-muted-foreground break-words">
                      {purchase.profiles?.email} • {purchase.service?.title || 'Unknown Service'}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex-shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Payment Completed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {completedPurchases.length === 0 && servicePlans.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            No completed services available for plan upload
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {servicePlans.map((plan) => {
          const IconComponent = getPlanTypeIcon(plan.plan_type);
          const colorClass = getPlanTypeColor(plan.plan_type);

          return (
            <Card key={plan.id} className="bg-gradient-to-r from-slate-500/5 to-gray-500/5 border-border shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-foreground break-words">
                        {plan.profiles?.full_name || 'Unknown Client'}
                      </h3>
                      <Badge className={`${colorClass} flex-shrink-0`}>
                        <IconComponent className="h-3 w-3 mr-1" />
                        {plan.plan_type.charAt(0).toUpperCase() + plan.plan_type.slice(1)} Plan
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground text-lg break-words">{plan.title}</h4>
                      <p className="text-sm text-muted-foreground break-words">
                        Service: {plan.services?.title || 'Unknown Service'}
                      </p>
                      {plan.description && (
                        <p className="text-muted-foreground bg-card/30 p-3 rounded-md border border-border/50 backdrop-blur-sm break-words">{plan.description}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground bg-card/30 p-2 rounded-md border border-border/50 backdrop-blur-sm">
                        <span className="flex items-center gap-1 break-all">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="break-all">{plan.file_name}</span>
                        </span>
                        <span className="flex-shrink-0">Size: {formatFileSize(plan.file_size)}</span>
                        <span className="flex-shrink-0">Uploaded: {new Date(plan.created_at || '').toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(plan.file_url, '_blank')}
                      className="border-primary/30 text-primary hover:bg-primary/20 hover:text-primary hover:border-primary flex-1 sm:flex-initial"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = plan.file_url;
                        link.download = plan.file_name;
                        link.click();
                      }}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-400 flex-1 sm:flex-initial"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteServicePlan(plan.id, plan.file_url)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400 flex-1 sm:flex-initial"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ServicePlanManager;