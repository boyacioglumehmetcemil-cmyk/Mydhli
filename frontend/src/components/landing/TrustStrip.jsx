const TrustStrip = () => (
  <section
    data-testid="trust-strip"
    className="bg-dhl-ink text-white py-6"
  >
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 text-center">
      <div className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-sm">
        <span className="font-medium">Trusted by businesses worldwide</span>
        <span className="hidden sm:inline w-px h-4 bg-white/30" />
        <span className="font-medium">220+ countries served</span>
        <span className="hidden sm:inline w-px h-4 bg-white/30" />
        <span className="font-medium">24/7 customer support</span>
      </div>
      <div className="mt-2.5 mx-auto w-24 h-0.5 bg-dhl-yellow" />
    </div>
  </section>
);

export default TrustStrip;
