import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import VideoTestimonials from "@/components/VideoTestimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

interface IndexProps {
  onAuthRequest: () => void;
}

const Index = ({ onAuthRequest }: IndexProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is logged in and redirect to dashboard
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        window.location.href = '/dashboard';
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          window.location.href = '/dashboard';
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header onAuthRequest={onAuthRequest} />
      <main>
        <Hero />
        <About />
        <Services />
        <VideoTestimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
