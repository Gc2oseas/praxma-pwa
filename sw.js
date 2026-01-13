const CACHE_NAME = 'praxma-engine-v4';
const RSS_FEED = 'https://praxma.blogspot.com/feeds/posts/default?alt=rss';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Función de consulta (el "Ping")
async function checkForUpdates() {
  try {
    const response = await fetch(RSS_FEED);
    const text = await response.text();
    
    // Extraemos la fecha de la última actualización del feed
    const lastUpdateMatch = text.match(/<updated>(.*?)<\/updated>/);
    const currentUpdate = lastUpdateMatch ? lastUpdateMatch[1] : '';

    // Comparamos con la guardada en la base de datos local (IndexedDB o Cache)
    const cache = await caches.open(CACHE_NAME);
    const lastStoredUpdate = await cache.match('last-update-tag');
    const lastTagText = lastStoredUpdate ? await lastStoredUpdate.text() : '';

    if (currentUpdate !== lastTagText) {
      console.log('PRAXMA: ¡Nuevo contenido detectedo! Iniciando descarga...');
      
      // Guardamos la nueva marca de tiempo
      cache.put('last-update-tag', new Response(currentUpdate));
      
      // Descargamos los últimos posts
      const urls = [...text.matchAll(/<link>(.*?)<\/link>/g)]
                    .map(m => m[1])
                    .filter(url => url.includes('.html'))
                    .slice(0, 5);
      
      await cache.addAll(urls);

      // Activamos el Badge (punto de notificación)
      if (navigator.setAppBadge) {
        navigator.setAppBadge(1);
      }
    }
  } catch (err) {
    console.error('Error en el ping de consulta:', err);
  }
}

// Escuchar el evento de sincronización periódica
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-check') {
    event.waitUntil(checkForUpdates());
  }
});

// También revisamos cuando el usuario abre la app
self.addEventListener('activate', (event) => {
  event.waitUntil(checkForUpdates());
});
