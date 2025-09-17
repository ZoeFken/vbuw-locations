// v1: bump dit versienummer bij elke wijziging
const CACHE_NAME = 'vbuw-locations-v1';

// Zet ALLES wat je nodig hebt offline in deze lijst:
const ASSETS = [
  '/vbuw-locations/',
  '/vbuw-locations/index.html',
  '/vbuw-locations/style.css',
  '/vbuw-locations/script.js',
  '/vbuw-locations/coordinates.json',
  '/vbuw-locations/icons/icon-192.png',
  '/vbuw-locations/icons/icon-512.png'
];

// Install: pre-cache
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate: oude caches weg
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : undefined)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first, netwerk fallback; SPA-fallback op index
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const okToCache =
          req.method === 'GET' &&
          res.status === 200 &&
          (res.type === 'basic' || res.type === 'opaque');
        if (okToCache) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return res;
      }).catch(() => {
        // Navigatie offline? terugvallen op index.html
        if (req.mode === 'navigate') return caches.match('/vbuw-locations/index.html');
      });
    })
  );
});
