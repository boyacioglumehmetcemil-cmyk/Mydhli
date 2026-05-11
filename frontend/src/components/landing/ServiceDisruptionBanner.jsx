import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

const LS_KEY = "dhl_disruption_banner_dismissed_v1";

const ServiceDisruptionBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(LS_KEY);
    if (!dismissed) setShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(LS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      data-testid="service-disruption-banner"
      className="bg-white border-b border-dhl-border"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-2.5 flex items-center gap-3">
        <div className="flex-shrink-0 w-6 h-6 bg-dhl-red/10 rounded-sm flex items-center justify-center">
          <AlertTriangle className="w-3.5 h-3.5 text-dhl-red" strokeWidth={2.5} />
        </div>
        <div className="flex-1 text-sm text-dhl-text">
          <span className="font-semibold">Service updates:</span>{" "}
          <span className="text-dhl-muted">
            Some lanes may experience longer transit times during peak season.
          </span>
          <a
            href="#info-cards"
            data-testid="disruption-learn-more"
            className="ml-2 text-[#1976D2] font-semibold hover:underline whitespace-nowrap"
          >
            Learn More →
          </a>
        </div>
        <button
          type="button"
          onClick={dismiss}
          data-testid="disruption-dismiss"
          aria-label="Dismiss banner"
          className="flex-shrink-0 p-1.5 text-dhl-muted hover:text-dhl-text hover:bg-dhl-panel rounded-sm transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ServiceDisruptionBanner;
