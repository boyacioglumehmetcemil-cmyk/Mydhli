import { ChevronRight } from "lucide-react";

/**
 * PageBanner — myDHLi-style yellow page header strip.
 *
 * Sits at the top of every dashboard page (under the global header).
 * Word reference: image1 "On-Time Performance (OTP)" banner.
 *
 * Visual: full-width yellow band, white→yellow gradient, page icon in a
 * circle on the left, title centered to icon, optional right chevron.
 */
const PageBanner = ({ title, icon: Icon, action, "data-testid": testId }) => {
  return (
    <div
      data-testid={testId || "page-banner"}
      className="bg-gradient-to-r from-white via-dhl-yellow to-dhl-yellow border-b border-dhl-yellow-dark/30 px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 mb-6"
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <span className="w-8 h-8 rounded-full bg-white border border-dhl-ink/10 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-dhl-ink" strokeWidth={2.2} />
          </span>
        )}
        <h1 className="font-display font-bold text-base sm:text-lg text-dhl-ink truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action}
        <ChevronRight className="w-5 h-5 text-dhl-ink/60 hidden sm:block" aria-hidden="true" />
      </div>
    </div>
  );
};

export default PageBanner;
