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
import { Upload, Download, FileText, Video, Trash2, Eye, Search, Link as LinkIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  type: 'pdf' | 'video';
  created_at: string;
  updated_at: string;
}

interface Service {
  id: string;
  title: string;
  type: string;
}

interface ServiceResource {
  id: string;
  service_id: string;
  resource_id: string;
  is_default: boolean | null;
  services?: Service;
}

const ResourcesManager: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceResources, setServiceResources] = useState<ServiceResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'video'>('all');
  
  // Upload form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState<'pdf' | 'video'>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Assignment form
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isDefault, setIsDefault] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (resourcesError) throw resourcesError;
      setResources((resourcesData || []) as Resource[]);

      // Load services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, title, type')
        .eq('is_active', true)
        .order('title');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Load service-resource assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('service_resources')
        .select('*, services:service_id(id, title, type)');

      if (assignmentsError) throw assignmentsError;
      setServiceResources((assignmentsData || []) as ServiceResource[]);

    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !title) {
      toast({
        title: "Missing information",
        description: "Please provide a title and select a file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(filePath);

      // Create resource record
      const { error: insertError } = await supabase
        .from('resources')
        .insert({
          title,
          description: description || null,
          file_url: publicUrl,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          type: resourceType,
        });

      if (insertError) throw insertError;

      toast({
        title: "Resource uploaded successfully",
      });

      // Notify all users who have purchased services about new resource
      try {
        const { data: purchases } = await supabase
          .from('purchases')
          .select('user_id')
          .eq('payment_status', 'completed')
          .eq('is_active', true);

        if (purchases) {
          const uniqueUserIds = [...new Set(purchases.map(p => p.user_id))];
          await Promise.all(uniqueUserIds.map(userId =>
            supabase.functions.invoke('send-notification', {
              body: {
                user_id: userId,
                title: 'New Resource Available',
                message: `A new ${resourceType === 'pdf' ? 'PDF' : 'video'} resource "${title}" has been uploaded!`,
                type: 'info'
              }
            })
          ));
        }
      } catch (notifError) {
        console.error('Error sending notifications:', notifError);
      }

      setIsUploadModalOpen(false);
      resetUploadForm();
      loadData();

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAssignResources = async () => {
    if (!selectedResource || selectedServices.length === 0) {
      toast({
        title: "Missing information",
        description: "Please select services to assign",
        variant: "destructive",
      });
      return;
    }

    try {
      const assignments = selectedServices.map(serviceId => ({
        service_id: serviceId,
        resource_id: selectedResource.id,
        is_default: isDefault,
      }));

      const { error } = await supabase
        .from('service_resources')
        .upsert(assignments, { onConflict: 'service_id,resource_id' });

      if (error) throw error;

      toast({
        title: "Resource assigned successfully",
      });

      setIsAssignModalOpen(false);
      setSelectedResource(null);
      setSelectedServices([]);
      setIsDefault(false);
      loadData();

    } catch (error: any) {
      toast({
        title: "Assignment failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource? This will also remove all service assignments.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: "Resource deleted successfully",
      });

      loadData();

    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnassignResource = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('service_resources')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Resource unassigned successfully",
      });

      loadData();

    } catch (error: any) {
      toast({
        title: "Unassign failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetUploadForm = () => {
    setTitle('');
    setDescription('');
    setResourceType('pdf');
    setSelectedFile(null);
  };

  const getResourceAssignments = (resourceId: string) => {
    return serviceResources.filter(sr => sr.resource_id === resourceId);
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (resource.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || resource.type === filterType;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading resources...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold break-words">Resources Management</h2>
          <p className="text-muted-foreground text-sm break-words">Upload and manage PDFs and videos for your services</p>
        </div>
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="w-full sm:w-auto flex-shrink-0">
              <Upload className="mr-2 h-4 w-4" />
              Upload Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload New Resource</DialogTitle>
              <DialogDescription>
                Upload a PDF or video file and assign it to services
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Week 1 Workout Plan"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this resource..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="type">Resource Type</Label>
                <Select value={resourceType} onValueChange={(value: 'pdf' | 'video') => setResourceType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept={resourceType === 'pdf' ? '.pdf' : 'video/*'}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              <Button
                onClick={handleFileUpload}
                disabled={uploading || !selectedFile || !title}
                className="w-full"
              >
                {uploading ? "Uploading..." : "Upload Resource"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="pdf">PDFs Only</SelectItem>
            <SelectItem value="video">Videos Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resources List */}
      <div className="grid gap-4">
        {filteredResources.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No resources found</p>
            </CardContent>
          </Card>
        ) : (
          filteredResources.map((resource) => {
            const assignments = getResourceAssignments(resource.id);
            const ResourceIcon = resource.type === 'pdf' ? FileText : Video;
            
            return (
              <Card key={resource.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                      <ResourceIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-col gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg break-words">{resource.title}</h3>
                          {resource.description && (
                            <p className="text-sm text-muted-foreground mt-1 break-words">{resource.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className="flex-shrink-0">{resource.type.toUpperCase()}</Badge>
                            <Badge variant="outline" className="flex-shrink-0">{formatFileSize(resource.file_size)}</Badge>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(resource.file_url, '_blank')}
                            className="flex-1 sm:flex-initial"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedResource(resource);
                              setIsAssignModalOpen(true);
                            }}
                            className="flex-1 sm:flex-initial"
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteResource(resource.id)}
                            className="flex-1 sm:flex-initial"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Assigned Services */}
                      {assignments.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Assigned to:</p>
                          <div className="flex flex-wrap gap-2">
                            {assignments.map((assignment) => (
                              <Badge
                                key={assignment.id}
                                variant="secondary"
                                className="gap-2"
                              >
                                {assignment.services?.title}
                                {assignment.is_default && (
                                  <span className="text-xs">(Default)</span>
                                )}
                                <button
                                  onClick={() => handleUnassignResource(assignment.id)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Assignment Dialog */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Resource to Services</DialogTitle>
            <DialogDescription>
              Select which services should include this resource
            </DialogDescription>
          </DialogHeader>
          {selectedResource && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedResource.title}</p>
                <p className="text-sm text-muted-foreground">{selectedResource.type.toUpperCase()}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Select Services</Label>
                <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto space-y-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={service.id}
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServices([...selectedServices, service.id]);
                          } else {
                            setSelectedServices(selectedServices.filter(id => id !== service.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={service.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {service.title} <span className="text-muted-foreground">({service.type})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is-default"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked as boolean)}
                />
                <label
                  htmlFor="is-default"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Set as default resource (automatically assigned on purchase)
                </label>
              </div>

              <Button
                onClick={handleAssignResources}
                disabled={selectedServices.length === 0}
                className="w-full"
              >
                Assign to {selectedServices.length} Service(s)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourcesManager;
