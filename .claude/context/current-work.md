---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - src/**
  - .claude/**
last-verified-commit: a220a33
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
- Notifiche push: le chiavi VAPID sono già generate (nessun account esterno, pura crittografia
  locale) e riportate all'utente in chat; restano da scrivere in `.env` locale
  (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`) e da
  verificare nel browser (attivare il toggle su `/profilo`, far approvare una proposta di test da
  un admin, verificare che arrivi la notifica di sistema).
## Chiusa nel codice, verifica manuale in attesa: modifica profilo socio

Quinta voce di sviluppo applicativo. Chiude la lacuna dell'audit "il socio non puo' modificare i
propri dati": nuova pagina `/profilo/modifica` con due form, uno per nome ed email e uno per la
password, raggiungibile da un pulsante "Modifica dati" nella card "Dati account" di `/profilo`.

Validazione pura e testabile in `src/lib/profile-validation.ts` (nome non vuoto, email con "@",
password >= 8), allineata alle regole della registrazione. Due server action in
`src/app/profilo/actions.ts`: `updateProfileInfo` (nome + email, email normalizzata e vincolata
all'unicita') e `changePassword`. Decisione di sicurezza standard, presa in autonomia perche' e'
prassi consolidata e non una scelta di prodotto: il cambio email e il cambio password richiedono
la password attuale come conferma d'identita' (previene modifiche da una sessione rubata); chi ha
solo OAuth Google (nessuna `passwordHash`) ne e' esentato per l'email e, per la password, la sta
impostando per la prima volta senza doverne fornire una. La pagina mostra il form password come
"Imposta una password" per gli utenti solo-OAuth.

Limite noto e segnalato: cambiando nome/email, la sessione JWT esistente conserva i vecchi valori
finche' non si ricarica (il ricontrollo periodico o un nuovo accesso li allineano); la pagina
`/profilo` legge dal database, quindi mostra subito i valori aggiornati, ma l'avatar/nome in header
puo' restare indietro per poco. Nessuna migrazione di schema.

File creati: `src/lib/profile-validation.ts`, `src/lib/profile-validation.test.ts`,
`src/app/profilo/modifica/page.tsx`. File modificati: `src/app/profilo/actions.ts`
(`updateProfileInfo`, `changePassword`), `src/app/profilo/page.tsx` (link "Modifica dati").

Definition of done:
- [x] Validazione pura coperta da unit test (3 casi, verdi)
- [x] `updateProfileInfo` (nome, email con unicita' e conferma password) e `changePassword`
      (conferma password attuale se presente, lunghezza minima, conferma corrispondente)
- [x] `/profilo/modifica` con i due form e messaggi di errore/successo
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build` puliti (rotta nel manifest)
- [ ] Verifica manuale nel browser: **in attesa** (cambiare nome; cambiare email con password
      giusta/sbagliata e con email gia' esistente; cambiare password; provare da un utente
      Google-only); non dichiarata finche' non osservata
- [ ] Test di integrazione delle action non ancora scritti (rafforzamento successivo)

## Chiusa nel codice, verifica manuale in attesa: modifica/cancella contenuti citta'

Quarta voce di sviluppo applicativo, scelta dall'utente dopo l'audit: replica il pattern di
modifica/cancellazione appena introdotto con gli eventi ai quattro contenuti informativi che erano
create-only (spazi civici, mappa, timeline, rassegna stampa). Chiude in un colpo la lacuna
"nessuna modifica in tutta l'app" per questi contenuti, riusando codice fresco.

Ricetta identica per tutti e quattro: la validazione di ogni `actions.ts` e' stata estratta in una
funzione `parseXForm` condivisa tra `createX` e `updateX` (stesso controllo, redirect diversi su
errore); aggiunta `updateX` (legge un `id` nascosto) e `deleteX`; i campi del form vivono in un
componente presentazionale condiviso (`TimelineFormFields`, `PressFormFields`,
`CivicSpaceFormFields`) riusato da nuovo e modifica con `defaults` diversi; nuova rotta
`/admin/<x>/[id]/modifica`; i controlli admin "Modifica"/"Elimina" compaiono inline sulle pagine
pubbliche (stesso pattern delete-in-place gia' usato per forum e competenze), non in pagine admin
dedicate. La cancellazione e' un semplice `delete` perche' questi modelli sono autonomi, senza
relazioni dipendenti (a differenza di `Event` con i suoi RSVP).

I due form con componente client hanno guadagnato un prop di default: `OrariField` accetta
`defaultValue` per il campo orari; `MapPointPicker` accetta `defaults` (title/type/place/lat/lng) e
in modifica considera i campi gia' "scritti a mano" (dirty), cosi' spostare il pin non sovrascrive
titolo/luogo esistenti; `MapPointPickerLoader` inoltra il prop. La pagina pubblica `/mappa`, che
mostra una mappa e non un elenco, ha guadagnato per gli admin una sezione "Gestione punti" sotto la
mappa con Modifica/Elimina per punto. Le pagine di creazione hanno anche guadagnato un pulsante
"Torna a ..." coerente con quello degli eventi. Nessuna nuova ADR, nessuna migrazione.

File creati: `src/app/admin/timeline/TimelineFormFields.tsx`,
`src/app/admin/timeline/[id]/modifica/page.tsx`,
`src/app/admin/rassegna-stampa/PressFormFields.tsx`,
`src/app/admin/rassegna-stampa/[id]/modifica/page.tsx`,
`src/app/admin/spazi-civici/CivicSpaceFormFields.tsx`,
`src/app/admin/spazi-civici/[id]/modifica/page.tsx`,
`src/app/admin/mappa/[id]/modifica/page.tsx`. File modificati: i quattro `actions.ts`
(parse condiviso + update + delete), le quattro pagine `nuovo/page.tsx` (usano il componente
condiviso), le quattro pagine pubbliche (`/timeline`, `/rassegna-stampa`, `/spazi-civici`, `/mappa`
con controlli admin), `src/components/OrariField.tsx` e `src/components/MapPointPicker.tsx` +
`MapPointPickerLoader.tsx` (prop di default).

Definition of done:
- [x] `updateX`/`deleteX` con guardia di ruolo e validazione condivisa per tutti e quattro
- [x] Rotta `/admin/<x>/[id]/modifica` con form precompilato (componente condiviso) per tutti e quattro
- [x] Controlli admin Modifica/Elimina inline sulle pagine pubbliche
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build` puliti (le quattro rotte modifica nel manifest)
- [ ] Verifica manuale nel browser: **in attesa** (per ciascun contenuto: modificare una voce e
      vedere il cambiamento sulla pagina pubblica, eliminarne una; per la mappa verificare che il
      pin precompilato appaia e che spostarlo non cancelli titolo/luogo); non dichiarata finche' non osservata

## Chiusa nel codice, verifica manuale in attesa: eventi CRUD admin

Terza voce di sviluppo applicativo, scelta dall'utente dopo l'audit dei controlli mancanti come la
lacuna piu' impattante: fino a oggi gli eventi esistevano solo da seed (`prisma/seed.js`), un admin
non poteva crearli, modificarli o cancellarli dall'interfaccia. E' anche la prima schermata di
modifica del progetto (finora ogni contenuto era create-only), quindi introduce un pattern di form
riusabile per gli altri contenuti quando guadagneranno la modifica.

Tre rotte: `/admin/eventi` (elenco con Modifica/Elimina e conteggio RSVP), `/admin/eventi/nuovo`
(creazione), `/admin/eventi/[id]/modifica` (modifica precompilata). I campi comuni vivono in un
componente presentazionale condiviso `EventFormFields`, riusato da nuovo e modifica con i
`defaults` diversi. Azioni `createEvent`/`updateEvent`/`deleteEvent` con guardia di ruolo,
validazione condivisa (`parseEventForm`: campi obbligatori, lunghezze da `validation.ts`, data
valida) e redirect con `?error=` come le altre create action.

Decisioni prese e segnalate. La cancellazione pulisce le dipendenze in transazione esplicita: gli
RSVP dell'evento (dato di partecipazione senza senso senza l'evento) vengono eliminati, gli album
fotografici collegati sopravvivono scollegati (`eventId` a null), cosi' il delete non dipende dalla
regola referenziale del database e l'intento resta leggibile. La data usa un input datetime-local
interpretato come ora locale del server, coerente tra creazione, modifica e riletura; il fuso di
visualizzazione pubblica resta una questione separata gia' presente (il seed usa offset espliciti).
Nessuna nuova ADR, nessuna migrazione di schema (il modello `Event` esisteva dalla Fase 0). La
categoria resta testo libero come `Event.category` era gia' (non un enum), coerente con lo stato
attuale del modello.

File creati: `src/app/admin/eventi/actions.ts`, `src/app/admin/eventi/EventFormFields.tsx`,
`src/app/admin/eventi/page.tsx`, `src/app/admin/eventi/nuovo/page.tsx`,
`src/app/admin/eventi/[id]/modifica/page.tsx`. File modificati: `src/app/admin/page.tsx` (gruppo
"Eventi" nell'hub), `src/components/SiteHeader.tsx` e `src/app/altro/page.tsx` (link), `src/app/eventi/page.tsx`
(pulsante "Gestisci eventi" per gli admin sulla pagina pubblica).

Definition of done:
- [x] `createEvent`/`updateEvent`/`deleteEvent` con guardia di ruolo e validazione condivisa
- [x] Elenco `/admin/eventi`, form di creazione e modifica precompilata (componente condiviso)
- [x] Delete che pulisce RSVP e scollega gli album in transazione
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build` puliti (tre rotte nel manifest)
- [ ] Verifica manuale nel browser: **in attesa** (creare un evento, vederlo su `/eventi`,
      modificarlo, iscriversi e poi cancellarlo verificando che l'album collegato sopravviva); non
      dichiarata come fatta finche' non osservata
- [ ] Test di integrazione delle action non ancora scritti (rafforzamento successivo, come per soci)

## Chiusa nel codice, verifica manuale in attesa: gestione soci (admin)

Seconda voce di sviluppo applicativo dopo il pannello admin, continuazione diretta: la sezione
"Utenti" del prototipo (`civitanext-admin.jsx`, `CN_ADMIN_USERS`). Scelta tra le direzioni aperte
perche' estende il pannello appena costruito e chiude una lacuna reale di Fase 1 annotata da tempo
("l'assegnazione di una tessera resta un'azione amministrativa non ancora costruita"). Elenco
utenti con cambio ruolo e assegnazione/revoca tessera, riservato ad `ADMIN`/`SUPERADMIN`.

La regola di autorizzazione, la parte sensibile, vive in funzioni pure testabili in isolamento
(`src/lib/user-admin.ts`, stessa filosofia di `reputation.ts`): `canChangeRole` codifica un
invariante di sicurezza esplicito, nessuno cambia il proprio ruolo (anti auto-blocco), un
SUPERADMIN puo' tutto sugli altri, un ADMIN opera solo dentro `{UTENTE, ADMIN}` e non tocca ne'
crea SUPERADMIN. La guardia e' ricontrollata lato server leggendo lo stato reale del bersaglio dal
database, non ci si fida di cosa la tendina permetteva di scegliere. Il numero tessera e'
generato da `nextTesseraNumero` (progressivo `CN-NNNN` dal massimo esistente, funzione pura).

Due decisioni prese in autonomia e segnalate come tali, entrambe reversibili: l'interruttore
"attivo/disattivato" del prototipo e' stato omesso perche' non esiste una colonna corrispondente
nello schema e introdurla sarebbe una scelta di prodotto a se' (sospensione account), non un
dettaglio di questa feature; la scelta della feature stessa (gestione soci contro l'alternativa
"attuazione proposte") e' stata fatta su delega esplicita dell'utente di procedere con la prossima
feature applicativa, offrendo comunque di cambiare.

A supporto della verifica manuale, `prisma/seed.js` ora crea anche tre account di prova stabili,
uno per ruolo (`superadmin@`/`admin@`/`socio@civitanext.local`, password condivisa dev), idempotenti
e reimpostabili con `node prisma/seed.js`; sono credenziali dev usa-e-getta come `e2e/credentials.ts`,
non segreti (il file `_notes/CREDENZIALI-TEST.md`, non versionato, le riepiloga per comodita').

File creati: `src/lib/user-admin.ts`, `src/lib/user-admin.test.ts`, `src/app/admin/soci/actions.ts`,
`src/app/admin/soci/page.tsx`. File modificati: `prisma/seed.js` (+`seedUsers`), `src/app/admin/page.tsx`
(voce "Gestione soci" nell'hub), `src/components/SiteHeader.tsx` e `src/app/altro/page.tsx`
(link).

Definition of done:
- [x] Autorizzazione in `src/lib/user-admin.ts`, coperta da unit test puri (10 casi, verdi)
- [x] `/admin/soci` con guardia di ruolo: cambio ruolo (tendina filtrata per attore) e tessera
- [x] `changeUserRole`/`assignTessera`/`revokeTessera` con guardia e ricontrollo server-side
- [x] `npx tsc --noEmit`, `npm run lint`, `npm run build` puliti (rotta `/admin/soci` nel manifest)
- [ ] Verifica manuale nel browser: **in attesa** (login superadmin, cambiare il ruolo del socio,
      assegnare tessera all'admin, verificare che ADMIN non possa toccare un SUPERADMIN ne' se
      stesso); non dichiarata come fatta finche' non osservata
- [ ] Test di integrazione delle action (con Postgres) non ancora scritti: la logica di sicurezza
      e' coperta dai test puri, l'integrazione e' un rafforzamento successivo

## Chiusa nel codice, verifica manuale in attesa: pannello admin + analytics (Fase 5)

Prima voce di sviluppo applicativo dopo la chiusura di Fase 4 e dei tre assi di hardening piu'
GDPR. Scelta confrontata con l'utente tra piu' direzioni (nuova feature, attivazione interventi
manuali, ampliamento test) e, dentro la feature, due decisioni non ovvie confrontate prima di
scrivere: ambito taglio focalizzato (cruscotto + analytics che riusano i dati esistenti, non
parita' col prototipo che implicherebbe CRUD admin di eventi/quiz, gestione utenti e un sistema di
segnalazione forum inesistente) e grafici come Server Component SVG/CSS (nessuna dipendenza,
nessun JS al client, coerente col target Workers) invece di una libreria di charting client.

Fino a oggi le azioni admin vivevano come 13 rotte separate raggiungibili solo da `/altro`, senza
una radice `/admin`. Il nuovo cruscotto la introduce: Panoramica con statistiche reali (utenti
registrati, soci tesserati, RSVP medi per evento, tentativi quiz e messaggi forum nel mese, eventi
totali), contatori di lavoro in attesa (proposte in revisione, richieste di cancellazione account
non ancora eseguite) con link diretto, e un hub raggruppato verso tutte le sezioni esistenti. La
pagina Analytics mostra tre andamenti mensili sugli ultimi sei mesi (nuovi iscritti, attivita'
forum, tentativi quiz), la distribuzione delle proposte per stato e i totali RSVP/voti.

Tutto calcolato in lettura come per la reputazione (ADR-015): nessun contatore memorizzato. La
parte deterministica (bucketing per mese, medie, soglie) e' isolata in funzioni pure senza
database in `src/lib/analytics.ts`, testata senza Postgres (`src/lib/analytics.test.ts`, 9 casi,
girano anche in pre-commit); le funzioni che leggono dal DB delegano a quelle il calcolo. A
differenza dei "trend" testuali statici del prototipo, l'Analytics non inventa narrazioni: solo
numeri reali (regola di onesta' del contenuto). Nessuna nuova ADR (riuso di pattern gia' decisi),
nessuna migrazione di schema.

File creati: `src/lib/analytics.ts`, `src/lib/analytics.test.ts`, `src/components/ui/StatTile.tsx`,
`src/components/ui/BarChart.tsx`, `src/app/admin/page.tsx`, `src/app/admin/analytics/page.tsx`.
File modificati: `src/components/SiteHeader.tsx` (chip "Admin" ora punta a `/admin`, attiva su
qualunque rotta `/admin`; `/admin` e `/admin/analytics` aggiunti a `ALTRO_HREFS`),
`src/app/altro/page.tsx` (link "Pannello admin").

Definition of done:
- [x] Logica statistiche in `src/lib/analytics.ts`, parte pura coperta da unit test (9 casi, verdi)
- [x] Cruscotto `/admin` con guardia di ruolo, Panoramica reale, contatori "da gestire", hub
- [x] `/admin/analytics` con grafici SVG/CSS sui dati reali, guardia di ruolo
- [x] `npx tsc --noEmit`, `npm run lint` e `npm run build` puliti (rotte `/admin` e
      `/admin/analytics` nel manifest di build)
- [ ] Verifica manuale nel browser: **in attesa** (login admin, controllo che statistiche e
      grafici rendano sui dati del DB di sviluppo); non dichiarata come fatta finche' non osservata

## Chiusa: Google OAuth (ADR-010) — configurazione esterna completata e verificata

L'ultimo punto rimandato di ADR-010 (Fase 1) è chiuso il 2026-07-23: l'account Google
dell'associazione (dal 2026-07-22) è stato usato per configurare l'app OAuth su Google Cloud
Console passo-passo via screenshot, procedura completa e replicabile in `deployment.md`
("Configurazione Google OAuth"). Fatto: progetto "CivitaNext" (ID `civitanext`); identità
dell'app ("Google Auth Platform") — pubblico "Esterno", email di assistenza/contatto
`civitanext@gmail.com`; client OAuth "CivitaNext web" (redirect URI
`http://localhost:3000/api/auth/callback/google`); `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`
scritti in `.env` locale dall'utente (mai passati all'agente); account di prova aggiunto.
**Verificato nel browser**: login con Google completo, sessione creata, utente autenticato nel
sito (avatar "AS" in header, "Esci" visibile) — non solo configurato, osservato funzionare.

Durante la verifica, un bug reale e non ovvio ha bloccato il primo tentativo, diagnosticato e
corretto nella stessa sessione: il service worker (`public/sw.js`, Fase 3) intercettava anche la
navigazione di ritorno da Google (`/api/auth/callback/google`), una richiesta che arriva da un
redirect cross-origin. Richiamare `fetch()` su quella richiesta dentro il service worker falliva
per un vincolo del browser sulle navigazioni reindirizzate da un'origine esterna — non un errore
di rete vero, ma trattato come tale dal `.catch()` del service worker, che mostrava la pagina di
fallback offline invece del sito. La richiesta non arrivava mai al server Next (verificato nel
log: nessuna riga per quella rotta, in nessuno dei tentativi), il che ha isolato il problema al
service worker piuttosto che a Google, alla rete o alla configurazione OAuth stessa — confermato
anche perché il problema si riproduceva identico in una finestra in incognito, escludendo
cronologia/estensioni del browser normale. Fix: escludere le rotte `/api/` dall'intercettazione
di navigazione nel service worker (nessun fallback offline ha senso su una rotta API comunque).
Effetto collaterale distinto e chiarito con l'utente, non un bug: durante la diagnosi sono
comparse nel log richieste a `/home`, `/admin`, `/restaurant`, `/band`, `/photographer`, rotte
inesistenti in CivitaNext riconosciute come appartenenti a un altro progetto locale dell'utente
mai eseguito su questa porta contemporaneamente — quasi certamente cronologia/autocompletamento
dell'indirizzo del browser che confonde host+porta (`localhost:3000`) tra progetti diversi
eseguiti in momenti diversi sulla stessa porta, non una contaminazione reale tra codebase. Nulla
da segnalare all'altro progetto. Voce didattica associata: `refactor-17-sw-oauth-redirect.md`.

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
dichiarato da `ROADMAP.md`, completate nel codice il 2026-07-22: vedi la sezione dedicata più
sotto, dopo la chiusura di Fase 4.

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

Aggiornamento 2026-07-23: per non mostrare un rosso permanente su ogni push per un blocco
volutamente posticipato, il job `test-cloudflare-adapter` è stato sospeso dai push automatici e
reso lanciabile solo a mano (`workflow_dispatch` in `.github/workflows/ci.yml`, con
`if: github.event_name == 'workflow_dispatch'` sul job). Su push e PR ora risulta "skipped", non
"failed"; il job CI standard (`test`) resta l'unico gate automatico e resta verde. Lo si rilancerà
a mano dopo aver applicato il fix Prisma sopra, alla vigilia del primo deploy. Nessuna
mascheratura del blocco: il job esiste ancora ed è documentato, semplicemente non gira a vuoto.

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

## Chiusa nel codice, verifica manuale in attesa: notifiche push

Chiude il passo dichiarato subito dopo le notifiche in-app di Fase 3 (mai affrontato finora),
indipendente dal blocco deploy Cloudflare: Web Push API standard + libreria `web-push`, nessun
servizio terzo (OneSignal, Firebase Cloud Messaging) — stessa preferenza già seguita per
NextAuth self-hosted su Clerk e R2 su Cloudflare Images, standard aperto e gratuito invece di un
account esterno aggiuntivo. Le chiavi VAPID sono pura crittografia locale (`npx web-push
generate-vapid-keys`), non una credenziale di servizio: generate in sessione e già consegnate
all'utente, senza bisogno di un intervento manuale su un account esterno.

`notifyUser` (`src/lib/notifications.ts`) è ora il punto unico sia della notifica in-app sia del
push: dopo aver scritto la riga `Notification`, invia un push a ogni `PushSubscription` (un
abbonamento per dispositivo/browser, non per utente) del destinatario, best-effort — un fallimento
del push non fa fallire la scrittura in-app, che resta comunque visibile su `/notifiche`. Una
sottoscrizione che il push service segnala come scaduta (404/410 via `WebPushError`) viene
cancellata lì stesso; altri errori (rete, 5xx) non la cancellano, si ritenta alla notifica
successiva. `PushToggle.tsx` è la prima eccezione del progetto al pattern "solo form": essendo
una sottoscrizione del browser (endpoint + chiavi da `pushManager.subscribe()`), chiama
`subscribeToPush`/`unsubscribeFromPush` come funzioni direttamente da un componente client, non
tramite un `<form>`.

File creati: `src/lib/push.ts`, `src/components/PushToggle.tsx`, migrazione
`prisma/migrations/20260722071101_add_push_subscription/`, test `src/lib/push.test.ts`,
`src/lib/notifications.test.ts` (mai esistito finora nonostante `notifyUser` risalga a Fase 2).
File modificati: `prisma/schema.prisma` (+`PushSubscription`), `src/lib/notifications.ts`,
`src/app/profilo/{page.tsx,actions.ts}` (`subscribeToPush`, `unsubscribeFromPush`), `public/sw.js`
(listener `push` e `notificationclick`), `src/test/fixtures.ts` (`createTestPushSubscription`,
pulizia in `resetTestData`).

Definition of done:
- [x] Modello `PushSubscription` scritto, validato e migrato (procedura ADR-009) su DB di
      sviluppo e di test (`test:db:migrate`)
- [x] `subscribeToPush`/`unsubscribeFromPush` con guardia di sola autenticazione (upsert su
      `endpoint`, cancellazione filtrata anche su `userId`)
- [x] `notifyUser` invia push best-effort e cancella le sole sottoscrizioni segnalate scadute
      (verificato da unit/integration test, web-push mockato)
- [x] Service worker aggiornato con `push`/`notificationclick`
- [x] `npm run build`, `npx tsc --noEmit`, `npm run lint` e `npm test` (80 casi, 17 file) puliti
- [ ] Verifica manuale nel browser: **in attesa**, vedi "Interventi manuali in sospeso" in testa
      a questa scheda (scrivere le chiavi VAPID in `.env`, poi attivare il toggle su `/profilo` e
      far approvare una proposta di test); non dichiarata come fatta finche' non osservata davvero

## Chiusa nel codice: hardening (Fase 5, tre assi su quattro)

Prima voce di Fase 5 indipendente dal deploy Cloudflare, per scelta esplicita dell'utente tra
hardening/analytics admin/ampliamento test. Tre dei quattro assi del `ROADMAP.md` di handoff
("rate limiting su voti/post, validazione server-side, moderazione, GDPR, backup") completati
senza bisogno di confronto con l'utente: nessuna decisione di infrastruttura esterna, solo
ingegneria diretta. Il quarto asse (GDPR/backup) resta aperto perche' tocca scelte reali di
prodotto (cosa succede ai contenuti di un socio che chiede la cancellazione dell'account), da
decidere insieme, non un affinamento mecanico come gli altri tre.

Rate limiting: basato su conteggio di righe Postgres esistenti (nessun Redis/KV, nessuna tabella
dedicata), `src/lib/rate-limit.ts`. Soglie calibrate sul costo di moderazione di ogni tipo di
contenuto: 5 thread/10 min e 20 risposte/10 min (forum), 3 proposte/60 min (aprono una coda di
revisione admin, tetto piu' basso), 10 competenze/60 min (uso legittimo di dichiarare piu' voci in
una sessione, tetto piu' alto). Non applicato a voti (gia' vincolati dal `@@unique` su
utente+target) ne' a contenuto admin-only (rischio di spam trascurabile, guardia di ruolo gia'
sufficiente).

Validazione server-side: `MAX_SHORT_TEXT` (200) e `MAX_LONG_TEXT` (5000) in
`src/lib/validation.ts`, applicati a tutti gli 8 file di action che accettavano testo libero senza
alcun limite (verificato con un audit completo, zero eccezioni prima di oggi): forum, proposte,
competenze, e i quattro contenuti informativi admin (mentorship, spazi civici, mappa, timeline,
rassegna stampa).

Moderazione: forum (`src/app/admin/forum/actions.ts`, `deleteThread`/`deleteReply`, cancella prima
le risposte) e competenze (`src/app/admin/competenze/actions.ts`, `deleteSkill`) non avevano
alcuna azione di cancellazione — verificato, zero `delete` in tutto il repo per questi due
contenuti prima di oggi. Pulsante "Elimina" visibile solo ad ADMIN/SUPERADMIN su `/forum`,
`/forum/[id]`, `/competenze`, accanto al contenuto invece che in una sezione admin separata (non
esisteva e non serviva crearne una per due sole azioni).

File creati: `src/lib/validation.ts`, `src/lib/rate-limit.ts`, `src/app/admin/forum/actions.ts`,
`src/app/admin/competenze/actions.ts`, test `src/lib/rate-limit.test.ts`,
`src/app/forum/actions.test.ts` (mai esistito), `src/app/admin/forum/actions.test.ts`,
`src/app/proposte/actions.test.ts` (mai esistito), `src/app/competenze/actions.test.ts` (mai
esistito), `src/app/admin/competenze/actions.test.ts`. File modificati: le 8 action con testo
libero e le rispettive pagine `nuovo/page.tsx` (nuovi messaggi di errore per lunghezza/rate
limit), `src/app/forum/page.tsx`, `src/app/forum/[id]/page.tsx`, `src/app/competenze/page.tsx`
(pulsanti Elimina), `src/test/fixtures.ts` (`createTestReply`; corretto un bug di pulizia
preesistente — `resetTestData` filtrava thread/proposal solo per titolo, non per autore, quindi
righe con titolo non-MARKER create nei nuovi test di successo sopravvivevano e rompevano la FK
alla cancellazione dell'utente a fine test).

Definition of done:
- [x] Rate limiting su forum (thread/risposte), proposte, competenze — soglie testate
- [x] Validazione di lunghezza massima su tutti gli 8 file di action con testo libero
- [x] Moderazione admin (delete) su forum e competenze, prima assente
- [x] `npm run build`, `npx tsc --noEmit`, `npm run lint` e `npm test` (108 casi, 23 file) puliti
- [x] GDPR (cancellazione account): chiuso il 2026-07-23, vedi sezione dedicata sotto (ADR-018)
- [ ] Backup: **non affrontato**, dipende dalle garanzie del piano gratuito Neon (da verificare,
      non un compito di codice), vedi `deployment.md`

## Chiusa nel codice: cancellazione account GDPR (ADR-018)

Chiude il quarto asse di hardening rimasto aperto. Confrontate con l'utente tre vie (cascata,
anonimizzazione automatica, mediata dall'admin); scelto un ibrido: **anonimizzazione** (i
contenuti pubblicati restano, solo l'identità viene sostituita con "Utente cancellato") **mediata
dall'admin** (nessuna esecuzione automatica, il socio richiede da `/profilo` e un admin esegue da
`/admin/account-deletion`), con enfasi esplicita dell'utente su una "pulizia profonda" contro il
data leakage.

Nuovo modello `AccountDeletionRequest`: riga mai cancellata nemmeno dopo l'esecuzione, resta come
traccia scritta (chi ha chiesto, quando, quale admin ha eseguito, quando) e rende la richiesta
ricollegabile alla riga `User` anonimizzata ma non rimossa. `processAccountDeletion` cancella per
davvero (non anonimizza) tre categorie non pubbliche: righe `Account` (token OAuth Google —
`access_token`/`refresh_token`/`id_token`, credenziali reali), righe `PushSubscription`
(dispositivo-specifiche), `VerificationToken` residuo sulla vecchia email (nessuna foreign key
verso `User`, non toccato da alcun cascade). Poi anonimizza `User`: email deterministica
`deleted-<id>@anonimizzato.civitanext.local` (mantiene l'unicità richiesta dallo schema), nome
"Utente cancellato", password/immagine/tessera/verifica email azzerate, digest disattivato.

File creati: `src/app/admin/account-deletion/{actions.ts,page.tsx}`, migrazione
`prisma/migrations/20260723093041_add_account_deletion_request/`, test
`src/app/profilo/actions.test.ts` (mai esistito, copre anche `toggleDigestOptIn`),
`src/app/admin/account-deletion/actions.test.ts`. File modificati: `prisma/schema.prisma`
(+`AccountDeletionRequest`), `src/app/profilo/{actions.ts,page.tsx}` (`requestAccountDeletion`,
sezione "Zona pericolosa"), `src/components/SiteHeader.tsx`/`src/app/altro/page.tsx` (voce
admin), `src/test/fixtures.ts` (`createTestOAuthAccount`, `createTestAccountDeletionRequest`,
pulizia dedicata — l'anonimizzazione cambia deliberatamente `User.name`, quindi il filtro MARKER
da solo non basta più a trovare l'utente di test dopo che un test l'ha anonimizzato).

Definition of done:
- [x] Modello `AccountDeletionRequest` migrato (procedura ADR-009) su DB di sviluppo e di test
- [x] `requestAccountDeletion` idempotente, guardia di sola autenticazione
- [x] `processAccountDeletion` con guardia di ruolo: anonimizza `User`, cancella
      Account/PushSubscription/VerificationToken, lascia intatti i contenuti (verificato da
      unit/integration test, incluso un caso con thread reale ancora agganciato dopo
      l'anonimizzazione)
- [x] `npm run build`, `npx tsc --noEmit`, `npm run lint` e `npm test` (116 casi, 25 file) puliti
- [ ] Verifica manuale nel browser: **in attesa** (richiedere la cancellazione da `/profilo` con
      un utente di prova, eseguirla da `/admin/account-deletion`, confermare che il contenuto
      dell'utente resti visibile con autore "Utente cancellato" e che il login precedente non
      funzioni più); non dichiarata come fatta finche' non osservata davvero

## Riconciliazione

Ultima verifica delle schede: 2026-07-23, sopra l'HEAD dopo `e3d18cd`. Mappa (con picker e
geocodifica inversa), timeline e rassegna stampa committate e verificate nel browser; fondazione
di test ADR-014 committata, job CI standard verde. Blocco Prisma/Workers rimandato al primo
deploy con fix identificato. Feature competenze verificata nel browser e committata (`60d7f16`),
insieme al fix del ritorno post-login. Reputazione e badge (ADR-015) verificati nel browser e
committati (`c2b5a87`). Mentorship verificata nel browser e committata (`17cd21e`/`4608ecf`).
Galleria foto (ADR-016) committata (`93be748`); documenti (`b33b974`); webinar ed email digest
(ADR-017, `b330de2`): con queste si chiudono tutte le nove voci di Fase 4, tutte complete nei test
automatici, nessuna ancora verificata nel browser/attivata davvero (bucket R2, account YouTube,
account Resend e deploy Cloudflare tutti in sospeso). Notifiche push committate (`e3d18cd`),
completano Fase 3, verifica manuale in attesa (chiavi VAPID da scrivere in `.env`). Hardening
(Fase 5: rate limiting/validazione/moderazione, e ora anche cancellazione account GDPR ADR-018)
completo nel codice e nei test automatici, non ancora committato; resta solo backup (Neon, da
verificare) tra i quattro assi del gruppo hardening. Google OAuth (ADR-010) chiuso il 2026-07-23:
configurazione Google Cloud Console completata e login con Google **verificato funzionante nel
browser** (non solo configurato), con in aggiunta un bug reale del service worker trovato e
corretto nella stessa sessione (vedi sezione dedicata sopra e
`refactor-17-sw-oauth-redirect.md`); non ancora committato. Vedi "Interventi manuali in sospeso"
in testa a questa scheda per il dettaglio di cosa resta da attivare a mano.
Vedi `memory/progress.md` per il dettaglio completo di ogni
feature e bug, e `memory/decisions.md` per le ADR.
