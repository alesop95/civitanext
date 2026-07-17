# Refactor 10 — Mappa della città: Leaflet senza account esterno, e il confine client/server di Next.js

Riferimento: voce 10 di `studio-didattico-master.md`. Decisione tracciata in ADR-013.

## Il confronto che ha deciso la libreria

Tre librerie considerate, tutte capaci di disegnare una mappa con pin: Google Maps, Mapbox GL JS,
Leaflet (con tile OpenStreetMap). Il criterio che ha deciso non è la potenza della libreria, che
per il bisogno reale (una manciata di pin su Civitanova Marche) è sostanzialmente equivalente tra
le tre, ma cosa ciascuna richiede oltre al codice:

```
Google Maps   -> account Google + chiave API fatturabile
Mapbox GL JS  -> account Mapbox + token, licenza proprietaria dalla v2
Leaflet + OSM -> nessun account, nessuna chiave, tile pubblici gratuiti
```

Leaflet è l'unica che non aggiunge una dipendenza da un servizio esterno da configurare, la stessa
frizione che nello stesso blocco di lavoro si è scelto di rimandare per il login Google. Il
compromesso accettato: il tile server pubblico di OpenStreetMap chiede di non essere usato per
traffico di produzione pesante senza attribuzione o caching proprio. Per la scala di un sito
associativo è un rischio accettabile, e se mai smettesse di esserlo il cambio è isolato a una
riga (l'URL del `TileLayer`), non una riscrittura della libreria.

## Il problema tecnico: Leaflet e il rendering lato server

Leaflet costruisce la mappa leggendo `window` e manipolando il DOM direttamente, non tramite React:
non può girare durante il rendering lato server di un Server Component, l'impostazione di default
di ogni pagina in App Router. Il sintomo, se si prova a importarlo senza precauzioni in una pagina
server, è un errore a runtime sul server (`window is not defined`), non un problema visibile solo
nel browser.

La soluzione richiede due file distinti, non uno:

```tsx
// src/components/CivicMap.tsx — il componente vero, client
"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
export function CivicMap({ points }: { points: CivicMapPoint[] }) {
  return <MapContainer center={CIVITANOVA_CENTER} zoom={14} /* ... */ />;
}
```

```tsx
// src/components/CivicMapLoader.tsx — il caricatore, anch'esso client
"use client";
import dynamic from "next/dynamic";
const CivicMap = dynamic(() => import("./CivicMap").then((m) => m.CivicMap), {
  ssr: false,
});
export function CivicMapLoader({ points }: { points: CivicMapPoint[] }) {
  return <CivicMap points={points} />;
}
```

Il motivo per cui servono due componenti e non uno solo con `"use client"` in testa: `"use client"`
marca dove finisce il confine server/client, ma il componente viene comunque renderizzato lato
server per produrre l'HTML iniziale (il meccanismo che permette l'idratazione). `ssr: false` su
`next/dynamic` è l'unico modo per dire "questo componente non va mai eseguito lato server, nemmeno
per l'HTML iniziale" — e App Router lo consente solo dentro un Client Component, non dentro un
Server Component. La pagina `/mappa` (`src/app/mappa/page.tsx`) resta un Server Component perché
deve leggere `MapPoint` dal database con Prisma; non può chiamare `next/dynamic` con `ssr: false`
direttamente, quindi chiama `CivicMapLoader` (client, incaricato solo di fare il caricamento
dinamico) che a sua volta carica `CivicMap` (client, il componente vero). Il principio si applica
a qualunque libreria futura che tocchi `window`/`document` fuori da React (un editor WYSIWYG, un
lettore video con controlli custom, una libreria di grafici canvas-based): componente vero client
+ caricatore client con `dynamic(..., { ssr: false })`, mai un solo componente con `"use client"`
sperando che basti.

## Le icone rotte, un bug noto non specifico di Next.js

Leaflet calcola gli URL delle sue icone di default (il segnaposto blu classico) con un percorso
relativo che nessun bundler moderno risolve correttamente — capita identico con webpack, Vite,
Turbopack. Il fix standard, applicato una sola volta all'avvio del modulo:

```tsx
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  iconUrl: "/leaflet/marker-icon.png",
  shadowUrl: "/leaflet/marker-shadow.png",
});
```

Le tre immagini sono copiate da `node_modules/leaflet/dist/images/` a `public/leaflet/` invece di
puntare a un CDN esterno (la soluzione più comune trovata online): coerente con l'impostazione
offline-first già presa per la PWA (ADR-012, refactor-09), un CDN irraggiungibile lascerebbe la
mappa senza icone anche quando il resto della pagina funziona offline.

## Il modello dati: un punto autonomo, non agganciato a Event/Proposal

`MapPoint` (`title`, `type`, `place`, `lat`, `lng`) non ha relazione con `Event` o `Proposal`.
Motivo pratico, non solo di principio: né l'uno né l'altro modello ha oggi una form di creazione
amministrativa da cui aggiungere delle coordinate (`Event` è popolato solo dal seed, `Proposal`
nasce da un utente). Agganciare la mappa a quei modelli avrebbe richiesto costruire anche quelle
form, un allargamento di scope che la feature mappa da sola non giustificava. Un admin popola
`MapPoint` a mano, stesso pattern CRUD già visto per sondaggi e spazi civici.

## Come estendere il pattern

Ogni volta che una libreria nuova promette una capacità che il browser da solo non offre (mappe,
grafici interattivi, editor visuali), vale la pena separare la domanda "quale libreria" dalla
domanda "cosa serve oltre al codice per farla funzionare" (account, chiave, fatturazione,
attribuzione): la libreria più nota non è automaticamente quella con il costo totale più basso per
il bisogno reale. E ogni volta che quella libreria richiede il browser per costruirsi (legge
`window`, manipola il DOM fuori da React), il confine client/server di Next.js va rispettato con il
pattern a due componenti (vero + caricatore con `dynamic(..., { ssr: false })`), non aggirato
sperando che un solo `"use client"` basti.
