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

## Riconciliazione

Ultima verifica: 2026-07-13, al commit `4da8cf9`. Migrazione Prisma applicata al Postgres locale
dedicato di questo progetto (schema sincronizzato, cronologia tracciata in `prisma/migrations/`),
non ancora committata al momento di questa nota: vedi `memory/progress.md` e ADR-009 in
`memory/decisions.md` per il dettaglio dell'indagine e del workaround.
