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
Fase 1 del `ROADMAP.md` di handoff **chiusa nella sostanza** il 2026-07-15: auth reale
(NextAuth, tre livelli `SUPERADMIN`/`ADMIN`/`UTENTE`, tesseramento indipendente dal ruolo,
sessione JWT con ricontrollo periodico, credenziali più Google OAuth: ADR-010); eventi (lettura +
RSVP, vincolo di unicità a livello di database come `Vote`); profilo con tessera digitale
(l'assegnazione di una tessera resta un'azione amministrativa non ancora costruita); forum
(thread, risposte, creazione), nessuna modifica di schema necessaria perché `Thread`/`Reply`
esistevano già dalla Fase 0. Tutte e tre le feature verticali verificate nel browser con
contenuto reale, non solo con build pulita.

Fase 2 aperta: proposte e votazioni con coda di approvazione admin costruite e verificate lo
stesso giorno (2026-07-15) — ciclo di vita revisione → votazione → approvata, votazione con
vincolo di unicità (riuso di `Vote`), coda riservata ad `ADMIN`/`SUPERADMIN`. Prima volta in
questo progetto con un controllo di autorizzazione per ruolo su un percorso di codice reale, non
solo di autenticazione. Prossimo passo di Fase 2: quiz — richiede modelli di schema nuovi, non
ancora progettati, a differenza di proposte/forum/eventi che riusavano schema già presente dalla
Fase 0.

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
