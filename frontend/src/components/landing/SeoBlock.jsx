import SectionEyebrow from "./SectionEyebrow";

const SeoBlock = () => (
  <section data-testid="seo-block" className="bg-white py-16 lg:py-[100px] border-b border-dhl-border">
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
      <div className="max-w-[880px]">
        <SectionEyebrow className="mb-4">Worldwide Logistics</SectionEyebrow>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-[2.5rem] font-black text-dhl-ink tracking-tighter leading-[1.1] mb-3 max-w-[720px]">
          Express Delivery & Worldwide Shipping
        </h2>
        <p className="text-base lg:text-lg font-semibold text-dhl-text mb-6">
          Fast. Door-to-door. Backed by a global network.
        </p>
        <p className="text-[15px] text-[#555] leading-[1.65] max-w-[880px]">
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
