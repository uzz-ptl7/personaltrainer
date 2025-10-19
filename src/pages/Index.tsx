import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import FitnessGallery from "@/components/FitnessGallery";
import Services from "@/components/Services";
// import Testimonials from "@/components/Testimonials";
import EmailMarketing from "@/components/EmailMarketing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

interface IndexProps {
  onAuthRequest: () => void;
}

const Index = ({ onAuthRequest }: IndexProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check current user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header onAuthRequest={onAuthRequest} user={user} />
      <main>
        <Hero />
        <About />
        <FitnessGallery />
        <Services />
        {/* <Testimonials /> */}
        <EmailMarketing />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
