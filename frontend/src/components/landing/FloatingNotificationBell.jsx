import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

const LS_KEY = "dhl_floating_bell_dismissed_v1";

/**
 * Floating red notification pill with "2" badge — fixed bottom-right.
 * Positioned ABOVE the DEMO MODE badge by raising bottom offset.
 * Dismissible; persists via localStorage.
 */
const FloatingNotificationBell = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(LS_KEY);
    if (!dismissed) {
      // Slight delay for nicer entrance
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, []);

  const dismiss = () => {
    localStorage.setItem(LS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      data-testid="floating-bell"
      className="fixed right-4 lg:right-6 z-40 flex items-center gap-2 group"
      style={{ bottom: "76px" /* sits above DEMO MODE badge */ }}
    >
      <button
        type="button"
        onClick={dismiss}
        data-testid="floating-bell-dismiss"
        aria-label="Dismiss notification"
        className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 bg-white border border-dhl-border rounded-full flex items-center justify-center shadow-sm hover:bg-dhl-panel"
      >
        <X className="w-3.5 h-3.5 text-dhl-muted" />
      </button>
      <div
        className="relative w-14 h-14 bg-dhl-red text-white rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-105"
        style={{ transform: "rotate(-8deg)" }}
        title="2 new updates"
      >
        <Bell className="w-5 h-5" strokeWidth={2.5} />
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-dhl-yellow text-dhl-ink text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white">
          2
        </span>
      </div>
    </div>
  );
};

export default FloatingNotificationBell;
