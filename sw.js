
const CACHE_NAME = 'kinecomap-v21';
const DYNAMIC_CACHE = 'kinecomap-dynamic-v21';

// Ressources critiques à mettre en cache immédiatement
const STATIC_ASSETS = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.2/dist/jsQR.min.js'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interception des requêtes réseau (Stratégie hybride Stale-While-Revalidate + Cache Tuiles)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ne pas mettre en cache les API dynamiques Firestore/Supabase pour préserver la cohérence temps réel
  if (url.href.includes('supabase.co') || url.href.includes('firestore.googleapis.com') || event.request.method !== 'GET') {
    return;
  }

  // Cache dédié aux tuiles cartographiques
  if (url.href.includes('tile.openstreetmap.org') || url.href.includes('basemaps.cartocdn.com')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Stale-While-Revalidate pour le reste des assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          const isStatic = /\.(js|css|png|jpg|jpeg|svg|woff2|ico)$/.test(url.pathname);
          if (isStatic) {
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Background Sync pour synchroniser les signalements hors-ligne
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_PENDING_REPORTS' });
        });
      })
    );
  }
});

// Notifications Push
self.addEventListener('push', (event) => {
  let data = { title: 'BISO PETO', body: 'Nouvelle notification environnementale' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'https://xjllcclxkffrpdnbttmj.supabase.co/storage/v1/object/public/branding/logo-1766239701120-logo_bisopeto.png',
    badge: 'https://xjllcclxkffrpdnbttmj.supabase.co/storage/v1/object/public/branding/logo-1766239701120-logo_bisopeto.png',
    data: data.url || '/',
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data || '/');
      }
    })
  );
});

