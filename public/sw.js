// Service Worker for caching images
const CACHE_NAME = 'nightreign-images-v1';
const IMAGE_URLS = [
  // Add specific image URLs if needed, but we'll cache dynamically
];

// Install event - cache initial resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker caching images.');
      return cache.addAll(IMAGE_URLS);
    })
  );
});

// Fetch event - cache images on demand
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for images
  if (event.request.method !== 'GET' ||
      !event.request.url.includes('.png') &&
      !event.request.url.includes('.jpg') &&
      !event.request.url.includes('.jpeg') &&
      !event.request.url.includes('.gif') &&
      !event.request.url.includes('.webp')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('Serving from cache:', event.request.url);
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
          console.log('Cached:', event.request.url);
        });

        return response;
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
