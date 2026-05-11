import GlobalNavbar from "@/components/landing/GlobalNavbar";
import HeroSection from "@/components/landing/HeroSection";
import AnimatedStats from "@/components/landing/AnimatedStats";
import ServicesGrid from "@/components/landing/ServicesGrid";
import GlobalNetwork from "@/components/landing/GlobalNetwork";
import WhyBlocks from "@/components/landing/WhyBlocks";
import Testimonials from "@/components/landing/Testimonials";
import FinalCTA from "@/components/landing/FinalCTA";
import RichFooter from "@/components/landing/RichFooter";

const Landing = () => {
  return (
    <div className="min-h-screen bg-white" data-testid="landing-page" style={{ scrollBehavior: "smooth" }}>
      <GlobalNavbar variant="transparent" />
      <main>
        <HeroSection />
        <AnimatedStats />
        <ServicesGrid />
        <GlobalNetwork />
        <WhyBlocks />
        <Testimonials />
        <FinalCTA />
      </main>
      <RichFooter />
    </div>
  );
};

export default Landing;
