import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Receipt, ChevronRight, Loader2, FileText, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { formatDate, formatPGK } from "@/lib/shipmentUtils";
import { downloadAuthedPdf } from "@/lib/downloadPdf";

const statusTone = {
  PAID: "bg-green-100 text-green-900 border-green-600",
  UNPAID: "bg-dhl-yellow/30 text-dhl-ink border-dhl-yellow",
  OVERDUE: "bg-red-100 text-dhl-red border-dhl-red",
};

const BACKEND = process.env.REACT_APP_BACKEND_URL;

const PayModal = ({ invoice, onClose, onPaid }) => {
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("2027");
  const [cvv, setCvv] = useState("123");
  const [name, setName] = useState("Demo User");
  const [paying, setPaying] = useState(false);

  const pay = async () => {
    setPaying(true);
    try {
      const res = await api.post("/payments/charge", {
        cardNumber, expMonth: Number(expMonth), expYear: Number(expYear),
        cvv, cardholderName: name, amountPGK: invoice.totalPGK,
        invoiceNumber: invoice.invoiceNumber,
      });
      if (res.data.status === "FAILED") {
        toast.error(res.data.detail);
        return;
      }
      // Then mark invoice as paid
      await api.post(`/invoices/${invoice.invoiceNumber}/pay`);
      toast.success(`Payment successful · Ref ${res.data.referenceNumber}`);
      onPaid();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Pay Invoice {invoice.invoiceNumber}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="bg-dhl-ink text-white p-4">
            <div className="text-[10px] uppercase tracking-wider text-dhl-yellow font-bold">Amount Due</div>
            <div className="font-display text-3xl font-black">{formatPGK(invoice.totalPGK)}</div>
          </div>
          <div className="text-xs text-dhl-muted bg-dhl-panel p-3">
            Demo cards: <b className="font-mono">4111 1111 1111 1111</b> = success · <b className="font-mono text-dhl-red">4000 0000 0000 0002</b> = decline
          </div>
          <div>
            <Label className="text-xs font-bold uppercase tracking-wider">Card Number</Label>
            <Input value={cardNumber} onChange={e => setCardNumber(e.target.value)} data-testid="pay-card-number" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs font-bold uppercase tracking-wider">Month</Label><Input value={expMonth} onChange={e => setExpMonth(e.target.value)} data-testid="pay-exp-month" /></div>
            <div><Label className="text-xs font-bold uppercase tracking-wider">Year</Label><Input value={expYear} onChange={e => setExpYear(e.target.value)} data-testid="pay-exp-year" /></div>
            <div><Label className="text-xs font-bold uppercase tracking-wider">CVV</Label><Input value={cvv} onChange={e => setCvv(e.target.value)} data-testid="pay-cvv" /></div>
          </div>
          <div><Label className="text-xs font-bold uppercase tracking-wider">Cardholder Name</Label><Input value={name} onChange={e => setName(e.target.value)} data-testid="pay-name" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={pay} disabled={paying} data-testid="pay-submit" className="bg-dhl-yellow text-dhl-ink hover:bg-dhl-yellow-dark rounded-none font-bold uppercase tracking-wider text-xs border-2 border-dhl-ink px-5">
            {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Pay {formatPGK(invoice.totalPGK)}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Invoices = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [payInv, setPayInv] = useState(null);

  const load = () => {
    setLoading(true);
    const params = filter !== "ALL" ? { status: filter } : {};
    api.get("/invoices", { params }).then(r => {
      setItems(r.data.items);
      setTotal(r.data.total);
    }).finally(() => setLoading(false));
  };
  useEffect(load, [filter]);

  // KPI calculations
  const allInvoices = items;
  const totalOutstanding = allInvoices.filter(i => i.status !== "PAID").reduce((s, i) => s + i.totalPGK, 0);
  const overdueTotal = allInvoices.filter(i => i.status === "OVERDUE").reduce((s, i) => s + i.totalPGK, 0);
  const paidCount = allInvoices.filter(i => i.status === "PAID").length;
  const avgAmt = allInvoices.length ? allInvoices.reduce((s, i) => s + i.totalPGK, 0) / allInvoices.length : 0;

  return (
    <div className="max-w-7xl mx-auto" data-testid="invoices-page">
      <h1 className="font-display text-3xl lg:text-4xl font-black text-dhl-text leading-tight tracking-tighter mb-2">Invoices</h1>
      <p className="text-sm text-dhl-muted mb-6">Your billing history and outstanding balances.</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Kpi label="Total Outstanding" value={formatPGK(totalOutstanding)} accent="bg-dhl-yellow" />
        <Kpi label="Overdue" value={formatPGK(overdueTotal)} accent="bg-dhl-red text-white" />
        <Kpi label="Paid Invoices" value={paidCount} accent="bg-dhl-ink text-white" />
        <Kpi label="Average Invoice" value={formatPGK(avgAmt)} accent="bg-dhl-panel" />
      </div>

      {/* Filter */}
      <div className="flex gap-1 mb-4 bg-dhl-panel p-1 inline-flex">
        {["ALL", "UNPAID", "PAID", "OVERDUE"].map(f => (
          <button key={f} onClick={() => setFilter(f)} data-testid={`inv-filter-${f.toLowerCase()}`} className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${filter === f ? "bg-white text-dhl-ink" : "text-dhl-muted hover:text-dhl-text"}`}>{f}</button>
        ))}
      </div>

      <div className="bg-white border border-dhl-border">
        {loading ? (
          <div className="py-16 text-center"><Loader2 className="w-7 h-7 text-dhl-yellow animate-spin mx-auto" /></div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center" data-testid="invoices-empty">
            <Receipt className="w-12 h-12 mx-auto text-dhl-muted mb-3" />
            <p className="text-dhl-muted">No invoices yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" data-testid="invoices-table">
            <table className="w-full text-sm">
              <thead className="bg-dhl-panel border-b border-dhl-border">
                <tr>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Invoice</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Issued</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Due</th>
                  <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Total</th>
                  <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Status</th>
                  <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-dhl-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(inv => (
                  <tr key={inv.invoiceNumber} data-testid={`invoice-row-${inv.invoiceNumber}`} className="border-b border-dhl-border last:border-b-0 hover:bg-dhl-yellow/5">
                    <td className="px-5 py-3 font-mono font-bold">{inv.invoiceNumber}</td>
                    <td className="px-5 py-3 text-dhl-muted">{formatDate(inv.issueDate)}</td>
                    <td className="px-5 py-3 text-dhl-muted">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold">{formatPGK(inv.totalPGK)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${statusTone[inv.status]}`}>{inv.status}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            downloadAuthedPdf({
                              path: `/api/invoices/${inv.invoiceNumber}/pdf`,
                              filename: `${inv.invoiceNumber}.pdf`,
                              niceLabel: `Invoice ${inv.invoiceNumber}`,
                            })
                          }
                          data-testid={`inv-pdf-${inv.invoiceNumber}`}
                          className="text-xs font-bold uppercase tracking-wider text-dhl-text hover:text-dhl-red flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF
                        </button>
                        {inv.status !== "PAID" && (
                          <button onClick={() => setPayInv(inv)} data-testid={`inv-pay-${inv.invoiceNumber}`} className="text-xs font-bold uppercase tracking-wider text-dhl-red hover:underline flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5" /> Pay Now
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payInv && <PayModal invoice={payInv} onClose={() => setPayInv(null)} onPaid={load} />}
    </div>
  );
};

const Kpi = ({ label, value, accent }) => (
  <div className={`p-4 border border-dhl-border ${accent}`}>
    <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{label}</div>
    <div className="font-display text-2xl font-black">{value}</div>
  </div>
);

export default Invoices;
