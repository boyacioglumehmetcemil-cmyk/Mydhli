import { useNavigate } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

const FinalCTA = () => {
  const navigate = useNavigate();
  return (
    <section
      id="cta"
      data-testid="final-cta"
      className="relative bg-dhl-yellow py-20 lg:py-24 overflow-hidden"
    >
      <svg
        className="absolute inset-0 w-full h-full opacity-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="diag" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y="0" x2="0" y2="20" stroke="#1A1A1A" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diag)" />
      </svg>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 text-center">
        <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-dhl-ink leading-[0.95] tracking-tighter mb-5">
          Ready to ship the world?
        </h2>
        <p className="text-base lg:text-lg text-dhl-ink/80 max-w-xl mx-auto mb-9">
          Open an account in under 5 minutes. No setup fees. See contract rates, schedule pickups,
          and print labels in one place.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            data-testid="cta-open-account"
            onClick={() => navigate("/register")}
            className="h-13 bg-dhl-ink text-white hover:bg-dhl-red font-bold px-8 py-3 rounded-none uppercase tracking-wider text-sm border-2 border-dhl-ink hover:-translate-y-0.5 transition-transform"
          >
            Open Account <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button
            data-testid="cta-talk-sales"
            onClick={() => alert("In production this would open the sales contact form.")}
            variant="outline"
            className="h-13 border-2 border-dhl-ink text-dhl-ink hover:bg-dhl-ink hover:text-white font-bold px-8 py-3 rounded-none uppercase tracking-wider text-sm bg-transparent"
          >
            <Phone className="mr-2 w-4 h-4" /> Talk to Sales
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
