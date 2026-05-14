/**
 * BrandImagePlaceholder
 *
 * Intentional, brand-aligned image placeholder used wherever the marketing
 * landing will eventually receive an official DHL photograph. The visual is
 * never "missing image" — it is a deliberate brand-colour block with a faint
 * SVG silhouette, designed to feel like modern editorial art direction.
 *
 *   <BrandImagePlaceholder variant="yellow" icon={PackageOutline} />
 *
 * variant — visual palette
 *   "yellow" → Postyellow primary (hero & info band)
 *   "red"    → DHL Red secondary
 *   "green"  → sustainability dark green (#006B3F)
 *   "navy"   → near-black (dhl-ink)
 *
 * icon — SVG React component rendered at 8–12% opacity in the corner. If
 * omitted, a default geometric mark is used.
 *
 * TODO(brand): when DHL delivers the official marketing photography, swap
 * this single component for `<img src={photo} alt="..." />` in place. All
 * consumers (Hero, InfoBand, Sustainability) will pick the new asset up
 * without further edits.
 */
const VARIANTS = {
  yellow: {
    base: "#FFCC00",
    glow: "rgba(255,255,255,0.18)",
    grain: "rgba(0,0,0,0.10)",
    stripe: "rgba(212,5,17,0.05)",
    iconColor: "rgba(0,0,0,0.10)",
  },
  red: {
    base: "#D40511",
    glow: "rgba(255,255,255,0.10)",
    grain: "rgba(0,0,0,0.18)",
    stripe: "rgba(255,204,0,0.08)",
    iconColor: "rgba(255,255,255,0.12)",
  },
  green: {
    base: "#006B3F",
    glow: "rgba(255,255,255,0.10)",
    grain: "rgba(0,0,0,0.18)",
    stripe: "rgba(255,255,255,0.05)",
    iconColor: "rgba(255,255,255,0.14)",
  },
  navy: {
    base: "#1A1A1A",
    glow: "rgba(255,255,255,0.06)",
    grain: "rgba(0,0,0,0.30)",
    stripe: "rgba(255,204,0,0.04)",
    iconColor: "rgba(255,204,0,0.10)",
  },
};

const DefaultMark = ({ color }) => (
  <svg viewBox="0 0 200 200" width="100%" height="100%" aria-hidden="true">
    <g fill="none" stroke={color} strokeWidth="2.4">
      <path d="M20 110 L100 60 L180 110 L100 160 Z" />
      <path d="M100 60 L100 160" />
      <path d="M20 110 L100 110 L180 110" />
      <circle cx="100" cy="60"  r="3" fill={color} stroke="none" />
      <circle cx="20"  cy="110" r="3" fill={color} stroke="none" />
      <circle cx="180" cy="110" r="3" fill={color} stroke="none" />
      <circle cx="100" cy="160" r="3" fill={color} stroke="none" />
    </g>
  </svg>
);

const BrandImagePlaceholder = ({
  variant = "yellow",
  icon: IconSvg,
  className = "",
  iconSize = 320,
  iconAlign = "br",        // "br" | "tl" | "center"
  testId = "brand-image-placeholder",
}) => {
  const v = VARIANTS[variant] || VARIANTS.yellow;
  const Mark = IconSvg || (() => <DefaultMark color={v.iconColor} />);

  const cornerPos = {
    br:     { bottom: "-3%", right: "-4%" },
    tl:     { top: "-4%", left: "-4%" },
    center: { top: "50%", left: "50%", transform: "translate(-50%,-50%)" },
  }[iconAlign];

  return (
    <div
      data-testid={testId}
      data-placeholder-swap-target="true" // TODO(brand): swap for DHL photo
      className={`relative overflow-hidden isolate ${className}`}
      style={{
        backgroundColor: v.base,
        backgroundImage: [
          `radial-gradient(circle at 30% 25%, ${v.glow}, transparent 55%)`,
          `radial-gradient(circle at 80% 90%, ${v.grain}, transparent 60%)`,
          `repeating-linear-gradient(135deg, ${v.stripe} 0 2px, transparent 2px 28px)`,
        ].join(", "),
      }}
    >
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{ width: iconSize, height: iconSize, ...cornerPos }}
      >
        <Mark />
      </div>
    </div>
  );
};

export default BrandImagePlaceholder;
