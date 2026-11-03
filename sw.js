// Pause service worker: makes the app installable and lets the page open offline.
// Journal data is NOT stored here; it lives in your account (Supabase) and in drafts on the device.
const CACHE = "pause-v10";
const SHELL = ["./", "index.html", "styles.css", "app.js", "astro.js", "content.js", "config.js", "manifest.webmanifest", "news.json", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Never cache account or database traffic
  if (url.hostname.endsWith("supabase.co") || url.hostname.includes("open-meteo")) return;
  // Network first (so updates show immediately), fall back to cache when offline
  e.respondWith(
    fetch(req).then((res) => {
      if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
  );
});
