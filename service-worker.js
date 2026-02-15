const APP_SCOPE = '/vbuw-locations';
const CACHE_VERSION = 'v13';
const STATIC_CACHE = `vbuw-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `vbuw-runtime-${CACHE_VERSION}`;
const OFFLINE_PAGE = `${APP_SCOPE}/index.html`;
const STATIC_ASSETS = [
  `${APP_SCOPE}/`,
  OFFLINE_PAGE,
  `${APP_SCOPE}/style.css`,
  `${APP_SCOPE}/script.js`,
  `${APP_SCOPE}/manifest.json`,
  `${APP_SCOPE}/coordinates.json`,
  `${APP_SCOPE}/icons/icon-192.png`,
  `${APP_SCOPE}/icons/icon-512.png`
];

function isAppAsset(pathname) {
  return pathname.startsWith(`${APP_SCOPE}/`) && (
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.json') ||
    pathname.endsWith('.webmanifest')
  );
}

function canBeCached(request, response) {
  if (request.method !== 'GET' || !response) return false;
  if (response.type === 'opaque') return true;
  return response.status === 200 && (response.type === 'basic' || response.type === 'cors');
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        const isOldCache = key.startsWith('vbuw-static-') || key.startsWith('vbuw-runtime-');
        if (!isOldCache) return Promise.resolve();
        return key === STATIC_CACHE || key === RUNTIME_CACHE ? Promise.resolve() : caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (canBeCached(request, response)) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_PAGE);
    }
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (canBeCached(request, response)) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) return cached;
  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;
  if (request.mode === 'navigate') return caches.match(OFFLINE_PAGE);
  throw new Error('No cached or network response available');
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  if (url.pathname === `${APP_SCOPE}/coordinates.json`) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  if (isAppAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
