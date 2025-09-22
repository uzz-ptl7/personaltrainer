import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

interface IndexProps {
  onAuthRequest: () => void;
}

const Index = ({ onAuthRequest }: IndexProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header onAuthRequest={onAuthRequest} />
      <main>
        <Hero />
        <About />
        <Services />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
