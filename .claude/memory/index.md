# Snapshot di sincronizzazione

> Da leggere per primo a inizio sessione. Fotografa lo stato del progetto al commit di
> riferimento e mappa ogni scheda al suo stato di verifica. È la fonte di verità su cosa è fatto,
> non le spunte del diario.

## Stato

```
Branch attivo:        main
Commit di riferimento: 4da8cf9
Data snapshot:        2026-07-15
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
| studio-didattico-master.md | 4da8cf9 | 7 voci |

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

Fase 2 aperta: proposte e votazioni con coda di approvazione admin costruite e verificate lo
stesso giorno. Riuso di `Vote` (polimorfico, conteggio calcolato a mano, refactor-04) per il voto
sulle proposte; prima guardia di autorizzazione per ruolo (`ADMIN`/`SUPERADMIN`) su un percorso
di codice reale, non solo di autenticazione. Trovato e corretto un bug di validazione silenziosa
in `createProposal` (e per coerenza anche in `createThread` del forum): un campo vuoto arrivato
al server veniva scartato senza redirect né messaggio, scoperto verificando con una query
diretta al database che la proposta di test non era mai stata scritta. Creato un secondo utente
di prova con ruolo `ADMIN` (`admin@civitanext.test`) per testare la coda senza approvare le
proprie proposte. Verificato nel browser il ciclo completo: proposta creata → approvata per il
voto dall'admin → votata → voto ritirato, ogni passaggio con l'esito visivo corretto.
Prossimo passo di Fase 2: quiz, che richiede modelli di schema nuovi non ancora progettati.
