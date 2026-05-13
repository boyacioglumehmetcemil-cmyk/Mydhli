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
      label: "About myDHLi",
      onClick: () => setModal({ title: "About myDHLi" }),
      testId: "mydhl-cell-about",
    },
    {
      icon: Sparkles,
      label: "What's New",
      onClick: () => setModal({ title: "What's New in myDHLi" }),
      testId: "mydhl-cell-whatsnew",
    },
  ];

  return (
    <section
      id="mydhl"
      ref={ref}
      data-testid="mydhl-platform"
      className="bg-white py-10 lg:py-16"
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
              alt="myDHLi workspace shown on desktop, tablet, and mobile devices"
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
              <div className="inline-flex items-center gap-2.5 mb-4">
                <span
                  aria-hidden="true"
                  className="block w-3 h-[3px]"
                  style={{ backgroundColor: "#D40511" }}
                />
                <span
                  className="text-[12px] font-bold uppercase text-dhl-ink"
                  style={{ letterSpacing: "0.18em" }}
                >
                  myDHLi Platform
                </span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.25rem] font-black text-dhl-ink leading-[1.1] tracking-tighter mb-5">
                Built for everyday shipping
              </h2>
              <p className="text-base lg:text-[1.05rem] text-dhl-muted leading-[1.55] max-w-[520px]">
                One workspace for the people who ship every day — create shipments, generate
                quotes, request pickups, manage tracking, and download paperwork without
                switching tools.
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
                      className="group relative flex flex-col items-center justify-center text-center px-3 py-5 hover:bg-[#F8F8F8] transition-colors duration-[200ms] ease-out"
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
                      <span className="font-medium text-[13px] text-[#0EA5B7] group-hover:text-[#0B8C9C] transition-colors leading-tight">
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
        body="The myDHLi feature you're looking at is part of the live platform. Sign in or open an account to access it."
      />
    </section>
  );
};

export default MyDHLPlatform;
