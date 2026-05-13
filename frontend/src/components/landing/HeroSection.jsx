import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search, Calculator, CalendarClock, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TabBtn = ({ active, onClick, icon: Icon, label, testId }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testId}
    className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
      active
        ? "border-dhl-yellow text-dhl-ink bg-white"
        : "border-transparent text-dhl-muted hover:text-dhl-ink hover:bg-white/50"
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const HeroSection = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("track");
  const [awb, setAwb] = useState("");

  const onTrack = (e) => {
    e.preventDefault();
    if (!awb.trim()) return toast.error("Please enter an AWB");
    navigate(`/track/${awb.trim().toUpperCase()}`);
  };

  return (
    <section
      data-testid="hero-section"
      className="relative w-full min-h-screen flex items-center"
    >
      {/* Hero image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-cargo-plane.jpg"
          alt=""
          loading="eager"
          className="w-full h-full object-cover"
        />
        {/* Dark left-to-right overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-24 lg:py-32">
        <div className="max-w-3xl">
          <div
            data-testid="hero-eyebrow"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 mb-7 animate-fade-up"
          >
            <span className="w-2 h-2 bg-dhl-yellow rounded-full animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              Global Freight Forwarding
            </span>
          </div>

          <h1
            data-testid="hero-headline"
            className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[0.92] tracking-tighter mb-7 animate-fade-up"
            style={{ animationDelay: "100ms" }}
          >
            Connecting your world.
            <br />
            <span className="text-dhl-yellow">Delivered.</span>
          </h1>

          <p
            data-testid="hero-sub"
            className="text-base sm:text-lg lg:text-xl text-white/85 max-w-2xl leading-relaxed mb-9 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            Freight forwarding to 220+ countries and territories. Real-time tracking, dedicated
            couriers, and dependable next-day delivery options.
          </p>

          {/* Tabbed widget */}
          <div
            data-testid="hero-widget"
            className="bg-white shadow-2xl animate-fade-up max-w-2xl"
            style={{ animationDelay: "320ms" }}
          >
            <div className="flex border-b border-dhl-border bg-dhl-panel">
              <TabBtn
                active={tab === "track"}
                onClick={() => setTab("track")}
                icon={Search}
                label="Track"
                testId="hero-tab-track"
              />
              <TabBtn
                active={tab === "rate"}
                onClick={() => setTab("rate")}
                icon={Calculator}
                label="Get Rate"
                testId="hero-tab-rate"
              />
              <TabBtn
                active={tab === "pickup"}
                onClick={() => setTab("pickup")}
                icon={CalendarClock}
                label="Schedule Pickup"
                testId="hero-tab-pickup"
              />
            </div>

            <div className="p-5">
              {tab === "track" && (
                <form onSubmit={onTrack} className="flex flex-col sm:flex-row gap-3" data-testid="hero-track-form">
                  <Input
                    value={awb}
                    onChange={(e) => setAwb(e.target.value)}
                    placeholder="Enter Air Waybill (AWB) — try DHL1234567890"
                    data-testid="hero-track-input"
                    className="flex-1 h-12 bg-dhl-panel border-2 border-dhl-border focus-visible:border-dhl-yellow focus-visible:ring-0 rounded-none text-base"
                  />
                  <Button
                    type="submit"
                    data-testid="hero-track-submit"
                    className="h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold px-6 rounded-none uppercase tracking-wider text-sm border-2 border-dhl-ink"
                  >
                    Track <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </form>
              )}

              {tab === "rate" && (
                <div className="text-center py-3">
                  <p className="text-sm text-dhl-muted mb-4">
                    Get instant quotes between 220+ countries.
                  </p>
                  <Button
                    data-testid="hero-rate-cta"
                    onClick={() => navigate("/login?redirect=/dashboard/quote")}
                    className="h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold px-7 rounded-none uppercase tracking-wider text-sm border-2 border-dhl-ink"
                  >
                    Get a Quote <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}

              {tab === "pickup" && (
                <div className="text-center py-3">
                  <p className="text-sm text-dhl-muted mb-4">
                    Book a courier to collect your shipment.
                  </p>
                  <Button
                    data-testid="hero-pickup-cta"
                    onClick={() => navigate("/login?redirect=/dashboard/pickup")}
                    className="h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold px-7 rounded-none uppercase tracking-wider text-sm border-2 border-dhl-ink"
                  >
                    Schedule Pickup <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div
            data-testid="hero-trust"
            className="mt-7 flex items-center gap-3 text-sm text-white/70 animate-fade-up"
            style={{ animationDelay: "440ms" }}
          >
            <div className="flex -space-x-2">
              {["#FFCC00", "#D40511", "#1A1A1A"].map((c, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white" style={{ background: c }} />
              ))}
            </div>
            Trusted by <span className="font-bold text-white">2.7M+ businesses</span> worldwide
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center text-white/60 animate-fade-up" style={{ animationDelay: "600ms" }}>
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] mb-2">Scroll</span>
        <ChevronDown className="w-5 h-5 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSection;
