const CACHE_NAME = 'praxma-engine-v4';
const RSS_FEED = 'https://praxma.blogspot.com/feeds/posts/default?alt=rss';
const OFFLINE_PAGE = 'https://praxma.blogspot.com/p/offline.html';

// 1. Recursos que se guardan siempre al instalar
const PRE_CACHE = [
  '/',
  '/favicon.ico',
  OFFLINE_PAGE
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE))
  );
  self.skipWaiting();
});

// 2. Función de consulta (El "Ping" inteligente)
async function checkForUpdates() {
  try {
    const response = await fetch(RSS_FEED);
    const text = await response.text();
    
    // Extraemos la fecha de la última actualización del feed
    const lastUpdateMatch = text.match(/<updated>(.*?)<\/updated>/);
    const currentUpdate = lastUpdateMatch ? lastUpdateMatch[1] : '';

    const cache = await caches.open(CACHE_NAME);
    const lastStoredUpdate = await cache.match('last-update-tag');
    const lastTagText = lastStoredUpdate ? await lastStoredUpdate.text() : '';

    if (currentUpdate !== lastTagText) {
      console.log('PRAXMA Engine: ¡Nuevo contenido detectado!');
      
      // Guardamos la nueva marca de tiempo
      cache.put('last-update-tag', new Response(currentUpdate));
      
      // Extraemos URLs de los últimos 5 posts
      const urls = [...text.matchAll(/<link href=['"](.*?)['"]/g)]
                    .map(m => m[1])
                    .filter(url => url.includes('.html') && !url.includes('search'))
                    .slice(0, 5);
      
      // Descargamos los nuevos relatos a la memoria
      await cache.addAll(urls);

      // Activamos el punto de notificación en el icono
      if (self.registration && self.registration.index) {
          // Intento de notificación via badge
          if ('setAppBadge' in navigator) {
              navigator.setAppBadge(1);
          }
      }
    }
  } catch (err) {
    console.error('Error en el ping de consulta RSS:', err);
  }
}

// 3. Gestión de Peticiones (Velocidad extrema y modo Offline)
self.addEventListener('fetch', (event) => {
  // Solo manejamos peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si está en caché, lo entregamos (Velocidad instantánea)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no está en caché, intentamos ir a la red
      return fetch(event.request).then((networkResponse) => {
        // Guardamos dinámicamente lo que el usuario va visitando
        if (networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // SI FALLA LA RED Y NO ESTÁ EN CACHÉ: Mostramos la página Offline poética
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_PAGE);
        }
      });
    })
  );
});

// 4. Eventos de Sincronización
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-check') {
    event.waitUntil(checkForUpdates());
  }
});

self.addEventListener('activate', (event) => {
  // Limpieza de versiones antiguas de caché
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME)
                  .map((name) => caches.delete(name))
      );
    })
  );
  event.waitUntil(checkForUpdates());
  return self.clients.claim();
});
