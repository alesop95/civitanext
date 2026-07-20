---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - src/**
  - .claude/**
last-verified-commit: 6495c68
stato: allineata a HEAD; blocco Prisma/Workers rimandato al deploy, fix identificato
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

## Chiusa: Fase 4 — mappa della città

Terza feature verticale di Fase 4, la prima del gruppo "richiede una decisione di infrastruttura"
(ADR-013): libreria Leaflet + `react-leaflet` con tile OpenStreetMap, confrontata con l'utente
contro MapLibre GL e Mapbox GL JS e scelta perché l'unica senza account esterno da configurare.
Nuovo modello `MapPoint` (`title`, `type`, `place`, `lat`, `lng`), autonomo, senza relazione con
`Event`/`Proposal` (nessuno dei due ha oggi una form di creazione amministrativa da estendere con
coordinate). Dettaglio tecnico completo (il confine client/server di Next.js con Leaflet, il fix
delle icone rotte, il perché del modello autonomo) in `refactor-10-mappa-leaflet.md`.

File creati: `src/app/mappa/page.tsx` (elenco + mappa pubblica), `src/app/admin/mappa/actions.ts`
(`createMapPoint`, guardia di ruolo), `src/app/admin/mappa/nuovo/page.tsx` (form con validazione
coordinate), `src/components/CivicMap.tsx` (componente client con `react-leaflet`),
`src/components/CivicMapLoader.tsx` (caricatore `next/dynamic` con `ssr: false`), tre icone
Leaflet copiate in `public/leaflet/`. File modificati: `prisma/schema.prisma` (+`MapPoint`,
migrazione `20260716040000_map_point`), `src/app/altro/page.tsx` e `src/components/SiteHeader.tsx`
(link "Mappa" e "Nuovo punto mappa (admin)", stesso trattamento di navigazione già scelto per
spazi civici: nessun chip proprio nell'header desktop).

Definition of done:
- [x] Modello `MapPoint` scritto, validato e migrato (procedura ADR-009)
- [x] `createMapPoint` con guardia di ruolo `ADMIN`/`SUPERADMIN` e validazione delle coordinate
      (range lat/lng) lato server
- [x] Pagina pubblica `/mappa` con mappa reale (Leaflet, tile OSM, centro Civitanova Marche) e pin
      per ogni `MapPoint` pubblicato
- [x] `npm run build` pulito (typecheck incluso)
- [x] Verifica manuale nel browser (2026-07-17: pin, popup e tile OSM corretti; tre punti reali
      creati dall'utente)

Estensione post-verifica, su feedback dell'utente (2026-07-17): il form admin non chiede più
coordinate a mano. `MapPointPicker` (client) possiede tutti i campi del form: clic sulla mappa
o trascinamento del marker compilano lat/lng, e la geocodifica inversa Nominatim (nessun
account né chiave, coerente con ADR-013) compila luogo e, se il punto ha un nome proprio in
OSM, il titolo; un campo scritto a mano non viene mai più toccato dall'automatismo (flag
dirty), un errore di rete degrada ad avviso non bloccante. Fix icone Leaflet estratto nel
modulo condiviso `leafletDefaultIcon.ts`. Verificato nel browser dall'utente. Dettaglio in
`refactor-12-picker-geocodifica.md` (voce didattica 12).

Domande aperte: nessuna bloccante. Nuova ADR-013 per la scelta di libreria (confronto esplicito
con l'utente, non una continuazione di pattern minore come sondaggi/spazi civici).

## Chiusa: Fase 4 — timeline della città e rassegna stampa

Quarta e quinta feature verticale di Fase 4, costruite insieme il 2026-07-17 (ripresa dopo
riavvio forzato del PC: server Prisma dev riavviato, build di controllo pulita). Scelte in
autonomia, segnalate all'utente, perché uniche voci rimaste senza account Google, senza decisione
di infrastruttura e senza design non ovvio: puro pattern spazi civici (CRUD admin + elenco
pubblico, modelli senza relazioni). Due modelli nuovi, `PressArticle` e `TimelineEntry` con enum
`TimelineKind`, con tre scelte di modellazione deliberatamente opposte tra i due (data `DateTime`
ordinabile contro periodo testo libero + campo `order` esplicito; enum per l'insieme chiuso
contro la stringa libera di `Event.category`) e due omissioni rispetto al prototipo (`comments`,
`photo`: presuppongono sistemi che non esistono). Dettaglio in
`refactor-11-modellare-tempo-e-categorie.md` (voce didattica 11). Nessuna nuova ADR.

File creati: `src/app/timeline/page.tsx`, `src/app/admin/timeline/actions.ts`,
`src/app/admin/timeline/nuovo/page.tsx`, `src/app/rassegna-stampa/page.tsx`,
`src/app/admin/rassegna-stampa/actions.ts`, `src/app/admin/rassegna-stampa/nuovo/page.tsx`.
File modificati: `prisma/schema.prisma` (+2 modelli, +1 enum, migrazioni
`20260717000000_press_article` e `20260717010000_timeline_entry`, una per feature),
`src/app/altro/page.tsx` e `src/components/SiteHeader.tsx` (quattro voci nuove, nessun chip
desktop).

Definition of done:
- [x] Modelli scritti, validati e migrati (procedura ADR-009)
- [x] Server action con guardia di ruolo e validazione lato server (enum `kind`, `order` intero,
      `url` solo `http(s)` assoluto perché renderizzato come `href`)
- [x] Pagine pubbliche `/timeline` (ordinata per `order`, tappe associazione evidenziate) e
      `/rassegna-stampa` (ordinata per data discendente, link "Leggi l'articolo" se online)
- [x] `npm run build` pulito (typecheck incluso)
- [x] Verifica manuale nel browser (2026-07-17: ordinamento per `order` confermato con periodi
      testuali non ordinabili, tappa CivitaNext evidenziata, data articolo in italiano, link
      "Leggi l'articolo", e anche il percorso d'errore: url `https:\\...` respinto con il
      messaggio `error=2`)

Nota di verifica: una voce di prova è stata salvata con un refuso di digitazione ("asce
CivitaNext"); controllato il dato reale nel database, il codice lo mostra fedelmente, nessun
bug. Non esiste ancora una UI admin di modifica/cancellazione per questi contenuti (tutte le
feature informative di Fase 4 sono create-only, limite di perimetro noto e condiviso): i
contenuti di prova si correggono in SQL o si sostituiscono quando arriveranno quelli veri.

## Chiusa: fondazione di test (ADR-014)

Fondazione di test mirata, non retroattiva: Vitest per la logica delle server action (quattro file
sulle aree già toccate da bug reali — toggle RSVP, vincolo di voto unico dei sondaggi, scoring del
quiz, guardie di ruolo delle proposte), Playwright per un solo smoke end-to-end (login, RSVP, voto
proposta, tentativo quiz), entrambi contro un Postgres reale (in locale via Docker sulla porta
5433, in CI un service container). CI su GitHub Actions in due job, husky + lint-staged in
pre-commit. Motivazioni in ADR-014, dettaglio tecnico in voce didattica 13
(`refactor-13-piano-test.md`), comandi e perimetro in `dev-testing.md`. Il job CI standard (lint,
build, unit, e2e su runtime Node) è verde. Durante la verifica del secondo job sono stati trovati e
corretti tre bug reali di configurazione: `postinstall: prisma generate` mancante, `AUTH_SECRET`
mancante per NextAuth in produzione, `pg-cloudflare` non esterno in `next.config.ts`.

## Aperto: Prisma 7 su Cloudflare Workers (job CI `test-cloudflare-adapter`)

Il secondo job CI resta rosso di proposito (nessun `continue-on-error` a mascherarlo): builda con
`opennextjs-cloudflare` e fa girare lo smoke e2e contro il preview workerd su runner Linux.
Corretti i tre bug sopra, resta un blocco più a monte, isolato via debugger del Worker:
`CompileError: WebAssembly.Module(): Wasm code generation disallowed by embedder`, dentro il query
compiler WASM di Prisma 7.8. L'ipotesi originale di ADR-006 (problema solo di Windows) è stata
smentita: il difetto si riproduce identico su Linux in CI (correzione in coda ad ADR-006).

Lettura delle fonti reali completata il 2026-07-20 (issue upstream `prisma/prisma#28657`, aperta,
più documentazione Prisma e OpenNext). Esito: la causa non è un bug da attendere in una release, è
una configurazione mancante. Il generator `prisma-client` usa il path di default che compila la
WASM a runtime, vietato dall'isolate V8 di workerd; il fix indicato da un maintainer Prisma è
dichiarare `runtime = "cloudflare"` (alias di `workerd`) nel blocco generator, che lega il query
compiler staticamente al deploy invece di generarlo a runtime, restando su Prisma 7.8 con
`@prisma/adapter-pg`. Nessun compatibility flag di workerd può abilitare la WASM a runtime: è un
divieto strutturale, non aggirabile lato configurazione. Il downgrade a Prisma 6.19.0 funziona ma
non è più l'unica via né la migliore.

Da verificare sul nostro stack specifico (OpenNext + `@prisma/adapter-pg`), non ancora fatto: con
`@opennextjs/cloudflare` alcuni commentatori riportano un secondo errore ("WASM file not found")
legato al bundling dell'asset `.wasm`, e in certi setup serve anche il plugin `unwasm`.

Decisione presa con l'utente il 2026-07-20: rimandare l'applicazione del fix al primo deploy reale
su Cloudflare. Il blocco tocca solo il job CI del deploy (sviluppo locale, build Node e job CI
standard verdi, nessun deploy ancora avvenuto), quindi il job resta rosso e documentato mentre si
prosegue con le feature di Fase 4. Il fix è identificato — `runtime = "cloudflare"` nel blocco
generator, oggi assente, con verifica dell'integrazione OpenNext e del campo `output` — e si
applica alla vigilia del deploy. Il downgrade a Prisma 6.19.0 è scartato: superato dal fix di
configurazione.

## Chiusa: Fase 4 — competenze (bacheca di matching tra soci)

Sesta feature verticale di Fase 4, sezione "Community" del prototipo (`CN_SKILLS`). A differenza
delle altre feature informative di Fase 4, curate da un admin, questa è contenuto autoriale
generato dagli utenti come i thread del forum: la voce appartiene a un `User` (relazione reale) e
la guardia è di sola autenticazione, non di ruolo. Un socio loggato dichiara una competenza (testo
libero) e cosa offre (testo libero, default "Disponibile su richiesta"), e la voce compare subito
nella bacheca pubblica.

Scelta di modellazione confrontata con l'utente (tre vie: testo libero, tassonomia chiusa, tag
normalizzati) e decisa per il testo libero, stessa classe di scelta minore di sondaggi e spazi
civici: nessuna feature attuale fa matching automatico sul valore (la mentorship del prototipo è
separata, con `area` e slot propri) e il long tail delle competenze civiche resiste a un enum.
Nessuna nuova ADR; aggancio alla tensione enum/stringa della voce didattica 11. Modello `Skill`
(`userId`, `name`, `offer`, `createdAt`), una riga per competenza (un socio può averne più d'una).

File creati: `src/app/competenze/page.tsx` (bacheca pubblica), `src/app/competenze/actions.ts`
(`createSkill`, guardia di sola autenticazione), `src/app/competenze/nuova/page.tsx` (form). File
modificati: `prisma/schema.prisma` (+`Skill`, migrazione `20260720000000_skill`),
`src/components/SiteHeader.tsx` e `src/app/altro/page.tsx` (voce "Competenze" sotto Altro, nessun
chip desktop, stesso trattamento di mappa/timeline/spazi).

Durante la verifica è emersa una lacuna dell'accesso, non specifica delle competenze ma che ne
rovinava il flusso: `src/app/accedi/page.tsx` aveva `redirectTo` cablato a `"/"`, quindi dopo il
login si tornava sempre in home. Corretta in modo non distruttivo: `/accedi` ora onora un
`callbackUrl` interno (validato contro open redirect, deve iniziare con `/` ma non `//`), con
default `"/"` immutato per i link che non lo passano; l'invito della bacheca passa
`callbackUrl=/competenze`. Il pulsante "Accedi" dell'header e quello in "Altro" restano al
comportamento precedente (ritorno in home): estensione a tutta l'app rimandata su richiesta.

Definition of done:
- [x] Modello `Skill` scritto, validato e migrato (procedura ADR-009, `migrate deploy` applicato)
- [x] `createSkill` con guardia di sola autenticazione, `name` obbligatorio, `offer` con default
- [x] Bacheca pubblica `/competenze` (nome autore, competenza come tag, offerta) e form
      `/competenze/nuova` per i loggati; vista da sloggato con invito ad accedere
- [x] `npm run build` e `npx tsc --noEmit` puliti
- [x] Verifica manuale nel browser (2026-07-20: login con ritorno a `/competenze`, voce "Sviluppo
      tecnico" dell'utente Pippo creata e visibile con tag competenza e offerta)

## Chiusa: Fase 4 — reputazione e badge (capstone gamification)

Settima verticale di Fase 4, sezione "Community" del prototipo (`CN_REPUTATION`, `CN_BADGES`,
`CN_LEADERBOARD`), sviluppata in autonomia su delega esplicita dell'utente. Scelta di design non
banale documentata in ADR-015 e nella voce didattica 14: reputazione, livelli e badge calcolati in
lettura come funzione pura dei dati gia' in database (RSVP, tentativi quiz, proposte, voti, data di
tesseramento), senza colonna `points` memorizzata ne' tabella `Badge` (scartato il contatore per
il rischio di drift e il backfill del pregresso; stessa filosofia "calcola in query" di ADR-011).
Punteggio ancorato ai quattro assi del prototipo (RSVP 20, quiz 30, proposta 40, voto 10), livelli
Nuovo 0 / Attivo 200 / Pilastro 500, sei badge da soglie calcolate, classifica come aggregato di
quattro `groupBy`.

File creati: `src/lib/reputation.ts` (catalogo punti/livelli/badge, funzioni pure piu'
`getUserReputation` e `getLeaderboard`), `src/lib/reputation.test.ts` (otto casi, logica pura,
girano senza Postgres), `src/app/classifica/page.tsx` (classifica pubblica). File modificati:
`src/app/profilo/page.tsx` (card reputazione con avanzamento al livello successivo e griglia
badge), `src/components/SiteHeader.tsx` e `src/app/altro/page.tsx` (voce "Classifica" sotto Altro).
Nessuna migrazione di schema.

Definition of done:
- [x] Logica calcolata in `src/lib/reputation.ts`, coperta da unit test (8 casi, verdi)
- [x] Reputazione su `/profilo` (punti, livello, barra al livello successivo, badge)
- [x] Classifica pubblica su `/classifica`, riga dell'utente corrente evidenziata
- [x] `npm run build`, `npx tsc --noEmit`, `npm run lint` e `npm test` (22 casi) puliti
- [x] Verifica manuale nel browser (2026-07-20: utente Pippo a 100 punti — 1 RSVP, 1 proposta, 1
      quiz, 1 voto — livello Nuovo, badge corretti, primo in classifica sopra "Admin di prova")

## Riconciliazione

Ultima verifica delle schede: 2026-07-20, sopra l'HEAD `6495c68`. Mappa (con picker e geocodifica
inversa), timeline e rassegna stampa committate e verificate nel browser; fondazione di test
ADR-014 committata, job CI standard verde. Blocco Prisma/Workers rimandato al primo deploy con fix
identificato. Feature competenze verificata nel browser e committata (`60d7f16`), insieme al fix
del ritorno post-login. Reputazione e badge (ADR-015) verificati nel browser, pronti al commit.
Vedi `memory/progress.md` per il dettaglio completo di ogni feature e bug, e `memory/decisions.md`
per le ADR.
