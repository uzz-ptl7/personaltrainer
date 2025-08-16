import { Instagram, Youtube, Facebook, Mail, Phone } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
    { icon: Facebook, href: "#", label: "Facebook" },
  ];

  const quickLinks = [
    { label: "About", href: "#about" },
    { label: "Services", href: "#services" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Contact", href: "#contact" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand & Description */}
          <div>
            <h3 className="font-heading font-bold text-xl text-foreground mb-4">
              TrainerName
            </h3>
            <p className="font-body text-muted-foreground mb-6">
              Transforming lives through personalized fitness coaching. 
              Your journey to a stronger, healthier you starts here.
            </p>
            <div className="space-y-2">
              <a 
                href="tel:+250788123456"
                className="flex items-center text-muted-foreground hover:text-primary transition-smooth"
              >
                <Phone className="h-4 w-4 mr-2" />
                <span className="font-body">+250 788 123 456</span>
              </a>
              <a 
                href="mailto:alex@trainername.com"
                className="flex items-center text-muted-foreground hover:text-primary transition-smooth"
              >
                <Mail className="h-4 w-4 mr-2" />
                <span className="font-body">alex@trainername.com</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg text-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="font-body text-muted-foreground hover:text-primary transition-smooth text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-heading font-semibold text-lg text-foreground mb-4">
              Follow My Journey
            </h4>
            <p className="font-body text-muted-foreground mb-4">
              Get daily motivation, workout tips, and transformation stories.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="p-3 bg-muted rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-smooth"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="font-body text-muted-foreground">
            © {currentYear} TrainerName. All Rights Reserved.
          </p>
          <p className="font-accent text-primary mt-2 text-lg">
            Made with ❤️ in Rwanda by{" "}
            <a 
              href="https://www.sitecraftersz.co/" 
              className="underline hover:text-primary-glow transition-smooth" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Sitecrafters Team
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;