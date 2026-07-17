# Refactor 12 — Il picker sulla mappa e la geocodifica inversa: campi client, input umano intoccabile, servizio esterno con degrado controllato

Riferimento: voce 12 di `studio-didattico-master.md`. Nessuna ADR dedicata: Nominatim non
introduce account né chiavi, quindi non cambia il perimetro infrastrutturale fissato da ADR-013.

## Da dove nasce: un feedback di verifica, non un piano

Il form `admin/mappa/nuovo` è nato con due campi numerici nudi per le coordinate e una nota che
spiegava come ricavarle da openstreetmap.org. Durante la verifica browser l'utente ha osservato
che per chi amministra è un passaggio ostile. Le alternative confrontate insieme prima di
scrivere codice: un selettore a clic sulla mappa (nessun servizio esterno, riusa l'infrastruttura
Leaflet appena costruita), la ricerca per indirizzo con il geocoder Nominatim (comoda ma
dipendente da un servizio di rete), o entrambe. Scelto il selettore; la geocodifica inversa è
arrivata al passo successivo, di nuovo su richiesta esplicita durante la verifica, quando l'uso
reale ha mostrato che il clic poteva compilare anche i campi testuali, non solo i numeri.

## Il vincolo di confine: un clic client non può scrivere in un campo server

La prima versione del picker possedeva solo i campi lat/lng, e i campi titolo, tipo e luogo
restavano nella pagina, un Server Component. Finché l'automatismo riguardava solo le coordinate
andava bene; per compilare il luogo dal clic, invece, il vincolo di App Router diventa visibile:
il markup di un Server Component è HTML già renderizzato, nessuno stato React lo collega al
picker, e l'unico modo pulito perché un evento client scriva in quei campi è che appartengano
allo stesso albero client.

La soluzione sposta tutti i campi dentro `MapPointPicker` (client), come input controllati.
La pagina server conserva ciò che deve restare server: la guardia di ruolo, l'elemento `form` e
la server action. Il contratto tra i due mondi è minimo ed esplicito: gli attributi `name` dei
campi, che `FormData` consegna alla action identici a prima. La action `createMapPoint` non è
cambiata di una riga.

```tsx
// src/app/admin/mappa/nuovo/page.tsx (Server Component, dopo)
<form action={createMapPoint} className="flex flex-col gap-4">
  <MapPointPicker />
  <Btn type="submit" kind="primary" className="self-start">Pubblica punto</Btn>
</form>
```

Il picker si aggancia al clic con un componente vuoto, perché `useMapEvents` di `react-leaflet`
funziona solo da figlio di `MapContainer`:

```tsx
// src/components/MapPointPicker.tsx
function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}
```

Le coordinate si arrotondano a cinque decimali, circa un metro: precisione sufficiente per un
pin cittadino e valori leggibili nei campi, invece della coda di tredici cifre che un clic
produrrebbe. Il marker è trascinabile e il `dragend` passa dallo stesso `pick` del clic, così
ogni via d'ingresso della posizione attraversa un solo punto del codice.

## L'automatismo non sovrascrive mai l'umano: il flag dirty

La geocodifica inversa compila luogo e titolo, ma un valore calcolato e un valore scritto a
mano non hanno lo stesso peso. Se l'amministratore ha già scritto "Sede dell'associazione" nel
titolo e poi aggiusta il marker di dieci metri, l'ultima cosa che deve accadere è che il titolo
torni "Stadio Comunale". Ogni campo compilabile dall'automatismo porta quindi un flag che
diventa vero al primo intervento manuale e da lì in poi lo esclude dalla compilazione.

```tsx
const titleDirty = useRef(false);
// ...nel then della geocodifica:
if (!placeDirty.current) {
  const nextPlace = placeFromAddress(data);
  if (nextPlace) setPlace(nextPlace);
}
if (!titleDirty.current && data.name) setTitle(data.name);
```

Il flag vive in un `useRef` e non in uno `useState` per una ragione precisa: non deve produrre
alcun render, è pura memoria di chi ha parlato per ultimo. Il titolo inoltre si compila solo
quando Nominatim restituisce un `name`, cioè quando il punto cliccato è un luogo con nome
proprio in OpenStreetMap (uno stadio, un palazzo storico); il campo tipo resta interamente
manuale, perché le categorie del geocoder sono etichette tecniche in inglese ("town_hall") che
tradotte automaticamente peggiorerebbero il dato invece di migliorarlo.

## Il servizio esterno con degrado controllato

Nominatim è il geocoder pubblico di OpenStreetMap: nessun account, nessuna chiave, la stessa
ragione per cui ADR-013 aveva scelto Leaflet. La sua policy d'uso chiede al massimo una
richiesta al secondo, un ritmo che un form amministrativo rispetta per costruzione, una
richiesta per clic. Resta però un servizio di rete, e un servizio di rete fallisce: la
richiesta parte con un `AbortController`, un nuovo clic annulla quella precedente ancora in
volo (vince sempre l'ultimo punto scelto, mai una risposta arrivata in ritardo su un punto
vecchio), e il fallimento non blocca niente, mostra una riga di avviso e lascia i campi
compilabili a mano, esattamente com'erano prima di questa feature.

```tsx
inFlight.current?.abort();
const controller = new AbortController();
inFlight.current = controller;

reverseGeocode(nextLat, nextLng, controller.signal)
  .then((data) => { /* compila i campi non dirty */ })
  .catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") return;
    setLookup("error");
  });
```

L'abort va riconosciuto e ignorato nel `catch`: non è un errore del servizio, è il programma
che ha cambiato idea, e mostrarlo come guasto confonderebbe. Verificato nel browser
dall'utente: clic sullo stadio con titolo e luogo compilati da Nominatim, tipo scritto a mano e
mai sovrascritto, punto pubblicato e visibile su `/mappa` con popup completo.

## Come estendere il pattern

La ricerca per indirizzo (l'alternativa rimandata) si innesta sopra questo stesso impianto
senza toccarne le regole: un campo di testo che interroga l'endpoint `/search` di Nominatim,
centra la mappa sul risultato e chiama lo stesso `pick`, così coordinate, geocodifica inversa
e flag dirty continuano a funzionare identici. Qualsiasi altro form che voglia compilazione
assistita dovrebbe ereditare le stesse tre regole: i campi appartengono al componente che li
compila, l'automatismo non tocca ciò che l'umano ha scritto, e il servizio esterno deve poter
sparire senza portarsi via il form.
