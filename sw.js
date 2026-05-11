const CACHE_NAME = 'astro-gallery-v1';
const ASSETS = [
    './',
    './index.html',
    './styles/theme.css',
    './styles/gallery.css',
    './scripts/gallery.js',
    './scripts/gallery-core.js',
    './scripts/gallery-astro.js',
    './scripts/gallery-ui.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
