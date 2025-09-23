import { User, Users, Monitor, Apple, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const Services = () => {
  const services = [
    {
      icon: User,
      title: "Personal Training",
      subtitle: "1-on-1 Sessions",
      description: "Personalized workout sessions designed specifically for your goals, fitness level, and preferences.",
      features: [
        "Custom workout plans",
        "Proper form guidance",
        "Progress tracking",
        "Flexible scheduling"
      ],
      popular: false
    },
    {
      icon: Monitor,
      title: "Online Coaching",
      subtitle: "Train Anywhere",
      description: "Get professional guidance and custom workout plans delivered digitally, perfect for busy schedules.",
      features: [
        "Weekly workout plans",
        "Video exercise library",
        "Progress check-ins",
        "24/7 support chat"
      ],
      popular: true
    },
    {
      icon: Users,
      title: "Group Classes",
      subtitle: "Small Groups",
      description: "High-energy group sessions that combine motivation, community, and expert coaching.",
      features: [
        "Max 6 people per class",
        "Varied workout styles",
        "Team motivation",
        "Cost-effective option"
      ],
      popular: false
    },
    {
      icon: Apple,
      title: "Nutrition Guidance",
      subtitle: "Fuel Your Progress",
      description: "Comprehensive nutrition planning to complement your training and accelerate your results.",
      features: [
        "Meal planning assistance",
        "Macro calculations",
        "Healthy recipe ideas",
        "Supplement guidance"
      ],
      popular: false
    }
  ];

  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="services" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-6">
            Training{" "}
            <span className="text-gradient-primary">Programs</span>
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect training solution that fits your lifestyle, goals, and preferences. 
            All programs include my full support and expertise.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {services.map((service, index) => (
            <div 
              key={index}
              className={`relative bg-gradient-card rounded-2xl p-8 border shadow-elevation hover:shadow-primary/20 transition-smooth ${
                service.popular ? 'border-primary' : 'border-border'
              }`}
            >
              {/* Popular Badge */}
              {service.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-primary px-4 py-2 rounded-full">
                    <span className="text-primary-foreground font-semibold text-sm">
                      Most Popular
                    </span>
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className="flex items-center mb-6">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <service.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="font-heading font-bold text-xl text-foreground">
                    {service.title}
                  </h3>
                  <p className="text-primary font-medium">{service.subtitle}</p>
                </div>
              </div>

              {/* Description */}
              <p className="font-body text-muted-foreground mb-6">
                {service.description}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                    <span className="font-body text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                onClick={() => window.location.href = '/auth'}
                variant={service.popular ? "default" : "outline"}
                className={`w-full font-semibold transition-smooth ${
                  service.popular 
                    ? "bg-gradient-primary text-primary-foreground shadow-primary hover:shadow-glow" 
                    : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="font-body text-muted-foreground mb-6">
            Not sure which program is right for you?
          </p>
          <Button
            onClick={scrollToContact}
            variant="outline"
            size="lg"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg transition-smooth"
          >
            Book Free Consultation
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;