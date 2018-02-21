self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('static-cache-v1')
    .then((cache) => {
      return cache.addAll([
        '.',
        'index.html',
        'css/main.css',
        'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700',
        'images/MtHoodCityscape.jpg',
        'res/nrcs_spp.txt'
      ]);
    })
    .catch((e) => {
      console.log(e);
      return;
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request)
  .then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    })
  );
});
