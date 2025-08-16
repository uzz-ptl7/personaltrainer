import { CheckCircle, Award, Users, Clock } from "lucide-react";
import trainerPhoto from "@/assets/trainer-photo.jpg";

const About = () => {
  const achievements = [
    { icon: Award, text: "Certified Personal Trainer (NASM)" },
    { icon: Users, text: "500+ Clients Transformed" },
    { icon: Clock, text: "8+ Years Experience" },
    { icon: CheckCircle, text: "Nutrition Specialist" },
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image with Trainer Name Overlay */}
          <div className="relative group">
            <div className="relative overflow-hidden rounded-2xl shadow-elevation">
              <img
                src={trainerPhoto}
                alt="Personal Trainer"
                className="w-full h-[600px] object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent"></div>
              
              {/* Name Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/75 to-background opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center">
                <div className="text-center mb-8">
                  <h3 className="font-heading font-bold text-3xl text-foreground mb-2">Alex Martinez</h3>
                  <p className="font-body text-lg text-muted-foreground">Certified Personal Trainer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <div>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-foreground mb-6">
                Meet Your{" "}
                <span className="text-gradient-primary">Trainer</span>
              </h2>
              
              <div className="space-y-4 font-body text-lg text-muted-foreground">
                <p>
                  Hi, I'm Alex Martinez, a certified personal trainer with over 8 years 
                  of experience helping people transform their lives through fitness. 
                  My passion for health and wellness started during my own fitness journey, 
                  and now I'm dedicated to helping others achieve their goals.
                </p>
                
                <p>
                  I believe that fitness is not just about physical transformation—it's 
                  about building confidence, discipline, and a mindset that carries over 
                  into every aspect of your life. Every program I design is tailored 
                  specifically to your unique needs, goals, and lifestyle.
                </p>
                
                <p>
                  Whether you're looking to lose weight, build muscle, improve athletic 
                  performance, or simply feel better in your own skin, I'm here to 
                  guide and support you every step of the way.
                </p>
              </div>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 p-4 bg-gradient-card rounded-lg border border-border"
                >
                  <achievement.icon className="h-6 w-6 text-primary flex-shrink-0" />
                  <span className="font-body text-sm text-foreground font-medium">
                    {achievement.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Mission Statement */}
            <div className="p-6 bg-gradient-card rounded-xl border border-border">
              <h3 className="font-heading font-semibold text-xl text-foreground mb-3">
                My Mission
              </h3>
              <p className="font-body text-muted-foreground">
                "To empower individuals to become the strongest, most confident 
                version of themselves through personalized fitness coaching and 
                unwavering support."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;