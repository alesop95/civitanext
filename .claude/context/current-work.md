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

## Interventi manuali in sospeso

Lista unica, accumulata invece di fermare lo sviluppo a ogni feature: l'utente li esegue tutti
insieme in un secondo momento, non uno per uno. Aggiornata a ogni feature che ne genera uno nuovo.

- Galleria foto e documenti (ADR-016): creare due bucket R2 (`civitanext-media-dev`,
  `civitanext-media-prod`) e le credenziali sulla dashboard Cloudflare; scrivere in `.env` locale
  `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`,
  `R2_PUBLIC_BASE_URL` (nomi in `deployment.md`, mai i valori in una scheda tracciata).
- Verifica manuale nel browser di galleria e documenti (login admin per creare album/documento,
  login socio per caricare foto, tentativo di file non valido), possibile solo dopo il punto sopra.
- Webinar (ADR-017): creare/usare l'account YouTube dell'associazione, pubblicare almeno un video
  come "non in elenco pubblico" e verificare nel browser che l'admin possa incollarne il link
  (`/admin/webinar/nuovo`) e che l'embed si veda su `/webinar/[id]`.
- Email digest (ADR-017): creare l'account Resend, verificare un dominio dell'associazione,
  generare `RESEND_API_KEY`; scegliere e scrivere `DIGEST_FROM_EMAIL`; generare `CRON_SECRET` e
  scriverlo sia in `.env` locale sia nei secret del repository GitHub insieme a `DEPLOY_URL`.
  **Bloccante aggiuntivo, non solo un intervento manuale**: il workflow
  `.github/workflows/weekly-digest.yml` non può inviare nulla finché non esiste un URL pubblico
  raggiungibile, cioè finché il deploy reale su Cloudflare (bloccato da ADR-006) non è avvenuto:
  fino a quel momento il digest si può solo testare a mano chiamando `/api/digest` in locale con
  l'header `Authorization` corretto.

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

## Chiusa: Fase 4 — mentorship (bacheca mentori curata + richiesta di incontro)

