import SectionEyebrow from "./SectionEyebrow";

const SeoBlock = () => (
  <section data-testid="seo-block" className="bg-white py-16">
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
      <div className="bg-white border border-dhl-border rounded-lg shadow-sm p-8 lg:p-10">
        <SectionEyebrow className="mb-3">Worldwide Logistics</SectionEyebrow>
        <h2 className="font-display text-2xl lg:text-[1.75rem] font-black text-dhl-ink tracking-tight leading-[1.15] mb-2 max-w-[720px]">
          Express Delivery & Worldwide Shipping
        </h2>
        <p className="text-sm text-[#666] font-medium mb-4">
          Fast. Door-to-door. Backed by a global network.
        </p>
        <p className="text-[15px] text-[#555] leading-[1.65] max-w-[920px]">
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
