// Offline safety net for the Scott Harris deck. Everything same-origin is network first with a
// cache fallback, and every successful response is cached, so after the deck has been opened once
// (it loads all its modules at start) a Wi-Fi dropout or a reload mid-talk still works.
// Paths are relative to this file, so it works at the site root (Worker) and in a subfolder
// (ryrycd.github.io/t10/scott/). The live sync (/ws, /api) always needs the network.
const CACHE = "scott-harris-intro-v6";
const PRECACHE = ["deck/", "script/", "assets/js/script-data.js?v=6", "assets/js/sync.js?v=2", "assets/js/sound.js?v=2", "assets/js/sw/main.js?v=2"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  // only our own old caches: other pages on the same github.io origin keep theirs
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("scott-harris-intro-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/ws") || u.pathname.startsWith("/api")) return;
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: false }).then((hit) => hit || caches.match(e.request, { ignoreSearch: true })))
  );
});