Ottava verticale di Fase 4, sezione "Community" del prototipo (`CN_MENTORS`), sviluppata in
autonomia su delega. Scelta di perimetro ancorata al prototipo, non una nuova ADR (riuso dei
pattern press/timeline e RSVP): i mentori sono una lista curata da un admin, non self-service,
perche' nel prototipo diventare mentor passa da un contatto offline ("scrivici dal forum o agli
eventi"); quindi `Mentor` e' un modello autonomo con CRUD admin, come `PressArticle`, non contenuto
autoriale legato a un `User` come `Skill`. Il campo `slots` resta informativo ("posti questo
mese"), non un contatore che cala. La richiesta "Chiedi un incontro" invece si persiste
(`MentorRequest`, `@@unique([mentorId, userId])`, stesso principio di unicita' di `Rsvp`/`Vote`):
un socio loggato esprime interesse una sola volta, lo rivede al ricaricamento, e l'admin vede il
conteggio richieste per mentor. Nessun decremento di slot ne' flusso di accettazione: il mentor
non e' un account, il coordinamento resta offline com'e' nel prototipo.

File creati: `src/app/mentorship/page.tsx` (bacheca pubblica), `src/app/mentorship/actions.ts`
(`requestMentor`, guardia di sola autenticazione), `src/app/admin/mentorship/actions.ts`
(`createMentor`, guardia di ruolo), `src/app/admin/mentorship/nuovo/page.tsx` (form),
`src/app/mentorship/actions.test.ts` (idempotenza della richiesta e caso non autenticato),
`prisma/migrations/20260721000000_mentor/migration.sql`. File modificati: `prisma/schema.prisma`
(+`Mentor`, +`MentorRequest`), `src/test/fixtures.ts` (`createTestMentor` e pulizia nel rispetto
delle FK), `src/components/SiteHeader.tsx` e `src/app/altro/page.tsx` (voce "Mentorship" sotto
Altro e link admin).

Definition of done:
- [x] Modelli `Mentor` e `MentorRequest` scritti, validati e migrati (procedura ADR-009) su DB di
      sviluppo e di test (`test:db:migrate`)
- [x] `createMentor` con guardia di ruolo; `requestMentor` con guardia di sola autenticazione e
      unicita' della richiesta (verificata da unit test, 24 casi totali verdi)
- [x] Bacheca pubblica `/mentorship` (mentore, area, descrizione, posti; "Chiedi un incontro" o
      "Richiesta inviata"; conteggio richieste per l'admin) e form admin `/admin/mentorship/nuovo`
- [x] `npm run build`, `npx tsc --noEmit`, `npm run lint` e `npm test` puliti
- [x] Verifica manuale nel browser (2026-07-21: admin pubblica "Luca Bonifazi/Bandi e fondi",
      scheda corretta su `/mentorship`, da Pippo "Chiedi un incontro" diventa "Richiesta inviata"
      e persiste)

## Chiusa nel codice, verifica manuale in attesa: Fase 4 — galleria foto (ADR-016)

Prima voce del gruppo "infrastruttura" di Fase 4 (galleria foto, documenti, webinar, email
digest) e prima feature del progetto con upload di file binari. Meccanismo e modello confrontati
esplicitamente con l'utente prima di scrivere codice (due piani paralleli, sintesi in ADR-016):
upload proxato dal server (non URL presigned), modello relazionale `PhotoAlbum` (aperto da un
admin, con `Event` collegato opzionale) + `Photo` (aggiunta self-service da chiunque sia
autenticato). Validazione lato server sui byte reali (magic bytes JPEG/PNG/WEBP,
`src/lib/photo-validation.ts`), mai sull'estensione o sul `File.type` dichiarati dal client.
Nessuna eliminazione self-service delle proprie foto in questo primo taglio, scope cut esplicito:
la sola valvola di moderazione e' `deleteAlbum`/`deletePhoto` lato admin.

File creati: `src/lib/r2.ts`, `src/lib/photo-validation.ts`, `src/app/galleria/{actions.ts,
page.tsx,[id]/page.tsx}`, `src/app/admin/galleria/{actions.ts,nuovo/page.tsx}`, migrazione
`prisma/migrations/20260721132916_add_photo_gallery/`, test `src/lib/photo-validation.test.ts`,
`src/lib/r2.test.ts`, `src/app/galleria/actions.test.ts`, `src/app/admin/galleria/actions.test.ts`.
File modificati: `prisma/schema.prisma` (+`PhotoAlbum`, +`Photo`), `next.config.ts`
(`serverActions.bodySizeLimit: "25mb"`), `src/components/SiteHeader.tsx` e `src/app/altro/page.tsx`
(voce "Galleria foto"), `src/test/fixtures.ts` (`createTestPhotoAlbum`, `createTestPhoto`,
pulizia in `resetTestData`), `package.json` (+`@aws-sdk/client-s3`).

Definition of done:
- [x] Modelli `PhotoAlbum`/`Photo` scritti, validati e migrati (procedura ADR-009) su DB di
      sviluppo e di test (`test:db:migrate`)
- [x] `createAlbum` con guardia di ruolo; `uploadPhoto` con guardia di sola autenticazione e
      validazione dei byte reali prima di scrivere su R2 (verificata da unit/integration test)
- [x] `npm run build`, `npx tsc --noEmit`, `npm run lint` e `npm test` (43 casi, 10 file) puliti
- [ ] Verifica manuale nel browser: **in attesa**, vedi "Interventi manuali in sospeso" in testa a
      questa scheda; non dichiarata come fatta finche' non osservata davvero (regola di onesta'
      del contenuto)

## Chiusa nel codice, verifica manuale in attesa: Fase 4 — documenti

Seconda voce del gruppo "infrastruttura" di Fase 4. A differenza della galleria, nessuna nuova
decisione di infrastruttura: riusa esattamente il meccanismo appena costruito (upload proxato dal
server, client `src/lib/r2.ts`, ora generalizzato da `putPhotoObject` a `putObject` perche' non ha
piu' nulla di specifico alle foto). Governance senza ambiguita' da confrontare con l'utente: il
prototipo (`CN_DOCS`) non mostra alcun testo "caricate dai soci" per i documenti (a differenza
della galleria), solo lettura/filtro/download, quindi upload riservato all'admin, stesso principio
di `CivicSpace`/`PressArticle`/`MapPoint`. `category` e' un enum chiuso (`STATUTO`/`VERBALI`/
`BILANCI`, dal filtro a chip del prototipo), non testo libero: pilota il filtro della UI come
`TimelineKind` (voce didattica 11), non e' un valore descrittivo libero come `CivicSpace.type`.
Validazione lato server sul magic number PDF (`%PDF`, `src/lib/document-validation.ts`), stesso
principio della galleria. Nessuna nuova ADR (pattern riusati, nessun asse di incertezza aperto).

File creati: `src/lib/document-validation.ts`, `src/app/admin/documenti/{actions.ts,
nuovo/page.tsx}`, `src/app/documenti/page.tsx`, migrazione
`prisma/migrations/20260721142413_add_document/`, test `src/lib/document-validation.test.ts`,
`src/app/admin/documenti/actions.test.ts`. File modificati: `prisma/schema.prisma`
(+`DocumentCategory`, +`Document`), `src/lib/r2.ts` (rinominato `putPhotoObject` → `putObject`,
generico), `src/app/galleria/actions.ts` e i relativi test (aggiornati alla nuova firma),
`src/components/SiteHeader.tsx` e `src/app/altro/page.tsx` (voce "Documenti").

Definition of done:
- [x] Enum `DocumentCategory` e modello `Document` scritti, validati e migrati (procedura
      ADR-009) su DB di sviluppo e di test (`test:db:migrate`)
- [x] `createDocument`/`deleteDocument` con guardia di ruolo, validazione dei byte reali (magic
      number PDF) prima di scrivere su R2 (verificata da unit/integration test)
- [x] Elenco pubblico `/documenti` con filtro a chip per categoria e download diretto da R2
- [x] `npm run build`, `npx tsc --noEmit`, `npm run lint` e `npm test` (54 casi, 12 file) puliti
- [ ] Verifica manuale nel browser: **in attesa**, vedi "Interventi manuali in sospeso" in testa a
      questa scheda (stesso bucket R2 della galleria, nessuna variabile aggiuntiva); non
      dichiarata come fatta finche' non osservata davvero

## Chiusa nel codice, verifica manuale in attesa: Fase 4 — webinar (ADR-017)

Terza voce del gruppo "infrastruttura" di Fase 4. Decisione confrontata con l'utente: hosting
video su YouTube (video non in elenco pubblico), non storage self-hosted su R2 né Vimeo né
Cloudflare Stream — il primo perché i video pesano troppo per i limiti gratuiti di R2/Workers
usati da galleria/documenti, gli altri due per limiti di piano gratuito più stretti o assenza di
piano gratuito. Modello `Webinar` senza relazione con `User` (nessuna attribuzione di chi
pubblica), stesso trattamento informativo di `PressArticle`/`CivicSpace`/`MapPoint`: il prototipo
non mostra né upload self-service né sezione admin per questa feature. `youtubeId` salva solo
l'id del video (parsing di URL comuni in `src/lib/youtube.ts`), embed e thumbnail composti a
runtime. Nessun campo "views" (richiederebbe la YouTube Data API, non giustificata oggi).

File creati: `src/lib/youtube.ts`, `src/app/admin/webinar/{actions.ts,nuovo/page.tsx}`,
`src/app/webinar/{page.tsx,[id]/page.tsx}`, migrazione
`prisma/migrations/20260721144358_add_webinar_digest/` (insieme a `User.digestOptIn`, vedi sotto),
test `src/lib/youtube.test.ts`, `src/app/admin/webinar/actions.test.ts`. File modificati:
`prisma/schema.prisma` (+`Webinar`), `src/components/SiteHeader.tsx` e `src/app/altro/page.tsx`
(voce "Webinar").

Definition of done:
- [x] Modello `Webinar` scritto, validato e migrato (procedura ADR-009) su DB di sviluppo e di
      test (`test:db:migrate`)
- [x] `createWebinar`/`deleteWebinar` con guardia di ruolo; parsing e validazione del link/id
      YouTube prima di scrivere (verificata da unit/integration test)
- [x] Elenco pubblico `/webinar` (copertina da thumbnail YouTube) e dettaglio `/webinar/[id]`
      con embed reale (`youtube-nocookie.com`)
- [x] `npm run build`, `npx tsc --noEmit`, `npm run lint` e `npm test` puliti
- [ ] Verifica manuale nel browser: **in attesa**, vedi "Interventi manuali in sospeso" in testa a
      questa scheda (richiede un video reale pubblicato come non in elenco su YouTube); non
      dichiarata come fatta finche' non osservata davvero

## Chiusa nel codice, attivazione e verifica in attesa: Fase 4 — email digest (ADR-017)

Quarta e ultima voce del gruppo "infrastruttura" di Fase 4 — con questa, tutte le nove voci di
Fase 4 sono complete nel codice. Tre decisioni confrontate con l'utente: servizio email Resend
(nominato nel `ROADMAP.md` del prototipo insieme a SendGrid, confrontato anche con Brevo);
contenuto del digest interpretato dal prototipo come eventi nei prossimi 7 giorni + thread del
forum degli ultimi 7 giorni (non l'intero forum né le proposte); trigger settimanale via GitHub
Actions schedulato (non il Cron Trigger nativo di Cloudflare Workers, non disponibile prima del
deploy reale). `User.digestOptIn` default **false**, scelta in autonomia e segnalata come tale:
il toggle del prototipo era solo `localStorage` (mai un'email vera) con default "acceso", ma
attivare di default l'invio a utenti già esistenti al momento della migrazione avrebbe mandato
email a chi non ha mai davvero acconsentito attraverso questa feature.

File creati: `src/lib/resend.ts`, `src/lib/digest.ts` (con fuga HTML esplicita sul contenuto
scritto dai soci, titoli/nomi dei thread), `src/app/profilo/actions.ts` (`toggleDigestOptIn`),
`src/app/api/digest/route.ts` (protetta da `CRON_SECRET` a confronto tempo-costante, nessuna
sessione: chi chiama è un workflow, non un utente loggato), `.github/workflows/weekly-digest.yml`,
test `src/lib/digest.test.ts`. File modificati: `prisma/schema.prisma` (+`User.digestOptIn`),
`src/app/profilo/page.tsx` (card preferenze con toggle), `src/test/fixtures.ts`
(`createTestThread`, `createTestWebinar`, estensione `createTestEvent`, pulizia thread/reply mai
coperta finora in `resetTestData`).

Definition of done:
- [x] `User.digestOptIn` migrato (procedura ADR-009) su DB di sviluppo e di test
- [x] `toggleDigestOptIn` con guardia di sola autenticazione; toggle visibile su `/profilo`
- [x] `buildDigestContent`/`renderDigestHtml`/`sendWeeklyDigest` con fuga HTML e nessun invio se
      il contenuto è vuoto (verificati da unit/integration test, DB reale mockando solo Resend)
- [x] `/api/digest` protetta, confronto a tempo costante, non una sessione
- [x] `npm run build`, `npx tsc --noEmit`, `npm run lint` e `npm test` puliti
- [ ] **Non solo verifica manuale: attivazione reale in sospeso**, vedi "Interventi manuali in
      sospeso" in testa a questa scheda. A differenza di galleria/documenti/webinar (dove basta
      creare un account e verificare nel browser), qui il workflow schedulato non può inviare
      nulla finché non esiste un URL pubblico raggiungibile, cioè finché il deploy reale su
      Cloudflare (bloccato da ADR-006) non sarà avvenuto. Testabile solo a mano in locale
      chiamando `/api/digest` con l'header `Authorization` corretto finché quel momento non arriva.

## Riconciliazione

Ultima verifica delle schede: 2026-07-22, sopra l'HEAD dopo `93be748`. Mappa (con picker e
geocodifica inversa), timeline e rassegna stampa committate e verificate nel browser; fondazione
di test ADR-014 committata, job CI standard verde. Blocco Prisma/Workers rimandato al primo
deploy con fix identificato. Feature competenze verificata nel browser e committata (`60d7f16`),
insieme al fix del ritorno post-login. Reputazione e badge (ADR-015) verificati nel browser e
committati (`c2b5a87`). Mentorship verificata nel browser e committata (`17cd21e`/`4608ecf`).
Galleria foto (ADR-016) committata (`93be748`), completa nei test automatici, non ancora
verificata nel browser (bucket R2 da creare). Documenti, webinar ed email digest (ADR-017)
completi nel codice e nei test automatici, non ancora committati: con questi si chiudono tutte le
nove voci di Fase 4. Nessuno dei tre ancora verificato nel browser/attivato davvero (bucket R2,
account YouTube, account Resend e deploy Cloudflare tutti in sospeso, vedi "Interventi manuali in
sospeso" in testa a questa scheda). Vedi `memory/progress.md` per il dettaglio completo di ogni
feature e bug, e `memory/decisions.md` per le ADR.
