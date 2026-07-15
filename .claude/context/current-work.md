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

## Chiusa: Fase 2 — proposte e votazioni, coda di approvazione admin

Ciclo di vita revisione → votazione → approvata, votazione con vincolo di unicità (riuso di
`Vote`, stesso principio di RSVP/forum), coda di approvazione riservata ad `ADMIN`/`SUPERADMIN`
(prima guardia di autorizzazione per ruolo del progetto, non solo di autenticazione). Nessuna
modifica di schema: `Proposal`/`Vote`/`ProposalStatus` esistevano già dalla Fase 0. Bug trovato e
corretto durante la verifica: `createProposal`/`createThread` restituivano senza scrivere né
avvisare se un campo arrivava vuoto al server (scoperto con query diretta al database, non
un'ipotesi). Ciclo completo verificato nel browser con due utenti di prova distinti (uno
normale, uno `ADMIN`): proposta creata → approvata per il voto → votata → voto ritirato.

## Feature: Fase 2 — Quiz (modello dati)

Cosa fa: seconda feature verticale di Fase 2 secondo `roadmap.md`. A differenza di eventi, forum
e proposte, il Quiz è un dominio dati completamente nuovo, non un riuso di schema esistente.
Quattro decisioni sul modello dati confrontate con l'utente e registrate in ADR-011 prima di
scrivere qualunque pagina: opzioni di risposta relazionali (non JSON, coerente con la convenzione
già stabilita in questo schema), risposte salvate per singola domanda (non solo un punteggio
aggregato, per poter dare un feedback domanda per domanda), tentativi ripetibili con il punteggio
migliore registrato (non un tentativo permanente), sblocco progressivo tra quiz calcolato in
query (non un flag salvato che potrebbe disallinearsi).

File da modificare:

```
prisma/schema.prisma   5 nuovi modelli: Quiz, QuizQuestion, QuizOption, QuizAttempt, QuizAnswer, fatto
```

Definition of done:

- [x] Schema scritto, validato e migrato (procedura ADR-009)
- [ ] Pagine (elenco quiz con stato sblocco, svolgimento, risultato con feedback per domanda)
- [ ] Server action (submit tentativo, calcolo punteggio, aggiornamento solo se migliore)
- [ ] Seed di almeno un quiz reale (il prototipo ha domande di educazione civica pronte da
      riprendere, `CN_QUIZ_QUESTIONS` in `civitanext-data.jsx`)
- [ ] Verifica manuale nel browser

Domande aperte: nessuna bloccante. Le pagine e le server action sono il prossimo passo
implementativo, non ancora scritte.

## Riconciliazione

Ultima verifica: 2026-07-15, al commit `4da8cf9` (le modifiche di questa voce non ancora
committate al momento della nota). Vedi `memory/progress.md` per il dettaglio completo di ogni
feature e bug, e `memory/decisions.md` per le ADR.
