const CACHE_NAME = "voice-diary-v3";

// Static assets to cache on install (not HTML — that must stay fresh)
const STATIC_ASSETS = ["/icon-192.png", "/icon-512.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Bypass cache for Supabase API & auth
  if (event.request.url.includes("supabase.co")) {
    return;
  }

  const url = new URL(event.request.url);

  // Network-first for HTML pages — always get latest version
  if (event.request.mode === "navigate" || url.pathname === "/" || url.pathname.startsWith("/diary") || url.pathname.startsWith("/calendar")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, fonts, images)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetched = fetch(event.request).then((resp) => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return resp;
      });
      return cached || fetched;
    })
  );
});
