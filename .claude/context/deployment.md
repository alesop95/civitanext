---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - wrangler.jsonc
  - open-next.config.ts
  - prisma.config.ts
last-verified-commit: 4da8cf9
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

L'anteprima locale del runtime Cloudflare reale (`wrangler dev`/`preview`) non è disponibile su
questa macchina (Windows nativo, non WSL2): un bug di bundling di OpenNext, non legato al
codice applicativo, restituisce 500 su ogni rotta (vedi `memory/progress.md`, voce del
2026-07-10, e ADR-006). Lo sviluppo quotidiano usa `next dev`/`next build` (Node standard, nessun
problema riscontrato); la verifica del comportamento specifico su Cloudflare si sposta al primo
deploy reale o a un'esecuzione automatica su un runner Linux (il remote GitHub `alesop95/civitanext`
è collegato e già ricevuto un push, quindi una pipeline CI è predisponibile quando serve, non
ancora fatto in Fase 0).

## Comandi

Sviluppo: `npm run dev` dalla radice del repository. Build standard: `npm run build` /
`npm run start`. Build e pacchettizzazione per Cloudflare: `npm run preview` (build OpenNext +
`wrangler dev` locale, oggi non funzionante su questa macchina) e `npm run deploy` (build
OpenNext + `wrangler deploy`, mai eseguito).

Migrazioni schema: **non** `npx prisma migrate dev` su questa macchina. Un bug noto e non
confermato dal team Prisma (`prisma/prisma#29366`) fa fallire `migrate dev` con `P1017` contro lo
shadow database del server locale `npx prisma dev` (vedi ADR-009 e
`refactor-05-migrazione-shadow-database.md`). Procedura effettiva a ogni cambio di schema:

```
npx prisma migrate diff --from-empty --to-schema=prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_<nome>/migration.sql
npx prisma migrate deploy
```

(`migrate diff` genera l'SQL confrontando lo schema con la cronologia esistente senza toccare lo
shadow database; per una modifica incrementale il `--from-empty` va sostituito con
`--from-schema-datamodel`/`--from-migrations` puntato alla cronologia già applicata, non ancora
verificato in questo progetto perché finora esiste una sola migrazione, `init`). `migrate deploy`
applica e registra in `_prisma_migrations`, verificabile con `prisma migrate status`. Contro il
`DATABASE_URL` attivo (locale in Fase 0, poi branch Neon di sviluppo, mai direttamente in
produzione) — da riverificare se `migrate dev` torna utilizzabile contro un Postgres reale in
rete (Neon), vedi Conseguenze di ADR-009.

## Variabili d'ambiente e segreti

`.env` (ignorato da git, mai letto dall'agente per regola di `settings.json`): contiene
almeno `DATABASE_URL`. `.dev.vars` (creato dall'adapter Cloudflare per le variabili lette
in emulazione locale Workers): `NEXTJS_ENV`. Variabili ancora da introdurre quando si apriranno
le fasi corrispondenti: `AUTH_SECRET` (NextAuth, un valore distinto per ambiente test/
produzione), credenziali R2 (Fase 4). Nessun valore reale va mai scritto in una scheda tracciata
o in un commit: solo i nomi delle variabili e dove sono gestite.
