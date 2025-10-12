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
import { Upload, Download, Plus, User, FileText, Trash2, Eye, CheckCircle } from "lucide-react";

interface DietPlan {
  id: string;
  user_id: string;
  purchase_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  uploaded_by: string;
  consultation_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  profiles?: {
    user_id: string;
    full_name: string | null;
    email: string | null;
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

interface DietPlanManagerProps {
  currentUserId: string;
}

const DietPlanManager: React.FC<DietPlanManagerProps> = ({ currentUserId }) => {
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [completedPurchases, setCompletedPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load completed purchases that don't have diet plans yet
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('payment_status', 'completed');

      if (purchasesError) throw purchasesError;

      // Load existing diet plans
      const { data: dietPlansData, error: dietPlansError } = await supabase
        .from('diet_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (dietPlansError) throw dietPlansError;

      // Get profile data for all users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profilesError) throw profilesError;

      // Get purchase data for diet plans with service information
      const { data: purchaseDetailData, error: purchaseDetailError } = await supabase
        .from('purchases')
        .select('id, amount, service_id, payment_status');

      if (purchaseDetailError) throw purchaseDetailError;

      // Get service data
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, title, type');

      if (servicesError) throw servicesError;

      // Enrich diet plans with profile and purchase data
      const enrichedDietPlans = (dietPlansData || []).map(plan => ({
        ...plan,
        profiles: profilesData?.find(profile => profile.user_id === plan.user_id),
        purchases: purchaseDetailData?.find(purchase => purchase.id === plan.purchase_id)
      }));

      // Enrich purchases with profile and service data
      const enrichedPurchases = (purchasesData || []).map(purchase => ({
        ...purchase,
        profiles: profilesData?.find(profile => profile.user_id === purchase.user_id),
        service: servicesData?.find(service => service.id === purchase.service_id)
      }));

      // Filter purchases that already have diet plans
      const existingPurchaseIds = new Set((dietPlansData || []).map(plan => plan.purchase_id));
      const availablePurchases = enrichedPurchases.filter(purchase => 
        !existingPurchaseIds.has(purchase.id)
      );

      setDietPlans(enrichedDietPlans);
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

  const uploadDietPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPurchaseId || !title || !selectedFile) {
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
      const filePath = `diet-plans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('diet-plans')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('diet-plans')
        .getPublicUrl(filePath);

      // Find the selected purchase to get user_id
      const selectedPurchase = completedPurchases.find(p => p.id === selectedPurchaseId);
      if (!selectedPurchase) throw new Error('Selected purchase not found');

      // Save diet plan record
      const { error: insertError } = await supabase
        .from('diet_plans')
        .insert({
          user_id: selectedPurchase.user_id,
          purchase_id: selectedPurchaseId,
          title,
          description: description || null,
          file_url: publicUrl,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          uploaded_by: currentUserId,
          is_active: true
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Diet plan uploaded successfully"
      });

      // Reset form
      setIsUploadModalOpen(false);
      setSelectedPurchaseId('');
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      
      // Reload data
      loadData();
    } catch (error) {
      console.error('Error uploading diet plan:', error);
      toast({
        title: "Error",
        description: "Failed to upload diet plan",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteDietPlan = async (id: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this diet plan?')) return;

    try {
      // Delete from database
      const { error: deleteError } = await supabase
        .from('diet_plans')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Delete file from storage
      const filePath = fileUrl.split('/').pop();
      if (filePath) {
        await supabase.storage
          .from('diet-plans')
          .remove([`diet-plans/${filePath}`]);
      }

      toast({
        title: "Success",
        description: "Diet plan deleted successfully"
      });

      loadData();
    } catch (error) {
      console.error('Error deleting diet plan:', error);
      toast({
        title: "Error",
        description: "Failed to delete diet plan",
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
          <h2 className="text-2xl font-bold text-foreground">Diet Plan Management</h2>
          <p className="text-muted-foreground">Upload personalized diet plans for clients with completed services</p>
        </div>
        
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary" disabled={completedPurchases.length === 0}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Diet Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Diet Plan</DialogTitle>
              <DialogDescription>
                Upload a personalized diet plan for a client
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={uploadDietPlan} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purchase">Client (Completed Service)</Label>
                <Select value={selectedPurchaseId} onValueChange={setSelectedPurchaseId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
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
                <Label htmlFor="title">Diet Plan Title</Label>
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
                  placeholder="Brief description of the diet plan..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Diet Plan File</Label>
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
                  {uploading ? "Uploading..." : "Upload Diet Plan"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {completedPurchases.length === 0 && dietPlans.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            No completed services available for diet plan upload
          </CardContent>
        </Card>
      )}

      {completedPurchases.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-primary">Available for Diet Plans</CardTitle>
            <CardDescription>
              Clients with completed service payments ready for diet plan delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedPurchases.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-4 bg-card/50 rounded-lg border border-border shadow-sm backdrop-blur-sm">
                  <div>
                    <p className="font-medium text-foreground">
                      {purchase.profiles?.full_name || 'Unknown Client'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {purchase.profiles?.email} • {purchase.service?.title || 'Unknown Service'}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Payment Completed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {dietPlans.map((plan) => (
          <Card key={plan.id} className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/20 shadow-md hover:shadow-lg transition-shadow backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="h-5 w-5 text-emerald-400" />
                    <h3 className="font-semibold text-foreground">
                      {plan.profiles?.full_name || 'Unknown Client'}
                    </h3>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <FileText className="h-3 w-3 mr-1" />
                      Diet Plan
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-foreground text-lg">{plan.title}</h4>
                    {plan.description && (
                      <p className="text-muted-foreground bg-card/30 p-3 rounded-md border border-border/50 backdrop-blur-sm">{plan.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground bg-card/30 p-2 rounded-md border border-border/50 backdrop-blur-sm">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {plan.file_name}
                      </span>
                      <span>Size: {formatFileSize(plan.file_size)}</span>
                      <span>Uploaded: {new Date(plan.created_at || '').toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(plan.file_url, '_blank')}
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-400"
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
                    className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-400"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteDietPlan(plan.id, plan.file_url)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DietPlanManager;