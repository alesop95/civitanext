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

Fase 0 (fondamenta) sostanzialmente chiusa: allineamento `.claude`, scelta stack gratuito,
bootstrap Next.js+TypeScript, design system, schema dati iniziale, migrazione applicata (ADR-009).
Fase 1 del `ROADMAP.md` di handoff aperta: auth reale (NextAuth), iscrizione socio, profilo con
tessera digitale, eventi (lettura + RSVP), forum. Autenticazione e ruoli decisi e implementati
(tre livelli `SUPERADMIN`/`ADMIN`/`UTENTE`, tesseramento come dato indipendente dal ruolo,
sessione JWT con ricontrollo periodico, credenziali più Google OAuth: ADR-010). Eventi (lettura +
RSVP), la prima feature verticale completa, costruita e verificata nel browser il 2026-07-15:
elenco eventi da database, iscrizione/disiscrizione con vincolo di unicità a livello di database
(stesso principio di `Vote`), header di navigazione condiviso tra le pagine. Profilo con tessera
digitale costruito e verificato lo stesso giorno: dati account, tessera digitale se l'utente è
tesserato, messaggio altrimenti (l'assegnazione di una tessera resta un'azione amministrativa non
ancora costruita). Prossimo passo di Fase 1: forum. Priorità dopo: Fase 2 (proposte e votazioni,
coda di approvazione admin, quiz), la feature di valore più alto perché collega utenti e admin.

Rimandata esplicitamente, non bloccante per testare il resto: la configurazione dell'app OAuth
Google (creazione su Google Cloud Console, `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`). Il codice del
provider Google è già scritto e non richiede altro lavoro quando si riprende questo punto; manca
solo la configurazione esterna, rimandata di proposito a quando esisterà un account Google
dedicato all'associazione (non il personale dello sviluppatore, per lo stesso principio di
separazione identità personale/organizzazione già adottato per git in
`.claude/rules/git-identity-and-repo.md`). Fino ad allora il flusso di test usa solo email e
password.

## Idee e ipotesi da verificare

Da verificare quando si arriverà a Fase 4: se due bucket R2 separati per dev/produzione bastano
o se la crescita reale della galleria fotografica richiede rivedere la stima di capacità fatta
in ADR-004. Da verificare prima del primo deploy reale: se il bug di bundling OpenNext su
Windows (ADR-006) si manifesta anche sull'infrastruttura di build di Cloudflare stessa o è
limitato all'anteprima locale — non ancora testato. Da verificare in Fase 1: se il piano gratuito
di Neon regge la stima aggiornata di 10.000 utenti massimi (rivista rispetto alle "centinaia"
assunte in ADR-004/005), non ancora confrontata con i limiti effettivi del piano gratuito.
