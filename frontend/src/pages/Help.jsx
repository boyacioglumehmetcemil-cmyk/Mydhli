/**
 * Customer service — public landing surface.
 *
 * Structure:
 *   1. Breadcrumb (Home › Customer service)
 *   2. Light-gray contact band: H1 + subhead + reference lookup + 3 sidebar cards
 *   3. FAQ accordion (4 Q&A pairs, shared with /track)
 *   4. Shared light-theme footer (from Landing.jsx)
 *
 * Page chrome (utility bar + nav bar + mobile drawer + search modal + footer)
 * is reused from Landing.jsx — same as /track and /global-forwarding.
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Footer,
  MobileDrawer,
  NavBar,
  SearchModal,
  UtilityBar,
} from "@/pages/Landing";
import { CUSTOMER_SERVICE_FAQ } from "@/lib/customerServiceFAQ";
import useTitle from "@/hooks/useTitle";

const Help = () => {
  useTitle("Customer service");
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ref, setRef] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = ref.trim();
    if (!trimmed) {
      toast.error("Please enter a tracking or booking reference");
      return;
    }
    // Reuse the multi-format /track/:ref detail route.
    navigate(`/track/${encodeURIComponent(trimmed.toUpperCase())}`);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col" data-testid="customer-service-page">
      <header data-testid="customer-service-header">
        <UtilityBar onSearch={() => setSearchOpen(true)} />
        <NavBar onMobileMenu={() => setDrawerOpen(true)} />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </header>

      {/* ─── 1) Breadcrumb ─── */}
      <nav
        aria-label="Breadcrumb"
        data-testid="cs-breadcrumb"
        className="max-w-[1280px] mx-auto px-6 lg:px-10 pt-6 pb-4 w-full"
      >
        <ol className="flex items-center text-sm">
          <li>
            <Link
              to="/"
              className="text-sm font-bold text-dhl-red hover:underline"
              data-testid="cs-breadcrumb-home"
            >
              Home
            </Link>
          </li>
          <li className="flex items-center" aria-hidden="true">
            <ChevronRight className="w-3 h-3 text-stone-400 mx-2" />
          </li>
          <li className="text-sm text-stone-600" aria-current="page">
            Customer service
          </li>
        </ol>
      </nav>

      {/* ─── 2) Light-gray contact band ─── */}
      <section className="bg-stone-100 py-12" data-testid="cs-contact-band">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10 lg:gap-12 items-start">
            {/* Left column — heading + reference lookup */}
            <div>
              <h1
                data-testid="cs-headline"
                className="font-display font-bold text-4xl lg:text-5xl text-dhl-ink"
              >
                Customer service
              </h1>
              <p className="text-base lg:text-lg text-stone-700 mt-2 mb-6 max-w-[640px]">
                Enter your reference number and we&apos;ll route you to the right team for a fast answer.
              </p>
              <form
                onSubmit={handleSubmit}
                data-testid="cs-reference-form"
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="text"
                  value={ref}
                  onChange={(e) => setRef(e.target.value)}
                  placeholder="Enter your tracking or booking reference"
                  data-testid="cs-reference-input"
                  aria-label="Tracking or booking reference"
                  className="h-14 flex-1 px-4 border border-stone-300 bg-white rounded-sm focus:border-dhl-red focus:ring-2 focus:ring-dhl-red/20 outline-none text-base"
                />
                <button
                  type="submit"
                  data-testid="cs-reference-submit"
                  className="h-14 px-10 bg-dhl-red text-white font-bold rounded-sm hover:bg-dhl-red-dark transition-colors"
                >
                  Find contact
                </button>
              </form>
            </div>

            {/* Right column — 3 sidebar cards */}
            <aside className="flex flex-col gap-4" data-testid="cs-sidebar">
              {/* Card 1 — Business account (yellow folded corner) */}
              <Link
                to="/register?intent=business"
                data-testid="cs-card-business"
                className="relative bg-white border border-stone-200 rounded-md p-4 pr-6 hover:border-stone-400 hover:shadow-sm transition group overflow-hidden"
              >
                <span
                  aria-hidden="true"
                  className="absolute top-0 right-0 w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-dhl-yellow"
                />
                <h3 className="text-base font-bold text-dhl-red inline-flex items-center">
                  DHL for Business
                  <ChevronRight className="w-4 h-4 text-dhl-red ml-1 transition-transform group-hover:translate-x-0.5" />
                </h3>
                <p className="text-sm text-stone-600 mt-1">
                  Shipping regularly? Open a business account for account pricing and consolidated invoices.
                </p>
              </Link>

              {/* Card 2 — Fraud email (external link) */}
              <a
                href="https://www.dhl.com/global-en/home/footer/fraud-awareness.html"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="cs-card-fraud"
                className="bg-white border border-stone-200 rounded-md p-4 hover:border-stone-400 hover:shadow-sm transition group"
              >
                <h3 className="text-base font-bold text-dhl-red inline-flex items-center">
                  Suspect a fraudulent email?
                  <ChevronRight className="w-4 h-4 text-dhl-red ml-1 transition-transform group-hover:translate-x-0.5" />
                  <ExternalLink className="w-3 h-3 text-dhl-red/70 ml-1" />
                </h3>
                <p className="text-sm text-stone-600 mt-1">
                  Let us know if you&apos;ve received a message claiming to be from DHL that looks suspicious.
                </p>
              </a>

              {/* Card 3 — No tracking number */}
              {/* TODO: wire to a dedicated /help/contacts route once division contact directory ships. */}
              <Link
                to="/help"
                data-testid="cs-card-no-tracking"
                className="bg-white border border-stone-200 rounded-md p-4 hover:border-stone-400 hover:shadow-sm transition group"
              >
                <h3 className="text-base font-bold text-dhl-red inline-flex items-center">
                  No tracking number?
                  <ChevronRight className="w-4 h-4 text-dhl-red ml-1 transition-transform group-hover:translate-x-0.5" />
                </h3>
                <p className="text-sm text-stone-600 mt-1">
                  Browse our division contacts to reach the right team without a reference.
                </p>
              </Link>
            </aside>
          </div>
        </div>
      </section>

      {/* ─── 3) FAQ accordion ─── */}
      <section
        className="max-w-[1280px] mx-auto px-6 lg:px-10 py-16 w-full"
        data-testid="cs-faq-section"
      >
        <h2 className="font-display font-bold text-2xl lg:text-3xl text-dhl-ink mb-6">
          Frequently asked questions
        </h2>
        <Accordion
          type="single"
          collapsible
          className="border-t border-stone-200"
          data-testid="cs-faq"
        >
          {CUSTOMER_SERVICE_FAQ.map((item, idx) => (
            <AccordionItem
              key={item.q}
              value={`faq-${idx}`}
              className="border-b border-stone-200"
              data-testid={`cs-faq-row-${idx}`}
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

      {/* ─── 4) Shared footer ─── */}
      <Footer />

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Help;
