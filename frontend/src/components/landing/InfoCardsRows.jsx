import { AlertTriangle, Globe, ShieldCheck, Thermometer, FileSearch, PackageCheck, RefreshCw } from "lucide-react";
import InfoCardsSection from "./InfoCardsSection";

// Row 1 — Shipping Resources
export const SHIPPING_RESOURCES_CARDS = [
  {
    image: "/images/fotolar/fotolar-03.jpg",
    eyebrow: "Business Accounts",
    headline: "Save up to 30% on Frequent Shipping",
    body: "Open a business account and unlock preferred rates, flexible billing, and dedicated support.",
    cta: "Open an Account",
    action: { type: "route", to: "/register" },
    testId: "info-card-business",
  },
  {
    image: "/images/fotolar/fotolar-08.jpg",
    eyebrow: "Compliance",
    headline: "Shipping Batteries Safely",
    body: "Lithium-ion batteries are classified as Dangerous Goods. Learn the regulations before you ship.",
    cta: "Understanding Dangerous Goods",
    action: {
      type: "modal",
      title: "Understanding Dangerous Goods",
      icon: AlertTriangle,
      content: [
        "Lithium batteries, perfumes, aerosols, and certain chemicals are classified as Dangerous Goods (DG) under IATA regulations.",
        "Before shipping, declare DG items and use approved packaging with required hazard labels. Incorrect declaration can result in fines, refused shipments, and safety risks.",
        "DHL Express offers DG-trained specialists and approved packaging kits. Contact your local team for a compliance review before your first DG shipment.",
      ],
    },
    testId: "info-card-batteries",
  },
  {
    image: "/images/fotolar/fotolar-07.png",
    eyebrow: "Customs",
    headline: "Customs Regulatory Updates",
    body: "Stay current on import and export regulations changes that affect international shipments.",
    cta: "View Latest Updates",
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

// Row 2 — Solutions
export const SOLUTIONS_CARDS = [
  {
    image: "/images/fotolar/fotolar-05.jpg",
    headline: "Send With Added Reassurance",
    body: "Optional shipment value protection helps cover parcels and documents from pickup to delivery, so unexpected setbacks stay manageable.",
    cta: "See Protection Options",
    action: {
      type: "modal",
      title: "Shipment Value Protection",
      icon: ShieldCheck,
      content: [
        "Standard shipping comes with limited liability per kilogram. For higher-value items, optional value protection extends coverage up to the declared value of your goods.",
        "Available for parcels and documents. Add coverage at the time you create a shipment — the premium is a small percentage of the declared value and is shown before you confirm.",
        "Claims are processed centrally with a 30-day window from the date of acceptance.",
      ],
    },
    testId: "info-card-protection",
  },
  {
    image: "/images/card-coldchain.jpg",
    headline: "Temperature-Sensitive? No Problem",
    body: "Specialised lanes for ambient, refrigerated, and frozen cargo — built for medical, life-science, and perishable shipments.",
    cta: "Explore Temperature-Controlled Logistics",
    action: {
      type: "modal",
      title: "Temperature-Controlled Logistics",
      icon: Thermometer,
      content: [
        "Our cold-chain network supports +15°C to +25°C (ambient), +2°C to +8°C (refrigerated), and below -20°C (frozen) with continuous monitoring and chain-of-custody logging.",
        "Used by pharmaceutical companies, clinical trial coordinators, vaccine programs, and high-end perishable shippers — every leg is documented and temperature-mapped.",
        "Bookings require advance scheduling; contact your account manager for a route assessment before your first temperature-controlled shipment.",
      ],
    },
    testId: "info-card-coldchain",
  },
  {
    image: "/images/fotolar/fotolar-01.jpg",
    headline: "Smoother Customs, Faster Clearance",
    body: "Multi-shipment consolidation, expert documentation, and direct broker links reduce holds at the border and speed delivery.",
    cta: "Discover Customs Solutions",
    action: {
      type: "modal",
      title: "Customs Solutions",
      icon: FileSearch,
      content: [
        "We work with licensed customs brokers in every destination market to pre-clear shipments, resolve documentation gaps in transit, and minimise time-at-border.",
        "Consolidation services let multi-piece shipments clear under a single entry, simplifying paperwork and reducing per-shipment duty processing fees.",
        "HS code lookup, automated commercial invoice generation, and direct duty payment options are available inside MyDHL for account holders.",
      ],
    },
    testId: "info-card-customs-solutions",
  },
];

// Row 3 — Self-Service Tools
export const SELFSERVICE_CARDS = [
  {
    image: "/images/fotolar/fotolar-04.jpg",
    headline: "Bring Imports Under Your Control",
    body: "Flexible inbound tools let importers schedule, consolidate, and track inbound shipments from any origin — all from one workspace.",
    cta: "Manage Your Imports",
    action: {
      type: "modal",
      title: "Inbound Shipment Management",
      icon: PackageCheck,
      content: [
        "Inbound (Import Express) lets you book and pay for shipments that originate from a supplier or vendor at any origin, with you as the receiver.",
        "Configure preferred shippers, set default service levels, and consolidate weekly inbound flows into a single billing account.",
        "Available inside MyDHL once your business account is approved.",
      ],
    },
    testId: "info-card-imports",
  },
  {
    image: "/images/fotolar/fotolar-02.jpg",
    headline: "Reschedule On Your Terms",
    body: "Missed a delivery? Choose a new day, redirect to a pickup point, or leave instructions for your courier — without picking up the phone.",
    cta: "Adjust a Delivery",
    action: {
      type: "modal",
      title: "On Demand Delivery",
      icon: RefreshCw,
      content: [
        "On Demand Delivery (ODD) gives the receiver control over how and when a shipment arrives. Options include redelivery on a different day, redirect to a service point, leave with a neighbour, and signature waivers.",
        "Receivers get a tracking link via email or SMS once the parcel reaches its destination country.",
        "All preferences are recorded on the shipment for proof-of-delivery.",
      ],
    },
    testId: "info-card-reschedule",
  },
  {
    image: "/images/fotolar/fotolar-09.jpg",
    headline: "Follow Every Step of the Journey",
    body: "From the moment a parcel is picked up to the second it lands at the receiver's door — see each handover in real time.",
    cta: "How Tracking Works",
    action: { type: "route", to: "/track" },
    testId: "info-card-tracking",
  },
];

export const ShippingResourcesRow = () => (
  <InfoCardsSection
    id="info-cards"
    testId="info-cards-row"
    eyebrow="Shipping Resources"
    title="Tips for Smarter Shipping"
    cards={SHIPPING_RESOURCES_CARDS}
    background="panel"
  />
);

export const SolutionsRow = () => (
  <InfoCardsSection
    id="solutions"
    testId="solutions-cards-row"
    eyebrow="Solutions"
    title="Tailored for what you move"
    cards={SOLUTIONS_CARDS}
    background="white"
  />
);

export const SelfServiceRow = () => (
  <InfoCardsSection
    id="self-service"
    testId="selfservice-cards-row"
    eyebrow="Self-Service Tools"
    title="Stay in control, every step of the way"
    cards={SELFSERVICE_CARDS}
    background="panel"
  />
);
