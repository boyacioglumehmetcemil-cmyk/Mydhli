import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Search, ArrowRight, ArrowLeft, PackageX, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Logo from "@/components/Logo";
import LandingNavbar from "@/components/LandingNavbar";
import Footer from "@/components/Footer";
import TrackingDetail from "@/components/TrackingDetail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

const Track = () => {
  const { awb: awbParam } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(awbParam || "");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-fetch when AWB is in the URL
  useEffect(() => {
    if (awbParam) {
      fetchShipment(awbParam);
    } else {
      setShipment(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awbParam]);

  const fetchShipment = async (awb) => {
    setLoading(true);
    setError(null);
    setShipment(null);
    try {
      const res = await api.get(`/track/${encodeURIComponent(awb.trim().toUpperCase())}`);
      setShipment(res.data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setError({ kind: "notfound", awb: awb.trim().toUpperCase() });
      } else {
        setError({ kind: "network" });
        toast.error("Unable to fetch tracking. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      toast.error("Please enter an AWB number");
      return;
    }
    navigate(`/track/${encodeURIComponent(trimmed.toUpperCase())}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <LandingNavbar />

      {/* Hero / Search */}
      <section className="bg-white border-b border-dhl-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-16">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-dhl-red mb-3">
            Tracking
          </div>
          <h1
            data-testid="track-headline"
            className="font-display text-4xl lg:text-5xl font-black text-dhl-text leading-tight tracking-tighter mb-3"
          >
            Track Your Shipment
          </h1>
          <p className="text-base text-dhl-muted max-w-2xl mb-7">
            Enter your AWB (Air Waybill) number to see real-time status, milestones and ETA.
            No account needed.
          </p>

          <form
            onSubmit={handleSubmit}
            data-testid="track-form"
            className="bg-white border-2 border-dhl-ink p-1 flex flex-col sm:flex-row gap-1 max-w-2xl shadow-[6px_6px_0px_0px_#FFCC00]"
          >
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. DHL1234567890"
              data-testid="track-input"
              className="flex-1 h-12 border-0 bg-transparent focus-visible:ring-0 text-base font-mono uppercase placeholder:text-dhl-muted placeholder:normal-case"
            />
            <Button
              type="submit"
              disabled={loading}
              data-testid="track-submit"
              className="h-12 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold px-6 rounded-none uppercase tracking-wider text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Track <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-xs text-dhl-muted">
            Try the demo AWB:{" "}
            <button
              type="button"
              data-testid="demo-awb-button"
              onClick={() => {
                setInput("DHL1234567890");
                navigate("/track/DHL1234567890");
              }}
              className="font-mono font-bold text-dhl-red hover:underline"
            >
              DHL1234567890
            </button>
          </div>
        </div>
      </section>

      {/* Result */}
      <section className="flex-1 bg-dhl-panel py-10 lg:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
          {loading && (
            <div className="text-center py-24" data-testid="track-loading">
              <Loader2 className="w-10 h-10 text-dhl-yellow mx-auto mb-4 animate-spin" />
              <p className="text-sm text-dhl-muted font-medium">Looking up your shipment…</p>
            </div>
          )}

          {!loading && error?.kind === "notfound" && (
            <div
              data-testid="track-notfound"
              className="bg-white border border-dhl-border max-w-2xl mx-auto px-6 py-20 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 border-2 border-dashed border-dhl-border flex items-center justify-center">
                <PackageX className="w-10 h-10 text-dhl-muted" strokeWidth={1.5} />
              </div>
              <h2 className="font-display text-2xl font-black text-dhl-text mb-3">
                No shipment found
              </h2>
              <p className="text-sm text-dhl-muted max-w-md mx-auto mb-6">
                We couldn't find a shipment with AWB{" "}
                <span className="font-mono font-bold text-dhl-text">{error.awb}</span>.
                Please double-check the number and try again.
              </p>
              <Button
                data-testid="track-retry"
                onClick={() => navigate("/track")}
                className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold rounded-none uppercase tracking-wider text-xs px-6 border-2 border-dhl-ink"
              >
                Try Another AWB
              </Button>
            </div>
          )}

          {!loading && error?.kind === "network" && (
            <div data-testid="track-network-error" className="bg-white border border-dhl-red max-w-2xl mx-auto px-6 py-14 text-center">
              <h2 className="font-display text-2xl font-black text-dhl-red mb-3">
                Tracking service unavailable
              </h2>
              <p className="text-sm text-dhl-muted mb-5">
                Something went wrong reaching the tracking service. Please try again in a moment.
              </p>
              <Button
                data-testid="track-network-retry"
                onClick={() => fetchShipment(input || awbParam || "")}
                className="h-11 bg-dhl-ink text-white hover:bg-dhl-red rounded-none uppercase tracking-wider text-xs font-bold px-6"
              >
                Retry
              </Button>
            </div>
          )}

          {!loading && shipment && (
            <TrackingDetail shipment={shipment} mode="public" />
          )}

          {!loading && !shipment && !error && (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-dhl-muted mx-auto mb-3 opacity-40" />
              <p className="text-sm text-dhl-muted">Enter an AWB above to see live tracking.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Track;
