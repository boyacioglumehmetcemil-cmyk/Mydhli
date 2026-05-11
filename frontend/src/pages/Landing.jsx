import DHLHeader from "@/components/landing/DHLHeader";
import ServiceDisruptionBanner from "@/components/landing/ServiceDisruptionBanner";
import HeroStatic from "@/components/landing/HeroStatic";
import QuickActionStrip from "@/components/landing/QuickActionStrip";
import SecondarySlider from "@/components/landing/SecondarySlider";
import InsideNetworkGrid from "@/components/landing/InsideNetworkGrid";
import SeoBlock from "@/components/landing/SeoBlock";
import RichFooter from "@/components/landing/RichFooter";
import FloatingNotificationBell from "@/components/landing/FloatingNotificationBell";
import useTitle from "@/hooks/useTitle";

const Landing = () => {
  useTitle("Express Shipping & Logistics");

  return (
    <div
      className="min-h-screen bg-white"
      data-testid="landing-page"
      style={{ scrollBehavior: "smooth" }}
    >
      <DHLHeader />

      {/* Spacer for fixed header (utility 40 + main 80 = 120) */}
      <div className="h-[126px]" aria-hidden="true" />

      <ServiceDisruptionBanner />

      <main>
        <HeroStatic />
        <QuickActionStrip />
        <SecondarySlider />
        <InsideNetworkGrid />
        <SeoBlock />
      </main>
      <RichFooter />

      <FloatingNotificationBell />
    </div>
  );
};

export default Landing;
