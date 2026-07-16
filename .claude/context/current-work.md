---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - src/**
  - .claude/**
last-verified-commit: 5986a01
stato: verificata
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

## Chiusa: Fase 4 — sondaggi rapidi in home

Prima feature verticale di Fase 4 (`ROADMAP.md`): un admin crea un sondaggio (domanda + 2-4
opzioni, `/admin/sondaggi/nuovo`); chiunque sia loggato vota dalla home, percentuali aggiornate;
un voto per sondaggio non per opzione (vincolo applicato a livello di codice, non di schema,
stesso compromesso già accettato per `Vote` in refactor-04), cliccare la stessa opzione la
ritira, un'altra la sposta. Riuso di `Vote`/`VoteTargetType.POLL`, anticipato dalla Fase 0 e mai
usato finora: solo due nuovi modelli (`Poll`, `PollOption`), nessuna modifica all'enum. Nessuna
nuova ADR. Verificato nel browser: creazione sondaggio, percentuali corrette dopo il voto,
ritiro voto (torna a 0%), vista da sloggato con barre in sola lettura e link "Accedi per votare".

## Chiusa: Fase 4 — spazi civici

Seconda feature verticale di Fase 4, scelta perché senza bisogno di nuova infrastruttura (puro
CRUD admin + elenco pubblico, stesso pattern di Eventi). Nuovo modello `CivicSpace` (`name`,
`type`, `hours`, `note`), nessuna relazione con altri modelli. `createCivicSpace` riservata ad
`ADMIN`/`SUPERADMIN` (`/admin/spazi-civici/nuovo`), elenco pubblico su `/spazi-civici`, link
raccolti in `/altro` invece che un chip proprio nell'header: con Fase 4 che aggiunge molte
sezioni di contenuto, un chip a testa affollerebbe la navigazione desktop, decisione presa senza
conferma preventiva perché reversibile e di basso impatto, segnalata all'utente.

Il campo `hours` resta testo libero nello schema (nessuna migrazione per la struttura): su
richiesta esplicita dell'utente, il form offre un aiuto solo di superficie, `OrariField`
(componente client), due menu a tendina (intervallo di giorni, ora di inizio/fine) che compongono
la stringa standard nel campo di testo con un pulsante "Componi", lasciandolo comunque modificabile
a mano per casi che i menu non esprimono (su prenotazione, chiusure stagionali). Confrontata
l'alternativa di un modello orari strutturato per giorno (JSON o tabella collegata): scartata per
ora perché nessuna feature attuale richiede l'interrogabilità che darebbe (es. "aperto adesso"),
a fronte di una rigidità che gli orari reali di spazi civici spesso non rispettano. Nessuna nuova
ADR: stesso genere di scelta minore già presa per i sondaggi.

Verificato nel browser: creazione di uno spazio civico compilando i campi a mano, uso dei menu a
tendina (Lun-Ven, 9, 18, "Componi") che scrive "Lun-Ven 9-18" nel campo restando modificabile,
comparsa nell'elenco pubblico con tipo/nome/orari/note corretti insieme allo spazio creato in
precedenza.

Bug non applicativo incontrato durante la build: il worker di generazione statica di Turbopack va
in `out of memory` in modo intermittente su questa macchina (due o tre tentativi su build
successive, non sempre alla stessa fase), risolto riprovando; non ancora una causa isolata, non
sembra legato al codice del progetto.

## Riconciliazione

Ultima verifica: 2026-07-16, al commit (da confermare al prossimo commit: spazi civici e helper
orari, non ancora committati al momento di questa nota). Vedi `memory/progress.md` per il
dettaglio completo di ogni feature e bug, e `memory/decisions.md` per le ADR.
