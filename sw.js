// Block Brawl service worker: network-first, falls back to cache when offline.
const CACHE = 'bb-v9';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(r => {
      if (r && r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(req, c)).catch(() => {}); }
      return r;
    }).catch(() => caches.match(req).then(m => m || Response.error()))
  );
});
