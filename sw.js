// Math Facts PWA Service Worker
// Cache-first with background updates for offline functionality

const CACHE_NAME = 'math-facts-v1';
const STATIC_CACHE = 'math-facts-static-v1';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/modules/ui.js',
  '/modules/leaderboard.js',
  '/games/addition.js',
  '/games/division.js',
  '/games/subtraction.js',
  '/games/multiplication.js',
  '/games/math-facts-base.js',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, update in background
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          // Background update: fetch fresh version and update cache
          fetch(event.request)
            .then(freshResponse => {
              if (freshResponse && freshResponse.status === 200) {
                const responseClone = freshResponse.clone();
                caches.open(STATIC_CACHE)
                  .then(cache => {
                    cache.put(event.request, responseClone);
                  });
              }
            })
            .catch(() => {
              // Network failed, but we have cached version
              console.log('Service Worker: Network failed, serving cached version');
            });

          return cachedResponse;
        }

        // No cached version, fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache the fetched response
            const responseClone = response.clone();
            caches.open(STATIC_CACHE)
              .then(cache => {
                cache.put(event.request, responseClone);
              });

            return response;
          })
          .catch(() => {
            // Network failed and no cached version
            console.log('Service Worker: Network failed, no cached version available');

            // For HTML requests, you could return a custom offline page here
            if (event.request.headers.get('accept').includes('text/html')) {
              return new Response(
                '<h1>Offline</h1><p>Math Facts is not available offline for this page.</p>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            }

            throw error;
          });
      })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received skip waiting message');
    self.skipWaiting();
  }
});

// Notify clients when a new version is available
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});