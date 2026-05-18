import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// --- Mobile subpath bare-directory guard ---------------------------------
// Emergent's static server does not auto-resolve "/m/" → "/m/index.html",
// it falls back to the CRA SPA shell. This guard hard-redirects any bare
// "/m" or "/m/" request to the explicit Expo Web bundle entry before React
// mounts. Specific paths like "/m/login" and "/m/manifest.json" already
// resolve correctly via static-file routing.
(() => {
  if (typeof window === "undefined") return;
  const p = window.location.pathname;
  if (p === "/m" || p === "/m/") {
    window.location.replace("/m/index.html" + window.location.search + window.location.hash);
  }
})();
// -------------------------------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// ---- PWA service worker registration ----
// Registers `/service-worker.js` so Chrome / Edge consider the page
// "installable" and show the DHL Global Forwarding icon on "Add to Home
// Screen". The worker is intentionally a no-op pass-through (see
// public/service-worker.js) — no offline caching, so deploys always serve
// fresh content. Only runs in production builds; CRA dev server has its
// own HMR socket which conflicts with a registered worker.
if (
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  (process.env.NODE_ENV === "production" ||
    window.location.protocol === "https:")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js", { scope: "/" })
      .catch((err) => {
        // Non-fatal: app still works without the worker.
        console.warn("[PWA] service worker registration failed:", err);
      });
  });
}
