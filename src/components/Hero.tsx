import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  const scrollToContact = () => {
    const element = document.querySelector("#contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-hero"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-7xl text-foreground mb-6 animate-fade-in-up">
            Transform Your{" "}
            <span className="text-gradient-primary">Body</span>,{" "}
            <br className="hidden sm:block" />
            Transform Your{" "}
            <span className="text-gradient-primary">Life</span>
          </h1>
          
          <p className="font-body text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up">
            Achieve your fitness goals with personalized training programs designed 
            to build strength, confidence, and lasting healthy habits.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up">
            <Button
              onClick={scrollToContact}
              size="lg"
              className="bg-gradient-primary text-primary-foreground font-semibold px-8 py-6 text-lg shadow-primary hover:shadow-glow transition-bounce animate-glow"
            >
              Start Training Today
            </Button>
            
            <Button
              onClick={() => document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" })}
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-6 text-lg transition-smooth"
            >
              Learn More
            </Button>
          </div>

          {/* Scroll Indicator */}
          <div className="mt-16 flex justify-center animate-float">
            <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
              <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-bounce"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;