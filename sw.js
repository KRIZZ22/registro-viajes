const CACHE = 'viajes-v1';
const ASSETS = [
  '/registro-viajes/',
  '/registro-viajes/index.html',
  '/registro-viajes/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Para llamadas al webhook de Google siempre ir a la red
  if (e.request.url.includes('script.google.com')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// Cola de viajes pendientes cuando no hay conexión
const PENDING_QUEUE = 'pending-viajes';

self.addEventListener('sync', e => {
  if (e.tag === 'sync-viajes') {
    e.waitUntil(syncPendingViajes());
  }
});

async function syncPendingViajes() {
  const cache = await caches.open(PENDING_QUEUE);
  const requests = await cache.keys();
  await Promise.all(requests.map(async req => {
    try {
      await fetch(req);
      await cache.delete(req);
    } catch(e) {}
  }));
}
