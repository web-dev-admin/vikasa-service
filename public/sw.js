// =========================================================================
// VIKASA SERVICES & INTERIORS — SERVICE WORKER
// PWA OFFLINE CACHING & WEB PUSH NOTIFICATION HANDLER
// =========================================================================

const CACHE_NAME = 'vikasa-cache-v1';
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

// 2. ACTIVATE
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

// 3. FETCH
// SECURITY RULE: Never cache sensitive API calls, customer records, or technician credentials.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // B. Sensitive endpoints: Network-first, strictly no-cache for private data
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.includes('/track')
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

  // C. Static assets (images, CSS, JS): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, resClone);
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

      return cached || fetchPromise;
    })
  );
});

// 4. WEB PUSH NOTIFICATIONS (FCM & Web Push)
self.addEventListener('push', (event) => {
  let data = {
    title: 'Vikasa Services Update',
    body: 'You have a new update in Vikasa Admin.',
    url: '/admin/dashboard',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = {
        title: parsed.title || parsed.notification?.title || data.title,
        body: parsed.body || parsed.notification?.body || parsed.message || data.body,
        url: parsed.data?.url || parsed.url || data.url,
      };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
    },
    actions: [
      { action: 'open', title: 'Open in Admin' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// 5. NOTIFICATION CLICK
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/admin/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

