/* Minimal service worker for PWA installability.
 *
 * Chrome's "Add to Home Screen" prompt requires:
 *   1) HTTPS (production has it via Cloudflare)
 *   2) A linked manifest with name + 192/512 icons + start_url + display
 *      (public/manifest.json — done)
 *   3) An active service worker with a `fetch` handler.
 *
 * This worker does NOT do offline caching of the app shell (that would
 * require version-bumping every deploy). It just registers a no-op
 * pass-through fetch handler so Chrome considers the page "installable"
 * and shows the DHL Global Forwarding icon when the user adds it to their
 * home screen.
 *
 * If we ever want offline support, replace the fetch handler with a
 * cache-first strategy keyed by `self.serviceWorker.scriptURL` hash.
 */
const VERSION = "mydhli-pwa-v1";

self.addEventListener("install", (event) => {
  // Skip waiting so a redeploy activates immediately on next visit.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim all open clients so the new worker takes effect without reload.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through. Required for installability; no caching side-effects.
  // Network-first, no offline fallback — keeps the app always-fresh.
  event.respondWith(fetch(event.request).catch(() => Response.error()));
});
