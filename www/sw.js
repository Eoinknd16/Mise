// Mise service worker: app shell offline, recipe images/data cached as you browse.
const VERSION = 'mise-v29';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/core.js', 'js/data.js', 'js/smart.js', 'js/builder.js', 'js/flavour.js', 'js/chef.js', 'js/chefmap.js', 'js/techniques.js', 'js/pairings.js', 'js/prep.js', 'data/chefdb.json', 'data/nutmap.json', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'fonts/fraunces.woff2', 'fonts/inter.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'mise-runtime').map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin === location.origin) {
    // network first for the app itself so updates arrive; cache fallback offline
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
    return;
  }
  if (/themealdb\.com|fonts\.(googleapis|gstatic)\.com|cdn\.jsdelivr\.net/.test(url.host)) {
    // stale-while-revalidate for recipe data, images, fonts and the receipt reader
    e.respondWith(caches.open('mise-runtime').then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r.ok || r.type === 'opaque') c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
  }
});
