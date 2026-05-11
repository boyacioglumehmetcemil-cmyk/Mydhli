import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import Logo from "@/components/Logo";

const NotFound = () => (
  <div className="min-h-screen bg-dhl-panel flex flex-col items-center justify-center px-4" data-testid="notfound-page">
    <Logo size="md" />
    <div className="font-display text-[10rem] font-black text-dhl-yellow leading-none mt-8" style={{ textShadow: "4px 4px 0 #1A1A1A" }}>
      404
    </div>
    <h1 className="font-display text-3xl font-black text-dhl-text mt-4 tracking-tighter">Lost in transit.</h1>
    <p className="text-sm text-dhl-muted mt-3 max-w-md text-center">
      We couldn't find that page. It might have been moved, or the address is incorrect.
    </p>
    <div className="mt-7 flex flex-col sm:flex-row gap-3">
      <Link to="/" data-testid="notfound-home" className="inline-flex items-center justify-center h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold uppercase tracking-wider text-xs px-6 border-2 border-dhl-ink">
        <Home className="mr-2 w-4 h-4" /> Return Home
      </Link>
      <Link to="/track" data-testid="notfound-track" className="inline-flex items-center justify-center h-11 border-2 border-dhl-ink text-dhl-ink hover:bg-dhl-ink hover:text-white font-bold uppercase tracking-wider text-xs px-6">
        <Search className="mr-2 w-4 h-4" /> Track a Shipment
      </Link>
    </div>
  </div>
);

export default NotFound;
