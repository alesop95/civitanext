# Refactor 09 — Responsive unico e PWA: estensione incrementale, non ricostruzione

Riferimento: voce 9 di `studio-didattico-master.md`.

## Prima (il codice era già più responsive di quanto sembrasse)

```tsx
// src/app/eventi/page.tsx, già scritto in Fase 1
<section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
```

Una colonna su schermi stretti, due su schermi più larghi: responsive senza che nessuno l'avesse
dichiarato come strategia esplicita. Quello che mancava non era "rendere l'app responsive", ma
un pezzo preciso: l'header, con cinque-sei link di navigazione in fila, non regge su uno schermo
stretto.

## Dopo (la navigazione, non un'app parallela)

`src/components/MobileTabBar.tsx`, un componente nuovo ma piccolo:

```tsx
const TABS = [
  { href: "/", label: "Home" },
  { href: "/eventi", label: "Eventi" },
  { href: "/quiz", label: "Quiz" },
  { href: "/forum", label: "Forum" },
  { href: "/altro", label: "Altro" },
];

export function MobileTabBar({ activeHref }: { activeHref: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex gap-1 border-t-2 border-ink bg-paper-card px-2 py-2 sm:hidden">
      {/* ... */}
    </nav>
  );
}
```

`src/components/SiteHeader.tsx` nasconde il `<nav>` orizzontale sotto la soglia `sm` invece di
sostituirlo con qualcosa di diverso:

```tsx
<nav className="hidden gap-3 sm:flex">
```

Proposte, Profilo e Admin, che sul desktop hanno un chip proprio, confluiscono su mobile sotto
una singola voce "Altro" (`src/app/altro/page.tsx`): non tre tab in più, un'unica pagina di
raccolta. Lo spazio per la tab bar fissa si riserva una sola volta, nel layout radice, non in
ogni pagina:

```tsx
// src/app/layout.tsx
<body className="... pb-16 sm:pb-0">
```

## Dopo (installabilità, non un'app nativa)

`src/app/manifest.ts`, la convenzione ufficiale di Next.js (non un file statico scritto a mano):

```ts
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CivitaNext",
    display: "standalone",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    // ...
  };
}
```

Le icone sono lo stesso mark di `Logo.tsx`, rasterizzato con Inkscape (già installato sulla
macchina, nessuna dipendenza nuova nel progetto):

```
inkscape public/icon.svg --export-type=png -w 512 -h 512 --export-filename=public/icon-512x512.png
```

Il service worker (`public/sw.js`) è deliberatamente minimo:

```js
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
  }
});
```

Intercetta solo le richieste di navigazione (le pagine), e solo per mostrare una pagina di
cortesia offline (`public/offline.html`) se la rete manca — nessuna cache di dati, di API, di
pagine autenticate. Il motivo è specifico di questa app: `SiteHeader` chiama `auth()` a ogni
richiesta, quindi ogni pagina riflette lo stato di sessione del momento; metterla in cache
significherebbe rischiare di mostrare a un utente disconnesso la sessione di prima, o viceversa.

## Come estendere il pattern

Quando un nuovo requisito sembra chiedere una piattaforma parallela (una shell mobile, un'app
nativa, un sito separato per un pubblico diverso), la prima domanda utile è quanto del lavoro già
scritto lo soddisfa già, anche senza che fosse stato pianificato esplicitamente. Il costo di
un'estensione incrementale (una variante responsive di un componente esistente, due file per la
PWA sopra l'app web già scritta) è quasi sempre più basso del costo di una ricostruzione
parallela, soprattutto per un team piccolo che dovrà mantenere quel lavoro nel tempo. E quando si
introduce una funzionalità che promette qualcosa (offline, notifiche, sincronizzazione), è più
onesto limitarne lo scope a quello che si può davvero garantire subito, dichiarando il limite,
piuttosto che implementarla in modo ottimistico e scoprirne le crepe più avanti.
