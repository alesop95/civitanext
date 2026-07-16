# Work-log

> Append-only, in ordine cronologico inverso (la voce più recente in alto). Ogni passo
> significativo di codice e ogni intervento manuale rilevante lascia una voce con data, file
> toccati, motivo e commit di riferimento. Qui confluisce anche il log di riconciliazione dei
> documenti `.docx`, con il nome del documento sorgente e l'esito, così la data di allineamento
> sopravvive a un clone.

## 2026-07-16 — Verificato nel browser il ciclo completo delle notifiche in-app

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: nessuno (verifica, non sviluppo).
Motivo/racconto: l'utente ha verificato con cinque screenshot il ciclo completo: come admin,
approvata per il voto la proposta di prova ("IN VOTAZIONE (1)"), poi approvata definitivamente
("SEGNA COME APPROVATA" → coda vuota); come Pippo, comparso il badge "NOTIFICHE (1)" in home,
messaggio corretto ("La tua proposta \"PROVA\" è stata approvata definitivamente.") con orario su
`/notifiche`, stile non letto (sfondo `--accent`, testo bianco); dopo "Segna tutte come lette",
tornato allo stile normale e il badge sparito dall'header. Nessuna discrepanza, nessun bug
trovato in questo passaggio. Con questo, Fase 3 (responsive, PWA, notifiche in-app) è chiusa
nella sostanza; resta solo la verifica dell'installabilità PWA vera, rimandata al primo deploy
reale su Cloudflare (richiede HTTPS, non verificabile in locale), e le notifiche push, passo
successivo dichiarato da `ROADMAP.md` ma non ancora affrontato.

