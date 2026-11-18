// =========================================================================
// VIKASA SERVICES & INTERIORS — SERVICE WORKER (v4)
// PWA OFFLINE CACHING & OPTIMIZED CDN ASSET DELIVERY
// =========================================================================

const CACHE_NAME = 'vikasa-cache-v4';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/logo/vikasa_interior_logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico',
];

// 1. INSTALL
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some static assets could not be pre-cached:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE (Purge old cache versions)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH STRATEGY
// SECURITY RULE: Never cache sensitive API calls, customer records, or technician credentials.
// VERCEL USAGE RULE: Do not trigger redundant background fetches for assets already present in cache.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. Skip non-GET requests or unsupported schemes (e.g. chrome-extension:)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // B. Sensitive and dynamic endpoints: Network-first, strictly no-cache for private data
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.includes('/track') ||
    url.pathname.startsWith('/request') ||
    url.pathname.startsWith('/worker-register')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If offline and navigating to a page, serve offline fallback
        if (event.request.mode === 'navigate') {
          return caches.match('/offline').then((res) => res || new Response('Offline'));
        }
        return new Response(JSON.stringify({ error: 'Network unavailable offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // C. Static assets (images, CSS, JS, fonts): Cache-First to minimize Vercel CDN requests
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200 && event.request.url.startsWith('http')) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, resClone).catch(() => {});
            });
          }
          return networkRes;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return null;
        });
    })
  );
});
