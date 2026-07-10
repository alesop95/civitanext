---
generated-from-commit: 7ba6100
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - webapp/**
  - .claude/**
last-verified-commit: 7ba6100
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
webapp/                                    scaffold Next.js 16 + TypeScript, fatto
webapp/src/components/ui/*.tsx             design system (Starburst, Waves, Logo, Btn, Chip, Tag, Avatar), fatto
webapp/prisma/schema.prisma                User, Event, Thread, Reply, Proposal, Vote, fatto
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
- [ ] Migrazione Prisma eseguita contro un Postgres reale (in attesa che l'utente imposti
      `DATABASE_URL` locale in `webapp/.env`, vedi Domande aperte)
- [ ] Sintesi non tecnica per lo stakeholder (Step 2bis del piano)
- [ ] Verifica del runtime Cloudflare reale (bloccata su questa macchina Windows, rimandata a
      deploy/CI, vedi ADR-006)

Domande aperte:

In attesa dell'utente: valore di `DATABASE_URL` in `webapp/.env` puntato al Postgres locale di
`npx prisma dev` (connection string già fornita in chat, non scritta qui perché questa scheda è
tracciata). Da decidere più avanti, non bloccante per Fase 0: accesso a un ulteriore progetto
personale ai fini del solo confronto didattico privato in `_notes/` (dettagli non tracciati qui
di proposito).

## Riconciliazione

Ultima verifica: 2026-07-10, working tree non ancora committato (ultimo commit reale: 7ba6100).
