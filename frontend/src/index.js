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
