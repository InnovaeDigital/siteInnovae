const CACHE_NAME = "innovae-site-cache-v26";
const ASSETS = [
  "/",
  "/index.html",
  "/portfolio.html",
  "/portfolio-admin.html",
  "/instagram.html",
  "/cliente.html",
  "/manifest.webmanifest",
  "/assets/logo-innovae.png",
  "/assets/app-icon.svg",
  "/assets/analytics.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // HTML sempre tenta a rede primeiro: assim correções e novos cadastros não
  // ficam presos na versão antiga do aplicativo instalado no celular.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
