# Snapshot di sincronizzazione

> Da leggere per primo a inizio sessione. Fotografa lo stato del progetto al commit di
> riferimento e mappa ogni scheda al suo stato di verifica. È la fonte di verità su cosa è fatto,
> non le spunte del diario.

## Stato

```
Branch attivo:        main
Commit di riferimento: 4da8cf9
Data snapshot:        2026-07-16
```

## Stato di verifica delle schede

| Scheda | last-verified | Stato |
|---|---|---|
| STACK.md | 4da8cf9 | aggiornata |
| design-and-security.md | 4da8cf9 | aggiornata |
| deployment.md | 4da8cf9 | aggiornata |
| dev-testing.md | 4da8cf9 | aggiornata |
| current-work.md | 4da8cf9 | aggiornata |
| roadmap.md | 4da8cf9 | aggiornata (direzione e priorità; il dettaglio in fasi resta `design_handoff_civitanext/ROADMAP.md`) |
| studio-didattico-master.md | 4da8cf9 | 9 voci |

## Punto di ripresa

Fase 0 (fondamenta) chiusa nella sostanza: allineamento `.claude`, stack, bootstrap, design
system, schema dati, migrazione Prisma contro un Postgres reale (server locale dedicato
`npx prisma dev -n civitanext`, porte 51218/51219, workaround `migrate diff` + `migrate deploy`
per un bug noto upstream, ADR-009). Restano aperte solo la sintesi non tecnica generale di Fase 0
per lo stakeholder e la verifica del runtime Cloudflare reale (ADR-006, invariato).

Fase 1 **chiusa nella sostanza** il 2026-07-15. Autenticazione e ruoli (ADR-010): tre livelli
`SUPERADMIN`/`ADMIN`/`UTENTE`, tesseramento indipendente dal ruolo, sessione JWT con ricontrollo
periodico, credenziali più Google (Google rimandato solo nella configurazione esterna, non
bloccante, vedi `roadmap.md`). Tre feature verticali costruite e verificate nel browser con
contenuto reale: eventi (lettura + RSVP, seminati i quattro eventi reali del prototipo, vincolo
di unicità a database come `Vote`), profilo con tessera digitale (l'assegnazione di una tessera
resta amministrativa, non ancora costruita), forum (thread, risposte, creazione — nessun seed,
verificato creando contenuto reale perché i thread hanno un autore reale). Header di navigazione
condiviso (`SiteHeader`) tra tutte le pagine. Due bug distinti trovati durante le verifiche e
corretti in `/accedi` (redirect mancante dopo login; `CredentialsSignin` non gestito), entrambi
diagnosticati leggendo il sorgente reale di `next-auth`, non per tentativi — dettaglio completo
in `memory/progress.md`. Studio didattico a 7 voci, l'ultima sul metodo di parallelizzazione a
due agenti usato per la feature Eventi. Sintesi stakeholder di Fase 1 in
`_notes/stakeholder-brief-fase-1-autenticazione.md`.

Fase 2 **chiusa nella sostanza** il 2026-07-16. Proposte e votazioni: ciclo di vita revisione →
votazione → approvata, riuso di `Vote` (polimorfico, refactor-04), prima guardia di
autorizzazione per ruolo (`ADMIN`/`SUPERADMIN`) del progetto. Bug di validazione silenziosa
trovato e corretto in `createProposal`/`createThread` (un campo vuoto veniva scartato senza
messaggio, scoperto con query diretta al database). Quiz: dominio dati completamente nuovo,
quattro decisioni confrontate con l'utente prima di scrivere schema (ADR-011) — opzioni
relazionali, risposte salvate per singola domanda, tentativi ripetibili con punteggio migliore,
sblocco progressivo. Pagine, server action e seed del primo quiz reale scritti e verificati.
Durante la verifica trovato un bug non applicativo ma del server di sviluppo: Turbopack non
invalidava la cache CSS dopo una modifica a `globals.css` nemmeno riavviando il processo,
risolto solo eliminando `.next` ed eseguendo una build pulita. Entrambe le feature verificate nel
browser con due utenti di prova distinti (uno normale, uno `ADMIN`). Studio didattico a 8 voci.
Sintesi stakeholder in `_notes/stakeholder-brief-fase-2-quiz.md` e
`_notes/stakeholder-brief-fase-1-autenticazione.md`. Dettaglio completo di ogni bug e decisione
in `memory/progress.md`; nessuna terza feature dichiarata per Fase 2 in questo blocco.

Fase 3 aperta lo stesso giorno: layout responsive unico invece di shell mobile dedicata (ADR-012,
confrontato con l'utente prima di scrivere codice), tab bar mobile fissa (`MobileTabBar`) come
variante dello stesso `SiteHeader`, non un sistema a parte; nuova pagina `/altro` che raccoglie
Proposte/Profilo/Admin su mobile. App resa installabile come PWA: manifest (convenzione ufficiale
Next.js), icone generate dal logo esistente con Inkscape (nessuna dipendenza nuova), service
worker deliberatamente conservativo (solo fallback offline per la navigazione, nessuna cache di
pagine che dipendono dalla sessione utente). Studio didattico a 9 voci, l'ultima sul principio di
estendere incrementalmente il lavoro esistente invece di ricostruirlo per un nuovo requisito
(mobile, installabilità). Sintesi stakeholder in `_notes/stakeholder-brief-fase-3-mobile-pwa.md`. Verificato su un telefono
reale (Samsung S25 Ultra): nav orizzontale nascosta, tab bar fissa corretta con stato attivo
evidenziato. Installabilità PWA vera non verificabile in questa sessione (test avvenuto su IP di
rete locale in HTTP semplice, il prompt del browser richiede HTTPS): rimandata al primo deploy
reale su Cloudflare, non presentata come già confermata. Notifiche (in-app poi push) restano
fuori scope, sequenziate dopo nel documento di handoff — prossimo passo di Fase 3.
