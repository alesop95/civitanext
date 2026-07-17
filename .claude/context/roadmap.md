---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths: []
last-verified-commit: 147c741
---

# Roadmap

> Direzione e priorità del progetto. Tracciata. Non è il work-log: qui sta dove si va, non cosa è
> già stato fatto. La sequenza dettagliata in sei fasi (con dipendenze, stime e note pratiche) è
> già scritta in `design_handoff_civitanext/ROADMAP.md`, materiale di handoff del design: questa
> scheda non la duplica, la riprende a livello di direzione e priorità corrente.

## Direzione

Trasformare il prototipo di design hi-fi in `design_handoff_civitanext/` in una piattaforma
reale di partecipazione civica per l'associazione di Civitanova Marche, una feature verticale
alla volta (dati → API → UI), mantenendo l'intera infrastruttura gratuita.

## Priorità

Fase 0 (fondamenta) sostanzialmente chiusa: allineamento `.claude`, scelta stack gratuito,
bootstrap Next.js+TypeScript, design system, schema dati iniziale, migrazione applicata (ADR-009).
Fase 1 del `ROADMAP.md` di handoff **chiusa nella sostanza** il 2026-07-15: auth reale
(NextAuth, tre livelli `SUPERADMIN`/`ADMIN`/`UTENTE`, tesseramento indipendente dal ruolo,
sessione JWT con ricontrollo periodico, credenziali più Google OAuth: ADR-010); eventi (lettura +
RSVP, vincolo di unicità a livello di database come `Vote`); profilo con tessera digitale
(l'assegnazione di una tessera resta un'azione amministrativa non ancora costruita); forum
(thread, risposte, creazione), nessuna modifica di schema necessaria perché `Thread`/`Reply`
esistevano già dalla Fase 0. Tutte e tre le feature verticali verificate nel browser con
contenuto reale, non solo con build pulita.

Fase 2 **chiusa nella sostanza** il 2026-07-16 — proposte e votazioni con coda di approvazione
admin (ciclo di vita revisione → votazione → approvata, vincolo di unicità riuso di `Vote`, prima
guardia di autorizzazione per ruolo del progetto); quiz (ADR-011, dominio dati completamente
nuovo a differenza di proposte/forum/eventi: opzioni relazionali, feedback per domanda, tentativi
ripetibili con punteggio migliore, sblocco progressivo). Entrambe verificate nel browser con
contenuto reale. Nessuna terza feature verticale dichiarata per Fase 2 in questo blocco di lavoro.

Fase 3 **chiusa nella sostanza** il 2026-07-16 — layout responsive unico invece di shell mobile
dedicata (ADR-012, verificato su telefono reale), app installabile come PWA (l'installabilità
vera del prompt richiede HTTPS, da verificare al primo deploy reale), notifiche in-app (un
utente notificato quando una sua proposta viene approvata per il voto o definitivamente,
verificato nel browser con un ciclo completo). Notifiche push, il passo successivo dichiarato nel
documento di handoff, richiedono chiavi VAPID e la libreria `web-push`, non ancora introdotte.

Fase 4 aperta e primo passo chiuso il 2026-07-16 con sondaggi rapidi in home: un admin crea un
sondaggio, chiunque sia loggato vota (un voto per sondaggio, riuso di
`Vote`/`VoteTargetType.POLL` anticipato dalla Fase 0), risultati visibili anche a chi non è
loggato. Prima scelta tra gli elementi di Fase 4 perché l'unica senza bisogno di nuova
infrastruttura (niente storage, mappe, servizio email), coerente con la nota di `ROADMAP.md` che
per questa fase "tutte riusano i pattern già costruiti". Verificato nel browser dall'utente:
creazione sondaggio, percentuali corrette dopo il voto, ritiro voto, vista da sloggato coerente.

