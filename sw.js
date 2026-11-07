// PausKIT service worker: makes the app installable and lets the page open even on a bad connection.
// Journal data is NOT stored here; it lives in your account (Supabase) and in drafts on the device.
const CACHE = "pauskit-v13";
const SHELL = ["./", "index.html", "styles.css", "fonts.css", "app.js", "astro.js", "content.js", "config.js", "manifest.webmanifest", "news.json",
  "vendor/supabase.js", "vendor/astronomy.min.js", "fonts/shadows.woff2", "fonts/kalam-400.woff2", "fonts/kalam-700.woff2",
  "fonts/nunito-400.woff2", "fonts/nunito-600.woff2", "fonts/nunito-800.woff2", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Network first so updates show straight away; if the network is slow (4 s) or blocked, use the saved copy.
function networkFirst(req) {
  return new Promise((resolve) => {
    let done = false;
    const fromCache = () => caches.match(req).then((r) => r || caches.match("index.html"));
    const timer = setTimeout(() => { fromCache().then((r) => { if (!done && r) { done = true; resolve(r); } }); }, 4000);
    fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      if (!done) { done = true; clearTimeout(timer); resolve(res); }
    }).catch(() => fromCache().then((r) => { if (!done) { done = true; clearTimeout(timer); resolve(r || Response.error()); } }));
  });
}
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // never touch account/database or other sites' traffic
  e.respondWith(networkFirst(req));
});
