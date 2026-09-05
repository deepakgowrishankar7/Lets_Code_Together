const CACHE_NAME = 'codetogether-v12';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/main.html',
  '/styles.css',
  '/mobile_fixes.css',
  '/scripts.js',
  '/quizzes.js',
  '/image/logo.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request).then(networkResponse => {
      if (networkResponse && networkResponse.status === 200) {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
      }
      return networkResponse;
    }).catch(() => caches.match(event.request))
  );
});
