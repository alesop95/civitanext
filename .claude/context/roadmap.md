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
documento di handoff, completate nel codice il 2026-07-22: Web Push API standard + libreria
`web-push`, chiavi VAPID generate in locale (nessun account esterno, nessun servizio terzo come
OneSignal/Firebase). Verifica manuale nel browser in sospeso (scrittura chiavi in `.env`), non
legata al blocco deploy Cloudflare — indipendente dal resto del lavoro in coda.

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

Mentorship, competenze e reputazione/badge (gruppo "design") sono chiuse. Del gruppo
"infrastruttura", galleria foto è completa nel codice e nei test automatici (2026-07-21,
ADR-016): meccanismo di upload (proxato dal server, non URL presigned) e modello dati
(`PhotoAlbum`/`Photo` relazionale, contenitore admin-gated + foto self-service) confrontati
esplicitamente con l'utente prima di scrivere codice. Documenti, seconda voce del gruppo, è
completa nello stesso giorno: nessuna nuova decisione di infrastruttura (riusa il client R2 e il
meccanismo di upload proxato appena costruiti, generalizzato da `putPhotoObject` a `putObject`),
governance senza ambiguità (admin-curato, il prototipo non mostra self-service per i documenti a
differenza della galleria), nessuna nuova ADR. Webinar ed email digest, terza e quarta voce,
completi nel codice il 2026-07-21/22 (ADR-017): hosting video su YouTube (non in elenco pubblico,
non storage self-hosted né Vimeo né Cloudflare Stream), servizio email Resend, trigger settimanale
via GitHub Actions in attesa del Cron Trigger nativo di Cloudflare Workers (non disponibile prima
del deploy reale). Con queste, **tutte le nove voci di Fase 4 sono complete nel codice**.

Verifica manuale nel browser (galleria, documenti, webinar) e attivazione reale (email digest,
che richiede in più un URL pubblico raggiungibile) restano in sospeso: creazione bucket R2,
account YouTube, account Resend con dominio verificato, secret GitHub, e soprattutto il deploy
reale su Cloudflare (bloccato da ADR-006) di cui l'email digest ha bisogno per poter davvero
inviare qualcosa. Dettaglio completo in "Interventi manuali in sospeso", `current-work.md`.

Aggiornato il 2026-07-22: l'account Google dedicato all'associazione (non il personale dello
sviluppatore, per lo stesso principio di separazione identità personale/organizzazione già
adottato per git in `.claude/rules/git-identity-and-repo.md`) esiste ora. Resta da fare solo il
passo esterno, non di codice: creare un progetto OAuth su Google Cloud Console con quell'account,
configurare la schermata di consenso, generare le credenziali (Client ID/Secret) con redirect URI
`{origin}/api/auth/callback/google` (in locale `http://localhost:3000/api/auth/callback/google`,
verificare la porta reale), e scrivere `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` in `.env`. Il codice
del provider è già scritto (ADR-010) e non richiede altro lavoro. Aggiunto a "Interventi manuali
in sospeso" in `current-work.md`.

Hardening (Fase 5, scelta dell'utente tra le voci indipendenti dal deploy) completo nel codice su
tre dei quattro assi del `ROADMAP.md` di handoff il 2026-07-22 — rate limiting (Postgres, nessun
Redis/KV), validazione di lunghezza massima (prima assente su tutti gli 8 file con testo libero),
moderazione admin su forum e competenze (prima assente): nessuno di questi ha richiesto un
confronto con l'utente, sono rafforzamenti diretti. Quarto asse, GDPR (cancellazione account),
chiuso il 2026-07-23 (ADR-018) dopo confronto con l'utente: anonimizzazione (non cascata, i
contenuti pubblicati restano) mediata dall'admin (nessuna esecuzione automatica), con pulizia
profonda delle credenziali/dati di dispositivo (token OAuth, sottoscrizioni push, verification
token residui) per evitare data leakage. Resta solo backup, dipendente dalle garanzie del piano
gratuito Neon (da verificare, non un compito di codice).

## Idee e ipotesi da verificare

Aggiornato il 2026-07-21 (ADR-016): due bucket R2 separati per dev/produzione decisi
(`civitanext-media-dev`/`civitanext-media-prod`), bucket ancora da creare davvero sulla dashboard
Cloudflare. Resta da verificare quando ci sarà traffico reale: se la crescita della galleria
fotografica richiede rivedere la stima di capacità fatta in ADR-004 (10 GB gratuiti). Aggiornato
il 2026-07-20: il bug di bundling OpenNext (ADR-006) non era specifico di
Windows, si riproduce identico su Linux in CI; il blocco residuo del deploy su Cloudflare è il
query compiler WASM di Prisma 7 su Workers, con fix di configurazione identificato da fonte
(`runtime = "cloudflare"` nel generator) e alla decisione dell'utente (vedi `current-work.md`,
`deployment.md` e la coda di ADR-006). Da verificare in Fase 1: se il piano gratuito
di Neon regge la stima aggiornata di 10.000 utenti massimi (rivista rispetto alle "centinaia"
assunte in ADR-004/005), non ancora confrontata con i limiti effettivi del piano gratuito.
