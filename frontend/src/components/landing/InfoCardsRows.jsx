import { Globe } from "lucide-react";
import InfoCardsSection from "./InfoCardsSection";

// Single, simplified row — exactly 3 cards. Replaced the previous 3-row / 9-card stack.
export const FEATURED_CARDS = [
  {
    image: "/images/mydhl-devices.jpg",
    headline: "All Your Shipping, One Workspace",
    body: "Quotes, labels, customs forms, and tracking — every tool a frequent shipper needs, brought together in a single account.",
    cta: "Open a Login",
    action: { type: "route", to: "/register" },
    testId: "info-card-pro",
  },
  {
    image: "/images/card-courier-wave.jpg",
    headline: "Better Rates for Regular Senders",
    body: "Account holders unlock preferred pricing, flexible billing, and direct account support — built for businesses that ship often.",
    cta: "Start an Account",
    action: { type: "route", to: "/register" },
    testId: "info-card-business",
  },
  {
    image: "/images/customs-world-illustration.jpg",
    headline: "Stay Ahead of Customs Changes",
    body: "Cross-border rules shift constantly. Get a clean summary of the regulatory changes that affect international shipments.",
    cta: "Browse Updates",
    action: {
      type: "modal",
      title: "Customs Regulatory Updates",
      icon: Globe,
      content: [
        "Customs requirements change frequently. Recent updates include new electronic export declaration formats, revised HS code classifications for electronics, and updated documentation standards for high-value shipments.",
        "All international shipments require a commercial invoice with HS codes, country of origin, and accurate declared value. Missing or incorrect data is the #1 cause of clearance delays.",
        "Use our Customs Documents tool inside MyDHL to generate compliant paperwork automatically — it's available the moment your account is active.",
      ],
    },
    testId: "info-card-customs",
  },
];

export const FeaturedRow = () => (
  <InfoCardsSection
    id="featured"
    testId="info-cards-row"
    title="Smarter shipping, made simple"
    cards={FEATURED_CARDS}
    background="panel"
  />
);
