/* myDHLi PWA service worker — TOMBSTONE (Faz 7.9 cleanup)
 *
 * The web shell at `/` is no longer a PWA — that role moved to the mobile
 * Expo Web bundle at `/m/` in Faz 7.9. This file is intentionally a
 * self-uninstalling worker so any browser that still has v1 or v2 cached
 * will drop it on next visit instead of intercepting navigation requests
 * (which is what made Add-to-Home-Screen attach to the wrong app).
 *
 * Do not delete this file: removing it would make older clients keep their
 * stale workers indefinitely (a 404 on the script does NOT trigger
 * unregister). The tombstone must stay reachable until we're confident
 * every user has cleared their cache.
 */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop all caches this worker (or its predecessors) owned.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("mydhli-pwa-")).map((k) => caches.delete(k)),
      );
      // Unregister self so the browser stops treating / as a PWA.
      await self.registration.unregister();
      // Force every open client to reload without the worker.
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url).catch(() => {});
      }
    })(),
  );
});

// No fetch handler — navigation requests fall through to the network,
// which removes the "controlled by service worker" installability signal.
