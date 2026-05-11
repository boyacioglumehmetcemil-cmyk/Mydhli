import { Link } from "react-router-dom";
import { Construction, ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DashboardComingSoon = ({ title = "Coming Soon" }) => {
  return (
    <div className="max-w-4xl mx-auto" data-testid="coming-soon-page">
      <div className="mb-8">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-dhl-red mb-2">
          MyDHL Express · Module
        </div>
        <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter">
          {title}
        </h1>
      </div>

      <div className="bg-white border border-dhl-border">
        <div className="px-6 py-20 lg:py-28 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="w-28 h-28 border-2 border-dashed border-dhl-border flex items-center justify-center">
              <Construction
                className="w-14 h-14 text-dhl-muted"
                strokeWidth={1.25}
                data-testid="coming-soon-icon"
              />
            </div>
            <div className="absolute -top-2 -right-2 bg-dhl-yellow text-dhl-ink text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rotate-3">
              Soon
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-dhl-panel border border-dhl-border px-3 py-1.5 mb-5">
            <span className="w-2 h-2 bg-dhl-red rounded-full animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-dhl-text">
              In Development
            </span>
          </div>

          <h2 className="font-display text-3xl font-black text-dhl-text mb-3">
            {title} arrives in the next phase.
          </h2>
          <p className="text-sm text-dhl-muted max-w-md mb-8">
            We're wiring up this module right now. Phase 2 brings full functionality with
            real-time data, bulk operations and PGK billing baked in.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              data-testid="coming-soon-notify"
              onClick={() =>
                toast.success("We'll ping you when it ships", {
                  description: `${title} is on the roadmap.`,
                })
              }
              className="h-11 bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark font-bold rounded-none uppercase tracking-wider text-xs px-6 border-2 border-dhl-ink hover:-translate-y-0.5 transition-transform"
            >
              <Bell className="mr-2 w-4 h-4" />
              Notify Me
            </Button>
            <Link
              to="/dashboard"
              data-testid="coming-soon-back"
              className="inline-flex items-center justify-center h-11 px-6 border-2 border-dhl-ink text-dhl-ink hover:bg-dhl-ink hover:text-white font-bold uppercase tracking-wider text-xs transition-colors"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardComingSoon;
