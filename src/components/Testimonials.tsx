import { Star, Quote } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      age: 32,
      program: "Personal Training",
      quote: "Alex completely transformed my relationship with fitness. I went from being intimidated by the gym to feeling confident and strong. Lost 30 pounds and gained so much more than just physical strength!",
      rating: 5,
      beforeAfter: "Lost 30 lbs, Gained Confidence"
    },
    {
      name: "Mike Rodriguez",
      age: 28,
      program: "Online Coaching",
      quote: "The online coaching program was perfect for my busy schedule. Alex's guidance helped me build muscle and improve my performance while traveling for work. The support was incredible!",
      rating: 5,
      beforeAfter: "Gained 15 lbs Muscle"
    },
    {
      name: "Lisa Chen",
      age: 45,
      program: "Group Classes",
      quote: "I love the group classes! The energy is amazing and Alex makes everyone feel included regardless of fitness level. It's been 8 months and I've never felt stronger or more motivated.",
      rating: 5,
      beforeAfter: "Improved Strength & Energy"
    },
    {
      name: "David Thompson",
      age: 35,
      program: "Nutrition + Training",
      quote: "The combination of training and nutrition guidance was game-changing. Alex helped me understand how to fuel my body properly. I'm in the best shape of my life at 35!",
      rating: 5,
      beforeAfter: "Best Shape of His Life"
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-5 w-5 ${
          index < rating ? "text-secondary fill-current" : "text-muted-foreground"
        }`}
      />
    ));
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

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-gradient-card rounded-2xl p-8 border border-border shadow-elevation hover:shadow-primary/20 transition-smooth relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10">
                <Quote className="h-12 w-12 text-primary" />
              </div>

              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-heading font-semibold text-xl text-foreground">
                    {testimonial.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Age {testimonial.age} • {testimonial.program}
                  </p>
                </div>
                <div className="flex space-x-1">
                  {renderStars(testimonial.rating)}
                </div>
              </div>

              {/* Quote */}
              <blockquote className="font-body text-foreground mb-6 text-lg leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Result Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full">
                <span className="text-primary font-semibold text-sm">
                  {testimonial.beforeAfter}
                </span>
              </div>
            </div>
          ))}
        </div>

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