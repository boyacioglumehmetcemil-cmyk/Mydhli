import { Link } from "react-router-dom";

/**
 * Typographic placeholder logo for the DHL Express demo.
 * NOT the real DHL logo — user will swap in the official logo later.
 */
const Logo = ({ to = "/", size = "md", className = "" }) => {
  const sizes = {
    sm: "text-base px-2.5 py-1",
    md: "text-lg px-3 py-1.5",
    lg: "text-2xl px-4 py-2",
    xl: "text-3xl px-5 py-2.5",
  };

  const content = (
    <span
      data-testid="brand-logo"
      className={`dhl-pill-logo ${sizes[size] || sizes.md} ${className}`}
    >
      <span className="dhl-text">DHL</span>
      <span className="express-text">Express</span>
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} data-testid="brand-logo-link" className="inline-flex">
      {content}
    </Link>
  );
};

export default Logo;
