import { Link } from "react-router-dom";

// To swap to official DHL logo: drop high-res SVG into /public/images/ and pass
// assetSrc="/images/logo-official.svg" (or set it as a default below).
const DEFAULT_ASSET_SRC = undefined;

/**
 * DHL Express logo.
 *
 * Props:
 *  - to:        Router target (null disables linking, defaults to "/")
 *  - variant:   "default" | "compact" | "icon-only"
 *  - theme:     "light" (default) | "dark" (inverted for use on yellow backgrounds)
 *  - assetSrc:  optional path to a high-res image; renders <img> instead of typography
 *  - size:      legacy alias mapped to variant (sm/md/lg/xl)
 *  - className: extra classes
 */
const Logo = ({
  to = "/",
  variant = "default",
  theme = "light",
  assetSrc = DEFAULT_ASSET_SRC,
  size,
  className = "",
}) => {
  // Map legacy size prop to variant
  const v = size
    ? { sm: "compact", md: "default", lg: "default", xl: "default" }[size] || variant
    : variant;

  const heightByVariant = {
    "icon-only": "h-7",
    compact: "h-8",
    default: "h-10",
  };

  // Asset path mode — client drops a high-res logo file
  if (assetSrc) {
    const img = (
      <img
        src={assetSrc}
        alt="DHL Express"
        data-testid="brand-logo"
        className={`${heightByVariant[v]} w-auto select-none ${className}`}
        draggable={false}
      />
    );
    if (!to) return img;
    return (
      <Link to={to} data-testid="brand-logo-link" className="inline-flex shrink-0">
        {img}
      </Link>
    );
  }

  // Typography placeholder mode
  const sizeClasses = {
    compact: "text-sm px-2.5 py-1",
    default: "text-lg px-3 py-1.5",
    "icon-only": "text-base px-2 py-1",
  };

  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-dhl-ink" : "bg-dhl-yellow";
  const dhlColor = isDark ? "text-dhl-yellow" : "text-dhl-ink";
  const expressColor = isDark ? "text-white" : "text-dhl-red";

  const labelText = v === "icon-only" ? "DHL" : null;

  const content = (
    <span
      data-testid="brand-logo"
      className={`inline-flex items-center gap-1.5 font-display font-black tracking-tight leading-none rounded-sm ${bgClass} ${sizeClasses[v]} ${className}`}
    >
      <span className={dhlColor}>DHL</span>
      {!labelText && <span className={expressColor}>Express</span>}
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} data-testid="brand-logo-link" className="inline-flex shrink-0">
      {content}
    </Link>
  );
};

export default Logo;
