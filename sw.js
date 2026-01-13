const CACHE_NAME = 'praxma-dynamic-v1';

// Recursos esenciales mínimos
const PRE_CACHE = [
  '/',
  'https://PRAXMA.blogspot.com/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRE_CACHE))
  );
});

self.addEventListener('fetch', event => {
  // Solo cacheamos peticiones de tu blog o recursos externos necesarios (fuentes, imágenes)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(response => {
        // Si la respuesta es válida, la guardamos automáticamente en la caché
        if (response.status === 200) {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        }
        return response;
      });
    })
  );
});
