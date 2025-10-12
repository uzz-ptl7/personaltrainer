import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Star, Quote, Play, Video, MessageSquare, X, Globe, Mail, PhoneCall, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";

interface VideoTestimonial {
  id: string;
  title: string;
  description: string;
  video_url: string;
  is_featured: boolean;
}

interface TextTestimonial {
  id: string;
  name: string;
  role: string;
  company: string | null;
  content: string;
  rating: number;
  website: string | null;
  email: string;
  phone: string;
  is_approved: boolean | null;
  is_featured: boolean | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

interface TextFormInputs {
  name: string;
  role: string;
  company?: string;
  content: string;
  rating: number;
  website?: string;
  email: string;
  phone: string;
}

const Testimonials = () => {
  const [videoTestimonials, setVideoTestimonials] = useState<VideoTestimonial[]>([]);
  const [textTestimonials, setTextTestimonials] = useState<TextTestimonial[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const [textCarouselApi, setTextCarouselApi] = useState<any>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<TextFormInputs>();

  // Placeholder video testimonials with placeholder URLs
  const placeholderVideos: VideoTestimonial[] = [
    {
      id: '1',
      title: 'Sarah\'s 6-Month Transformation',
      description: 'Lost 30 pounds and gained confidence through personalized training',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      is_featured: true
    },
    {
      id: '2', 
      title: 'Mike\'s Muscle Building Journey',
      description: 'Gained 15 pounds of muscle while traveling for work',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      is_featured: false
    },
    {
      id: '3',
      title: 'Lisa\'s Strength Transformation',
      description: '8 months of group classes changed her life',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      is_featured: false
    }
  ];

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Load placeholder videos and text testimonials
    loadTestimonials();

    // Body overflow control for modal
    if (isTextModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    // Set up realtime subscription for text testimonials
    const subscription = supabase
      .channel('text_testimonials_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'text_testimonials',
        filter: 'is_approved=eq.true'
      }, () => {
        loadTextTestimonials();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      document.body.style.overflow = "";
    };
  }, [isTextModalOpen]);

  const loadTestimonials = async () => {
    setVideoTestimonials(placeholderVideos);
    await loadTextTestimonials();
    setLoading(false);
  };

  const loadTextTestimonials = async () => {
    const { data, error } = await supabase
      .from('text_testimonials')
      .select('*')
      .eq('is_approved', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading text testimonials:', error);
    } else {
      setTextTestimonials(data || []);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex space-x-[2px]" aria-label={`Rating: ${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const isFull = rating >= i;
        const isHalf = !isFull && rating >= i - 0.5;
        if (isFull) {
          return <Star key={i} className="w-5 h-5 text-secondary fill-secondary" />;
        } else if (isHalf) {
          return (
            <div key={i} className="relative w-5 h-5">
              <Star className="text-muted-foreground absolute top-0 left-0 w-5 h-5" />
              <div className="absolute top-0 left-0 w-2.5 h-5 overflow-hidden">
                <Star className="text-secondary fill-secondary w-5 h-5" />
              </div>
            </div>
          );
        } else {
          return <Star key={i} className="w-5 h-5 text-muted-foreground" />;
        }
      })}
    </div>
  );

  const onSubmitTextTestimonial = async (formData: TextFormInputs) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit a testimonial.",
        variant: "destructive"
      });
      return;
    }

    const newTestimonial = {
      user_id: user.id,
      ...formData,
      is_approved: false,
      is_featured: false
    };

    const { error } = await supabase
      .from('text_testimonials')
      .insert([newTestimonial]);

    if (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit testimonial. Please try again.",
        variant: "destructive"
      });
      console.error(error);
      return;
    }

    toast({
      title: "Testimonial Submitted!",
      description: "Thank you! Your testimonial is pending approval and will be visible once reviewed.",
    });
    
    reset();
    setIsTextModalOpen(false);
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
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Real transformations from real people. These are just a few of the incredible 
            journeys I've had the privilege to be part of.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Video Stories
            </TabsTrigger>
            <TabsTrigger value="written" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Written Reviews
            </TabsTrigger>
          </TabsList>

          {/* Video Testimonials Tab */}
          <TabsContent value="videos" className="space-y-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : videoTestimonials.length > 0 ? (
              <div className="max-w-5xl mx-auto">
                <Carousel className="w-full" setApi={setCarouselApi}>
                  <CarouselContent>
                    {videoTestimonials.map((testimonial) => (
                      <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/2">
                        <Card className="bg-gradient-card border-border shadow-elevation h-full">
                          <CardContent className="p-6">
                            <div className="aspect-video rounded-lg overflow-hidden mb-4">
                              <video
                                src={testimonial.video_url}
                                title={testimonial.title}
                                controls
                                className="w-full h-full object-cover"
                                poster="/placeholder-video-thumbnail.jpg"
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
                  
                  {/* Navigation buttons for large screens - positioned on sides */}
                  <CarouselPrevious className="hidden lg:flex" />
                  <CarouselNext className="hidden lg:flex" />
                </Carousel>
                
                {/* Navigation buttons for small/medium screens - centered below with spacing */}
                <div className="flex justify-center items-center gap-6 mt-6 lg:hidden">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => carouselApi?.scrollPrev()}
                    className="h-10 w-10 rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous slide</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => carouselApi?.scrollNext()}
                    className="h-10 w-10 rounded-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next slide</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="font-body text-muted-foreground">
                  Video testimonials coming soon!
                </p>
              </div>
            )}
          </TabsContent>

          {/* Text Testimonials Tab */}
          <TabsContent value="written" className="space-y-8">
            <div className="text-center mb-8">
              <Dialog open={isTextModalOpen} onOpenChange={setIsTextModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Share Your Review
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit Your Review</DialogTitle>
                    <DialogDescription>
                      Share your experience and help others on their fitness journey.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleSubmit(onSubmitTextTestimonial)}>
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        {...register("name", { required: true })} 
                        disabled={isSubmitting} 
                        placeholder="Your Name" 
                      />
                      <Input 
                        {...register("role", { required: true })} 
                        disabled={isSubmitting} 
                        placeholder="Your Role/Profession" 
                      />
                    </div>
                    <Input 
                      {...register("company")} 
                      disabled={isSubmitting} 
                      placeholder="Company (optional)" 
                    />
                    <Textarea 
                      {...register("content", { required: true })} 
                      disabled={isSubmitting} 
                      rows={4} 
                      placeholder="Share your experience..." 
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        {...register("rating", { required: true, min: 1, max: 5 })} 
                        disabled={isSubmitting} 
                        type="number" 
                        min={1} 
                        max={5} 
                        placeholder="Rating (1-5)" 
                      />
                      <Input 
                        {...register("website")} 
                        disabled={isSubmitting} 
                        placeholder="Website (optional)" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        {...register("email", { required: true })} 
                        disabled={isSubmitting} 
                        type="email" 
                        placeholder="Email" 
                      />
                      <Input 
                        {...register("phone", { required: true })} 
                        disabled={isSubmitting} 
                        type="tel" 
                        placeholder="Phone" 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting} 
                      className="w-full bg-gradient-primary"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : textTestimonials.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="font-body text-muted-foreground">
                  Be the first to share your review!
                </p>
              </div>
            ) : textTestimonials.length > 3 ? (
              // Carousel for more than 3 testimonials
              <div className="max-w-6xl mx-auto">
                <Carousel className="w-full" setApi={setTextCarouselApi}>
                  <CarouselContent>
                    {textTestimonials.map((testimonial) => (
                      <CarouselItem key={testimonial.id} className="md:basis-1/2 lg:basis-1/3">
                        <Card className="bg-gradient-card border border-border shadow-elevation h-full">
                          <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                              {renderStars(testimonial.rating)}
                              {testimonial.is_featured && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                                  <ShieldCheck size={12} /> Featured
                                </span>
                              )}
                            </div>
                            
                            <div className="relative">
                              <Quote className="absolute top-0 right-0 h-8 w-8 text-primary/10" />
                              <blockquote className="font-body text-foreground text-sm leading-relaxed">
                                "{testimonial.content}"
                              </blockquote>
                            </div>

                            <div className="border-t border-border pt-4">
                              <div className="mb-3">
                                <h4 className="font-heading font-semibold text-lg text-foreground">
                                  {testimonial.name}
                                </h4>
                                <p className="text-muted-foreground text-sm">
                                  {testimonial.role}
                                  {testimonial.company && `, ${testimonial.company}`}
                                </p>
                              </div>
                              
                              <div className="flex flex-wrap gap-3 text-muted-foreground text-xs">
                                {testimonial.website && (
                                  <a
                                    href={testimonial.website || undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 hover:text-primary transition-colors"
                                  >
                                    <Globe className="h-3 w-3" />
                                    Website
                                  </a>
                                )}
                                <a
                                  href={`mailto:${testimonial.email}`}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  <Mail className="h-3 w-3" />
                                  Email
                                </a>
                                <a
                                  href={`tel:${testimonial.phone}`}
                                  className="flex items-center gap-1 hover:text-primary transition-colors"
                                >
                                  <PhoneCall className="h-3 w-3" />
                                  Call
                                </a>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  
                  {/* Navigation buttons for large screens */}
                  <CarouselPrevious className="hidden lg:flex" />
                  <CarouselNext className="hidden lg:flex" />
                </Carousel>
                
                {/* Navigation buttons for small/medium screens - centered below with spacing */}
                <div className="flex justify-center items-center gap-6 mt-6 lg:hidden">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => textCarouselApi?.scrollPrev()}
                    className="h-10 w-10 rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous testimonial</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => textCarouselApi?.scrollNext()}
                    className="h-10 w-10 rounded-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next testimonial</span>
                  </Button>
                </div>
              </div>
            ) : (
              // Grid layout for 3 or fewer testimonials
              <div className={`grid gap-6 max-w-6xl mx-auto ${
                textTestimonials.length === 1 ? 'grid-cols-1 max-w-2xl' :
                textTestimonials.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl' :
                'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {textTestimonials.map((testimonial) => (
                  <Card key={testimonial.id} className="bg-gradient-card border border-border shadow-elevation h-full">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        {renderStars(testimonial.rating)}
                        {testimonial.is_featured && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded flex items-center gap-1">
                            <ShieldCheck size={12} /> Featured
                          </span>
                        )}
                      </div>
                      
                      <div className="relative">
                        <Quote className="absolute top-0 right-0 h-8 w-8 text-primary/10" />
                        <blockquote className="font-body text-foreground text-sm leading-relaxed">
                          "{testimonial.content}"
                        </blockquote>
                      </div>

                      <div className="border-t border-border pt-4">
                        <div className="mb-3">
                          <h4 className="font-heading font-semibold text-lg text-foreground">
                            {testimonial.name}
                          </h4>
                          <p className="text-muted-foreground text-sm">
                            {testimonial.role}
                            {testimonial.company && `, ${testimonial.company}`}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-muted-foreground text-xs">
                          {testimonial.website && (
                            <a
                              href={testimonial.website || undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 hover:text-primary transition-colors"
                            >
                              <Globe className="h-3 w-3" />
                              Website
                            </a>
                          )}
                          <a
                            href={`mailto:${testimonial.email}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Mail className="h-3 w-3" />
                            Email
                          </a>
                          <a
                            href={`tel:${testimonial.phone}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <PhoneCall className="h-3 w-3" />
                            Call
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

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

export default Testimonials;