self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('v1').then(function(cache) {
      return cache.addAll([
        '/index.ejs',
        '/welcome.ejs',
        '/chat.ejs',
        '/404.ejs',
        '/css/styles.css',
        '/images/logos/logo.png'
      ]);
    }).catch(function(error) {
      console.error("Erreur lors de l\'installation du Service Worker:", error);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    }).catch(function(error) {
      console.error('Erreur lors de la récupération de la ressource:', error);
    })
  );
});
