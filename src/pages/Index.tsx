import Navbar from "@/components/Navbar";
import { Seo } from "@/components/Seo";
import { buildHomeJsonLd } from "@/lib/seo";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import ServicesSection from "@/components/ServicesSection";
import BenefitsSection from "@/components/BenefitsSection";
import MethodSection from "@/components/MethodSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CtaSection from "@/components/CtaSection";
import FooterSection from "@/components/FooterSection";

const Index = () => {
  return (
    <main className="overflow-x-hidden">
      <Seo
        title="Coach sportif, bien-être & naturopathie"
        path="/"
        jsonLd={buildHomeJsonLd()}
      />
      <Navbar />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <BenefitsSection />
      <MethodSection />
      <TestimonialsSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
};

export default Index;
