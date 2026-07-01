/* Service worker for offline caching */
const CACHE_NAME = 'switchon-static-v1';
const ASSETS = [
  './',
  './index.html',
  './about.html',
  './problem.html',
  './solution.html',
  './prototype.html',
  './survey.html',
  './roadmap.html',
  './team.html',
  './faq.html',
  './contact.html',
  './waitlist.html',
  './404.html',
  './css/style.css',
  './css/responsive.css',
  './css/animations.css',
  './js/app.js',
  './js/theme.js',
  './js/animations.js',
  './js/charts.js',
  './js/firebase.js',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
