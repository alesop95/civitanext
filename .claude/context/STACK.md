---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - src/**
  - prisma/**
  - package.json
last-verified-commit: 4da8cf9
---

# Stack applicativo

> Documento di recupero più importante: tracciato, perché un collega che clona deve vederlo.
> Riflette lo stato del working tree di Fase 0, non ancora committato al momento della scrittura:
> `last-verified-commit` va bump con `sync-context` subito dopo il primo commit reale di questo
> blocco di lavoro.

## Stack e runtime

Applicazione alla radice del repository (Next.js 16.2.10, App Router, React 19.2.4, TypeScript 5 in modalità
`strict`), scaffoldata con `create-next-app` e Tailwind CSS 4 (configurazione CSS-first via
`@theme`, nessun `tailwind.config.ts`: la sintassi con file di configurazione JS/TS è stata
superata dalla v4). Node.js 22 come runtime di sviluppo locale, npm come gestore pacchetti.

Persistenza: Postgres tramite Prisma 7.8 con generator `prisma-client` (client TypeScript-first,
output in `src/generated/prisma`, non il vecchio `prisma-client-js`), connesso via
`@prisma/adapter-pg` invece del client Node standard. Provider di hosting Postgres: Neon
(vedi `deployment.md`). Autenticazione: NextAuth (Auth.js) self-hosted, hashing password con
`bcryptjs`. Storage file: Cloudflare R2 (non ancora integrato in Fase 0, previsto da Fase 4).
Deploy target: Cloudflare Pages/Workers tramite l'adapter `@opennextjs/cloudflare` (non il
deprecato `@cloudflare/next-on-pages`), con il compatibility flag `nodejs_compat` obbligatorio
in `wrangler.jsonc`.

Il materiale in `design_handoff_civitanext/` (React 18 + Babel via CDN, senza bundler) resta
riferimento di design di sola lettura: non è lo stack applicativo, è il prototipo da cui i token
e i componenti sono stati ricostruiti nel codice reale, alla radice del repository (non in una
sottocartella `webapp/`: vedi la nota sulla riorganizzazione in `memory/progress.md`).

## Alternative deliberatamente escluse

La scelta completa di hosting/DB/auth/storage, con le alternative confrontate e scartate
(Vercel Hobby + Supabase; Vercel Hobby + Neon + Clerk + Cloudflare R2) e la relativa
motivazione, è registrata per intero in ADR-004, ADR-005 e ADR-006 di `memory/decisions.md`:
questa scheda non la ripete, rimanda al registro delle decisioni per non doverla mantenere
allineata in due posti.

TypeScript è stato scelto al posto di JavaScript puro (il prototipo lo è) per la verifica
statica su un dominio con più ruoli e stati distinti (ADR-002). Il generator Prisma
`prisma-client` (nuovo, TypeScript-first) è stato preferito al più noto `prisma-client-js`
perché è quello scaffoldato di default da Prisma 7.8, non una scelta indipendente.

## Flussi di codice e ruolo architetturale dei file

`src/app/layout.tsx` carica i tre font del design system (Source Serif 4, Archivo,
Caveat) via `next/font/google` e applica i token come variabili CSS sull'elemento `html`.
`src/app/globals.css` definisce i design token (colori, raggio angoli, ombra dura) in
`:root` e li espone come utility Tailwind tramite `@theme inline`. `src/components/ui/`
contiene il vocabolario visivo riusabile (`Starburst`, `Waves`, `Logo`, `Btn`, `Chip`, `Tag`,
`Avatar`), tutti Server Component per default (nessuna direttiva `"use client"`): sono
puramente presentazionali, quindi non spediscono JavaScript al browser. `prisma/schema.prisma`
definisce il modello dati di Fase 0. `src/app/api/diag-fase0/route.ts` è una route
diagnostica temporanea (non applicativa) per validare Prisma+bcryptjs sul runtime Cloudflare
Workers al primo deploy reale, vedi ADR-006.

## Riferimenti a snippet

`src/components/ui/Starburst.tsx:Starburst` — generazione procedurale del path SVG,
senza `useMemo` (a differenza del prototipo): essendo un Server Component, il calcolo gira una
sola volta lato server, non ad ogni render client. `prisma/schema.prisma:User` — modello
utente con ruolo `Role` (`SOCIO`/`ADMIN`). `prisma/schema.prisma:Vote` — vincolo di voto
unico per utente, generico su più tipi di bersaglio (`VoteTargetType`), anticipato in Fase 0
come pura definizione di schema. `next.config.ts` — `serverExternalPackages` per tenere
Prisma fuori dal bundle Next, richiesto dall'adapter Cloudflare.
