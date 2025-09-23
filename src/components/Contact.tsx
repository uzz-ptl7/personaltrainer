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
      value: "+971 50 123 4567",
      action: "tel:+971501234567"
    },
    {
      icon: Mail,
      label: "Email",
      value: "salim@salimsalehfitness.com",
      action: "mailto:salim@salimsalehfitness.com"
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: "Quick Response",
      action: "https://wa.me/971501234567"
    },
    {
      icon: MapPin,
      label: "Location",
      value: "Kigali, Rwanda",
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

        <div className="grid lg:grid-cols-2 grid-cols-1 gap-12 max-w-6xl mx-auto">
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
          </div>
        </div>

          {/* Map */}
          <div className="bg-gradient-card rounded-xl p-4 mt-3 border border-border overflow-hidden">
            <h4 className="font-heading font-semibold text-lg text-foreground mb-4">
              Find Me in Kigali
            </h4>
            <div className="rounded-lg h-[500px] overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15949.65624441434!2d30.058611!3d-1.9705786!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca4258ed8e797%3A0xf32b36a5411d0bc8!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2sus!4v1672345678901!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kigali Location"
              ></iframe>
            </div>
          </div>

      </div>
    </section>
  );
};

export default Contact;