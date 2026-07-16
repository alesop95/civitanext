# Snapshot di sincronizzazione

> Da leggere per primo a inizio sessione. Fotografa lo stato del progetto al commit di
> riferimento e mappa ogni scheda al suo stato di verifica. È la fonte di verità su cosa è fatto,
> non le spunte del diario.

## Stato

```
Branch attivo:        main
Commit di riferimento: 5986a01
Data snapshot:        2026-07-16
```

## Stato di verifica delle schede

| Scheda | last-verified | Stato |
|---|---|---|
| STACK.md | 4da8cf9 | aggiornata |
| design-and-security.md | 4da8cf9 | aggiornata |
| deployment.md | 4da8cf9 | aggiornata |
| dev-testing.md | 4da8cf9 | aggiornata |
| current-work.md | 5986a01 | aggiornata |
| roadmap.md | 5986a01 | aggiornata (direzione e priorità; il dettaglio in fasi resta `design_handoff_civitanext/ROADMAP.md`) |
| studio-didattico-master.md | 4da8cf9 | 9 voci |

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

Fase 4 aperta lo stesso giorno (2026-07-16) con due feature verticali **chiuse nella sostanza**:
sondaggi rapidi in home (riuso di `Vote`/`VoteTargetType.POLL` anticipato dalla Fase 0) e spazi
civici (nuovo modello `CivicSpace`, CRUD admin + elenco pubblico come Eventi, helper di
superficie `OrariField` per comporre l'orario in un menu a tendina restando testo libero).
Nessuna nuova ADR per entrambe. Entrambe verificate nel browser dall'utente. Rimandato
esplicitamente lo stesso giorno tutto ciò che richiede l'account Google dell'associazione (non
ancora creato); nel frattempo prosegue il resto dello sviluppo. Resto di Fase 4 (mappa, galleria
foto, documenti, timeline, community, reputazione, email digest) non affrontato: alcune voci
richiederanno una decisione di infrastruttura da confrontare (mappa, upload, servizio email),
altre sono probabile riuso di pattern già costruiti (come spazi civici).

Dettaglio completo di ogni bug/decisione in `memory/progress.md`, ADR in `memory/decisions.md`.
Sintesi stakeholder unificata in `_notes/stakeholder-brief.md` (documento vivo, aggiornato a ogni
blocco di lavoro), che sostituisce le note separate per fase (rimaste come solo dettaglio
storico, non più aggiornate).