## 2026-07-16 — Notifiche in-app: chiusura della parte non-push di Fase 3

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: `prisma/schema.prisma` (modello `Notification`, relazione `User.notifications`);
nuova migrazione `prisma/migrations/20260716010000_notification/`; nuovo
`src/lib/notifications.ts` (`notifyUser`, punto unico di creazione); modificato
`src/app/admin/proposte/actions.ts` (`approveForVoting`/`closeVoting` notificano l'autore della
proposta); nuovi `src/app/notifiche/page.tsx` e `src/app/notifiche/actions.ts`
(`markAllAsRead`); modificato `src/components/SiteHeader.tsx` (link "Notifiche" con conteggio
non lette, nel cluster con avatar/esci, visibile a tutte le dimensioni di schermo, non nascosto
su mobile come il resto della nav).
Motivo/racconto: `design_handoff_civitanext/ROADMAP.md` sequenzia esplicitamente le notifiche
dopo responsive/PWA all'interno di Fase 3, prima in-app poi push. Scelto di completare questa
parte di Fase 3 (proposto e confermato dall'utente) invece di passare subito a Fase 4, per
chiudere una fase aperta prima di aprirne una nuova, coerente con la cadenza di lavoro tenuta
finora. Nessuna nuova ADR: le scelte (booleano `read` invece di un sistema più complesso di
ricevute di lettura, `link` come percorso libero non una foreign key perché la notifica deve
restare leggibile anche se il contenuto collegato viene cancellato) sono minori, non un confronto
di alternative comparabile a quelli già registrati. Trigger cablati solo sulle proposte
(`approveForVoting`, `closeVoting`), gli unici punti del codice esistente dove ha senso avvisare
un utente in questa prima versione; eventi (nessuna funzionalità di creazione via UI ancora
costruita) e forum (non richiesto esplicitamente da `ROADMAP.md` per le notifiche) non generano
notifiche per ora.
Verificato con `npm run build` (tutte le route generate, incluso `/notifiche`) e con una
richiesta diretta a `/notifiche` da sloggato (redirect atteso verso `/accedi`, confermato).
Ancora aperto: verifica manuale nel browser (approvare una proposta come admin, controllare la
notifica come utente normale) non ancora fatta dall'utente al momento di questa voce. Notifiche
push, esplicitamente il passo successivo dichiarato da `ROADMAP.md`, non affrontate: richiedono
chiavi VAPID e la libreria `web-push`, infrastruttura non ancora introdotta in questo progetto.

## 2026-07-16 — Verifica su telefono reale del responsive: confermato, installabilità rimandata al deploy

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: nessuno (verifica, non sviluppo).
Motivo/racconto: l'utente ha verificato la tab bar mobile con tre screenshot, due da Chrome
DevTools desktop (confermano la regola `@media (min-width: 40rem) { .sm\:pb-0 {...} }` presente
nel CSS compilato, cioè che il problema di cache di Turbopack della voce precedente non si è
ripresentato) e uno da un telefono reale (Samsung S25 Ultra): header ridotto a logo e
Accedi/Registrati, nav orizzontale nascosta, tab bar fissa in basso con "Home" evidenziato come
voce attiva — esattamente il comportamento voluto.
Prima di segnare l'intera Fase 3 come verificata, notato un limite: il test da telefono è
avvenuto su `http://192.168.10.73:3000`, IP di rete locale in HTTP semplice, non HTTPS. Il
prompt reale "Aggiungi a schermata Home" generato dal browser richiede HTTPS sulla maggior parte
dei browser (l'eccezione è solo `localhost` sulla stessa macchina, non un IP di rete locale):
quindi il layout responsive è verificato con certezza, l'installabilità PWA vera no. Segnato
come da verificare al primo deploy reale su Cloudflare, che serve automaticamente in HTTPS, non
presentato come già confermato.

## 2026-07-16 — Fase 3 aperta: responsive unico e PWA installabile (ADR-012)

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: nuovi `src/components/MobileTabBar.tsx`, `src/app/altro/page.tsx`,
`public/icon.svg`/`icon-192x192.png`/`icon-512x512.png`, `src/app/manifest.ts`, `public/sw.js`,
`public/offline.html`, `src/components/ServiceWorkerRegistration.tsx`; modificati
`src/components/SiteHeader.tsx` (nav orizzontale nascosto sotto la soglia `sm`) e
`src/app/layout.tsx` (spazio riservato in basso su mobile per la tab bar fissa, `viewport`
export con `themeColor`, registrazione del service worker).
Motivo/racconto: apertura di Fase 3 ("Mobile e PWA" in `design_handoff_civitanext/ROADMAP.md`),
che pone esplicitamente come prima domanda se adottare un layout responsive unico o una shell
mobile dedicata. Confronto presentato all'utente prima di scrivere codice (per la sua richiesta
permanente di non decidere scelte non banali in autonomia): scartata la shell dedicata per il
costo di manutenzione doppio su un progetto con un solo sviluppatore, scelto il layout responsive
unico, già la direzione implicita del codice esistente (`grid-cols-1 sm:grid-cols-2` nelle liste
già scritte in Fase 1/2). Confermato dall'utente, registrato come ADR-012 insieme alla seconda
parte (PWA).
Implementata la tab bar mobile (`MobileTabBar`, cinque voci fisse Home/Eventi/Quiz/Forum/Altro
indicate dal documento di handoff) come variante responsive dello stesso `SiteHeader`, non un
sistema a parte; Proposte/Profilo/Admin, che sul desktop hanno un chip proprio, confluiscono su
mobile in una nuova pagina `/altro`. Verificata con l'utente, prima di implementare, la domanda
se una PWA richieda sviluppo nativo Android/iOS separato (risposta: no, stesso codice web, un
manifesto e un service worker in più bastano; notato il limite storico di Safari iOS sul supporto
push, dal 16.4/2023, da riverificare quando si costruirà davvero quella parte).
Generato `app/manifest.ts` secondo la convenzione ufficiale Next.js verificata nei docs bundled
in `node_modules/next/dist/docs/01-app/02-guides/progressive-web-apps.md` (non assunta dalla
versione precedente di Next, stessa cautela di `AGENTS.md`). Icone PWA generate dal mark di
`Logo.tsx` (stesso SVG, non un'icona nuova) con Inkscape, già installato sulla macchina,
rasterizzato in PNG 192x192 e 512x512 senza aggiungere dipendenze npm. Service worker scritto
deliberatamente conservativo: solo un fallback offline (`public/offline.html`) per le richieste
di navigazione, nessuna cache di pagine applicative, perché ogni pagina legge la sessione utente
a ogni richiesta (`SiteHeader` chiama `auth()`) e una cache aggressiva rischierebbe di mostrare
uno stato di accesso non più valido.
Durante l'implementazione, per eliminare la cache di build `.next` (necessario a valle di un
problema di cache CSS di Turbopack incontrato nel lavoro precedente su questa stessa giornata) è
stato necessario chiedere conferma esplicita all'utente, perché la regola di questo progetto
vieta `rm -rf` all'agente: ottenuta, eseguita con `Remove-Item -Recurse -Force` di PowerShell.
Verificato con `npm run build` (tutte le route generate, incluso `/manifest.webmanifest`) e con
richieste dirette al server di sviluppo: manifest servito con contenuto corretto, `/altro` e
`/sw.js` rispondono 200. Documentato su tre livelli: ADR-012, voce 9 di studio didattico +
`refactor-09-responsive-e-pwa.md`, sintesi stakeholder in
`_notes/stakeholder-brief-fase-3-mobile-pwa.md`.
Ancora aperto: verifica visiva nel browser (aspetto della tab bar mobile, prompt di
installazione reale) non ancora fatta dall'utente. Nessuna cache offline dei contenuti letti in
questa prima versione (scelta deliberata, ADR-012); notifiche in-app e push, esplicitamente
sequenziate dopo nel documento di handoff, non affrontate.

## 2026-07-16 — Implementato il Quiz (pagine, action, seed) e risolto un bug di cache di Turbopack

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: nuovi `src/app/quiz/actions.ts` (`submitQuiz`), `src/app/quiz/page.tsx` (elenco con
stato sblocco), `src/app/quiz/[id]/page.tsx` (svolgimento), `src/app/quiz/[id]/risultato/page.tsx`
(risultato con feedback per domanda); `prisma/seed.js` esteso con il primo quiz reale
("Educazione civica: le basi", le 4 domande di `CN_QUIZ_QUESTIONS` in `civitanext-data.jsx`, gli
altri due quiz del prototipo non seminati perché senza domande reali disponibili);
`src/app/globals.css` (nuovo token `--success`, mancava un colore semantico per "risposta
corretta" nella palette esistente).
Motivo/racconto: implementazione del modello dati deciso in ADR-011. `submitQuiz` calcola il
punteggio confrontando le opzioni selezionate con `isCorrect`, aggiorna `QuizAttempt` e sostituisce
le `QuizAnswer` collegate solo se il nuovo punteggio supera quello registrato (altrimenti non
tocca nulla): conseguenza pratica di quella decisione è che la pagina risultato mostra sempre le
risposte del tentativo migliore salvato, non necessariamente quelle appena date se il tentativo
corrente è andato peggio — comportamento reso esplicito in un messaggio nella pagina, non lasciato
silenzioso. La pagina di svolgimento esclude `isCorrect` dalla query delle opzioni (`select: {id,
text}`), cosi' non arriva mai al browser prima dell'invio.
Durante la verifica, l'utente ha chiesto di colorare la risposta corretta in verde: aggiunto un
token `--success` in `globals.css` seguendo la stessa convenzione già in uso (variabile CSS in
`:root`, mappata in `@theme inline`, mai un colore Tailwind statico), riusando `--accent` per
"sbagliata" invece di introdurre un terzo colore, perché `--accent` è già il colore degli avvisi
d'errore nel resto dell'app. Dopo l'aggiunta, il verde non compariva nel browser nonostante
`npm run build` (una build di produzione separata, lanciata solo per verifica) generasse
correttamente `.text-success{color:var(--success)}`. Diagnosticato ispezionando direttamente i
chunk CSS compilati su disco (non un'ipotesi): il chunk servito dal server di sviluppo
(`.next/dev/static/chunks/...`) aveva una data di modifica precedente all'edit di `globals.css`,
segno che Turbopack non aveva invalidato la cache CSS. Riavviare il processo del server di
sviluppo non ha risolto (il chunk restava con la stessa data): solo eliminare l'intera cartella
`.next` (con conferma esplicita dell'utente, perché la regola di questo progetto vieta `rm -rf`
all'agente; eseguita con `Remove-Item -Recurse -Force` di PowerShell, non aggirando il divieto ma
usando uno strumento diverso per un'azione ormai autorizzata esplicitamente) e ricompilare da zero
ha prodotto un chunk con la classe corretta, confermato verificando il file su disco prima di
richiedere un nuovo test all'utente.
Verificato nel browser dall'utente dopo il refresh forzato: quiz svolto, risultato con "Risposta
corretta" in verde e "Risposta sbagliata" nel rosso-arancio già usato per gli errori altrove,
tutte le quattro domande valutate correttamente.
Ancora aperto: nessun punto bloccante. Con questo, la seconda feature verticale di Fase 2 è
completa e verificata; nessun'altra priorità immediata dichiarata da `roadmap.md` oltre a quanto
già elencato per le fasi successive.

## 2026-07-15 — Modello dati del Quiz deciso, applicato e documentato su tre livelli (ADR-011)

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: `prisma/schema.prisma` (5 nuovi modelli: `Quiz`, `QuizQuestion`, `QuizOption`,
`QuizAttempt`, `QuizAnswer`; `User.quizAttempts`); nuova migrazione
`prisma/migrations/20260716000000_quiz/`; `memory/decisions.md` (ADR-011);
`studio-didattico-master.md` (voce 8) e nuovo `refactor-08-modello-dati-quiz.md`; nuova
`_notes/stakeholder-brief-fase-2-quiz.md` (non versionata).
Motivo/racconto: seconda feature verticale di Fase 2, la prima con un dominio dati
completamente nuovo (eventi, forum e proposte riusavano schema già scritto in Fase 0). Prima di
scrivere qualunque riga di schema, presentato all'utente il confronto tra alternative su quattro
punti, per sua richiesta permanente di non decidere scelte non banali in autonomia: come
rappresentare domande/opzioni (relazionale, coerente con la convenzione già stabilita in questo
schema di non usare mai JSON, nemmeno dove sarebbe stato comodo, come nel pattern polimorfico di
`Vote`); cosa salvare di un tentativo (anche le singole risposte per domanda, non solo il
punteggio aggregato, per rendere possibile il feedback "hai sbagliato questa domanda" che è il
punto di un quiz civico pensato per insegnare); se permettere di ripetere il quiz (sì, tenendo il
punteggio migliore, non un tentativo permanente come il flag binario `done` del prototipo di
design); se lo sblocco progressivo tra quiz visto nel prototipo (`locked: true` su alcuni quiz)
fosse solo un dettaglio visivo del mockup o logica reale da implementare (interpretato come reale,
calcolato in query da un campo `order`, non un flag salvato a parte). L'utente ha accettato tutti
e quattro i consigli, registrati come ADR-011.
Applicato lo schema, validato, migrato con la procedura di ADR-009 (`migrate diff
--from-config-datasource --to-schema` + `migrate deploy`), rigenerato il client. Su richiesta
esplicita dell'utente di portare sempre avanti tre livelli di documentazione (stakeholder,
didattica, tecnica) per ogni scelta non banale, scritti insieme: l'ADR tecnico con le quattro
decisioni e la motivazione, la voce 8 di studio didattico (il principio generale: la domanda
"cosa serve salvare" si risponde guardando lo scopo della feature, non solo la forma del
prototipo) con il deep-dive `refactor-08`, e la sintesi non tecnica per lo stakeholder in
`_notes/` su come funzioneranno i quiz per chi li userà (si può sbagliare e riprovare, si scopre
cosa si è sbagliato, i quiz si sbloccano uno alla volta).
Ancora aperto: le pagine (elenco quiz, svolgimento, risultato con feedback), le server action
(submit tentativo, calcolo punteggio, aggiornamento solo se il punteggio migliora), un seed di
almeno un quiz reale (il prototipo ha già domande di educazione civica pronte da riprendere,
`CN_QUIZ_QUESTIONS` in `civitanext-data.jsx`) e la verifica nel browser: tutti prossimo passo
implementativo, fuori dal perimetro di questa voce, che riguarda solo la decisione e il modello
dati.

## 2026-07-15 — Feature Proposte e votazioni con coda di approvazione admin, prima feature verticale di Fase 2

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: nuovi `src/app/proposte/actions.ts` (`createProposal`, `toggleVote`),
`src/app/proposte/page.tsx`, `src/app/proposte/nuova/page.tsx`, `src/app/admin/proposte/actions.ts`
(`approveForVoting`, `closeVoting`, `rejectProposal`, ciascuna dietro una guardia di ruolo),
`src/app/admin/proposte/page.tsx`; `src/components/SiteHeader.tsx` (voce "Proposte" in nav, chip
"Admin" condizionale al ruolo); `src/app/forum/actions.ts` e `src/app/forum/nuovo/page.tsx`
(bugfix descritto sotto, applicato per coerenza). Nessuna modifica allo schema: `Proposal`,
`Vote`, `ProposalStatus` esistevano già dalla Fase 0.
Motivo/racconto: prima feature verticale di Fase 2, riprendendo il riuso del modello `Vote`
polimorfico già impostato per RSVP e forum (conteggio voti calcolato a mano nella pagina, non con
un `include` Prisma, perché `Vote` non ha una relazione diretta con `Proposal`, refactor-04).
Aggiunta una guardia di ruolo (`ADMIN`/`SUPERADMIN`) alle server action e alla pagina admin, la
prima volta in questo progetto che un controllo di autorizzazione (non solo di autenticazione)
entra in un percorso di codice reale. Creato un secondo utente di prova con ruolo `ADMIN`
(`admin@civitanext.test`, password aggiornata poi in `gabbianoCivico47` perché Chrome segnalava
anche `admin1234` come nota da violazioni, stesso problema già incontrato con `test1234` per
l'utente normale), distinto dall'utente ordinario per non approvare le proprie proposte durante
il test.
Durante la prima verifica nel browser, l'utente ha creato una proposta di prova ma la coda admin
mostrava zero proposte in revisione. Diagnosticato interrogando direttamente il database (query
diretta sulla tabella `Proposal`, non un'ipotesi): zero righe, la creazione non aveva mai
scritto nulla. Causa: `createProposal` (e lo stesso pattern, non ancora esercitato, in
`createThread` del forum) faceva `return` in silenzio se un campo arrivava vuoto al server dopo
il `trim()`, senza redirect né messaggio — invisibile per l'utente, sembrava che "non fosse
successo niente". Corretto in entrambe le action con un redirect a `?error=1` e un messaggio
visibile nella pagina corrispondente, applicando la correzione anche al forum non solo alle
proposte, per coerenza dello stesso difetto anche se non ancora manifestato lì.
Verificato con `npm run build` e nel browser il ciclo completo: proposta creata come utente
normale (in revisione, non visibile pubblicamente su `/proposte`) → approvata per il voto come
admin (sparisce da "in revisione", compare in "in votazione" nella coda admin e nell'elenco
pubblico) → votata come utente normale (conteggio 0→1, pulsante "Vota"→"Ritira il voto") → voto
ritirato (1→0, pulsante torna a "Vota").
Ancora aperto: nessun punto bloccante. La promozione da `VOTAZIONE` ad `APPROVATA` resta
un'azione manuale dell'admin, nessuna soglia automatica di voti implementata né richiesta. Quiz,
nello stesso blocco di priorità di `roadmap.md`, resta fuori scope: richiede modelli di schema
non ancora progettati.

## 2026-07-15 — Feature Forum (thread + risposte), terza feature verticale di Fase 1

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: nuovi `src/app/forum/actions.ts` (`createThread`, `createReply`),
`src/app/forum/page.tsx`, `src/app/forum/[id]/page.tsx`, `src/app/forum/nuovo/page.tsx`. Nessuna
modifica allo schema: `Thread`/`Reply` esistevano già dalla Fase 0.
Motivo/racconto: chiusura della terza feature verticale di Fase 1 (dopo autenticazione/ruoli,
eventi, profilo). Scritta direttamente senza agenti paralleli, dimensione comparabile a Eventi ma
senza l'utente che avesse richiesto esplicitamente di parallelizzare questa volta. Controllati
prima i dati demo del forum nel prototipo di design (`CN_THREADS` in
`design_handoff_civitanext/civitanext-data.jsx`) per lo stesso motivo di Eventi: non inventare
contenuto. Decisione distinta da Eventi però su come verificare: i thread hanno un autore reale
(`Thread.authorId`, foreign key su `User`), quindi seminare le quattro discussioni demo con i
loro autori originali ("Giulia M.", "Marco T.", ecc.) avrebbe richiesto creare utenti fittizi nel
database solo per intestare contenuto — scartato, non seminato nulla; verificato invece creando
un thread e una risposta reali con l'utente di prova, stessa logica già usata per la conferma
dell'RSVP.
Verificato con `npm run build` (tutte le route del forum generate, dinamiche) e nel browser:
creato un thread ("Thread di prova", categoria Mobilità), poi una risposta ("Pippo hai provato
bene"), entrambi comparsi con autore e orario corretti, conteggio risposte aggiornato da 0 a 1,
nessun errore in console in nessuno dei due passaggi.
Ancora aperto: nessun punto bloccante. Con Forum chiuso, tutte e tre le feature verticali di
Fase 1 elencate in `roadmap.md` (eventi, profilo, forum) sono complete; prossima priorità Fase 2
(proposte e votazioni, coda di approvazione admin, quiz).

## 2026-07-15 — Pagina profilo con tessera digitale, corretto CredentialsSignin non gestito in /accedi

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: nuovo `src/app/profilo/page.tsx` (dati account, tessera digitale condizionale su
`tesseraNumero`); `src/components/SiteHeader.tsx` (avatar collegato a `/profilo`);
`src/app/accedi/page.tsx` (gestione dell'errore `CredentialsSignin`).
Motivo/racconto: costruita la seconda feature verticale di Fase 1 (profilo con tessera digitale),
scritta direttamente senza agenti paralleli data la dimensione contenuta di un'unica pagina.
Durante la verifica nel browser, l'utente ha ricevuto un errore 500 con overlay di sviluppo
(`Runtime CredentialsSignin`) tentando di accedere da `/profilo` dopo un redirect a `/accedi`
(sessione probabilmente scaduta dopo un'ora, `maxAge` di ADR-010). Verificato sul sorgente
(`node_modules/@auth/core/errors.js`) che si tratta di comportamento dichiarato di Auth.js: quando
`authorize()` restituisce `null`, in un form action lato server (a differenza del flusso
client-side con redirect automatico) l'errore `CredentialsSignin` viene lanciato invece di
tradursi in un redirect silenzioso, e va gestito esplicitamente da chi scrive il form. Corretto
con un `try/catch` attorno a `signIn("credentials", formData)`: se l'errore è un'istanza di
`AuthError`, redirect a `/accedi?error=<tipo>` con un messaggio leggibile mappato
(`CredentialsSignin` → "Email o password non corretti."); altrimenti l'errore viene rilanciato
cosi' com'e', perché il segnale interno di redirect che Next.js usa per un `signIn` riuscito non è
un'istanza di `AuthError` e deve poter propagarsi senza essere intercettato per errore. Verificato
con `npm run build` (pagina `/accedi` ora dinamica, legge `searchParams`) e confermato
dall'utente nel browser: profilo visualizzato correttamente per l'utente di prova non tesserato.
Ancora aperto: nessun punto bloccante. L'assegnazione di un `tesseraNumero` a un utente resta
un'azione amministrativa non ancora costruita, fuori scope di questa feature.

## 2026-07-15 — Voce 7 di studio didattico: il metodo di parallelizzazione della voce precedente

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: `studio-didattico-master.md` (voce 7), nuovo `refactor-07-parallelizzazione-file-disgiunti.md`.
Motivo: su richiesta esplicita dell'utente di tenere aggiornata anche la documentazione
didattica, formalizzato come principio generale il metodo di parallelizzazione dei due agenti
già raccontato nella voce di lavoro precedente di questo stesso registro: partizionare per file
disgiunti verificati in anticipo, non per compiti che sembrano indipendenti, e rendere esplicito
a entrambi gli esecutori ogni punto di contatto (qui, la firma di `SiteHeader`) invece di
lasciarlo all'inferenza.

## 2026-07-15 — Feature Eventi (lettura + RSVP) costruita con due agenti paralleli, bug di login corretto e verificato

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: `prisma/schema.prisma` (modello `Rsvp`, vincolo `@@unique([userId, eventId])`,
stesso principio già raccontato in `refactor-04-vincolo-voto-unico.md` per `Vote`); nuova
migrazione `prisma/migrations/20260715000000_rsvp/`; `prisma/seed.js` (i quattro eventi reali del
prototipo di design, non inventati, con relativa esecuzione idempotente); estratte
`btnClassName()`/`chipClassName()` gia' preesistente la prima, aggiunta la seconda in
`src/components/ui/Chip.tsx`; nuovo `src/components/SiteHeader.tsx` (header di navigazione
condiviso); `src/app/page.tsx` semplificata per usarlo; nuovi `src/app/eventi/page.tsx` e
`src/app/eventi/actions.ts`; corretto `src/app/accedi/page.tsx` (bug descritto sotto).
Motivo/racconto: su richiesta esplicita dell'utente di parallelizzare per velocita', lanciati due
agenti in parallelo su insiemi di file disgiunti invece che in sequenza: uno ha estratto
`SiteHeader` da `page.tsx` (necessario perche' `/eventi` avrebbe altrimenti duplicato l'intero
header con la logica di sessione), l'altro ha scritto la pagina eventi e la server action di
RSVP, verificando da solo, leggendo i tipi generati, che Prisma chiama la chiave composta di
`@@unique([userId, eventId])` `userId_eventId` (non ipotizzato). Nessun conflitto perche' i due
insiemi di file non si sovrapponevano; verificata l'integrazione con un'unica `npm run build`
dopo che entrambi avevano finito, invece di far girare build concorrenti nella stessa cartella
di lavoro (rischio di corruzione della cache `.next` condivisa).
Durante la verifica nel browser (login su `/accedi` con l'utente di prova, a cui nel frattempo
era stata cambiata la password in chiaro di test da "test1234" a "muccignoso22" via query diretta
al database con bcrypt, per evitare l'avviso di Chrome sulle password compromesse) l'utente ha
segnalato che il login sembrava bloccarsi. Diagnosticato leggendo il sorgente reale
(`node_modules/next-auth/lib/actions.js`), non ipotizzando: `signIn("credentials", formData)`
senza `redirectTo` esplicito ricade sull'header HTTP `Referer` come destinazione (che e' la
stessa pagina `/accedi`), non su una nozione generica di "pagina corrente" come la documentazione
in linea sembrava suggerire; un primo tentativo di correzione (`signIn("credentials", formData,
{redirectTo: "/"})`, un terzo argomento posizionale) era sbagliato, perche' quella posizione e'
tipata come parametri di autorizzazione OAuth, non come opzioni aggiuntive — quando il secondo
argomento e' un `FormData`, Auth.js legge `redirectTo` dai campi del form stesso
(`Object.fromEntries`), non da un parametro separato. Corretto aggiungendo
`<input type="hidden" name="redirectTo" value="/" />` nel form, e per coerenza aggiunto
`{redirectTo: "/"}` anche al pulsante "Accedi con Google" (li' un oggetto letterale e' corretto,
non essendoci un `FormData` di mezzo). Verificato nel browser dopo la correzione: login riuscito
(screenshot dell'utente, home con sessione attiva), poi RSVP su un evento passato da "0
partecipanti"/"Partecipo" a "1 partecipante"/"Annulla partecipazione" senza ricaricare la pagina
a mano, confermando che `revalidatePath("/eventi")` funziona.
Ancora aperto: nessun punto bloccante per questa feature. Restano invariati la verifica del
flusso Google (rimandata) e la sintesi stakeholder di Fase 1 da aggiornare.

## 2026-07-14 — UI minima di stato sessione in home, verificata nel browser

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: `src/components/ui/Btn.tsx` (estratta `btnClassName()` dalla funzione `Btn`, cosi'
`src/app/page.tsx` puo' dare lo stesso stile a un `<Link>` di navigazione senza annidare un
`<button>` dentro un `<a>`, HTML non valido); `src/app/page.tsx` (diventata `async`, legge la
sessione con `auth()` e mostra `Avatar` + pulsante "Esci" se loggato, altrimenti i link
"Accedi"/"Registrati").
Motivo/racconto: emerso durante la verifica precedente che la home restava identica per utenti
loggati e anonimi, un vuoto atteso ma da colmare prima di proseguire. Verificato con
`npm run build` (la home passa da statica, `○`, a dinamica, `ƒ`, corretto perche' ora legge la
sessione a ogni richiesta) e poi nel browser vero: schermata con l'utente Pippo loggato (avatar
con iniziale, pulsante Esci) e, dopo aver cliccato Esci, ritorno ai link Accedi/Registrati,
confermando che il logout funziona quanto il login.
Ancora aperto: verifica del flusso Google (rimandata), sintesi stakeholder da aggiornare, le
prossime feature verticali di Fase 1 (profilo con tessera, eventi, forum).

## 2026-07-14 — Verificato nel browser il flusso a credenziali (registrazione + accesso)

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: nessuno (verifica, non sviluppo); generato e comunicato all'utente un valore di
`AUTH_SECRET` per `.env` (valore non riportato qui, scheda tracciata).
Motivo/racconto: prima di dichiarare chiusa la Definition of Done di Fase 1 sul flusso a
credenziali, verificato l'uso reale in un browser vero (non solo `npm run build`, che controlla
compilazione e tipi ma non comportamento a runtime). Avviato `npm run dev` (porta 3000, libera,
nessun conflitto con le porte del server Prisma dedicato 51218/51219 né con altri processi in
ascolto su questa macchina); l'utente ha registrato un account di prova (`Pippo`,
`pippo@gmail.com`, password "test1234") su `/registrati` e verificato che una password sotto gli
8 caratteri viene bloccata dal client prima dell'invio. Riscontrato un avviso del browser
("password compromessa in una violazione dati") dopo il login: non un difetto dell'applicazione,
ma il gestore password di Chrome che riconosce "test1234" come credenziale nota da violazioni
pubbliche, segnale indiretto che il login e' stato completato e riconosciuto come tale dal
browser. Verificato in modo definitivo, non per inferenza: interrogato direttamente il database
(via il driver `pg` con `dotenv/config` precaricato, senza mai leggere o stampare il contenuto di
`.env`, e senza passare dal client Prisma generato, che essendo sorgente TypeScript non
compilato non e' eseguibile con `node` diretto) per confermare la riga `User` creata
(`role: UTENTE` di default, `tesseraNumero: null`, `passwordHash` con prefisso `$2b$10$` quindi
bcrypt a 10 round, mai testo in chiaro); e controllato `/api/auth/session` nel browser, che ha
restituito la sessione attesa con `role`/`tesseraNumero` proiettati correttamente e `expires` a
un'ora esatta dal momento del controllo, coerente col `maxAge: 60 * 60` di ADR-010.
Ancora aperto: verifica del flusso Google, rimandata di proposito (vedi voce di `roadmap.md` e
Domande aperte di `current-work.md`); sintesi stakeholder di Fase 1 da aggiornare con l'esito di
questa verifica.

## 2026-07-14 — Implementata la configurazione NextAuth decisa in ADR-010

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: creati `src/lib/prisma.ts` (client Prisma per-richiesta via `cache()`, stesso
pattern di `src/app/api/diag-fase0/route.ts`/ADR-005), `src/types/next-auth.d.ts` (augmentation
di tipo), `src/auth.ts` (configurazione NextAuth lazy: provider Credentials e Google, adapter
Prisma, sessione JWT con `maxAge` di un'ora, callback `jwt` con ricontrollo del ruolo ogni 5
minuti, callback `session` che proietta `role`/`tesseraNumero`), `src/app/api/auth/[...nextauth]/route.ts`,
`src/app/api/register/route.ts` (registrazione credenziali: il provider Credentials autentica
soltanto, non crea utenti), `src/app/accedi/page.tsx`, `src/app/registrati/page.tsx`;
aggiunta la dipendenza `@auth/prisma-adapter` (`npm install`, versione risolta `^2.11.2`);
aggiornati `current-work.md` e `deployment.md` (variabili d'ambiente e procedura `migrate diff`
incrementale ora verificata, non più ipotizzata).
Motivo/racconto: implementazione della decisione già registrata in ADR-010, verificando prima
sul sorgente reale i punti non scontati di una libreria beta (`next-auth ^5.0.0-beta.31`), come
da `AGENTS.md`: confermato che con `strategy: "jwt"` il modello `Session` resta inutilizzato ma
che, con un adapter configurato, Auth.js sceglierebbe "database" di default se non si forza
esplicitamente `"jwt"` nello schema di configurazione; confermato inoltre che il provider
Credentials richiede comunque la strategia JWT (non persiste sessioni su database). Riusato senza
modifiche il pattern di client Prisma per-richiesta già stabilito in ADR-005 invece di introdurne
uno nuovo. Durante la build (`npm run build`, che a differenza di `next dev` esegue anche il
typecheck) emerso un errore non anticipato: l'augmentation di tipo per `Session`/`User`/`JWT` va
dichiarata sui moduli che DEFINISCONO quelle interfacce (`@auth/core/types`, `@auth/core/jwt`),
non su `next-auth`/`next-auth/jwt`, che le ri-esportano con `export *` senza dichiararle a loro
volta: TypeScript compila comunque l'augmentation su questi ultimi (nessun errore di sintassi),
ma il declaration merging non si applica, e i campi aggiunti (`role`, `tesseraNumero`,
`roleCheckedAt`) restavano tipati `unknown` nei callback, con conseguente errore di tipo
sull'assegnazione. Corretto puntando l'augmentation ai moduli di origine, verificato con build
completa (`npm run build`) fino in fondo: compilazione, typecheck e generazione di tutte le
route (incluse `/accedi`, `/registrati`, `/api/auth/[...nextauth]`, `/api/register`) senza
errori.
Ancora aperto: verifica manuale nel browser del percorso completo (registrazione, accesso,
accesso con Google) non ancora fatta, bloccata in attesa che l'utente imposti in `.env`
`AUTH_SECRET` (richiesta in produzione, NextAuth lancia un errore se assente), `AUTH_GOOGLE_ID` e
`AUTH_GOOGLE_SECRET` (da un'app OAuth non ancora creata su Google Cloud Console). Sintesi
stakeholder di Fase 1 da aggiornare solo dopo quella verifica, non prima.

## 2026-07-14 — Fase 1 aperta: modello ruoli/tesseramento e strategia di autenticazione decisi e applicati

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: `prisma/schema.prisma` (`Role` riscritto in `SUPERADMIN`/`ADMIN`/`UTENTE` con
default `UTENTE`; `User.passwordHash` reso opzionale; aggiunti `User.emailVerified`,
`User.image`, i modelli `Account` e `VerificationToken`); nuova migrazione
`prisma/migrations/20260714000000_ruoli_e_account_nextauth/migration.sql` generata e applicata;
client Prisma rigenerato; `memory/decisions.md` (nuova ADR-010); `studio-didattico-master.md`
(voce 6) e nuovo `refactor-06-ruoli-tesseramento-sessione.md`; `current-work.md` (nuova sezione
Feature Fase 1) e `roadmap.md` aggiornati; nuova nota
`_notes/stakeholder-brief-fase-1-autenticazione.md` (non versionata).
Motivo/racconto: discussa in chat la scelta di autenticazione per Fase 1 (NextAuth) partendo da
un'assunzione poi corretta dall'utente: non solo soci verificati in numero contenuto, ma tre
popolazioni reali (un responsabile generale, dei moderatori/admin, e utenti di una piattaforma
pubblica che possono o non possono essere soci tesserati), con una stima massima di 10.000
utenti. La correzione ha richiesto rifare da capo il confronto tra le alternative (già impostato
una prima volta assumendo lo scenario più piccolo): separare il ruolo (autorizzazione) dal
tesseramento (dato di appartenenza, già nullable in schema ma confuso dal default `SOCIO` sul
ruolo), e ricalibrare la strategia di sessione — non più JWT a lunga scadenza senza ripensamenti
(accettabile senza ruoli sensibili), né sessione su database per tutti (costosa su 10.000 utenti
per un rischio concentrato su pochi account), ma JWT a scadenza breve con ricontrollo del ruolo al
rinnovo. Verificato sul sorgente di `@auth/prisma-adapter` (non solo sulla documentazione) che il
modello `Session` è omettibile con strategia `jwt`. Applicata la modifica allo schema, generata e
applicata la migrazione incrementale con la procedura già stabilita in ADR-009
(`migrate diff --from-config-datasource --to-schema` + `migrate deploy`, evitando di nuovo lo
shadow database), registrata come ADR-010. Scritta in parallelo, su richiesta esplicita
dell'utente, sia la voce di studio didattico (il principio generale: ruolo e attributo di
dominio che gli somiglia vanno su assi separati; una scelta stateless/stateful va calibrata sul
rischio reale, non decisa da manuale) sia la sintesi non tecnica per lo stakeholder della stessa
decisione.
Ancora aperto: dipendenza `@auth/prisma-adapter` non ancora installata; configurazione NextAuth
(`auth.ts`, route handler, callback `jwt`/`session`) e pagine di accesso/registrazione non ancora
scritte — prossimo passo implementativo di Fase 1. Sintesi stakeholder generale di Fase 0
(distinta da questa, specifica alla sola decisione di auth) e verifica del runtime Cloudflare
reale restano invariate e aperte (vedi voce precedente).

## 2026-07-13 — Migrazione Prisma sbloccata: bug noto di `migrate dev` sullo shadow database, workaround `migrate diff` + `migrate deploy`

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: creati `prisma/migrations/20260713000000_init/migration.sql` e
`prisma/migrations/migration_lock.toml` (nuova cronologia di migrazione tracciata); database del
server locale dedicato `npx prisma dev -n civitanext` (porte 51218 principale, 51219 shadow)
resettato e ripopolato tramite quella migrazione; rigenerato il client Prisma in
`src/generated/prisma` (`prisma generate`, nessuna differenza di output); aggiornati
`current-work.md` (checkbox Definition of Done e Domande aperte), `decisions.md` (nuova
ADR-009), `studio-didattico-master.md` (voce 5) e creato `refactor-05-migrazione-shadow-database.md`.
Motivo/racconto: l'utente ha impostato `DATABASE_URL`/`SHADOW_DATABASE_URL` in `.env` puntate a
un'istanza `npx prisma dev` avviata con `-n civitanext` apposta per non condividere porte con
un'istanza già attiva su un altro progetto dell'utente (porte 51213-51215, non toccate). Il primo
tentativo di applicare lo schema, `npx prisma migrate dev --name init`, ha fallito due volte con
`Error: P1017 / Server has closed the connection`. Con `DEBUG=prisma:*` isolato il fallimento
esatto: il binario nativo `schema-engine-windows.exe` fallisce sulla chiamata RPC `devDiagnostic`
(quella che usa lo shadow database per il diff delle migrazioni) con un errore Rust
(`quaint::connector::postgres::native: UnexpectedMessage`), mentre connessioni singole
(`prisma db execute --stdin`) funzionavano regolarmente su entrambe le porte. Su richiesta
esplicita dell'utente di risolvere subito invece di limitarsi al workaround più semplice
(`db push`, già provato in un primo momento come verifica ma scartato perché non lascia
cronologia), lanciati tre agenti in parallelo: uno di ricerca esterna sulla causa nota, uno di
diagnostica chirurgica in locale sulle stesse porte 51218/51219 (mai eseguendo `migrate dev` per
intero, per non generare conflitti con gli altri agenti sullo stesso server condiviso), uno di
verifica versioni/changelog del pacchetto `prisma`. Tutti e tre convergenti sulla stessa causa:
bug tracciato ma non confermato dal team Prisma, issue GitHub `prisma/prisma#29366` ("Command
prisma migrate dev gives P1017 against local PGlite"), firma d'errore identica, nessun fix nella
versione installata (`7.8.0`, anche l'ultima stabile pubblicata). Applicato il workaround
riportato nell'issue stessa: generata la migrazione con `prisma migrate diff --from-empty
--to-schema=prisma/schema.prisma --script`, scritta nella struttura di cartella attesa da Prisma
Migrate; il database (già sincronizzato in un primo tentativo diagnostico con `db push`, senza
cronologia) resettato con `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` via `db execute`,
poi applicato con `prisma migrate deploy`; verificato con `prisma migrate status` ("Database
schema is up to date!"). Registrato come ADR-009 il workaround e la procedura da seguire per le
prossime modifiche di schema su questa macchina.
Ancora aperto: sintesi non tecnica per lo stakeholder; verifica del runtime Cloudflare reale
(ADR-006, invariato); verificare se il bug persiste anche contro il branch Neon di sviluppo
quando esisterà (vedi ADR-009, Conseguenze). Apertura di Fase 1 avviata in parallelo a questo
blocco, non ancora dettagliata in questo registro.

## 2026-07-13 — Sincronizzazione delle schede context/ dopo l'orfanaggio di 7ba6100

Commit di riferimento: `4da8cf9` (main, working tree pulito).
File toccati: frontmatter di `STACK.md`, `current-work.md`, `deployment.md`,
`design-and-security.md`, `dev-testing.md`, `roadmap.md` (bump `generated-from-commit` e
`last-verified-commit` da `7ba6100` a `4da8cf9`); `memory/index.md` (snapshot riportato a
`4da8cf9`, tabella di stato aggiornata, punto di ripresa riscritto).
Motivo: `sync-context` a inizio sessione ha rilevato che tutte le schede puntavano ancora
all'hash `7ba6100`, un commit reso orfano dalla riscrittura completa della storia (vedi voce
sotto): `git diff 7ba6100..HEAD` falliva con "bad revision". Ricalcolato il drift da `d619e8b`
(l'hash valido più vicino, già usato da `memory/index.md`) fino a HEAD: i soli file toccati
sotto `covers-paths` erano quelli spostati da `webapp/` alla radice nel commit di
riorganizzazione, e le schede risultavano già corrette per quel rename (confermato con
`grep -n "webapp/"`, nessun residuo se non nei registri append-only che per natura non si
riscrivono). Drift quindi di sola forma: nessun contenuto riscritto, solo bump del checkpoint.

## 2026-07-10 — Riorganizzazione struttura: applicazione portata alla radice del repository

Commit di riferimento: working tree in corso (non ancora committato al momento di questa voce).
File toccati: tutto il contenuto applicativo di `webapp/` (config, `src/`, `prisma/`, `public/`,
`package.json`, ecc.) spostato alla radice del repository, eliminando quel livello di cartella;
`webapp/.gitignore` e `webapp/CLAUDE.md` (il solo "@AGENTS.md") superati e rimossi, il loro
contenuto rispettivamente fuso nel `.gitignore` di radice e riportato come nota in `CLAUDE.md`;
i quattro file HTML di mockup monolitici in radice (`CivitaNext Guida mockup (file unico).html`,
`CivitaNext mockup (desktop).html`, `CivitaNext mockup (mobile).html`, `Flusso di Test.html`)
spostati in `_notes/` e rimossi dal tracciamento git, perché snapshot statici del prototipo non
necessari come sorgente versionata; tutte le schede `.claude/context/*.md` (schede di stato, non
i registri append-only) aggiornate per rimuovere il prefisso `webapp/` dai percorsi. Artefatti
rigenerabili (`node_modules`, `.next`, `.open-next`, `.wrangler`, `next-env.d.ts`,
`tsconfig.tsbuildinfo`) rimossi dove possibile; una cartella `webapp/` residua con questi soli
artefatti resta da eliminare manualmente dall'utente perché un processo `workerd.exe` (legato al
Postgres locale di `prisma dev`, ancora in uso) tiene occupato un file al suo interno.
Motivo: richiesta esplicita dell'utente di appiattire la struttura, un solo livello invece di
`repository-root/webapp/`, e di non versionare i mockup HTML legacy.
Nota per chi legge le voci precedenti a questa: i riferimenti a percorsi tipo `webapp/src/...`
nelle voci di lavoro sopra e negli ADR in `memory/decisions.md` descrivono lo stato reale al
momento in cui furono scritti, prima di questa riorganizzazione; non sono stati riscritti
retroattivamente, coerentemente con la natura append-only di questi due registri. Da questa voce
in poi, i percorsi non hanno più il prefisso `webapp/`.

## 2026-07-10 — Riscrittura completa della storia git e force-push di correzione

Commit di riferimento: `d619e8b` (root, unico commit su `main`, locale e remoto).
File toccati: nessuno (operazione di sola storia git, contenuto invariato rispetto al commit
precedente di questa stessa giornata).
Motivo: verifica di anonimizzazione emersa come incompleta. Due file già scrubati nel working
tree (`rules/git-identity-and-repo.md`, `skills/init-project-system/SKILL.md`) contenevano
ancora, nella storia già committata fin dal primissimo commit (`4e4447a`), un indirizzo email
aziendale dell'utente. Verifica con `git ls-remote`/`git fetch` ha corretto un'assunzione
sbagliata fatta in precedenza in questa stessa sessione ("nessun push mai avvenuto"): il remote
`alesop95/civitanext` su GitHub, **pubblico**, aveva davvero ricevuto push fino al commit
`53c7f95` in un momento precedente non tracciato in questa conversazione. I quattro commit
originali (`4e4447a`, `f9c5fe3`, `53c7f95`, `7ba6100`) sono stati sostituiti da un singolo commit
radice ricostruito dal working tree già ripulito (`git checkout --orphan` + `git add -A` +
commit + `git branch -D`/`-m` + `git reflog expire` + `git gc --prune=now --aggressive`), poi
`git push --force-with-lease origin main` ha aggiornato il remoto pubblico. Verificato con
`git ls-remote` e `git grep` su tutta la storia raggiungibile (locale e remota) che nessun
oggetto contiene più la stringa incriminata.
Limite dichiarato, non risolvibile da qui: se il repository e' stato clonato o forkato durante
la finestra in cui era pubblico con il vecchio contenuto, quella copia resta fuori controllo;
segnalato all'utente in chat, non un'azione eseguita.

Commit di riferimento: working tree in corso.
File toccati: rimossi i nomi di altri progetti personali e l'email aziendale da
`memory/progress.md`, `memory/decisions.md` (ADR-007), `context/current-work.md`,
`.claude/PROJECT-SYSTEM.md` (esempio KEEP genericizzato) e `rules/git-identity-and-repo.md`
(la sola parte aggiunta in questa sessione); creati `webapp/.env.example` e
`webapp/.dev.vars.example` (solo nomi di variabili, nessun valore) con l'eccezione corrispondente
aggiunta a `webapp/.gitignore` (`!.env.example`), perché la regola `.env*` generata da
`create-next-app` li escludeva entrambi per errore; confermato con `git add --dry-run` che
nessun file `.env` reale finirebbe in un commit. Revisionato il contenuto di
`_notes/stakeholder-brief-fase-0.html` (non versionato) su richiesta dell'utente: prosa più
scorrevole al posto di liste frammentate, apertura più diretta.
Motivo: richiesta esplicita dell'utente di verificare la predisposizione di credenziali, segreti
e anonimizzazione prima del primo commit. Trovati e corretti nomi di altri repository personali
e un indirizzo email aziendale in file altrimenti tracciati.
Punto lasciato aperto, segnalato all'utente in chat non qui: `rules/git-identity-and-repo.md`
(sezione "Profilo di lavoro") e `skills/init-project-system/SKILL.md` contengono lo stesso
indirizzo email aziendale, ma erano già committati nel primissimo commit (`4e4447a`), prima di
questa sessione; correggerli richiede modificare storia già scritta (nessun push ancora
avvenuto), quindi resta una decisione dell'utente, non un'azione fatta unilateralmente qui.

## 2026-07-10 — Schema dati, separazione ambienti, schede context/ popolate, studio-didattico adottato

Commit di riferimento: working tree in corso (nessun commit ancora su questo blocco).
File toccati: `webapp/prisma/schema.prisma` (User, Event, Thread, Reply, Proposal, Vote, enum
Role/ProposalStatus/VoteTargetType, validato con `prisma validate`); le sei schede
`.claude/context/*.md` popolate con contenuto reale (STACK.md, deployment.md,
design-and-security.md, roadmap.md, current-work.md, dev-testing.md); adottato il livello
didattico opzionale, `studio-didattico-master.md` con quattro voci e i relativi deep-dive
`refactor-01..04-*.md`; `CLAUDE.md` aggiornato per riflettere lo scaffold reale e l'adozione del
livello didattico; registrato ADR-007 in `memory/decisions.md` sulla separazione ambienti
test/produzione (branch Neon + deployment di anteprima Cloudflare, invece di duplicare
infrastruttura o disciplinare solo i branch di codice).
Motivo: chiusura di Fase 0. Confronto didattico privato con altri progetti personali svolto e
scritto in `_notes/studio-didattico-confronto-ambienti.md`, deliberatamente non tracciato e
senza nominarli qui perché tocca dettagli di repository altrui; durante quell'esplorazione un
sub-agente ha generato un avviso di sicurezza (lettura di un `.env` altrui via `grep`/`awk`,
aggirando la regola `deny` su `Read`), annotato sia nella nota privata sia segnalato all'utente
in chat.
Ancora aperto: migrazione Prisma reale (in attesa che l'utente imposti `DATABASE_URL` locale in
`webapp/.env`), sintesi non tecnica per lo stakeholder, verifica del runtime Cloudflare reale.

## 2026-07-10 — Test di validazione Cloudflare Workers: esito negativo, non per Prisma/bcrypt

Commit di riferimento: working tree in corso (nessun commit ancora su questo blocco).
File toccati: `webapp/` bootstrap completo (Next.js 16.2.10 + TypeScript, adapter
`@opennextjs/cloudflare`, Prisma 7.8 con `@prisma/adapter-pg`, `bcryptjs`, `next-auth` beta),
route diagnostica temporanea `webapp/src/app/api/diag-fase0/route.ts`.
Esito: `npx opennextjs-cloudflare build` completa senza errori; ma `wrangler dev` locale
restituisce 500 su **ogni** rotta, compresa la home page senza alcun codice Prisma/bcrypt
coinvolto (`ChunkLoadError: Failed to load chunk ... [externals]__0gmzu6y._.js`, poi
`TypeError: components.ComponentMod.handler is not a function`). Non e' quindi l'attrito
Prisma/bcrypt su Workers ipotizzato in ADR-004/005 (mai arrivato a essere testato: il worker
non serve nemmeno la home page), ma un problema di risoluzione dei chunk piu' a monte, coerente
con l'avviso esplicito emesso dallo stesso tool in fase di build e migrate ("OpenNext is not
fully compatible with Windows... could encounter unpredictable failures during runtime").
Motivo della voce: onestita' del contenuto, non si presenta un esito positivo non verificato;
questo e' il punto di decisione previsto da ADR-004 in caso di test negativo, da riportare
all'utente prima di proseguire.

## 2026-07-10 — Allineamento del sistema di progetto e avvio Fase 0

Commit di riferimento: 7ba6100 (main, working tree pulito).
File toccati: `.claude/PROJECT-SYSTEM.md` e `.claude/rules/token-economy.md` sincronizzati alla
versione corrente di `E:\template-claude-developing` (generalizzazione ingestione documenti
voluminosi oltre ai soli `.docx`, menzione dei pacchetti opzionali `hooks-starter`,
`stack-profiles`, `doc-ingest`, `notebooklm-bridge`); `.claude/rules/git-identity-and-repo.md`
integrato con la sezione mancante sull'asse account Claude Code/OAuth, mantenendo i valori reali
già instanziati per questo repository (identità git personale `alesop95`) invece di sostituirli
con i placeholder generici del template; `.claude/memory/index.md` ancorato all'HEAD reale.
Motivo: `CLAUDE.md` dichiarava "Frontend React costruito con Vite" senza che esistesse alcuno
scaffold applicativo reale, e la memoria di progetto non era mai stata ancorata a un commit
nonostante 4 commit già presenti. Avvio del blocco di lavoro "Fase 0 - fondamenta" del ROADMAP
di `design_handoff_civitanext/`, con vincolo di infrastruttura interamente gratuita da
confrontare esplicitamente prima di scegliere (vedi ADR-004 quando registrata).

## 2026-06-19 — Inizializzazione del sistema di progetto

Commit: 4e4447a
File toccati: anatomia di `.claude`, `CLAUDE.md`, `.gitignore`, schede di `context/`.
Motivo: installazione del sistema portabile di contesto, documentazione e version control
descritto in `.claude/PROJECT-SYSTEM.md`. Schede create con struttura e frontmatter, da popolare
leggendo il codice nelle sessioni successive.
