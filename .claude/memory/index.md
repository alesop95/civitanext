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
Fase 1 aperta: prima decisione presa e applicata il 2026-07-14, il modello di autenticazione e
ruoli. Corretta un'assunzione iniziale (popolazione di soli soci, stima "centinaia") con lo
scenario reale (tre livelli `SUPERADMIN`/`ADMIN`/`UTENTE`, tesseramento indipendente dal ruolo
tramite `tesseraNumero` nullable, scala massima 10.000 utenti): sessione JWT con scadenza breve
e ricontrollo del ruolo al rinnovo, provider credenziali più Google, adapter Prisma senza modello
Session (verificato sul sorgente che non serve con strategia JWT), registrato come ADR-010.
Schema aggiornato e migrato con la stessa procedura di ADR-009. Implementazione completata lo
stesso giorno: `@auth/prisma-adapter` installato, `src/auth.ts` scritto (Credentials + Google,
adapter, sessione JWT, callback `jwt`/`session`), route handler, route di registrazione
credenziali, pagine `/accedi` e `/registrati`. `npm run build` pulito (typecheck incluso) dopo
aver corretto un errore non anticipato: l'augmentation di tipo per `Session`/`User`/`JWT` va
dichiarata sui moduli che definiscono quelle interfacce (`@auth/core/types`, `@auth/core/jwt`),
non su `next-auth`/`next-auth/jwt` che le ri-esportano soltanto.
Flusso a credenziali verificato nel browser lo stesso giorno tramite `/registrati` (login
automatico con `redirectTo` esplicito): utente creato nel database con `role: UTENTE`/
`tesseraNumero: null` corretti, password hashata bcrypt, sessione confermata via
`/api/auth/session` con scadenza a un'ora coerente col `maxAge` di ADR-010. Flusso Google
rimandato di proposito a quando esisterà un account Google dedicato all'associazione (non
bloccante, vedi `roadmap.md`); codice già scritto e completo. Sintesi stakeholder di questa
decisione in `_notes/stakeholder-brief-fase-1-autenticazione.md`.

Prima feature verticale completa di Fase 1, Eventi (lettura + RSVP), costruita il 2026-07-15 con
due agenti in parallelo su file disgiunti (header di navigazione condiviso `SiteHeader` da un
lato, pagina `/eventi` + server action `toggleRsvp` dall'altro), integrati con un'unica build di
verifica. Modello `Rsvp` con vincolo di unicità a livello di database (`@@unique([userId,
eventId])`, stesso principio di `Vote`), migrato con la procedura di ADR-009, seminato con i
quattro eventi reali del prototipo di design. Durante la verifica trovato e corretto un bug
distinto in `/accedi` (mai esercitato end-to-end prima d'ora): `signIn("credentials", formData)`
senza un campo `redirectTo` nel form ricade sull'header `Referer` come destinazione invece che
sulla home, dando l'impressione di un login bloccato anche quando riesce — diagnosticato leggendo
il sorgente reale di `next-auth`, non ipotizzato. Verificato nel browser dopo la correzione: login
riuscito, RSVP funzionante con aggiornamento immediato del conteggio partecipanti.
