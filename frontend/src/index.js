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

// ---- PWA service worker UNREGISTER (post-Faz 7.9 cleanup) ----
// Faz 7.9 moved the PWA install role to the mobile Expo bundle at /m/.
// The web shell at / is no longer a PWA. Any service worker registered by
// earlier visits (v1, v2) must be actively unregistered, otherwise the
// user's phone keeps treating / as the install target and intercepts
// navigation requests. This block silently cleans up legacy workers and
// their caches on every page load. Safe to keep long-term: noop once
// no workers exist.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => Promise.all(regs.map((r) => r.unregister())))
      .catch(() => {});
    if (typeof caches !== "undefined" && caches.keys) {
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter((k) => k.startsWith("mydhli-pwa-"))
              .map((k) => caches.delete(k)),
          ),
        )
        .catch(() => {});
    }
  });
}
