# Snapshot di sincronizzazione

> Da leggere per primo a inizio sessione. Fotografa lo stato del progetto al commit di
> riferimento e mappa ogni scheda al suo stato di verifica. È la fonte di verità su cosa è fatto,
> non le spunte del diario.

## Stato

```
Branch attivo:        main
Commit di riferimento: 4da8cf9
Data snapshot:        2026-07-13
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
| studio-didattico-master.md | 4da8cf9 | 6 voci |

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
Schema aggiornato e migrato con la stessa procedura di ADR-009. Non ancora scritti: la
configurazione NextAuth (`auth.ts`, route handler), la dipendenza `@auth/prisma-adapter`, le
pagine di accesso/registrazione — prossimo passo implementativo. Sintesi stakeholder di questa
sola decisione già scritta in `_notes/stakeholder-brief-fase-1-autenticazione.md`.
