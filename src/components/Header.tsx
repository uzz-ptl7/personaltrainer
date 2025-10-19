import { useState, useEffect } from 'react';
import { Menu, X, User, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User as UserType } from '@supabase/supabase-js';
import ssfLogo from '@/assets/ssf-logo.jpg';

interface HeaderProps {
  onAuthRequest?: () => void;
  user?: UserType | null;
}

const Header = ({ onAuthRequest, user }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to reset overflow when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const navigationItems = [
    { label: "Home", href: "#home" },
    { label: "About Me", href: "#about" },
    { label: "Gallery", href: "#gallery" },
    { label: "Services", href: "#services" },
    { label: "Contact", href: "#contact" },
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src={ssfLogo} alt="SSF Logo" className="h-10 w-10 rounded-full object-cover" />
            <span className="font-heading font-bold text-xl text-foreground">
              Salim Saleh Fitness
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="font-body text-muted-foreground hover:text-primary transition-smooth"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA Buttons (Desktop) */}
          <div className="hidden lg:flex gap-3">
            <Button
              onClick={() => scrollToSection('#contact')}
              className="bg-gradient-primary text-primary-foreground hover:shadow-primary transition-smooth px-6"
            >
              Contact Me
            </Button>
            {user ? (
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => window.location.href = '/auth'}
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-muted-foreground hover:text-primary transition-smooth"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="font-body text-muted-foreground hover:text-primary transition-smooth text-left"
                >
                  {item.label}
                </button>
              ))}
              <div className="space-y-3 mt-4">
                <Button
                  onClick={() => scrollToSection('#contact')}
                  className="w-full bg-gradient-primary text-primary-foreground hover:shadow-primary transition-smooth"
                >
                  Contact Me
                </Button>
                {user ? (
                  <Button
                    onClick={() => window.location.href = '/dashboard'}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                ) : (
                  <Button
                    onClick={() => window.location.href = '/auth'}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;