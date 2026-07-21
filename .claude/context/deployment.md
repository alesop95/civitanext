---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - wrangler.jsonc
  - open-next.config.ts
  - prisma.config.ts
last-verified-commit: 6495c68
---

# Deployment

> Popolare leggendo la configurazione reale di infrastruttura e CI. Commit, push e deploy restano
> operazioni manuali dell'utente. Nessun deploy reale eseguito ancora in Fase 0: questa scheda
> descrive la configurazione predisposta, non un ambiente gia' attivo.

## Livelli

Due livelli previsti, nessuno ancora attivato: sviluppo locale (`next dev` su questa macchina,
Postgres locale via `npx prisma dev` durante la Fase 0, prima che esista un progetto Neon reale)
e produzione (Cloudflare Pages/Workers + branch Neon `production`). Un terzo livello di test
è previsto ma non ancora istanziato: un branch Neon `development` per copy-on-write dallo stesso
progetto, con i deployment di anteprima automatici di Cloudflare Pages per ogni branch di
codice non-`main` puntati a quel branch dati invece che a produzione (ADR-007). Nessun dominio
custom scelto in questa fase.

L'anteprima locale del runtime Cloudflare reale (`wrangler dev`/`preview`) restituisce 500 su
ogni rotta su questa macchina (Windows nativo, non WSL2). L'ipotesi originale di ADR-006, un
problema esclusivamente di Windows, è stata smentita: il job CI dedicato
`test-cloudflare-adapter` (build `opennextjs-cloudflare`, smoke e2e contro il preview workerd su
runner Linux) riproduce lo stesso attrito. Durante la sua messa a punto sono stati trovati e
corretti tre problemi reali indipendenti dal sistema operativo (`postinstall: prisma generate`
mancante, `AUTH_SECRET` mancante per NextAuth in produzione, `pg-cloudflare` non esterno nel
bundle di `next.config.ts`). Corretti quelli, resta un blocco più a monte, isolato collegandosi
al debugger del Worker in locale: `CompileError: WebAssembly.Module(): Wasm code generation
disallowed by embedder`, dentro il query compiler WASM di Prisma 7.8, con riscontro diretto
nell'issue upstream `prisma/prisma#28657` (aperta). Il job resta rosso di proposito, senza
`continue-on-error` che lo mascheri. Decisione presa il 2026-07-20: il fix è dichiarare
`runtime = "cloudflare"` nel blocco generator (resta su Prisma 7.8, lega il query compiler
staticamente al deploy), ma la sua applicazione è rimandata al primo deploy reale su Cloudflare,
perché il blocco tocca solo questo job e non lo sviluppo; il downgrade a Prisma 6.19.0 è scartato
in quanto superato dal fix di configurazione. Lo sviluppo quotidiano usa `next dev`/`next build`
(Node standard, nessun problema riscontrato).

## Comandi

Sviluppo: `npm run dev` dalla radice del repository. Build standard: `npm run build` /
`npm run start`. Build e pacchettizzazione per Cloudflare: `npm run preview` (build OpenNext +
`wrangler dev` locale, oggi non funzionante su questa macchina) e `npm run deploy` (build
OpenNext + `wrangler deploy`, mai eseguito).

Migrazioni schema: **non** `npx prisma migrate dev` su questa macchina. Un bug noto e non
confermato dal team Prisma (`prisma/prisma#29366`) fa fallire `migrate dev` con `P1017` contro lo
shadow database del server locale `npx prisma dev` (vedi ADR-009 e
`refactor-05-migrazione-shadow-database.md`). Procedura effettiva a ogni cambio di schema:

Prima migrazione (schema vuoto → schema):

```
npx prisma migrate diff --from-empty --to-schema=prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_<nome>/migration.sql
npx prisma migrate deploy
```

Migrazione incrementale successiva (verificato in ADR-010, non più solo ipotizzato): il lato
`--from-empty` si sostituisce con `--from-config-datasource`, che introspeziona direttamente il
`DATABASE_URL` attivo invece di rigiocare la cronologia (`--from-migrations` richiederebbe uno
shadow database per il replay, lo stesso punto che fallisce in ADR-009):

```
npx prisma migrate diff --from-config-datasource --to-schema=prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_<nome>/migration.sql
npx prisma migrate deploy
```

In entrambi i casi `migrate deploy` applica e registra in `_prisma_migrations`, verificabile con
`prisma migrate status`. Contro il `DATABASE_URL` attivo (locale in Fase 0/1, poi branch Neon di
sviluppo, mai direttamente in produzione) — da riverificare se `migrate dev` torna utilizzabile
contro un Postgres reale in rete (Neon), vedi Conseguenze di ADR-009.

## Variabili d'ambiente e segreti

`.env` (ignorato da git, mai letto dall'agente per regola di `settings.json`): contiene
`DATABASE_URL` e `SHADOW_DATABASE_URL` (server locale dedicato `npx prisma dev -n civitanext`,
ADR-009), più, da Fase 1 (ADR-010): `AUTH_SECRET` (obbligatoria in produzione, NextAuth la
richiede e lancia un errore se assente; un valore distinto per ambiente test/produzione),
`AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET` (nomi inferiti automaticamente da NextAuth v5 per il
provider Google, formato `AUTH_{PROVIDER}_{ID|SECRET}`, nessuna configurazione esplicita nel
codice). `.dev.vars` (creato dall'adapter Cloudflare per le variabili lette in emulazione locale
Workers): `NEXTJS_ENV`. Da Fase 4, galleria foto (ADR-016): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY` (credenziali del token API R2, permesso limitato al bucket, mai
admin-wide), `R2_BUCKET_NAME` (un solo nome per ambiente attivo: `civitanext-media-dev` in
sviluppo/test, `civitanext-media-prod` in produzione, selezionati dal valore di questa stessa
variabile per ambiente, non da due nomi di variabile diversi nel codice — chiude la domanda
aperta di ADR-007 sui due bucket dev/produzione), `R2_PUBLIC_BASE_URL` (dominio pubblico di
lettura del bucket, usato solo per comporre l'URL delle immagini, mai per firmare richieste).
Nessun valore reale va mai scritto in una scheda tracciata o in un commit: solo i nomi delle
variabili e dove sono gestite.
