import { useNavigate } from "react-router-dom";
import { PackageOpen, UserPlus, Info, Sparkles, Receipt, CalendarClock } from "lucide-react";
import { useState } from "react";
import { useReveal } from "@/hooks/useReveal";
import { useAuth } from "@/contexts/AuthContext";
import ComingSoonModal from "./ComingSoonModal";

const MyDHLPlatform = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { ref, visible } = useReveal(0);
  const [modal, setModal] = useState(null);

  const goAuth = (to) =>
    isAuthenticated ? navigate(to) : navigate(`/login?redirect=${to}`);

  const CELLS = [
    {
      icon: PackageOpen,
      label: "Create Shipment",
      onClick: () => goAuth("/dashboard/ship"),
      testId: "mydhl-cell-ship",
    },
    {
      icon: Receipt,
      label: "Get a Quote",
      onClick: () => goAuth("/dashboard/quote"),
      testId: "mydhl-cell-quote",
    },
    {
      icon: CalendarClock,
      label: "Schedule Pickup",
      onClick: () => goAuth("/dashboard/pickup"),
      testId: "mydhl-cell-pickup",
    },
    {
      icon: UserPlus,
      label: "Create a Login",
      onClick: () => navigate("/register"),
      testId: "mydhl-cell-register",
    },
    {
      icon: Info,
      label: "About MyDHL+",
      onClick: () => setModal({ title: "About MyDHL+" }),
      testId: "mydhl-cell-about",
    },
    {
      icon: Sparkles,
      label: "What's New",
      onClick: () => setModal({ title: "What's New in MyDHL+" }),
      testId: "mydhl-cell-whatsnew",
    },
  ];

  return (
    <section
      id="mydhl"
      ref={ref}
      data-testid="mydhl-platform"
      className="relative bg-white py-16 lg:py-[120px] overflow-hidden"
    >
      {/* Decorative yellow swoosh */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1400 600"
        className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
        preserveAspectRatio="none"
      >
        <path
          d="M -50 380 Q 350 200, 700 320 T 1450 280"
          fill="none"
          stroke="#FFCC00"
          strokeWidth="120"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M -50 380 Q 350 200, 700 320 T 1450 280"
          fill="none"
          stroke="#FFCC00"
          strokeWidth="2"
          strokeDasharray="6 8"
        />
      </svg>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Image */}
          <div
            className={`lg:col-span-7 transition-all duration-1000 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="relative">
              <img
                src="/images/mydhl-devices.jpg"
                alt="MyDHL platform on desktop, tablet, and mobile devices"
                loading="lazy"
                className="w-full h-auto max-h-[520px] object-cover object-center"
              />
              <div className="absolute -bottom-3 -right-3 w-32 h-32 bg-dhl-yellow -z-10 hidden lg:block" />
            </div>
          </div>

          {/* Copy column (no action card here anymore) */}
          <div
            className={`lg:col-span-5 transition-all duration-1000 delay-200 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-dhl-red mb-4">
              MyDHL Platform
            </div>
            <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-black text-dhl-ink leading-[0.95] tracking-tighter mb-6">
              Flexible.
              <br />
              Powerful.
              <br />
              <span className="text-dhl-yellow" style={{ WebkitTextStroke: "1.5px #1A1A1A" }}>
                Effortless.
              </span>
            </h2>
            <p className="text-base lg:text-lg text-dhl-muted leading-[1.55]">
              Your full logistics control center — create shipments, get rates, schedule pickups,
              manage customs documents, and track everything in one place. Built for the way modern
              businesses ship.
            </p>
          </div>
        </div>

        {/* Full-width 6-cell action row — single row on desktop, responsive grid below */}
        <div
          data-testid="mydhl-actions-card"
          className="mt-10 lg:mt-14 bg-white rounded-lg shadow-lg border border-dhl-border overflow-hidden max-w-[1200px] mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-gray-200">
            {CELLS.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  type="button"
                  key={c.label}
                  onClick={c.onClick}
                  data-testid={c.testId}
                  className="group bg-white flex flex-col items-center justify-center text-center px-3 py-6 hover:bg-dhl-yellow/10 transition-colors duration-[200ms] ease-out"
                >
                  <Icon className="w-7 h-7 text-dhl-ink mb-2" strokeWidth={1.75} />
                  <span className="font-semibold text-[13px] text-[#1976D2] group-hover:text-[#0D47A1] transition-colors leading-tight">
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ComingSoonModal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.title || ""}
        body="The MyDHL+ feature you're looking at is part of the live platform. Sign in or open an account to access it."
      />
    </section>
  );
};

export default MyDHLPlatform;
