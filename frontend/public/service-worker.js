/* myDHLi PWA service worker — v2
 *
 * Goal: satisfy Chrome's "installable" criteria so the Add to Home Screen
 * flow promotes a proper PWA install (with the DHL Global Forwarding icon)
 * instead of a generic bookmark shortcut.
 *
 * Strategy:
 *   • Pre-cache a tiny core (shell HTML + manifest + branded icons) at
 *     install time so the install bar can render a branded preview.
 *   • Network-first for navigation requests, falling back to the cached
 *     root shell — this gives Chrome a real `respondWith` for
 *     `request.mode === 'navigate'`, which is the formal installability
 *     check today.
 *   • Cache-first for the icon set and manifest — keeps the home-screen
 *     icon stable even if the network drops.
 *   • `v2` cache key + cleanup so the v1 (no-op) worker is replaced on
 *     first visit after redeploy.
 *
 * This worker does NOT cache the JS / CSS bundles, so a redeploy always
 * serves fresh app code. Only the shell + icons + manifest are cached.
 */
const CACHE = "mydhli-pwa-v2";
const CORE = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-touch-icon.png",
  "/pwa-192x192.png",
  "/pwa-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .catch(() => {
        // Don't fail the install if a single asset misses — the worker
        // must still register so the page is "installable".
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 1) Navigation requests (HTML page loads): network-first, fall back to
  //    the cached root shell. This branch is the formal installability
  //    requirement Chrome checks for ("a service worker that handles
  //    fetch events with a response").
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/").then((r) => r || Response.error()))
    );
    return;
  }

  // 2) Same-origin core asset (icons + manifest): cache-first.
  const url = new URL(req.url);
  if (url.origin === self.location.origin && CORE.some((p) => url.pathname === p)) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }

  // 3) Everything else: default network behaviour, no SW interference.
  //    (We intentionally don't call event.respondWith here.)
});
