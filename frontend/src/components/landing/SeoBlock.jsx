import SectionEyebrow from "./SectionEyebrow";

const SeoBlock = () => (
  <section data-testid="seo-block" className="bg-white py-10 lg:py-16">
    <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
      <div
        className="rounded-lg p-8 lg:p-12"
        style={{
          backgroundColor: "#FAFAF7",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
          border: "1px solid #6B7280",
        }}
      >
        <SectionEyebrow className="mb-3">Worldwide Logistics</SectionEyebrow>
        <h2 className="font-display text-2xl lg:text-[1.75rem] font-medium text-[#333] tracking-tight leading-[1.2] mb-2 max-w-[720px]">
          Express Delivery & Worldwide Shipping
        </h2>
        <p className="italic text-[#666] mb-5 text-[15px]">
          Fast. Door-to-door. Backed by a global network.
        </p>
        <p className="text-[1rem] text-[#444] leading-[1.55] max-w-[920px]">
          Sending parcels and documents around the world should feel effortless. From a single
          envelope to recurring freight, every shipment moves with the speed of next-flight
          transit and the confidence of a single accountable partner.
        </p>
      </div>
    </div>
  </section>
);

export default SeoBlock;
