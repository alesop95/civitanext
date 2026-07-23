# 17. Il service worker che rompeva "Accedi con Google": dettaglio

> Deep-dive della voce 17 di `studio-didattico-master.md`. Entra nel codice reale di
> `public/sw.js`; il racconto del metodo di diagnosi è nella voce didattica, la procedura di
> configurazione Google completa è in `deployment.md`.

## Il sintomo e l'assenza che lo ha spiegato

Dopo aver dato il consenso su Google, il browser mostrava `public/offline.html` invece del sito.
Il log del server (`next dev`), letto riga per riga durante due tentativi identici (uno in una
finestra normale già loggata su Google, uno in incognito con login completo email+password+2FA),
non conteneva **nessuna** riga per `/api/auth/callback/google` — non un errore, un'assenza
completa:

```
POST /accedi 303        (redirect verso Google, fuori dal nostro log da qui in avanti)
GET /home 404           (rumore non collegato, vedi sotto)
...
```

Un'assenza totale in un log di richieste HTTP significa una cosa precisa: la richiesta non ha mai
raggiunto la rete. Se fosse arrivata al server e avesse fallito per un motivo applicativo, ci
sarebbe stata una riga con uno stato di errore. Se fosse stata bloccata dalla rete (firewall,
DNS), il browser stesso avrebbe mostrato un errore di connessione, non la nostra pagina offline
personalizzata — e infatti la pagina mostrata era esattamente `offline.html`, prodotta dal nostro
service worker, non un errore generico del browser. Questo restringe il sospetto a un solo posto:
codice che intercetta la richiesta *prima* che diventi una vera richiesta di rete.

## Il codice imputato

```js
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
  }
});
```

Questo codice, scritto in Fase 3 per un solo scopo (mostrare `offline.html` quando la rete manca
davvero durante una navigazione), non distingue *l'origine* della navigazione. Una navigazione
"normale" (l'utente digita un URL, clicca un link interno) e una navigazione che arriva come
ultimo passo di una catena di redirect iniziata su un altro dominio (Google, dopo il consenso)
sono entrambe `event.request.mode === "navigate"` — indistinguibili da questa sola condizione.
Richiamare `fetch()` sulla request originale di una navigazione redirected cross-origin è un
punto dove i browser applicano restrizioni di sicurezza sulle richieste reindirizzate da
un'origine esterna: la promise può rigettare per questo motivo, senza che il server di
destinazione (il nostro `next dev`, perfettamente in ascolto) sia mai stato contattato. Il
`.catch()` scritto per il caso "sei davvero offline" intercetta indistintamente anche questo
caso, mostrando `offline.html` come se la rete non ci fosse.

## Il fix e perché è minimo di proposito

```js
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.mode === "navigate" && !url.pathname.startsWith("/api/")) {
    event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
  }
});
```

Una sola condizione aggiunta: le rotte `/api/` (dove vive anche `/api/auth/callback/google`) non
passano più dall'intercettazione del service worker. Non è un caso speciale per l'autenticazione:
è la constatazione che *nessuna* rotta API di questo progetto ha senso dietro un fallback offline
HTML — un errore su una rotta API deve restituire un errore vero (che il chiamante, umano o
codice, possa interpretare), non una pagina pensata per un umano che guarda un browser. La
correzione quindi non aggiunge un'eccezione per Google: rimuove un'ipotesi implicita (tutte le
navigazioni sono pagine per umani) che non era mai stata vera per `/api/`, solo che nessuna
navigazione era mai arrivata da quel percorso prima d'ora.

## Il rumore che sembrava collegato e non lo era

Nello stesso log, tra un tentativo e l'altro, sono comparse righe come `GET /restaurant 404`,
`GET /band 404`, `GET /photographer 404` — rotte inesistenti in CivitaNext. La tentazione era di
cercare una causa comune con il problema del service worker. Non c'è: sono richieste a percorsi
che esistevano in un altro progetto locale dello stesso sviluppatore, eseguito in passato sulla
stessa porta 3000. Il browser non lega la cronologia/autocompletamento dell'indirizzo a *quale
progetto* rispondeva su `localhost:3000` in un dato momento, solo all'origine (host+porta) in sé:
richieste storiche verso quell'origine possono riemergere (autocompletamento, precaricamento
predittivo) indipendentemente da cosa sta effettivamente rispondendo oggi. Confermato dal fatto
che il problema del service worker si riproduceva identico anche in una finestra in incognito
(dove cronologia ed estensioni sono escluse), mentre il rumore delle rotte estranee era presente
solo nella finestra normale: due fenomeni, non uno.
