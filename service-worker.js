// bump dit bij elke wijziging
const CACHE_NAME = 'vbuw-locations-v10';
const ASSETS = [
  '/vbuw-locations/',
  '/vbuw-locations/index.html',
  '/vbuw-locations/style.css',
  '/vbuw-locations/script.js',
  '/vbuw-locations/coordinates.json',
  '/vbuw-locations/icons/icon-192.png',
  '/vbuw-locations/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : 0)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(res => {
        const ok = req.method === 'GET' && res.status === 200 && (res.type === 'basic' || res.type === 'opaque');
        if (ok) caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('/vbuw-locations/index.html');
      });
    })
  );
});
