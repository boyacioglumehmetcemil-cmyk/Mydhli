import DHLHeader from "@/components/landing/DHLHeader";
import ServiceDisruptionBanner from "@/components/landing/ServiceDisruptionBanner";
import HeroCarousel from "@/components/landing/HeroCarousel";
import QuickActionStrip from "@/components/landing/QuickActionStrip";
import MyDHLPlatform from "@/components/landing/MyDHLPlatform";
import InfoCardsRow from "@/components/landing/InfoCardsRow";
import TrustStrip from "@/components/landing/TrustStrip";
import RichFooter from "@/components/landing/RichFooter";
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
      <div className="h-[120px]" aria-hidden="true" />

      <ServiceDisruptionBanner />

      <main>
        <HeroCarousel />
        <QuickActionStrip />
        <MyDHLPlatform />
        <InfoCardsRow />
        <TrustStrip />
      </main>
      <RichFooter />
    </div>
  );
};

export default Landing;
