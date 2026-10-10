/* Ledger's offline helper. Keeps a copy of the app itself (never your data or
   sign-in pages) so it opens instantly and works with no signal. */
const SHELL = "ledger-shell-v1";
const STATIC = "ledger-static-v1";
const MAX_STATIC = 300;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keep = [SHELL, STATIC];
      for (const k of await caches.keys()) if (k.startsWith("ledger-") && !keep.includes(k)) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_STATIC; i++) await cache.delete(keys[i]);
}

/* The app page: show the saved copy straight away, refresh it in the background.
   If the server says you're signed out, forget the saved copy. */
async function appPage(event) {
  const cache = await caches.open(SHELL);
  const saved = await cache.match("/");
  const fresh = fetch(event.request)
    .then(async (res) => {
      if (res.ok && !res.redirected && res.type === "basic") await cache.put("/", res.clone());
      else if (res.redirected || res.status === 401 || res.status === 403) await cache.delete("/");
      return res;
    })
    .catch(() => null);
  if (saved) {
    event.waitUntil(fresh);
    return saved;
  }
  return (await fresh) || Response.error();
}

/* Built files have unique names per version, so a saved copy never goes stale. */
async function builtFile(request) {
  const cache = await caches.open(STATIC);
  const saved = await cache.match(request);
  if (saved) return saved;
  const res = await fetch(request);
  if (res.ok && res.type === "basic") {
    await cache.put(request, res.clone());
    void trim(cache);
  }
  return res;
}

/* Icons and the app manifest: saved copy first, refreshed in the background. */
async function asset(event) {
  const cache = await caches.open(STATIC);
  const saved = await cache.match(event.request);
  const fresh = fetch(event.request)
    .then((res) => (res.ok && res.type === "basic" ? cache.put(event.request, res.clone()).then(() => res) : res))
    .catch(() => null);
  if (saved) {
    event.waitUntil(fresh);
    return saved;
  }
  return (await fresh) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase and anything else: straight to the network
  const p = url.pathname;
  if (p.startsWith("/login") || p.startsWith("/auth/") || p.startsWith("/api/")) return;
  if (req.mode === "navigate" && p === "/") return event.respondWith(appPage(event));
  if (p.startsWith("/_next/static/")) return event.respondWith(builtFile(req));
  if (p === "/manifest.webmanifest" || /^\/(icon[\w-]*|apple-touch-icon)\.(png|svg)$/.test(p))
    return event.respondWith(asset(event));
});

self.addEventListener("message", (e) => {
  if (e.data === "forget") e.waitUntil(Promise.all([caches.delete(SHELL), caches.delete(STATIC)]));
});
