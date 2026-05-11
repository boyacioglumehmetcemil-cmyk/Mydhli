import DHLHeader from "@/components/landing/DHLHeader";
import ServiceDisruptionBanner from "@/components/landing/ServiceDisruptionBanner";
import HeroStatic from "@/components/landing/HeroStatic";
import QuickActionStrip from "@/components/landing/QuickActionStrip";
import MyDHLPlatform from "@/components/landing/MyDHLPlatform";
import FeaturedCarousel from "@/components/landing/FeaturedCarousel";
import {
  ShippingResourcesRow,
  SolutionsRow,
  SelfServiceRow,
} from "@/components/landing/InfoCardsRows";
import TrustStrip from "@/components/landing/TrustStrip";
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
      <div className="h-[120px]" aria-hidden="true" />

      <ServiceDisruptionBanner />

      <main>
        {/* Calm, static first impression */}
        <HeroStatic />
        <QuickActionStrip />
        <MyDHLPlatform />

        {/* Dynamic content lives mid-page where it adds interest as you scroll */}
        <FeaturedCarousel />

        <ShippingResourcesRow />
        <SolutionsRow />
        <SelfServiceRow />
        <TrustStrip />
        <SeoBlock />
      </main>
      <RichFooter />

      <FloatingNotificationBell />
    </div>
  );
};

export default Landing;
