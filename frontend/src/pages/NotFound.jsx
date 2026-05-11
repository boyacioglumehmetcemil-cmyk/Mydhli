import { Link } from "react-router-dom";
import { Home, Search, PackageX } from "lucide-react";
import Logo from "@/components/Logo";
import useTitle from "@/hooks/useTitle";

const NotFound = () => {
  useTitle("Lost in Transit");

  return (
    <div
      className="min-h-screen bg-white flex flex-col items-center justify-center px-4 relative overflow-hidden"
      data-testid="notfound-page"
    >
      {/* Diagonal yellow stripes background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #FFCC00, #FFCC00 20px, transparent 20px, transparent 60px)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <Logo variant="default" />

        {/* Lost parcel illustration */}
        <div className="my-10 flex justify-center">
          <svg
            viewBox="0 0 240 200"
            className="w-56 h-44"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Ground shadow */}
            <ellipse cx="120" cy="180" rx="80" ry="6" fill="#1A1A1A" opacity="0.1" />
            {/* Parcel */}
            <g transform="translate(60 50) rotate(-8 60 60)">
              <rect x="0" y="0" width="120" height="100" fill="#D4A957" stroke="#1A1A1A" strokeWidth="2.5" />
              <rect x="0" y="38" width="120" height="14" fill="#FFCC00" stroke="#1A1A1A" strokeWidth="2.5" />
              <rect x="53" y="0" width="14" height="100" fill="#FFCC00" stroke="#1A1A1A" strokeWidth="2.5" />
              {/* Label */}
              <rect x="12" y="60" width="34" height="22" fill="#fff" stroke="#1A1A1A" strokeWidth="2" />
              <line x1="14" y1="66" x2="44" y2="66" stroke="#1A1A1A" strokeWidth="1.5" />
              <line x1="14" y1="71" x2="38" y2="71" stroke="#1A1A1A" strokeWidth="1.5" />
              <line x1="14" y1="76" x2="40" y2="76" stroke="#1A1A1A" strokeWidth="1.5" />
            </g>
            {/* Question marks floating */}
            <text x="195" y="40" fontSize="32" fontFamily="Cabinet Grotesk, sans-serif" fontWeight="900" fill="#D40511">
              ?
            </text>
            <text x="30" y="55" fontSize="22" fontFamily="Cabinet Grotesk, sans-serif" fontWeight="900" fill="#1A1A1A">
              ?
            </text>
            <text x="210" y="120" fontSize="18" fontFamily="Cabinet Grotesk, sans-serif" fontWeight="900" fill="#1A1A1A" opacity="0.5">
              ?
            </text>
          </svg>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-dhl-red/10 border border-dhl-red/20 mb-5">
          <PackageX className="w-4 h-4 text-dhl-red" />
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-dhl-red">404 · Not Found</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-dhl-ink tracking-tighter mb-4">
          Lost in transit.
        </h1>
        <p className="text-base text-dhl-muted max-w-md mx-auto leading-[1.55] mb-8">
          We couldn't find that page. It may have been moved, the address mistyped, or it never
          existed in our system.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            data-testid="notfound-home"
            className="inline-flex items-center justify-center h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold uppercase tracking-wider text-xs px-7 border-2 border-dhl-ink transition-all hover:-translate-y-0.5"
          >
            <Home className="mr-2 w-4 h-4" /> Return Home
          </Link>
          <Link
            to="/track"
            data-testid="notfound-track"
            className="inline-flex items-center justify-center h-12 border-2 border-dhl-ink text-dhl-ink hover:bg-dhl-ink hover:text-white font-bold uppercase tracking-wider text-xs px-7 transition-all"
          >
            <Search className="mr-2 w-4 h-4" /> Track a Shipment
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
