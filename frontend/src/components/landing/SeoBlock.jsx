import SectionEyebrow from "./SectionEyebrow";

const SeoBlock = () => (
  <section data-testid="seo-block" className="bg-white py-16">
    <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
      <div
        className="rounded-lg p-8 lg:p-12"
        style={{
          backgroundColor: "#FAFAF7",
          boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
        }}
      >
        <SectionEyebrow className="mb-3">Worldwide Logistics</SectionEyebrow>
        <h2 className="font-display text-2xl lg:text-[1.75rem] font-medium text-[#333] tracking-tight leading-[1.2] mb-2 max-w-[720px]">
          Express Delivery & Worldwide Shipping
        </h2>
        <p className="italic text-[#666] mb-5 text-[15px]">
          Fast. Door-to-door. Backed by a global network.
        </p>
        <p className="text-[1rem] text-[#444] leading-[1.7] max-w-[920px]">
          Sending parcels and documents around the world should feel effortless. With express
          services tuned for time-critical shipments, on-demand pickup, integrated customs
          support, and real-time visibility from the moment a parcel is picked up — businesses
          get the speed of next-flight transit and the confidence of a single accountable
          partner. From a single envelope to recurring multi-piece freight, every shipment is
          moved with the same care.
        </p>
      </div>
    </div>
  </section>
);

export default SeoBlock;
