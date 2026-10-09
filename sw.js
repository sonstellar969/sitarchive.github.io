const CACHE_NAME = 'sit-archive-v3';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/browse.html',
  '/css/tailwind.css',
  '/css/animations.css',
  '/js/data.js',
  '/js/theme.js',
  '/js/animations.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
          // ignore errors if a file is missing
          return Promise.allSettled(URLS_TO_CACHE.map(url => cache.add(url)));
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // Use Network-First (Stale-while-revalidate) for HTML navigation requests
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request).then(response => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        return caches.match(event.request);
      })
    );
    return;
  }

  // Cache-first for other static assets
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
