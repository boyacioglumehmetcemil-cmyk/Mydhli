import { Link } from "react-router-dom";

/**
 * Wordmark / lockup component for DHL Global Forwarding.
 *
 * Three rendering modes:
 *   • placement="header" → official red-on-yellow DHL PNG + "Global Forwarding"
 *                          sub-line (used in page headers and the mobile drawer).
 *   • placement="footer" → official black "DHL Group" lockup PNG (used in the
 *                          footer bottom strip — no sub-line, the asset
 *                          already includes "Group" text).
 *   • placement="default" (legacy) → typographic yellow/red tile placeholder.
 *
 * Brand guide rules:
 *   • No filters / recolor on the official PNGs.
 *   • Keep aspect ratio (`w-auto`).
 *   • Header asset renders eagerly (above the fold); footer asset is lazy.
 */
const HEADER_LOGO = "/assets/dhl/brand/dhl-bug-only.svg";
const HEADER_BUG_ONLY = "/assets/dhl/brand/dhl-bug-only.svg";
const FOOTER_LOGO = "/assets/dhl/brand/dhl-group-black.svg";

const sizeMap = { sm: "compact", md: "default", lg: "default", xl: "stack" };

const BrandWordmark = ({
  to = "/",
  placement,
  variant = "default",
  size,
  theme = "light",
  className = "",
  showSublabel = true,
}) => {
  /* ---------- placement="header" — official red-on-yellow DHL bug ---------- */
  if (placement === "header") {
    const lockup = (
      <span
        data-testid="brand-wordmark"
        className={`inline-flex flex-col items-start gap-1 select-none ${className}`}
        aria-label="DHL Global Forwarding"
      >
        <img
          src={HEADER_LOGO}
          alt="DHL"
          className="h-7 sm:h-9 w-auto block"
          width="338"
          height="63"
          decoding="async"
        />
        {showSublabel && (
          <span
            data-testid="brand-wordmark-sub"
            className="font-display font-medium text-[9px] sm:text-[10px] text-dhl-ink leading-tight tracking-tight"
          >
            Global Forwarding
          </span>
        )}
      </span>
    );
    if (!to) return lockup;
    return (
      <Link to={to} data-testid="brand-wordmark-link" className="inline-flex shrink-0">
        {lockup}
      </Link>
    );
  }

  /* ---------- placement="header-bug-only" — DHL bug PNG, NO subline ----------
     Used on the Landing utility bar where the user wants only the red-on-yellow
     bug, with no "Global Forwarding" sub-text underneath. Subline is intentionally
     omitted regardless of showSublabel. */
  if (placement === "header-bug-only") {
    const lockup = (
      <span
        data-testid="brand-wordmark"
        className={`inline-flex items-center select-none ${className}`}
        aria-label="DHL"
      >
        <img
          src={HEADER_BUG_ONLY}
          alt="DHL"
          data-testid="landing-utility-logo"
          className="h-10 sm:h-12 w-auto block"
          decoding="async"
        />
      </span>
    );
    if (!to) return lockup;
    return (
      <Link to={to} data-testid="brand-wordmark-link" className="inline-flex shrink-0">
        {lockup}
      </Link>
    );
  }

  /* ---------- placement="footer" — official black "DHL Group" lockup ---------- */
  if (placement === "footer") {
    const lockup = (
      <span
        data-testid="brand-wordmark"
        className={`inline-flex items-center select-none ${className}`}
        aria-label="DHL Group"
      >
        <img
          src={FOOTER_LOGO}
          alt="DHL Group"
          className="h-[22px] sm:h-7 w-auto block"
          width="353"
          height="110"
          decoding="async"
        />
      </span>
    );
    if (!to) return lockup;
    return (
      <Link to={to} data-testid="brand-wordmark-link" className="inline-flex shrink-0">
        {lockup}
      </Link>
    );
  }

  /* ---------- placement="default" (legacy) — typographic placeholder ---------- */
  const v = size ? sizeMap[size] || variant : variant;

  // Per-variant tokens. min-widths are mobile-first then upscaled on sm+.
  const cfg = {
    "icon-only": { tile: "text-[15px] px-2 py-0.5", sub: "text-[8px]",  minw: "min-w-[64px]",  hideSub: true },
    compact:     { tile: "text-[16px] px-2 py-0.5", sub: "text-[8px]",  minw: "min-w-[112px] sm:min-w-[112px]" },
    default:     { tile: "text-[18px] px-2.5 py-1", sub: "text-[9px]",  minw: "min-w-[112px] sm:min-w-[140px]" },
    stack:       { tile: "text-[26px] px-3.5 py-2", sub: "text-[11px]", minw: "min-w-[140px] sm:min-w-[180px]" },
    text:        { tile: "text-[18px] px-2.5 py-1", sub: "text-[9px]",  minw: "min-w-[112px] sm:min-w-[140px]" },
  };
  const c = cfg[v] || cfg.default;
  const hideSub = c.hideSub || !showSublabel;

  // Colour rules (brand guide):
  // Light theme  → red tile, yellow "DHL"
  // Dark theme   → yellow tile, dark "DHL"
  const tileBg = theme === "dark" ? "bg-dhl-yellow" : "bg-dhl-red";
  const dhlInk = theme === "dark" ? "text-dhl-ink" : "text-dhl-yellow";
  const subColor = theme === "dark" ? "text-white" : "text-dhl-ink";

  const tile = (
    <span
      data-testid="brand-wordmark-tile"
      className={`inline-flex items-center justify-center font-display font-black tracking-tight leading-none rounded-md ${tileBg} ${c.tile}`}
      aria-hidden="true"
    >
      <span className={dhlInk}>DHL</span>
    </span>
  );

  const sub = !hideSub && (
    <span
      data-testid="brand-wordmark-sub"
      className={`font-display font-medium ${c.sub} ${subColor} leading-tight mt-1 tracking-tight`}
    >
      Global Forwarding
    </span>
  );

  const content = (
    <span
      data-testid="brand-wordmark"
      className={`inline-flex flex-col items-start gap-0 select-none ${c.minw} ${className}`}
      aria-label="DHL Global Forwarding"
    >
      {tile}
      {sub}
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} data-testid="brand-wordmark-link" className="inline-flex shrink-0">
      {content}
    </Link>
  );
};

export default BrandWordmark;
