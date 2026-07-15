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
> leggibile senza ricostruire il contesto da capo. Le fasi chiuse e verificate restano solo come
> riepilogo compresso qui sotto: il dettaglio completo (file toccati, bug trovati, come sono
> stati diagnosticati) vive in `memory/progress.md`, che è append-only e non si riscrive mai.

## Chiuse: Fase 0 e Fase 1

Fase 0 (fondamenta): allineamento `.claude`, stack gratuito (ADR-004/005/006/007), bootstrap
Next.js+TypeScript, design system, schema Prisma iniziale, migrazione applicata (ADR-009).
Restano aperti solo la sintesi stakeholder generale di Fase 0 e la verifica del runtime
Cloudflare reale (bloccata su Windows, rimandata a deploy/CI, ADR-006).

Fase 1 (autenticazione e ruoli, ADR-010): tre livelli `SUPERADMIN`/`ADMIN`/`UTENTE`, tesseramento
indipendente dal ruolo, sessione JWT con ricontrollo periodico, credenziali più Google (Google
rimandato solo nella configurazione esterna, non bloccante). Tre feature verticali costruite e
verificate nel browser con contenuto reale: eventi (lettura + RSVP), profilo con tessera
digitale, forum (thread + risposte). Header di navigazione condiviso (`SiteHeader`). Bug trovati
e corretti durante le verifiche: redirect mancante e `CredentialsSignin` non gestito in
`/accedi`, entrambi diagnosticati leggendo il sorgente reale di `next-auth`.

## Feature: Fase 2 — proposte e votazioni, coda di approvazione admin

Cosa fa: prima feature verticale di Fase 2 secondo `roadmap.md` — proposte con ciclo di vita
(revisione → votazione → approvata), votazione con vincolo di unicità (riuso di `Vote`, stesso
principio di RSVP/forum), coda di approvazione riservata ad `ADMIN`/`SUPERADMIN`. Nessuna
modifica allo schema: `Proposal`/`Vote`/`ProposalStatus` esistevano già dalla Fase 0. Quiz,
menzionato nello stesso blocco di `roadmap.md`, resta fuori scope: richiede modelli nuovi non
ancora progettati.

File da creare:

```
src/app/proposte/actions.ts          createProposal, toggleVote (riuso Vote/VoteTargetType.PROPOSAL), fatto
src/app/proposte/page.tsx            elenco pubblico (solo VOTAZIONE/APPROVATA), voto, fatto
src/app/proposte/nuova/page.tsx      form di creazione proposta, fatto
src/app/admin/proposte/actions.ts    approveForVoting/closeVoting/rejectProposal, guardia di ruolo, fatto
src/app/admin/proposte/page.tsx      coda di approvazione (in revisione / in votazione), fatto
```

File da modificare:

```
src/components/SiteHeader.tsx   nav "Proposte"; chip "Admin" visibile solo ad ADMIN/SUPERADMIN, fatto
src/app/forum/actions.ts        bugfix: stesso silenzio di validazione di createProposal, corretto per coerenza, fatto
src/app/forum/nuovo/page.tsx    mostra il messaggio d'errore corrispondente, fatto
```

Definition of done:

- [x] Server action pubbliche (`createProposal`, `toggleVote`) e admin (`approveForVoting`,
      `closeVoting`, `rejectProposal`, quest'ultima come cancellazione: nessuno stato "respinta"
      nello schema, scelta pragmatica senza storico dei rifiuti)
- [x] Pagina `/proposte`: solo proposte non più in revisione, conteggio voti calcolato a mano
      (Vote è polimorfico, nessuna relazione diretta, refactor-04)
- [x] Pagina `/admin/proposte`: guardia di ruolo (`ADMIN`/`SUPERADMIN`, altrimenti redirect),
      sezioni "in revisione" e "in votazione" separate
- [x] `npm run build` pulito (typecheck incluso)
- [x] Bugfix di validazione silenziosa: `createProposal`/`createThread` restituivano senza
      scrivere né avvisare se un campo arrivava vuoto al server, scoperto quando una proposta di
      prova non compariva nella coda admin (verificato con query diretta al database: zero righe
      `Proposal`); corretto con redirect a un messaggio d'errore visibile, applicato anche al
      forum per coerenza dello stesso pattern
- [x] Creato un utente di prova con ruolo `ADMIN` (`admin@civitanext.test`), distinto dall'utente
      normale, per testare la coda senza approvare le proprie proposte
- [x] Verifica manuale nel browser, 2026-07-15, ciclo completo: creata una proposta come utente
      normale (in revisione, non visibile pubblicamente) → approvata per il voto come admin
      (sparisce dalla coda "in revisione", compare in "in votazione" e nell'elenco pubblico) →
      votata come utente normale (0→1 voto, pulsante "Vota"→"Ritira il voto") → voto ritirato
      (1→0, pulsante torna a "Vota")

Domande aperte: nessuna bloccante. La promozione da `VOTAZIONE` ad `APPROVATA` resta una
decisione manuale dell'admin (nessuna soglia automatica di voti): coerente con l'idea che
l'approvazione finale rispecchia una decisione reale dell'associazione, non ancora messa in
discussione dall'utente.

## Riconciliazione

Ultima verifica: 2026-07-15, al commit `4da8cf9` (le modifiche di questa voce non ancora
committate al momento della nota). Vedi `memory/progress.md` per il dettaglio completo di ogni
feature e bug, e `memory/decisions.md` per le ADR.
