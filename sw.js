const CACHE_NAME = 'praxma-cache-v1';
const URLS_TO_CACHE = [
  'https://PRAXMA.blogspot.com/',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap' // Ejemplo de fuente
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkResponse.clone());
        });
        return networkResponse;
      });
      return response || fetchPromise;
    })
  );
});
