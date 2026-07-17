# Snapshot di sincronizzazione

> Da leggere per primo a inizio sessione. Fotografa lo stato del progetto al commit di
> riferimento e mappa ogni scheda al suo stato di verifica. È la fonte di verità su cosa è fatto,
> non le spunte del diario.

## Stato

```
Branch attivo:        main
Commit di riferimento: 147c741 (working tree con mappa, timeline e rassegna stampa non committate)
Data snapshot:        2026-07-17
```

## Stato di verifica delle schede

| Scheda | last-verified | Stato |
|---|---|---|
| STACK.md | 4da8cf9 | aggiornata |
| design-and-security.md | 4da8cf9 | aggiornata |
| deployment.md | 4da8cf9 | aggiornata |
| dev-testing.md | 4da8cf9 | aggiornata |
| current-work.md | 147c741 | aggiornata (mappa, timeline e rassegna stampa verificate, pronte al commit) |
| roadmap.md | 147c741 | aggiornata (direzione e priorità; il dettaglio in fasi resta `design_handoff_civitanext/ROADMAP.md`) |
| studio-didattico-master.md | 147c741 | 12 voci |

## Punto di ripresa

Fase 0 (fondamenta) chiusa nella sostanza: stack, bootstrap, design system, schema Prisma
iniziale, migrazione contro un Postgres reale (ADR-009). Restano aperte la sintesi stakeholder
generale (ora assorbita nel documento unico, vedi sotto) e la verifica del runtime Cloudflare
reale (ADR-006).

Fase 1 **chiusa nella sostanza** (2026-07-15): autenticazione e ruoli (ADR-010, tre livelli,
tesseramento indipendente dal ruolo, sessione JWT con ricontrollo periodico, Google rimandato
solo nella configurazione esterna); eventi (RSVP), profilo con tessera digitale, forum — tutte
verificate nel browser con contenuto reale. Due bug corretti in `/accedi` (redirect mancante,
`CredentialsSignin` non gestito), entrambi diagnosticati dal sorgente reale di `next-auth`.

Fase 2 **chiusa nella sostanza** (2026-07-16): proposte e votazioni con coda di approvazione
admin (prima guardia di autorizzazione per ruolo del progetto; bug di validazione silenziosa
corretto in `createProposal`/`createThread`); quiz (ADR-011, dominio dati nuovo — opzioni
relazionali, feedback per domanda, tentativi ripetibili, sblocco progressivo). Entrambe
verificate nel browser. Bug di cache CSS di Turbopack incontrato e risolto (eliminazione `.next`).

Fase 3 **chiusa nella sostanza** (2026-07-16): layout responsive unico (ADR-012, verificato su
telefono reale), PWA installabile (installabilità vera rimandata al deploy, richiede HTTPS),
notifiche in-app (ciclo completo verificato nel browser). Studio didattico a 9 voci.

Fase 4 aperta lo stesso giorno (2026-07-16) con tre feature verticali. Sondaggi rapidi in home
(riuso di `Vote`/`VoteTargetType.POLL` anticipato dalla Fase 0) e spazi civici (nuovo modello
`CivicSpace`, CRUD admin + elenco pubblico come Eventi, helper di superficie `OrariField` per
comporre l'orario in un menu a tendina restando testo libero) **chiuse nella sostanza**,
verificate nel browser dall'utente, nessuna nuova ADR per entrambe (commit `f578c0b`, `147c741`).
Mappa della città **chiusa e verificata nel browser** (2026-07-17): nuovo modello `MapPoint`
(autonomo, non agganciato a `Event`/`Proposal`), Leaflet + `react-leaflet` con tile
OpenStreetMap scelta dopo confronto esplicito con l'utente contro MapLibre GL e Mapbox GL JS
(ADR-013, voce didattica 10) — vinta perché unica senza account esterno da configurare. Dal
feedback di verifica, il form admin ha guadagnato il picker a clic e la geocodifica inversa
Nominatim con flag dirty e degrado controllato (voce didattica 12), anch'essi verificati.
Rimandato esplicitamente lo stesso giorno tutto ciò che richiede l'account Google
dell'associazione (non ancora creato); nel frattempo prosegue il resto dello sviluppo.
Il 2026-07-17, dopo un riavvio forzato del PC (server Prisma dev riavviato, build di controllo
pulita), aggiunte insieme la quarta e quinta feature verticale di Fase 4, timeline della città
(`TimelineEntry` + enum `TimelineKind`) e rassegna stampa (`PressArticle`): puro riuso del
pattern spazi civici, nessuna nuova ADR, scelte di modellazione opposte e deliberate tra i due
modelli documentate nella voce didattica 11 (`refactor-11-modellare-tempo-e-categorie.md`).
**Verificate nel browser** lo stesso giorno insieme alla mappa (percorso d'errore della
validazione url compreso), tutte e tre pronte al commit, non ancora committate al momento di
questo snapshot. Resto di Fase 4 non affrontato, tutto dietro un confronto da fare: decisione di
infrastruttura (galleria foto, documenti, webinar, email digest) o di design (mentorship,
competenze, reputazione/badge, quest'ultima per ultima perché calcola sulle altre feature).

Dettaglio completo di ogni bug/decisione in `memory/progress.md`, ADR in `memory/decisions.md`.
Sintesi stakeholder unificata in `_notes/stakeholder-brief.md` (documento vivo, aggiornato a ogni
blocco di lavoro), che sostituisce le note separate per fase (rimaste come solo dettaglio
storico, non più aggiornate).