Seconda feature verticale, spazi civici, chiusa lo stesso giorno: nuovo modello `CivicSpace`
(nessuna relazione con altri modelli), CRUD admin + elenco pubblico su `/spazi-civici`, stesso
pattern di Eventi. Su richiesta dell'utente, il campo orari resta testo libero nello schema ma il
form offre un aiuto di superficie (`OrariField`, componente client) che compone la stringa
standard con due menu a tendina, restando comunque modificabile a mano; alternativa di un orario
strutturato per giorno confrontata e scartata per ora (rigidità non giustificata da alcuna
feature attuale). Verificato nel browser.

Rimando esplicito di oggi, non legato a Fase 4 in sé: tutto ciò che richiede l'account Google
dell'associazione (sync Google Calendar reale, configurazione OAuth) resta in pausa; nel
frattempo si procede con il resto dello sviluppo.

Terza feature verticale, mappa della città (ADR-013), chiusa e verificata nel browser il
2026-07-17: nuovo modello `MapPoint` (autonomo, non agganciato a `Event`/`Proposal`), Leaflet +
`react-leaflet` con tile OpenStreetMap scelta dopo un confronto esplicito con l'utente contro
MapLibre GL e Mapbox GL JS (vinta perché unica senza account esterno da configurare, stesso
principio applicato al rinvio dell'account Google). Dal feedback di verifica dell'utente, il
form admin ha guadagnato il picker a clic sulla mappa e la geocodifica inversa Nominatim
(anch'essa senza account né chiave), entrambe verificate (voce didattica 12).

Quarta e quinta feature verticale, timeline della città e rassegna stampa, costruite insieme e
verificate nel browser il 2026-07-17: scelte perché uniche voci rimaste senza account Google, senza
decisione di infrastruttura e senza design non ovvio, puro riuso del pattern spazi civici. Due
modelli autonomi (`TimelineEntry` con enum `TimelineKind`, `PressArticle`), scelte di
modellazione documentate nella voce didattica 11, nessuna nuova ADR. La raccolta del materiale
storico per la timeline (biblioteca comunale, archivi) resta il compito non tecnico a tempi
lunghi segnalato dal `ROADMAP.md` di handoff: la piattaforma ora è pronta a riceverlo.

Resto di Fase 4 non ancora affrontato, in due gruppi che richiedono un confronto prima di
scrivere codice: galleria foto, documenti, webinar ed email digest hanno bisogno di una decisione
di infrastruttura (upload su storage già scelto in ADR-004/005, servizio email, hosting video);
mentorship, competenze e reputazione/badge hanno bisogno di una decisione di design (matching,
sistema punti — e reputazione va per ultima perché calcola sui dati delle altre feature).

Rimandata esplicitamente, non bloccante per testare il resto: la configurazione dell'app OAuth
Google (creazione su Google Cloud Console, `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`). Il codice del
provider Google è già scritto e non richiede altro lavoro quando si riprende questo punto; manca
solo la configurazione esterna, rimandata di proposito a quando esisterà un account Google
dedicato all'associazione (non il personale dello sviluppatore, per lo stesso principio di
separazione identità personale/organizzazione già adottato per git in
`.claude/rules/git-identity-and-repo.md`). Fino ad allora il flusso di test usa solo email e
password.

## Idee e ipotesi da verificare

Da verificare quando si arriverà a Fase 4: se due bucket R2 separati per dev/produzione bastano
o se la crescita reale della galleria fotografica richiede rivedere la stima di capacità fatta
in ADR-004. Da verificare prima del primo deploy reale: se il bug di bundling OpenNext su
Windows (ADR-006) si manifesta anche sull'infrastruttura di build di Cloudflare stessa o è
limitato all'anteprima locale — non ancora testato. Da verificare in Fase 1: se il piano gratuito
di Neon regge la stima aggiornata di 10.000 utenti massimi (rivista rispetto alle "centinaia"
assunte in ADR-004/005), non ancora confrontata con i limiti effettivi del piano gratuito.
