---
generated-from-commit: 7ba6100
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - webapp/wrangler.jsonc
  - webapp/open-next.config.ts
  - webapp/prisma.config.ts
last-verified-commit: 7ba6100
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
deploy reale o a un'esecuzione automatica su un runner Linux, non disponibile finché il
repository resta senza remote GitHub collegato (scelta esplicita dell'utente per ora).

## Comandi

Sviluppo: `npm run dev` (in `webapp/`). Build standard: `npm run build` / `npm run start`.
Build e pacchettizzazione per Cloudflare: `npm run preview` (build OpenNext + `wrangler dev`
locale, oggi non funzionante su questa macchina) e `npm run deploy` (build OpenNext +
`wrangler deploy`, mai eseguito). Migrazioni schema: `npx prisma migrate dev` dentro `webapp/`,
contro il `DATABASE_URL` attivo (locale in Fase 0, poi branch Neon di sviluppo, mai
direttamente in produzione).

## Variabili d'ambiente e segreti

`webapp/.env` (ignorato da git, mai letto dall'agente per regola di `settings.json`): contiene
almeno `DATABASE_URL`. `webapp/.dev.vars` (creato dall'adapter Cloudflare per le variabili lette
in emulazione locale Workers): `NEXTJS_ENV`. Variabili ancora da introdurre quando si apriranno
le fasi corrispondenti: `AUTH_SECRET` (NextAuth, un valore distinto per ambiente test/
produzione), credenziali R2 (Fase 4). Nessun valore reale va mai scritto in una scheda tracciata
o in un commit: solo i nomi delle variabili e dove sono gestite.
