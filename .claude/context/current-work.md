---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - src/**
  - .claude/**
last-verified-commit: 4da8cf9
stato: in verifica
---

# Lavoro in corso

> La fonte di verità su cosa è fatto resta `memory/index.md` e il work-log, non le spunte di
> questo file. Ogni feature si descrive con lo schema fisso sotto, così il lavoro pendente è
> leggibile senza ricostruire il contesto da capo.

## Feature: Fase 0 — fondamenta tecniche

Cosa fa: prepara il terreno per lo sviluppo reale (nessuna feature utente): allineamento del
sistema di progetto, scelta e validazione dello stack gratuito, bootstrap applicativo, design
system, schema dati iniziale.

File da creare:

```
(radice del repository)                    scaffold Next.js 16 + TypeScript, fatto
src/components/ui/*.tsx                    design system (Starburst, Waves, Logo, Btn, Chip, Tag, Avatar), fatto
prisma/schema.prisma                       User, Event, Thread, Reply, Proposal, Vote, fatto
```

File da modificare:

```
CLAUDE.md            corretta la dichiarazione stack non reale ("Vite"), fatto
.claude/context/*.md  popolate con contenuto reale, questa voce
```

Definition of done:

- [x] `.claude` allineato al template (memoria ancorata, regole risincronizzate)
- [x] Stack gratuito scelto e motivato (ADR-004/005/006/007)
- [x] Bootstrap Next.js+TypeScript verificato (`npm run build`/`start` puliti)
- [x] Design system visibile su homepage (`npm run build` + verifica HTML)
- [x] Schema Prisma scritto e validato (`prisma validate`)
- [x] Migrazione Prisma eseguita contro un Postgres reale (server locale dedicato
      `npx prisma dev -n civitanext`, porte 51218/51219; `migrate dev` non utilizzabile per un
      bug noto upstream, workaround `migrate diff` + `migrate deploy` adottato e verificato,
      vedi ADR-009 e `refactor-05-migrazione-shadow-database.md`)
- [ ] Sintesi non tecnica per lo stakeholder (Step 2bis del piano)
- [ ] Verifica del runtime Cloudflare reale (bloccata su questa macchina Windows, rimandata a
      deploy/CI, vedi ADR-006)

Domande aperte:

Da decidere più avanti, non bloccante per Fase 0: accesso a un ulteriore progetto personale ai
fini del solo confronto didattico privato in `_notes/` (dettagli non tracciati qui di proposito).
Da verificare quando esisterà un branch Neon di sviluppo (ADR-007): se il bug upstream di
`migrate dev` contro lo shadow database (ADR-009) si manifesta anche contro un Postgres reale in
rete o è specifico del server locale `prisma dev` di questa macchina.

## Feature: Fase 1 — autenticazione reale e ruoli

Cosa fa: introduce l'autenticazione reale (NextAuth) con tre livelli di autorizzazione
(`SUPERADMIN`, `ADMIN`, `UTENTE`) e il tesseramento come dato indipendente dal ruolo, prima
decisione della prima feature verticale di Fase 1 secondo `roadmap.md`.

File da creare:

```
src/lib/prisma.ts                    client Prisma per-richiesta (cache()), fatto
src/types/next-auth.d.ts             augmentation di User/Session/JWT con role/tesseraNumero, fatto
src/auth.ts                          configurazione NextAuth (Credentials+Google, adapter, jwt/session), fatto
src/app/api/auth/[...nextauth]/route.ts   route handler NextAuth, fatto
src/app/api/register/route.ts        registrazione credenziali (il provider Credentials autentica soltanto), fatto
src/app/accedi/page.tsx              pagina di accesso (credenziali + Google), fatto
src/app/registrati/page.tsx          pagina di registrazione, fatto
```

File da modificare:

```
prisma/schema.prisma   Role (SUPERADMIN/ADMIN/UTENTE), passwordHash nullable, emailVerified/image, modelli Account e VerificationToken, fatto
package.json           dipendenza @auth/prisma-adapter, fatto
```

Definition of done:

- [x] Modello ruoli/tesseramento deciso e applicato allo schema (ADR-010)
- [x] Strategia di sessione decisa (JWT con scadenza breve + ricontrollo ruolo al rinnovo, ADR-010)
- [x] Provider di autenticazione decisi (credenziali + Google, ADR-010)
- [x] Migrazione applicata al Postgres locale (procedura ADR-009)
- [x] Dipendenza `@auth/prisma-adapter` installata
- [x] Configurazione NextAuth scritta (`auth.ts`, route handler, callback `jwt`/`session`),
      `npm run build` pulito con typecheck incluso
- [x] Pagine di accesso/registrazione (credenziali + pulsante Google)
- [x] Verifica manuale nel browser del flusso a credenziali (registrazione, accesso), 2026-07-14:
      utente creato nel database con `role: UTENTE`, `tesseraNumero: null`, password hashata
      bcrypt (mai in chiaro); sessione confermata via `/api/auth/session`, scadenza a un'ora
      dalla verifica, coerente con `maxAge` di ADR-010
- [ ] Verifica manuale del flusso Google — rimandata di proposito a quando esisterà un account
      Google dedicato all'associazione, non bloccante per il resto (vedi `roadmap.md`); codice
      già scritto e completo, non richiede altro lavoro quando si riprende
- [ ] Sintesi stakeholder di Fase 1 da aggiornare con l'esito della verifica (bozza della sola
      decisione già in `_notes/stakeholder-brief-fase-1-autenticazione.md`)

Domande aperte: nessuna bloccante per il flusso a credenziali. `AUTH_GOOGLE_ID`/
`AUTH_GOOGLE_SECRET` rimandati di proposito, non bloccanti (vedi `roadmap.md`).

## Riconciliazione

Ultima verifica: 2026-07-14, al commit `4da8cf9` (le modifiche di questa voce non ancora
committate al momento della nota). Migrazione Prisma applicata al Postgres locale dedicato di
questo progetto (schema sincronizzato, cronologia tracciata in `prisma/migrations/`): vedi
`memory/progress.md` e ADR-009/ADR-010 in `memory/decisions.md` per il dettaglio delle due
indagini/decisioni.
