import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Simulate form submission
    toast({
      title: "Message Sent!",
      description: "Thank you for your interest! I'll get back to you within 24 hours.",
    });

    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: ""
    });
  };

  const contactInfo = [
    {
      icon: Phone,
      label: "Phone",
      value: "+1 (555) 123-4567",
      action: "tel:+15551234567"
    },
    {
      icon: Mail,
      label: "Email",
      value: "alex@fittransform.com",
      action: "mailto:alex@fittransform.com"
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "Quick Response",
      action: "https://wa.me/15551234567"
    },
    {
      icon: MapPin,
      label: "Location",
      value: "Los Angeles, CA",
      action: null
    }
  ];

  return (
    <section id="contact" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-6">
            Start Your{" "}
            <span className="text-gradient-primary">Journey</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to transform your life? Let's discuss your goals and create a 
            personalized plan that works for you. Your free consultation is just one message away.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div className="bg-gradient-card rounded-2xl p-8 border border-border shadow-elevation">
            <h3 className="font-heading font-semibold text-2xl text-foreground mb-6">
              Book Your Free Consultation
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Name *
                  </label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your full name"
                    className="bg-input border-border focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Your phone number"
                    className="bg-input border-border focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className="bg-input border-border focus:border-primary focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tell me about your goals *
                </label>
                <Textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="What would you like to achieve? What's your current fitness level? Any specific concerns or preferences?"
                  rows={5}
                  className="bg-input border-border focus:border-primary focus:ring-primary resize-none"
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-primary text-primary-foreground font-semibold shadow-primary hover:shadow-glow transition-smooth"
              >
                <Send className="w-5 h-5 mr-2" />
                Send Message
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="font-heading font-semibold text-2xl text-foreground mb-6">
                Get In Touch
              </h3>
              <p className="font-body text-muted-foreground mb-8">
                I respond to all inquiries within 24 hours. Whether you have questions 
                about my programs, want to schedule a consultation, or just need some 
                quick advice, don't hesitate to reach out.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="space-y-4">
              {contactInfo.map((info, index) => (
                <div key={index} className="flex items-center p-4 bg-gradient-card rounded-xl border border-border">
                  <div className="p-3 bg-primary/10 rounded-lg mr-4">
                    <info.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{info.label}</div>
                    {info.action ? (
                      <a
                        href={info.action}
                        className="text-muted-foreground hover:text-primary transition-smooth"
                        target={info.action.startsWith('http') ? '_blank' : undefined}
                        rel={info.action.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {info.value}
                      </a>
                    ) : (
                      <div className="text-muted-foreground">{info.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Call to Action Box */}
            <div className="bg-gradient-primary p-6 rounded-xl text-center">
              <h4 className="font-heading font-semibold text-xl text-primary-foreground mb-2">
                Ready to Get Started?
              </h4>
              <p className="text-primary-foreground/90 mb-4">
                Your transformation begins with a single step. Let's take it together.
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="bg-background text-foreground hover:bg-background/90 font-semibold"
                onClick={() => document.querySelector('form')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Book Free Consultation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;