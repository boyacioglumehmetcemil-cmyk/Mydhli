// Reports page — myDHLi style empty state. Real analytics will be wired
// up once the shipment logbook integration goes live (Faz 9 zero-data reset).
import { BarChart3 } from "lucide-react";
import PageBanner from "@/components/PageBanner";
import EmptyState from "@/components/EmptyState";

const Reports = () => {
  return (
    <div className="max-w-7xl mx-auto" data-testid="reports-page">
      <PageBanner title="Reports" icon={BarChart3} data-testid="reports-page-banner" />

      <EmptyState
        icon={BarChart3}
        title="Reports will appear here"
        message="Spend, service mix and destination analytics will be available once your shipment logbook has been integrated."
        data-testid="reports-empty"
      />
    </div>
  );
};

export default Reports;
