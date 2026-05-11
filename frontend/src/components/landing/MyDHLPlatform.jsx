import { useNavigate } from "react-router-dom";
import { PackageOpen, UserPlus, Info, Sparkles } from "lucide-react";
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
      className="bg-white py-16 lg:py-[120px]"
    >
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left: devices image (no border, no caption) */}
          <div
            className={`transition-all duration-1000 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <img
              src="/images/mydhl-devices.jpg"
              alt="MyDHL platform on desktop, tablet, and mobile devices"
              loading="lazy"
              className="w-full h-auto max-h-[480px] object-cover object-center"
            />
          </div>

          {/* Right: stacked top text + bottom action card */}
          <div
            className={`transition-all duration-1000 delay-200 ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            {/* TOP: eyebrow + h2 + sub */}
            <div className="mb-8">
              <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-dhl-red mb-3">
                MyDHL Platform
              </div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-[3rem] font-black text-dhl-ink leading-[0.98] tracking-tighter mb-5">
                Flexible.
                <br />
                Powerful.
                <br />
                <span className="text-dhl-yellow" style={{ WebkitTextStroke: "1.5px #1A1A1A" }}>
                  Effortless.
                </span>
              </h2>
              <p className="text-base lg:text-[1.05rem] text-dhl-muted leading-[1.55] max-w-[480px]">
                Your full logistics control center — create shipments, get rates, schedule pickups,
                manage customs documents, and track everything in one place.
              </p>
            </div>

            {/* BOTTOM: 4-cell action card aligned to same left edge as text above */}
            <div
              data-testid="mydhl-actions-card"
              className="bg-white rounded shadow-md border border-dhl-border overflow-hidden"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4">
                {CELLS.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <button
                      type="button"
                      key={c.label}
                      onClick={c.onClick}
                      data-testid={c.testId}
                      className="group relative flex flex-col items-center justify-center text-center px-3 py-5 hover:bg-dhl-yellow/10 transition-colors duration-[200ms] ease-out"
                    >
                      {/* Vertical divider on large screens (between cells) */}
                      {i > 0 && (
                        <span
                          aria-hidden="true"
                          className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-px bg-gray-200"
                          style={{ height: "60%" }}
                        />
                      )}
                      {/* Horizontal divider when wrapped to 2×2 on small/medium screens */}
                      {i >= 2 && (
                        <span
                          aria-hidden="true"
                          className="lg:hidden absolute top-0 left-6 right-6 h-px bg-gray-200"
                        />
                      )}
                      {(i === 1 || i === 3) && (
                        <span
                          aria-hidden="true"
                          className="lg:hidden absolute left-0 top-[20%] bottom-[20%] w-px bg-gray-200"
                        />
                      )}
                      <Icon className="w-6 h-6 text-dhl-ink mb-2" strokeWidth={1.75} />
                      <span className="font-semibold text-[13px] text-[#1976D2] group-hover:text-[#0D47A1] transition-colors leading-tight">
                        {c.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
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
