import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MessageSquare, FileQuestion } from "lucide-react";
import BrandWordmark from "@/components/BrandWordmark";
import useTitle from "@/hooks/useTitle";

const Help = () => {
  useTitle("Customer service");
  return (
    <div className="min-h-screen bg-white" data-testid="help-page">
      <div className="bg-dhl-yellow border-b border-dhl-yellow-dark">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-14 flex items-center">
          <BrandWordmark to="/" placement="header" />
        </div>
      </div>
      <main className="max-w-[960px] mx-auto px-6 lg:px-10 py-16 lg:py-20">
        <Link to="/" data-testid="help-back" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-dhl-muted hover:text-dhl-red mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-dhl-red mb-3">Customer service</div>
        <h1 className="font-display font-bold text-dhl-text leading-tight tracking-tight mb-4 text-[32px] lg:text-[48px]">
          We're here when you need us.
        </h1>
        <p className="text-dhl-muted text-[15px] lg:text-base leading-relaxed mb-10">
          Reach our freight desk for booking help, document recovery, customs questions or anything else that's blocking a shipment.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            { Icon: Phone,         title: "Phone support",   sub: "Speak to a forwarder during local business hours." },
            { Icon: Mail,          title: "Email us",        sub: "hello@example-dhl.demo — replies within one business day." },
            { Icon: MessageSquare, title: "Live chat",       sub: "Quick answers on tracking, pickup and documents." },
            { Icon: FileQuestion,  title: "Help articles",   sub: "Booking, customs, billing and account guides." },
          ].map((c) => (
            <div key={c.title} className="bg-white border border-dhl-border rounded-xl p-6">
              <div className="w-11 h-11 bg-dhl-red/10 rounded-md flex items-center justify-center mb-4">
                <c.Icon className="w-5 h-5 text-dhl-red" strokeWidth={2} />
              </div>
              <h3 className="font-display font-bold text-dhl-text text-lg mb-1">{c.title}</h3>
              <p className="text-[13px] text-dhl-muted leading-relaxed">{c.sub}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Help;
