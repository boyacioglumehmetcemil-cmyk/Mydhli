/**
 * Backwards-compatible shim. The codebase was built around <Logo /> when the
 * pitch was DHL Express. The pivot to DHL Global Forwarding introduced a new
 * <BrandWordmark /> placeholder. We keep this file so existing imports
 * (`import Logo from "@/components/Logo"`) keep working — it simply re-exports
 * the new wordmark.
 *
 * When the official DHL Global Forwarding logo asset lands, update
 * components/BrandWordmark.jsx in ONE place. Do not re-introduce the express
 * raster PNG flow here.
 */
import BrandWordmark from "@/components/BrandWordmark";

/**
 * Default to `placement="header"` so any legacy call site (passing `size`,
 * `variant`, `theme`, etc.) automatically renders the official DHL PNG
 * instead of the legacy typographic placeholder. Callers can still override
 * by passing an explicit `placement` prop (e.g. `placement="footer"`).
 */
const Logo = ({ placement = "header", ...props }) => (
  <BrandWordmark placement={placement} {...props} />
);

export default Logo;
