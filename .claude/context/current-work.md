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

## Chiusa: Fase 2 — Quiz

Dominio dati completamente nuovo (non un riuso, a differenza di eventi/forum/proposte). Quattro
decisioni sul modello confrontate con l'utente e registrate in ADR-011 prima di scrivere schema:
opzioni relazionali (non JSON), risposte salvate per singola domanda (feedback dopo l'invio, non
solo punteggio aggregato), tentativi ripetibili con punteggio migliore registrato, sblocco
progressivo calcolato in query. Pagine (elenco con stato sblocco, svolgimento, risultato con
feedback verde/rosso per domanda), server action `submitQuiz`, e seed del primo quiz reale
("Educazione civica: le basi", 4 domande da `civitanext-data.jsx`) tutti scritti e verificati nel
browser. Aggiunto un token colore `--success` al design system (mancava un colore semantico per
"risposta corretta"; "sbagliata" riusa `--accent`, già il colore degli avvisi d'errore altrove).
Bug trovato durante la verifica, non del codice applicativo ma del server di sviluppo: Turbopack
non invalidava la cache CSS dopo la modifica a `globals.css`, nemmeno riavviando il processo —
risolto solo eliminando `.next` (con conferma esplicita dell'utente, la regola del progetto vieta
`rm -rf` all'agente) e ricompilando da zero.

## Chiusa: Fase 3 — responsive unico, PWA e notifiche in-app

Layout responsive unico invece di shell mobile dedicata (ADR-012): tab bar mobile fissa
(`MobileTabBar`, Home/Eventi/Quiz/Forum/Altro) come variante dello stesso `SiteHeader`, non un
sistema a parte; nuova pagina `/altro` che raccoglie Proposte/Profilo/Admin su mobile. Verificato
su un telefono reale (Samsung S25 Ultra): nav orizzontale sparita, tab bar fissa corretta con lo
stato attivo evidenziato. App resa installabile (manifest, icone dal logo esistente con
Inkscape, service worker conservativo — solo fallback offline, nessuna cache di pagine
autenticate); l'installabilità vera (prompt del browser) richiede HTTPS, non verificabile in
locale, rimandata al primo deploy reale su Cloudflare. Notifiche in-app: modello `Notification`,
un utente notificato quando una sua proposta viene approvata per il voto o approvata
definitivamente (unico trigger cablato per ora), pagina `/notifiche` con "segna tutte come
lette", indicatore col conteggio non lette nell'header. Ciclo completo verificato nel browser:
proposta approvata dall'admin → badge "Notifiche (1)" per l'autore → messaggio corretto su
`/notifiche` → "segna tutte come lette" → badge sparito. Notifiche push, il passo successivo
dichiarato da `ROADMAP.md`, non affrontate: richiedono chiavi VAPID e la libreria `web-push`.

## Feature: Fase 4 — sondaggi rapidi in home

Cosa fa: prima feature verticale di Fase 4 secondo `design_handoff_civitanext/ROADMAP.md`
("Sondaggi rapidi in home"). Un admin crea un sondaggio (domanda + 2-4 opzioni); chiunque sia
loggato vota un'opzione dalla home, con percentuali aggiornate in tempo reale; un voto per
sondaggio (non per opzione), cliccare la stessa opzione lo ritira, un'altra lo sposta. Riuso di
`Vote`/`VoteTargetType.POLL`, anticipato fin dalla Fase 0 e mai usato finora: nessuna modifica
all'enum, solo due nuovi modelli (`Poll`, `PollOption`).

File da creare:

```
src/app/sondaggi/actions.ts             votePoll(pollId, optionId), fatto
src/app/admin/sondaggi/actions.ts       createPoll, guardia di ruolo, fatto
src/app/admin/sondaggi/nuovo/page.tsx   form di creazione sondaggio, fatto
```

File da modificare:

```
prisma/schema.prisma              modelli Poll, PollOption, fatto
src/app/page.tsx                  sezione "Sondaggi rapidi" con barre di percentuale, fatto
src/app/admin/proposte/page.tsx   link "Nuovo sondaggio", fatto
```

Definition of done:

- [x] Modelli `Poll`/`PollOption` scritti, validati e migrati (procedura ADR-009)
- [x] `votePoll` con vincolo "un voto per sondaggio" applicato a livello di codice, non di schema
      (`Vote` garantisce solo un voto per opzione, non per sondaggio: stesso limite già accettato
      per il pattern polimorfico, refactor-04)
- [x] Creazione sondaggio riservata ad `ADMIN`/`SUPERADMIN`
- [x] Sezione sondaggi in home, visibile solo se esiste almeno un sondaggio; risultati visibili
      anche a chi non è loggato, voto riservato a chi lo è
- [x] `npm run build` pulito (typecheck incluso)
- [ ] Verifica manuale nel browser (creare un sondaggio come admin, votare come utente normale,
      verificare il cambio/ritiro voto) — prossimo passo

Domande aperte: nessuna bloccante. Nessuna nuova ADR: la scelta di applicare il vincolo "un voto
per sondaggio" a livello di codice invece che di schema è una continuazione diretta del
compromesso già accettato e documentato per `Vote` in refactor-04, non un confronto nuovo.

## Riconciliazione

Ultima verifica: 2026-07-16, al commit `4da8cf9` (le modifiche di questa voce non ancora
committate al momento della nota). Vedi `memory/progress.md` per il dettaglio completo di ogni
feature e bug, e `memory/decisions.md` per le ADR.
