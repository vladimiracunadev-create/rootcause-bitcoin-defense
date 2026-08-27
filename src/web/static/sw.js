// Service worker: la aplicacion sigue abriendose sin proceso servidor.
//
// Estrategia red primero, cache despues. Al reves de lo habitual, y a
// proposito: un panel de seguridad que sirviera datos de custodia desde una
// cache vieja seria peor que uno que no abre.
//
// Por eso `/api/` esta excluido explicitamente: se cachea la cascara -HTML,
// CSS, JS, icono-, nunca el estado. Lo que se ve siempre viene del proceso
// local o no se ve.
const CACHE = "rootcause-bitcoin-defense-v1";
const ASSETS = ["/", "/styles.css", "/app.js", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
