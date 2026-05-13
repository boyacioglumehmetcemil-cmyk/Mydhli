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

const Logo = (props) => <BrandWordmark {...props} />;

export default Logo;
