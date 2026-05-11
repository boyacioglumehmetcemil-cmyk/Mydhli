import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Plane, MapPin, Shield, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import LandingNavbar from "@/components/LandingNavbar";
import Footer from "@/components/Footer";
import HeroVisual from "@/components/HeroVisual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Landing = () => {
  const navigate = useNavigate();
  const [awb, setAwb] = useState("");

  const handleTrack = (e) => {
    e.preventDefault();
    if (!awb.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }
    toast.info("Tracking comes online in the next phase", {
      description: "Phase 2 will plug in live tracking. Hang tight!",
    });
  };

  const features = [
    {
      icon: Zap,
      title: "Fast Express Delivery",
      desc: "Same-day pickup in Port Moresby and next-flight-out service across PNG provinces with priority customs clearance.",
    },
    {
      icon: MapPin,
      title: "Real-time Tracking",
      desc: "Watch every milestone — pickup, scan, transit, customs, last-mile — with timestamped events streamed to your dashboard.",
    },
    {
      icon: Shield,
      title: "Business Solutions",
      desc: "Volume contracts, dedicated account support, and Pacific-region trade compliance built for PNG enterprises.",
    },
  ];

  const stats = [
    { value: "220+", label: "Countries Reached" },
    { value: "Same-Day", label: "Pickup in Port Moresby" },
    { value: "24/7", label: "Account Support" },
    { value: "18+", label: "PNG Service Points" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingNavbar />

      {/* HERO */}
      <section className="relative bg-white border-b border-dhl-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7 animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-dhl-panel border border-dhl-border px-3 py-1.5 mb-6">
                <span className="w-2 h-2 bg-dhl-red rounded-full" />
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-dhl-text">
                  Papua New Guinea Network
                </span>
              </div>

              <h1
                data-testid="hero-headline"
                className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-dhl-text leading-[0.95] tracking-tighter mb-6"
              >
                Move your business across
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10">Papua New Guinea</span>
                  <span className="absolute inset-x-0 bottom-1 h-3 bg-dhl-yellow -z-0" />
                </span>{" "}
                — and beyond.
              </h1>

              <p className="text-base sm:text-lg text-dhl-muted max-w-xl mb-8 leading-relaxed">
                Express logistics built for PNG enterprises. From a kina-saving small parcel to a
                pallet bound for Sydney, we move it on time, every time.
              </p>

              {/* Track widget */}
              <form
                onSubmit={handleTrack}
                data-testid="hero-track-form"
                className="bg-white border-2 border-dhl-ink p-1 flex flex-col sm:flex-row gap-1 max-w-2xl shadow-[6px_6px_0px_0px_#FFCC00]"
              >
                <Input
                  type="text"
                  value={awb}
                  onChange={(e) => setAwb(e.target.value)}
                  placeholder="Enter Air Waybill (AWB) number"
                  data-testid="hero-track-input"
                  className="flex-1 h-12 border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-dhl-muted"
                />
                <Button
                  type="submit"
                  data-testid="hero-track-submit"
                  className="h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold px-6 rounded-none uppercase tracking-wider text-sm"
                >
                  Track Shipment
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </form>

              <div className="mt-6 flex items-center gap-6 text-sm">
                <button
                  type="button"
                  data-testid="hero-ship-cta"
                  onClick={() => navigate("/register")}
                  className="font-semibold text-dhl-red hover:underline underline-offset-4 decoration-2"
                >
                  Open an account →
                </button>
                <span className="text-dhl-muted">or</span>
                <button
                  type="button"
                  data-testid="hero-signin-link"
                  onClick={() => navigate("/login")}
                  className="font-semibold text-dhl-text hover:text-dhl-red"
                >
                  Sign in to MyDHL
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 animate-fade-up" style={{ animationDelay: "120ms" }}>
              <HeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="ship" className="py-20 lg:py-28 bg-dhl-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-dhl-red mb-3">
                What we do
              </div>
              <h2 className="font-display text-3xl lg:text-5xl font-black text-dhl-text leading-tight tracking-tight max-w-2xl">
                Logistics that reaches the last village — and the next continent.
              </h2>
            </div>
            <p className="text-base text-dhl-muted max-w-md">
              Three pillars hold up every shipment we touch. Speed without slack, visibility
              without spreadsheets, and contracts built for real PNG businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  data-testid={`feature-card-${idx}`}
                  className="group bg-white border border-dhl-border p-7 hover:border-dhl-yellow hover:-translate-y-1 transition-all duration-300 relative"
                >
                  <div className="absolute top-0 left-0 h-1 w-0 bg-dhl-yellow group-hover:w-full transition-all duration-500" />
                  <Icon className="w-10 h-10 text-dhl-red mb-6" strokeWidth={1.75} />
                  <h3 className="font-display text-xl font-bold text-dhl-text mb-3">
                    {f.title}
                  </h3>
                  <p className="text-sm text-dhl-muted leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="bg-dhl-ink text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {stats.map((s) => (
              <div
                key={s.label}
                data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
                className="border-l-2 border-dhl-yellow pl-5"
              >
                <div className="font-display text-4xl lg:text-5xl font-black text-dhl-yellow leading-none mb-2">
                  {s.value}
                </div>
                <div className="text-xs uppercase tracking-[0.2em] text-white/60">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section id="rates" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <Clock className="w-10 h-10 text-dhl-red mx-auto mb-5" strokeWidth={1.75} />
          <h2 className="font-display text-3xl lg:text-4xl font-black text-dhl-text tracking-tight mb-4">
            Ready when you are.
          </h2>
          <p className="text-base text-dhl-muted max-w-xl mx-auto mb-8">
            Open a free MyDHL account in under two minutes. No card required to see contract
            rates, schedule pickups, or print waybills.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              data-testid="cta-open-account"
              onClick={() => navigate("/register")}
              className="h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold px-7 rounded-sm uppercase tracking-wider text-sm border-2 border-dhl-ink hover:-translate-y-0.5 transition-transform"
            >
              Open Account
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              data-testid="cta-signin"
              onClick={() => navigate("/login")}
              className="h-12 border-2 border-dhl-ink text-dhl-ink hover:bg-dhl-ink hover:text-white font-bold px-7 rounded-sm uppercase tracking-wider text-sm bg-transparent"
            >
              <Plane className="mr-2 w-4 h-4" />
              Sign In to Ship
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
