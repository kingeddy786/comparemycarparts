// CompareMyCarParts.com — Service Worker
// Handles offline caching and PWA install

const CACHE_NAME = 'cmcp-v1';
const OFFLINE_URL = '/';

// Files to cache for offline use
const CACHE_FILES = [
  '/',
  '/index.html',
  '/site.webmanifest'
];

// Install — cache core files
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch — serve from cache if offline, network first if online
self.addEventListener('fetch', function(event) {
  // Skip non-GET requests and API calls
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('workers.dev')) return;
  if (event.request.url.includes('api.')) return;
  if (event.request.url.includes('fonts.')) return;

  event.respondWith(
    fetch(event.request)
      .then(function(response) {
        // Cache successful responses
        if (response && response.status === 200) {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // If offline, serve from cache
        return caches.match(event.request).then(function(cached) {
          return cached || caches.match(OFFLINE_URL);
        });
      })
  );
});

// Handle push notifications (for future use)
self.addEventListener('push', function(event) {
  if (!event.data) return;
  var data = event.data.json();
  self.registration.showNotification(data.title || 'CompareMyCarParts', {
    body: data.body || 'New deal available!',
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  });
});
