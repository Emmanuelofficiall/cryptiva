import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CryptoLogosMarquee from "@/components/CryptoLogosMarquee";
import ServicesSection from "@/components/ServicesSection";
import FeaturesSection from "@/components/FeaturesSection";
import PlansSection from "@/components/PlansSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <CryptoLogosMarquee />
      <ServicesSection />
      <FeaturesSection />
      <PlansSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
