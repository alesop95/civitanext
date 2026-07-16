const CACHE_NAME = "civitanext-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([OFFLINE_URL, "/icon-192x192.png", "/icon-512x512.png"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

// Solo le richieste di navigazione (le pagine) hanno un fallback offline. Tutto il resto (dati,
// autenticazione, azioni server) passa sempre dalla rete, mai dalla cache: ogni pagina di questa
// app legge la sessione utente a ogni richiesta (SiteHeader chiama auth()), quindi servire HTML
// dalla cache mostrerebbe uno stato di accesso non più valido invece di un contenuto offline
// onesto. Nessuna cache aggressiva dei contenuti letti in questa prima versione: da rivedere
// solo per pagine che non dipendono dalla sessione, se servirà davvero.
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
  }
});
