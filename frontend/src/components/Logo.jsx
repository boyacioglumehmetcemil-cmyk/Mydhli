import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

// Client-provided wordmark logo. To swap to an even higher-res version, replace this file:
//   /app/frontend/public/images/logo-user.png
// (or set DEFAULT_ASSET_SRC to a different path and re-build).
const DEFAULT_ASSET_SRC = "/images/logo-user.png";

// Native pixel dimensions of the asset above — used to cap rendered size so the
// logo never up-scales beyond its native resolution (avoids blur).
const NATIVE_HEIGHT = 31;
// Variants that intentionally up-scale beyond NATIVE_HEIGHT (used in the tall
// utility bar). Capped at a slightly higher max to keep blur tolerable.
const UPSCALED_MAX = 44;

/**
 * DHL Express logo.
 *
 * Props:
 *  - to:        Router target (null disables linking, defaults to "/")
 *  - variant:   "default" | "compact" | "icon-only" | "text"
 *               "text" forces typography fallback even when assetSrc is set.
 *  - theme:     "light" (default) | "dark" — controls typography color in fallback
 *               AND whether to wrap the image in a black rounded rect for
 *               readability on yellow backgrounds.
 *  - onYellowBg:if true, wraps the image asset in a black rounded rectangle so
 *               the (typically dark) logo reads cleanly over the DHL yellow header.
 *  - assetSrc:  optional override for the image path; falls back to DEFAULT_ASSET_SRC.
 *  - size:      legacy alias mapped to variant.
 *  - className: extra classes applied to the outer element.
 */
const Logo = ({
  to = "/",
  variant = "default",
  theme = "light",
  onYellowBg = false,
  assetSrc,
  size,
  className = "",
}) => {
  // One-time low-res warning so prod owners notice and replace the file
  const warned = useRef(false);
  useEffect(() => {
    if (warned.current) return;
    warned.current = true;
    // eslint-disable-next-line no-console
    console.warn(
      "[DHL Demo] Logo asset is 334×31 raster. For production, replace " +
        "/public/images/logo-user.png with a high-resolution SVG or @2x PNG."
    );
  }, []);

  const v = size
    ? { sm: "compact", md: "default", lg: "default", xl: "default" }[size] || variant
    : variant;

  // Use the image asset by default unless the caller asked for typography.
  const useImg = v !== "text" && (assetSrc || DEFAULT_ASSET_SRC);

  // Cap rendered height so we never up-scale beyond native pixels.
  // Exception: "icon-only" is used in the tall utility bar and intentionally
  // up-scales to ~44px; we raise its cap accordingly.
  const heightByVariant = {
    "icon-only": "h-11", // 44px — tall utility bar
    compact: "h-7",      // 28px — under 31 native
    default: "h-[30px]", // 30px — under 31 native
    text: "h-10",
  };
  const maxHeightByVariant = {
    "icon-only": UPSCALED_MAX,
    compact: NATIVE_HEIGHT,
    default: NATIVE_HEIGHT,
    text: NATIVE_HEIGHT,
  };

  if (useImg) {
    const src = assetSrc || DEFAULT_ASSET_SRC;
    const img = (
      <img
        src={src}
        alt="DHL Express"
        data-testid="brand-logo"
        style={{ maxHeight: maxHeightByVariant[v] ?? NATIVE_HEIGHT }}
        className={`${heightByVariant[v]} w-auto select-none block`}
        draggable={false}
      />
    );

    // On yellow backgrounds: wrap in a small black rounded rect so the
    // (transparent-PNG) wordmark with dark surround reads as intentional.
    const inner = onYellowBg ? (
      <span
        data-testid="brand-logo-frame"
        className="inline-flex items-center bg-dhl-ink px-2 py-1.5 rounded-[4px] leading-none"
      >
        {img}
      </span>
    ) : (
      img
    );

    if (!to) return <span className={`inline-flex shrink-0 ${className}`}>{inner}</span>;
    return (
      <Link to={to} data-testid="brand-logo-link" className={`inline-flex shrink-0 ${className}`}>
        {inner}
      </Link>
    );
  }

  // Typography fallback (used only when variant="text")
  const sizeClasses = {
    compact: "text-sm px-2.5 py-1",
    default: "text-lg px-3 py-1.5",
    "icon-only": "text-base px-2 py-1",
    text: "text-lg px-3 py-1.5",
  };

  const isDark = theme === "dark";
  const bgClass = isDark ? "bg-dhl-ink" : "bg-dhl-yellow";
  const dhlColor = isDark ? "text-dhl-yellow" : "text-dhl-ink";
  const expressColor = isDark ? "text-white" : "text-dhl-red";

  const content = (
    <span
      data-testid="brand-logo"
      className={`inline-flex items-center gap-1.5 font-display font-black tracking-tight leading-none rounded-sm ${bgClass} ${sizeClasses[v] || sizeClasses.text} ${className}`}
    >
      <span className={dhlColor}>DHL</span>
      <span className={expressColor}>Express</span>
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
