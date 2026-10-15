// Service worker de "Historial de Planta".
// Sube este número cada vez que publiques cambios en index.html para forzar la actualización.
const CACHE = 'historial-planta-v1';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './favicon-16.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Nunca cachear llamadas a Supabase (datos y login siempre deben ir a la red).
  if (url.hostname.endsWith('.supabase.co')) return;

  // Nunca cachear el catálogo de máquinas publicado en Google Sheets (debe poder actualizarse).
  if (url.hostname.includes('google')) return;

  if (e.request.method !== 'GET') return;

  // App shell: cache-first con actualización en segundo plano.
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetchPromise = fetch(e.request).then((resp) => {
        if (resp && resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copia));
        }
        return resp;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
