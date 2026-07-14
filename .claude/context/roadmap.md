---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths: []
last-verified-commit: 4da8cf9
---

# Roadmap

> Direzione e priorità del progetto. Tracciata. Non è il work-log: qui sta dove si va, non cosa è
> già stato fatto. La sequenza dettagliata in sei fasi (con dipendenze, stime e note pratiche) è
> già scritta in `design_handoff_civitanext/ROADMAP.md`, materiale di handoff del design: questa
> scheda non la duplica, la riprende a livello di direzione e priorità corrente.

## Direzione

Trasformare il prototipo di design hi-fi in `design_handoff_civitanext/` in una piattaforma
reale di partecipazione civica per l'associazione di Civitanova Marche, una feature verticale
alla volta (dati → API → UI), mantenendo l'intera infrastruttura gratuita.

## Priorità

Fase 0 (fondamenta) in chiusura: allineamento `.claude`, scelta stack gratuito, bootstrap
Next.js+TypeScript, design system, schema dati iniziale. Prossima priorità, quando si aprirà un
nuovo blocco di lavoro: Fase 1 del `ROADMAP.md` di handoff — auth reale (NextAuth), iscrizione
socio, profilo con tessera digitale, eventi (lettura + RSVP) come prima feature verticale
completa, forum come seconda. Priorità dopo: Fase 2 (proposte e votazioni, coda di approvazione
admin, quiz), la feature di valore più alto perché collega utenti e admin.

## Idee e ipotesi da verificare

Da verificare quando si arriverà a Fase 4: se due bucket R2 separati per dev/produzione bastano
o se la crescita reale della galleria fotografica richiede rivedere la stima di capacità fatta
in ADR-004. Da verificare prima del primo deploy reale: se il bug di bundling OpenNext su
Windows (ADR-006) si manifesta anche sull'infrastruttura di build di Cloudflare stessa o è
limitato all'anteprima locale — non ancora testato.
