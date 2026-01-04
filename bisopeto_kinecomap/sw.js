
const CACHE_NAME = 'kinecomap-v20';
const DYNAMIC_CACHE = 'kinecomap-dynamic-v20';

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
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // CRITIQUE : Ne JAMAIS mettre en cache les appels vers Supabase ou les API dynamiques
  // Cela évite que les signalements supprimés réapparaissent à cause du cache local
  if (url.href.includes('supabase.co') || event.request.method !== 'GET') {
    return; // Laisser passer la requête directement vers le réseau sans intercepter
  }

  // Gestion spécifique pour les tuiles de la carte (OpenStreetMap / Carto)
  if (url.href.includes('tile.openstreetmap.org') || url.href.includes('basemaps.cartocdn.com')) {
     event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
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

  // Stratégie Stale-While-Revalidate pour le reste des assets statiques
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Optionnel : ne mettre en cache que si c'est un asset statique (image, css, js)
        const isStatic = /\.(js|css|png|jpg|jpeg|svg|woff2)$/.test(url.pathname);
        if (isStatic) {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback si réseau KO
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
