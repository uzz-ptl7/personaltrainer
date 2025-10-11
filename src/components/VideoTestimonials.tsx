import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Play, Upload, Video } from "lucide-react";

interface VideoTestimonial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  is_featured: boolean;
}

const VideoTestimonials = () => {
  const [testimonials, setTestimonials] = useState<VideoTestimonial[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    video_file: null as File | null
  });

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Load approved video testimonials
    loadTestimonials();

    // Set up realtime subscription
    const subscription = supabase
      .channel('video_testimonials_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'video_testimonials',
        filter: 'is_approved=eq.true'
      }, () => {
        loadTestimonials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const loadTestimonials = async () => {
    const { data, error } = await supabase
      .from('video_testimonials')
      .select('*')
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading testimonials:', error);
    } else {
      setTestimonials(data || []);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload a testimonial.",
        variant: "destructive"
      });
      return;
    }

    if (!uploadData.title || !uploadData.video_file) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and video file.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload video file to storage
      const fileExt = uploadData.video_file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('video-testimonials')
        .upload(fileName, uploadData.video_file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('video-testimonials')
        .getPublicUrl(fileName);

      // Insert testimonial record
      const { error } = await supabase
        .from('video_testimonials')
        .insert([{
          user_id: user.id,
          title: uploadData.title,
          description: uploadData.description,
          video_url: publicUrl,
          is_approved: false,
          is_featured: false
        }]);

      if (error) throw error;

      toast({
        title: "Testimonial Uploaded!",
        description: "Your video testimonial has been submitted for review. It will be visible after admin approval.",
      });
      setUploadData({ title: '', description: '', video_file: null });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your testimonial. Please try again.",
        variant: "destructive"
      });
    }

    setIsUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadData({...uploadData, video_file: file});
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid video file (MP4, MOV, etc.)",
        variant: "destructive"
      });
    }
  };

  return (
    <section id="testimonials" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-6">
            Success{" "}
            <span className="text-gradient-primary">Stories</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Hear directly from clients who have transformed their lives through personalized training. 
            These authentic stories showcase real results and the journey to better health.
          </p>
          
          {/* Upload Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Video className="h-4 w-4 mr-2" />
                Share Your Story
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Video Testimonial</DialogTitle>
                <DialogDescription>
                  Share your fitness journey with others. Your video will be reviewed before being published.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Title *
                  </label>
                  <Input
                    value={uploadData.title}
                    onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                    placeholder="e.g., My 6-Month Transformation"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Video File *
                  </label>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    required
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <Textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                    placeholder="Tell us about your journey..."
                    rows={3}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary text-primary-foreground"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Testimonial
                    </>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Video Carousel */}
        {testimonials.length > 0 ? (
          <div className="max-w-5xl mx-auto">
            <Carousel className="w-full">
              <CarouselContent>
                {testimonials.map((testimonial) => (
                  <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/2">
                    <Card className="bg-gradient-card border-border shadow-elevation h-full">
                      <CardContent className="p-6">
                        <div className="aspect-video rounded-lg overflow-hidden mb-4">
                          <video
                            src={testimonial.video_url}
                            title={testimonial.title}
                            controls
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                          {testimonial.title}
                        </h3>
                        {testimonial.description && (
                          <p className="font-body text-muted-foreground text-sm">
                            {testimonial.description}
                          </p>
                        )}
                        {testimonial.is_featured && (
                          <div className="mt-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              Featured Story
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        ) : (
          <div className="text-center py-12">
            <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="font-body text-muted-foreground">
              Be the first to share your success story!
            </p>
          </div>
        )}

        {/* Statistics */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { number: "50+", label: "Clients Transformed" },
            { number: "98%", label: "Success Rate" },
            { number: "5+", label: "Years Experience" },
            { number: "24/7", label: "Support Available" }
          ].map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="font-heading font-bold text-3xl text-gradient-primary">
                {stat.number}
              </div>
              <div className="font-body text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default VideoTestimonials;