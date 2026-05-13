import { Link } from "react-router-dom";

/**
 * PLACEHOLDER wordmark for DHL Global Forwarding (Papua New Guinea, demo).
 *
 * Two-tier typographic wordmark:
 *   Row 1 — "DHL"   bold yellow-on-red pill
 *   Row 2 — "Global Forwarding"   small caps, dark ink
 *
 * WHY a component:
 *   The real DHL Global Forwarding logo asset is expected to arrive shortly.
 *   When it does, only THIS file needs to change — swap the inner markup for
 *   an <img src="/images/logo-dhl-gf.svg" />, keep the props/variants, and
 *   every consumer (Header, Dashboard, Login, Footer, Splash) updates at once.
 *
 * Props mirror the previous <Logo /> API for drop-in compatibility:
 *   to       — Router target (null disables link)
 *   variant  — "default" | "compact" | "icon-only" | "stack" | "text"
 *   size     — legacy alias (sm/md/lg/xl) mapped to variant
 *   theme    — "light" (default) | "dark"
 *   onYellowBg — true to wrap in dark frame for legibility on yellow header bars
 *   className — extra classes on the outer element
 */
const sizeMap = {
  sm: "compact",
  md: "default",
  lg: "default",
  xl: "default",
};

const BrandWordmark = ({
  to = "/",
  variant = "default",
  size,
  theme = "light",
  onYellowBg = false,
  className = "",
  showSublabel = true,
}) => {
  const v = size ? sizeMap[size] || variant : variant;

  // Per-variant sizing tokens
  const cfg = {
    "icon-only": { row1: "text-[15px] px-2 py-0.5", row2: "text-[8px] tracking-[0.25em]", gap: "gap-0", hideSub: true },
    compact:     { row1: "text-[15px] px-2 py-0.5", row2: "text-[8px] tracking-[0.22em]", gap: "gap-[1px]" },
    default:     { row1: "text-[18px] px-2.5 py-1", row2: "text-[9px] tracking-[0.22em]",  gap: "gap-[2px]" },
    stack:       { row1: "text-[22px] px-3 py-1.5", row2: "text-[10px] tracking-[0.25em]", gap: "gap-[3px]" },
    text:        { row1: "text-[18px] px-2.5 py-1", row2: "text-[9px] tracking-[0.22em]",  gap: "gap-[2px]" },
  };
  const c = cfg[v] || cfg.default;
  const hideSub = c.hideSub || !showSublabel;

  // Tile colours (placeholder palette — final logo will replace this entirely)
  const tileBg = theme === "dark" ? "bg-dhl-yellow" : "bg-dhl-red";
  const dhlInk = theme === "dark" ? "text-dhl-ink" : "text-dhl-yellow";
  const subColor = theme === "dark" ? "text-white" : "text-dhl-ink";

  const tile = (
    <span
      data-testid="brand-wordmark-tile"
      className={`inline-flex items-center justify-center font-display font-black tracking-tight leading-none rounded-[3px] ${tileBg} ${c.row1}`}
    >
      <span className={dhlInk}>DHL</span>
    </span>
  );

  const sub = !hideSub && (
    <span
      data-testid="brand-wordmark-sub"
      className={`font-display font-bold uppercase ${c.row2} ${subColor} leading-none mt-0.5`}
    >
      Global Forwarding
    </span>
  );

  const content = (
    <span
      data-testid="brand-wordmark"
      className={`inline-flex flex-col items-start ${c.gap} select-none ${className}`}
      aria-label="DHL Global Forwarding"
    >
      {tile}
      {sub}
    </span>
  );

  const framed = onYellowBg ? (
    <span className="inline-flex items-center bg-dhl-ink/90 px-2 py-1 rounded-[4px]">
      {content}
    </span>
  ) : (
    content
  );

  if (!to) return framed;
  return (
    <Link to={to} data-testid="brand-wordmark-link" className="inline-flex shrink-0">
      {framed}
    </Link>
  );
};

export default BrandWordmark;
