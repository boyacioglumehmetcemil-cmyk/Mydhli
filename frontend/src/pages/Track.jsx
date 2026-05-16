/**
 * Track — public tracking surface.
 *
 * Two modes:
 *   - Index view (no :ref in URL)  → 4-section marketing-style layout:
 *       Section 1: Track & Trace H1
 *       Section 2: Gray input band
 *       Section 3: FAQ accordion (4 questions)
 *       Section 4: Careers callout strip (text left, placeholder right)
 *   - Detail view (/track/:ref) → loading / not-found / network-error /
 *       <TrackingDetail/> result, unchanged from the prior implementation.
 *
 * Both modes share the same chrome: utility bar + nav bar + mobile drawer +
 * search modal + light-theme 4-tier footer, all imported as named exports
 * from Landing.jsx.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, Briefcase, Loader2, PackageX } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Footer, MobileDrawer, NavBar, SearchModal, UtilityBar } from "@/pages/Landing";
import TrackingDetail from "@/components/TrackingDetail";
import api from "@/lib/api";
import useTitle from "@/hooks/useTitle";
import { CUSTOMER_SERVICE_FAQ as FAQ_ITEMS } from "@/lib/customerServiceFAQ";

const Track = () => {
  useTitle("Track & Trace");
  const { awb: awbParam } = useParams();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Detail-view state (only used when awbParam is set).
  const [input, setInput] = useState(awbParam || "");
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    // Multi-ref support: split on commas / newlines, take the first.
    // TODO: future — open multiple tabs / show stacked results when users
    // paste a batch.
    const first = input
      .split(/[\s,\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)[0];
    if (!first) {
      toast.error("Please enter a tracking reference");
      return;
    }
    navigate(`/track/${encodeURIComponent(first.toUpperCase())}`);
  };

  const isDetail = !!awbParam;

  return (
    <div className="min-h-screen bg-white flex flex-col" data-testid="track-page">
      <header data-testid="track-header">
        <UtilityBar onSearch={() => setSearchOpen(true)} />
        <NavBar onMobileMenu={() => setDrawerOpen(true)} />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </header>

      {/* ─── Section 1: Page heading band ─── */}
      <section className="bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-12">
          <h1
            data-testid="track-headline"
            className="font-display font-bold text-4xl lg:text-5xl text-dhl-ink"
          >
            Track &amp; Trace
          </h1>
        </div>
      </section>

      {/* ─── Section 2: Tracking input band ─── */}
      <section className="bg-stone-100 py-8 mt-8">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <form
            onSubmit={handleSubmit}
            data-testid="track-form"
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your tracking number(s)"
              data-testid="track-input"
              className="h-14 flex-1 px-4 border border-stone-300 bg-white rounded-sm focus:border-dhl-red focus:ring-2 focus:ring-dhl-red/20 outline-none text-base"
              aria-label="Tracking number"
            />
            <button
              type="submit"
              disabled={loading}
              data-testid="track-submit"
              className="h-14 px-10 bg-dhl-red text-white font-bold rounded-sm hover:bg-dhl-red-dark transition-colors disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Track"}
            </button>
          </form>
        </div>
      </section>

      {/* ─── Detail-view: results / loading / error ─── */}
      {isDetail && (
        <section className="flex-1 bg-stone-50 py-10 lg:py-14" data-testid="track-detail-section">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
            {loading && (
              <div className="text-center py-24" data-testid="track-loading">
                <Loader2 className="w-10 h-10 text-dhl-yellow mx-auto mb-4 animate-spin" />
                <p className="text-sm text-stone-500 font-medium">Looking up your shipment…</p>
              </div>
            )}
            {!loading && error?.kind === "notfound" && (
              <div
                data-testid="track-notfound"
                className="bg-white border border-stone-200 max-w-2xl mx-auto px-6 py-20 text-center"
              >
                <div className="w-20 h-20 mx-auto mb-6 border-2 border-dashed border-stone-300 flex items-center justify-center">
                  <PackageX className="w-10 h-10 text-stone-400" strokeWidth={1.5} />
                </div>
                <h2 className="font-display text-2xl font-bold text-dhl-ink mb-3">
                  No shipment found
                </h2>
                <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">
                  We couldn't find a shipment for reference{" "}
                  <span className="font-mono font-bold text-dhl-ink">{error.awb}</span>.
                  Double-check the number and try again — we accept AWB, HAWB, MAWB, HBL, MBL,
                  booking reference or container number.
                </p>
                <Button
                  data-testid="track-retry"
                  onClick={() => navigate("/track")}
                  className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold rounded-md text-sm px-6"
                >
                  Try another reference
                </Button>
              </div>
            )}
            {!loading && error?.kind === "network" && (
              <div
                data-testid="track-network-error"
                className="bg-white border border-dhl-red max-w-2xl mx-auto px-6 py-14 text-center"
              >
                <h2 className="font-display text-2xl font-black text-dhl-red mb-3">
                  Tracking service unavailable
                </h2>
                <p className="text-sm text-stone-500 mb-5">
                  Something went wrong reaching the tracking service. Please try again in a moment.
                </p>
                <Button
                  data-testid="track-network-retry"
                  onClick={() => fetchShipment(input || awbParam || "")}
                  className="h-11 bg-dhl-ink text-white hover:bg-dhl-red rounded-md uppercase tracking-wider text-xs font-bold px-6"
                >
                  Retry
                </Button>
              </div>
            )}
            {!loading && shipment && <TrackingDetail shipment={shipment} mode="public" />}
          </div>
        </section>
      )}

      {/* ─── Index-view extras (only when NO :ref in URL) ─── */}
      {!isDetail && (
        <>
          {/* Section 3 — FAQ accordion */}
          <section className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16" data-testid="track-faq-section">
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-dhl-ink mb-6">
              Frequently asked questions
            </h2>
            <Accordion
              type="single"
              collapsible
              className="border-t border-stone-200"
              data-testid="track-faq"
            >
              {FAQ_ITEMS.map((item, idx) => (
                <AccordionItem
                  key={item.q}
                  value={`faq-${idx}`}
                  className="border-b border-stone-200"
                  data-testid={`track-faq-row-${idx}`}
                >
                  <AccordionTrigger className="text-base text-dhl-ink hover:no-underline font-medium py-5">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-stone-600 leading-relaxed pb-5 pr-8">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Section 4 — Careers callout strip */}
          <section
            className="max-w-[1280px] mx-auto px-6 lg:px-10 pb-20"
            data-testid="track-careers-section"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-dhl-ink mb-5">
                  Move faster. Move smarter. Move with us.
                </h2>
                <p className="text-base text-stone-600 mb-3">
                  Careers across logistics, technology, freight handling and customer operations.
                </p>
                <p className="text-base text-stone-600 mb-3">
                  Clear growth paths, stable schedules, real impact on the world's supply chains.
                </p>
                <p className="text-base text-stone-600 mb-6">
                  Find a role that fits the way you want to work.
                </p>
                <a
                  href="https://careers.dhl.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="track-careers-cta"
                  className="inline-flex items-center gap-2 h-12 px-8 bg-dhl-red text-white font-bold rounded-sm hover:bg-dhl-red-dark transition-colors"
                >
                  See open roles <ArrowRight className="w-4 h-4" />
                </a>
              </div>
              <div className="lg:col-span-5">
                {/* TODO: swap this placeholder for a real careers / team photo
                    when the user provides one. */}
                <div
                  className="rounded-xl overflow-hidden aspect-[16/12] bg-dhl-yellow flex items-center justify-center"
                  data-testid="track-careers-image"
                >
                  <Briefcase className="w-14 h-14 text-dhl-red/40" />
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Tier 2 promo cards hidden on this page — same treatment as /help. */}
      <Footer showPromoCards={false} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Track;
