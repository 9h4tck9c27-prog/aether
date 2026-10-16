// Æther service worker: works offline after the first visit, always prefers fresh files when online.
const CACHE = "aether-v10";
const SHELL = ["/", "/index.html", "/css/styles.css", "/js/app.js", "/js/astro.js", "/js/data.js", "/js/sky3d.js", "/js/reading.js", "/js/voice.js",
  "/vendor/astronomy.browser.min.js", "/vendor/three.module.min.js", "/manifest.webmanifest", "/icons/icon-192.png", "/fonts/fraunces-latin-full-normal.woff2", "/fonts/fraunces-latin-full-italic.woff2", "/fonts/figtree-latin-wght-normal.woff2"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match("/"))));
});
