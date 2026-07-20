# Registro delle decisioni architetturali

> Convenzione ADR-lite, append-only. Ogni decisione architetturale non ovvia entra come voce
> numerata con data, stato, contesto, decisione, motivazione e conseguenze. Una decisione non si
> cancella e non si riscrive: quando viene superata, si aggiunge una nuova voce che dichiara di
> superare la precedente e ne cita il numero. Le inferenze non confermate si marcano come da
> verificare e si promuovono a decisione solo quando una fonte le conferma.

## ADR-001 — Adozione del sistema di progetto portabile

Data: 2026-06-19
Stato: accettata
Contesto: il progetto necessita di uno stato interamente recuperabile da un clone e di
documentazione che resti allineata al codice senza rilettura integrale a ogni sessione.
Decisione: adottare il sistema descritto in `.claude/PROJECT-SYSTEM.md`, con motore di
riconciliazione ancorato ai commit e doppio livello documentale tracciato/ignorato.
Motivazione: persistenza strutturale su disco indipendente dalla sessione di chat, e controllo
umano sul versionamento.
Conseguenze: ogni passo significativo aggiorna schede, `last-verified-commit`, snapshot e
work-log; commit e push restano manuali.

## ADR-002 — TypeScript per tutto il nuovo codice applicativo

Data: 2026-07-10
Stato: accettata
Contesto: il prototipo esistente in `design_handoff_civitanext/` è JavaScript/JSX puro
(Babel in-browser, nessun bundler). `CLAUDE.md` dichiarava genericamente ".jsx", mentre il
`ROADMAP.md` di handoff raccomanda TypeScript per il codice di produzione, in particolare per i
tipi generati automaticamente da Prisma sul modello dati (ruoli, stati delle proposte, vincoli
di voto) che altrimenti dipenderebbero solo da convenzioni informali.
Decisione: tutto il nuovo codice applicativo (a partire dal bootstrap Next.js di Fase 0) è
TypeScript. Il prototipo JSX resta riferimento di design di sola lettura, non convertito.
Motivazione: un dominio con più stati e ruoli distinti (socio/admin, proposta in
revisione/votazione/approvata, vincolo di voto unico) beneficia di verifica statica; scelta
esplicita dell'utente per il blocco di lavoro corrente.
Conseguenze: `webapp/tsconfig.json` in modalità strict; ogni componente e ogni modello Prisma
espone tipi generati o dichiarati esplicitamente.

## ADR-003 — Perimetro di questo blocco di lavoro ristretto alla Fase 0 (fondamenta)

Data: 2026-07-10
Stato: accettata
Contesto: il `ROADMAP.md` di `design_handoff_civitanext/` descrive sei fasi con dipendenze
esplicite fondamenta → MVP autenticato → partecipazione civica → mobile/PWA → community/città →
analytics/deploy/hardening, con il principio "prima le fondamenta, poi una feature verticale
alla volta, mai tutte le UI senza backend".
Decisione: questo blocco copre solo la Fase 0 (allineamento `.claude`, scelta stack gratuito,
bootstrap Next.js+TypeScript, design system, schema DB iniziale, popolamento delle schede di
contesto). Nessuna feature utente, nessuna autenticazione funzionante, nessuna pagina collegata
al DB in questo blocco.
Motivazione: scelta esplicita dell'utente, coerente con la sequenza di dipendenze già
documentata nel ROADMAP e con l'obiettivo di presentare a breve un primo risultato verificabile
a uno stakeholder non tecnico senza accumulare debito di UI scollegate dal backend.
Conseguenze: la Fase 1 (auth reale, profilo, eventi con RSVP, forum) resta esplicitamente fuori
perimetro finché non viene aperto un nuovo blocco di lavoro dedicato.

## ADR-004 — Stack di hosting/DB/auth/storage per Fase 0: Cloudflare Pages + Neon + NextAuth + R2

Data: 2026-07-10
Stato: accettata
Contesto: vincolo esplicito dell'utente di infrastruttura interamente gratuita, dimensionata su
un'associazione medio-piccola (non una startup), con necessita' di storage generoso per foto di
eventi e documenti (statuto, verbali, bilanci). Sono state confrontate tre famiglie verificate
con dati reali di luglio 2026: Vercel Hobby + Supabase (storage stretto a 1 GB, rischio ToS
"non commerciale" di Vercel se in futuro l'associazione incassa quote online); Vercel Hobby +
Neon + Clerk + Cloudflare R2 (storage generoso con egress zero, ma stesso rischio ToS lato
hosting); Cloudflare Pages + Neon + NextAuth self-hosted (nessun rischio ToS, nessun lock-in
sull'auth, ma storage non incluso e un attrito tecnico noto: Prisma con client Node standard e
bcrypt non girano senza adattamenti sul runtime Workers, che esegue V8 isolates e non Node.js).
Decisione: adottare una combinazione ibrida che risolve i due limiti della terza opzione invece
di scartarla: Cloudflare Pages per l'hosting, Neon per il database Postgres, Prisma come ORM ma
con il *driver adapter* verso il driver serverless HTTP di Neon (`@prisma/adapter-neon`) al
posto del client Node standard, NextAuth self-hosted con hashing password via Web Crypto
(PBKDF2) al posto di bcrypt, Cloudflare R2 per lo storage di foto e documenti (10 GB gratuiti,
egress zero, stesso account Cloudflare dell'hosting).
Motivazione: rimuove del tutto il rischio contrattuale "uso non commerciale" che gravava sulle
prime due opzioni (rilevante perche' l'associazione potrebbe in futuro incassare quote online),
elimina il lock-in su un vendor di autenticazione esterno, e risolve lo storage che era il vero
punto debole della combinazione originale, riusando un prodotto della stessa piattaforma
(Cloudflare) invece di introdurre un quarto servizio scollegato. L'attrito Prisma/bcrypt su
Workers si risolve con pattern documentati e stabili (driver adapter HTTP, Web Crypto come API
di piattaforma), non con un workaround fragile.
Conseguenze: primo passo tecnico del bootstrap (Step 3) e' un test di validazione concreto di
Prisma+driver-adapter e di un hashing via Web Crypto sul runtime Workers, prima di costruire
altro sopra: l'assunzione tecnica va chiusa subito, non data per scontata. In caso di esito
negativo del test, l'alternativa di ripiego gia' analizzata e pronta e' Vercel Hobby + Neon +
Clerk + Cloudflare R2 (stesso storage, runtime Node standard, auth pronta invece di scritta in
proprio). Video del futuro modulo Webinar (Fase 4) restano fuori da R2 per scelta di buon senso:
imbed da YouTube/Vimeo non in elenco pubblico invece di storage self-hosted, nota per il futuro
non decisione attuale.

## ADR-005 — Pattern tecnico verificato per Prisma+Neon su Cloudflare Workers (raffina ADR-004)

Data: 2026-07-10
Stato: accettata
Contesto: ADR-004 assumeva, senza verifica diretta, che l'unico modo per far girare Prisma sul
runtime Workers fosse un driver HTTP dedicato (`@prisma/adapter-neon`) e un hashing custom via
Web Crypto al posto di bcrypt. Il bootstrap di Next.js 16 ha mostrato un `AGENTS.md` generato
che avverte esplicitamente di verificare la documentazione reale inclusa nel pacchetto prima di
scrivere codice, perche' questa versione ha cambiamenti sostanziali rispetto alla conoscenza
pregressa. La documentazione bundled (`node_modules/next/dist/docs/`) mostra che il modello di
deploy di Next.js 16 e' cambiato (Deployment Adapter API, adapter verificati vs integrazioni
proprietarie non verificate) e che Cloudflare non ha ancora un adapter verificato sulla nuova
API: offre una propria integrazione, `@opennextjs/cloudflare`, verificata con ricerche mirate
del luglio 2026 su documentazione Cloudflare/Prisma/OpenNext ufficiale.
Decisione: adottare il pattern documentato da OpenNext invece del driver HTTP dedicato
ipotizzato in ADR-004. Configurazione concreta: `next.config.ts` con
`serverExternalPackages: ["@prisma/client", ".prisma/client"]`; `wrangler.jsonc` con il
compatibility flag `nodejs_compat` e `compatibility_date` successiva al 2024-09-23 (obbligatorio,
non opzionale, per far girare l'adapter OpenNext); client Prisma istanziato per-richiesta tramite
`cache()` di React con `@prisma/adapter-pg` (non un client Node globale con pool persistente,
vietato tra richieste diverse su Workers) e `maxUses: 1` sulla connessione verso Neon; hashing
password con `bcryptjs` (non l'implementazione nativa `bcrypt`), resa possibile proprio dal flag
`nodejs_compat` che espone `crypto.randomBytes` e gran parte di `node:crypto`, quindi senza
bisogno di sostituirla con Web Crypto/PBKDF2 come ipotizzato in ADR-004.
Motivazione: pattern preso da fonti verificate (documentazione ufficiale OpenNext, Cloudflare,
Prisma), non da inferenza; e' anche piu' semplice del piano originale, perche' riusa `bcryptjs`
al posto di un hashing scritto da zero e un driver Postgres standard (`@prisma/adapter-pg`) al
posto di un driver HTTP specifico di un solo provider, riducendo l'accoppiamento a Neon in
particolare.
Conseguenze: il test di validazione del bootstrap (Step 3) verifica in concreto questi tre punti
insieme (query Prisma via `wrangler dev` locale, hashing bcryptjs, flag `nodejs_compat` attivo)
prima di scrivere altro codice applicativo. Fonti: opennext.js.org/cloudflare/howtos/db,
developers.cloudflare.com/workers/frameworks/framework-guides/nextjs,
developers.cloudflare.com/workers/runtime-apis/nodejs/, blog Cloudflare
"nodejs-workers-2025", prisma.io/docs/guides/cloudflare-workers.

## ADR-006 — Confermato Cloudflare Pages nonostante il fallimento dell'anteprima locale su Windows

Data: 2026-07-10
Stato: accettata
Contesto: il test di validazione previsto da ADR-005 non ha raggiunto il punto che doveva
verificare. `npx opennextjs-cloudflare build` completa senza errori, ma `wrangler dev` in
locale su questa macchina (Windows nativo, non WSL2) restituisce 500 su ogni rotta, inclusa la
home page priva di qualunque codice Prisma/bcrypt, con un `ChunkLoadError` a monte nella
risoluzione dei chunk del bundle. Il tool stesso avverte esplicitamente, sia in fase di `migrate`
sia di `build`, di non essere pienamente compatibile con Windows e di raccomandare WSL2.
L'attrito Prisma/bcrypt ipotizzato in ADR-004/005 non e' quindi stato ne' confermato ne'
smentito: il worker non arriva a servire nessuna richiesta, indipendentemente dal loro codice.
Decisione: restare sullo stack Cloudflare Pages + Neon + NextAuth + R2 di ADR-004/005. Lo
sviluppo quotidiano prosegue con `next dev`/`next build` (Node standard, nessuna frizione
verificata su Windows), che restano il ciclo di lavoro ordinario per pagine, componenti, schema
Prisma con connessione reale a Neon. La verifica del comportamento specifico sul runtime
Cloudflare (workerd) si sposta dal "prima di ogni commit in locale" al momento del primo deploy
reale su Cloudflare o di un'esecuzione automatica su un runner Linux (CI), non disponibile
finche' il remote GitHub resta scollegato per scelta esplicita dell'utente.
Motivazione: il fallimento osservato e' un problema di bundling della toolchain OpenNext su
Windows, non un limite intrinseco dello stack scelto (Cloudflare esegue comunque il codice sui
propri server Linux, non sul PC dello sviluppatore); passare al fallback Vercel+Neon+Clerk+R2
solo per questo motivo rinuncerebbe ai vantaggi gia' motivati in ADR-004 (nessun rischio ToS,
nessun lock-in auth) per un problema che riguarda solo l'anteprima locale, non la produzione.
Conseguenze: la route diagnostica `webapp/src/app/api/diag-fase0/route.ts` resta nel progetto
come primo controllo da eseguire al momento del deploy/CI, non rimossa; va tenuto un elemento
esplicito in `current-work.md` (Step 6) che segnala questa verifica come ancora aperta, cosi'
da non presentarla per errore come gia' fatta.

Correzione del 2026-07-20 (vedi `memory/progress.md` alla stessa data): l'ipotesi "problema di
bundling della toolchain OpenNext su Windows, non un limite intrinseco dello stack" era solo
parzialmente corretta e va rettificata onestamente, non lasciata cosi'. Il job CI su runner Linux
costruito per verificarla (ADR-014) ha riprodotto lo stesso `ChunkLoadError` anche li', quindi non
era mai stato specifico di Windows. Una parte del problema era pero' un bug di bundling reale e
risolvibile, non del toolchain in generale ma di una singola dipendenza (`pg-cloudflare`, ora
esterna in `next.config.ts`); risolto quello, e' emerso un blocco piu' profondo e ancora aperto,
la compilazione dinamica di WebAssembly del query compiler di Prisma 7.8, vietata dal runtime
Workers per sicurezza. La domanda originale di ADR-006 resta quindi non completamente chiusa: si
sa molto di piu' del prima, ma la produzione su Cloudflare Workers non gira ancora.

## ADR-007 — Separazione ambienti test/produzione: branching nativo, non infrastruttura duplicata

Data: 2026-07-10
Stato: accettata
Contesto: richiesta esplicita dell'utente di separare un ambiente di test da uno di produzione
per questo sviluppo. Un confronto didattico non versionato con altri progetti personali (vedi
`_notes/studio-didattico-confronto-ambienti.md`, non tracciato perche' tocca dettagli di
repository altrui) mostra tre approcci diversi gia' in uso altrove: nessuna separazione perche'
non serve un server (progetto desktop locale) o perche' l'infrastruttura e' una singola VM
on-premise amministrata direttamente (Docker Compose unico, feature branch mergeate dritte in
main); due progetti cloud gestiti interamente duplicati, uno per ambiente (stessa piattaforma,
due configurazioni separate da mantenere allineate a mano); un'unica infrastruttura persistente
(VPS con PM2 dietro Nginx) con la disciplina di branch git (`main` produzione, `staging`
pre-produzione) a decidere cosa e' live.
Decisione: nessuna di queste tre strade e' quella naturale per lo stack di CivitaNext
(Cloudflare Pages + Neon, scelto in ADR-004/005/006 proprio per restare serverless e gratuito
senza amministrare una VM). Si adotta invece il meccanismo nativo della coppia
Cloudflare+Neon: un **branch Neon** dedicato (`development`, oltre al branch `production` di
default) per l'ambiente di test, ottenuto per copy-on-write dallo stesso progetto Neon senza
duplicare account ne' configurazione; e i **deployment di anteprima** automatici di Cloudflare
Pages (un URL dedicato per ogni branch/PR non-main) puntati, via variabili d'ambiente distinte,
al branch Neon di sviluppo, mentre il deployment di produzione punta al branch Neon di
produzione. Storage R2: due prefissi o due bucket separati (`civitanext-media-dev` /
`civitanext-media-prod`), scelta rimandata al momento in cui la feature di upload verra'
davvero costruita (Fase 4), non necessaria in Fase 0.
Motivazione: e' l'unico dei tre approcci confrontati che non richiede ne' amministrare una
macchina ne' duplicare a mano un intero progetto cloud: branch di dati e ambienti di deploy si
aprono e chiudono con lo stesso comando con cui si apre un branch di codice, ed e' incluso nel
piano gratuito di entrambe le piattaforme. E' un meccanismo che non esisteva, o non era
ugualmente maturo, quando gli altri progetti confrontati hanno preso le loro decisioni di stack.
Conseguenze: da Step 6 in poi, `deployment.md` documenta il branch Neon di sviluppo come
ambiente di test per le migrazioni Prisma prima di applicarle al branch di produzione; nessuna
migrazione va applicata direttamente in produzione senza prima averla verificata sul branch di
sviluppo. Il dettaglio dei nomi di variabile d'ambiente per ambiente si fissa quando si arriva
al primo deploy reale (fuori dal perimetro stretto di Fase 0).

## ADR-008 — Applicazione alla radice del repository, non in una sottocartella `webapp/`

Data: 2026-07-10
Stato: accettata
Contesto: il bootstrap di Fase 0 (ADR-004/005/006) aveva scaffoldato il progetto Next.js in una
sottocartella `webapp/`, per tenere separato il codice reale dal materiale di design in
`design_handoff_civitanext/` durante la fase di validazione dello stack. L'utente ha richiesto
esplicitamente di appiattire la struttura: l'applicazione alla radice del repository invece che
annidata, e i quattro file HTML di mockup monolitici storicamente in radice spostati in
`_notes/` (non versionati) invece che lasciati li' o spostati in `design_handoff_civitanext/`.
Decisione: spostato tutto il contenuto applicativo (config, `src/`, `prisma/`, `public/`,
dipendenze) dalla sottocartella alla radice del repository; `.gitignore` di radice e di
`webapp/` fusi in un solo file; i quattro mockup HTML rimossi dal tracciamento e spostati in
`_notes/`. `design_handoff_civitanext/` resta invariata: contiene il materiale di design vero e
proprio (componenti, dati demo, README, ROADMAP), non semplici snapshot statici.
Motivazione: con un solo progetto applicativo nel repository (non un monorepo con più
pacchetti), non c'e' un motivo strutturale per annidarlo in una sottocartella; farlo aggiunge
solo un livello di indirezione nei percorsi e nei comandi. I mockup HTML sono export statici del
prototipo (900 KB - 2,2 MB ciascuno), utili come riferimento visivo locale ma non come sorgente
da mantenere in git: `_notes/` (gia' usata per materiale privato non versionato) e' la
collocazione coerente con quel ruolo.
Conseguenze: tutti i riferimenti a percorsi `webapp/...` nelle schede di stato (`STACK.md`,
`deployment.md`, `design-and-security.md`, `dev-testing.md`, `current-work.md`) sono stati
aggiornati per rimuovere il prefisso. I riferimenti `webapp/...` nelle voci gia' scritte di
questo registro e di `memory/progress.md` NON sono stati riscritti retroattivamente, coerenti
con la natura append-only di entrambi i registri: descrivono lo stato reale al momento in cui
furono scritti. Una cartella `webapp/` residua, con i soli artefatti di build rigenerabili,
resta da eliminare manualmente (bloccata da un processo che tiene occupato un file al suo
interno al momento di questa voce).

## ADR-009 — Migrazioni Prisma locali via `migrate diff` + `migrate deploy`, non `migrate dev`, per un bug noto dello shadow database

Data: 2026-07-13
Stato: accettata
Contesto: sbloccato l'ultimo punto sospeso di Fase 0 (`DATABASE_URL` impostata dall'utente in
`.env`, puntata a un server locale dedicato `npx prisma dev -n civitanext` su porte 51218
principale/51219 shadow, isolato di proposito da un'istanza già attiva su un altro progetto
dell'utente sulle porte 51213-51215), il comando naturale per applicare lo schema per la prima
volta, `npx prisma migrate dev --name init`, ha fallito in modo riproducibile con `Error: P1017
/ Server has closed the connection`. Con log verboso (`DEBUG=prisma:*`) il fallimento è stato
isolato al binario nativo `schema-engine-windows.exe` durante la chiamata RPC `devDiagnostic`,
quella con cui lo schema-engine usa lo shadow database per calcolare il diff delle migrazioni e
rilevare drift, con errore Rust `quaint::connector::postgres::native: UnexpectedMessage`.
Connessioni singole (`prisma db execute --stdin`) funzionavano regolarmente su entrambe le
porte, isolando il problema alla sequenza multi-round-trip di `devDiagnostic`, non a un parametro
di connessione o a un guasto di rete banale.
Indagine: lanciati tre agenti in parallelo invece di un'indagine seriale, per non perdere tempo
a caso su un errore criptico. Un agente ha cercato la causa nota all'esterno (issue tracker,
changelog ufficiale); un secondo ha testato chirurgicamente in locale, sulle stesse porte
51218/51219, quali operazioni sullo shadow database funzionassero e quali no, senza mai eseguire
`migrate dev` per intero (per non generare un file di migrazione a metà o in conflitto con gli
altri due agenti in corso sullo stesso server); un terzo ha verificato se una versione più
recente del pacchetto `prisma` risolvesse il problema. I tre risultati indipendenti sono
convergenti sulla stessa causa: un bug tracciato ma non confermato dal team Prisma (issue GitHub
`prisma/prisma#29366`, "Command prisma migrate dev gives P1017 against local PGlite"),
riproducibile con la firma d'errore identica, senza fix noto nemmeno nell'ultima versione stabile
pubblicata (`7.8.0`, quella già installata in questo progetto). Il workaround riportato
nell'issue stessa: generare l'SQL con `prisma migrate diff` e applicarlo con `prisma migrate
deploy`, entrambi comandi a singolo round-trip che non interpellano mai lo shadow database.
Decisione: adottato quel workaround come procedura di riferimento per le migrazioni locali su
questa macchina, finché il bug upstream non si risolve o non si verifica se persiste anche
contro un Postgres reale in rete. Concretamente: `npx prisma migrate diff --from-empty
--to-schema=prisma/schema.prisma --script` genera l'SQL della migrazione confrontando uno schema
vuoto con lo stato dichiarato in `schema.prisma`; l'SQL va scritto a mano nella struttura di
cartella che Prisma Migrate si aspetta (`prisma/migrations/<timestamp>_<nome>/migration.sql`,
accompagnato da `prisma/migrations/migration_lock.toml` con `provider = "postgresql"`); il
database, già sincronizzato in un primo tentativo diagnostico con `prisma db push` (che non
lascia alcuna cronologia), è stato resettato con `DROP SCHEMA public CASCADE; CREATE SCHEMA
public;` via `prisma db execute --stdin`; infine `npx prisma migrate deploy` ha applicato la
migrazione e l'ha registrata nella tabella `_prisma_migrations`, verificato con `prisma migrate
status` ("Database schema is up to date!").
Motivazione: preserva l'obiettivo originale dello Step 5 di Fase 0, una cronologia di migrazione
tracciata e versionabile, invece di accontentarsi di uno schema sincronizzato al volo come
farebbe `db push` da solo (che non scrive alcun file e quindi non produce nulla da versionare in
`prisma/migrations/`); aggira un bug esterno non risolvibile da questo progetto senza rinunciare
al risultato che quel bug impedirebbe.
Conseguenze: per ogni futura modifica allo schema durante Fase 0/1/2 su questa macchina, il
flusso di lavoro locale è `migrate diff` (genera l'SQL in una nuova cartella
`prisma/migrations/<timestamp>_<nome>/`) seguito da `migrate deploy` (applica e registra), non
`migrate dev`; questo va seguito come procedura operativa corrente finché non cambia questa ADR.
Da riverificare quando esisterà un vero branch Neon di sviluppo (ADR-007): se `migrate dev`
funziona contro un Postgres reale raggiunto in rete, invece del server locale `prisma dev`
basato su PGlite, il bug potrebbe essere specifico di quest'ultimo, e il workaround diventerebbe
superfluo fuori da questa macchina — non verificato, da controllare quando accadrà. Limite
dichiarato: l'issue upstream resta "non confermata" dal team Prisma al momento di questa voce;
se viene risolta in una versione futura, questa ADR va rivista.

## ADR-010 — Fase 1: modello ruoli/tesseramento e strategia di autenticazione (NextAuth)

Data: 2026-07-14
Stato: accettata
Contesto: apertura di Fase 1 (auth reale, iscrizione socio, eventi, forum). Una prima analisi,
poi corretta dall'utente, assumeva una popolazione di soli soci verificati (stima "centinaia"),
con il tesseramento trattato implicitamente come coincidente con il ruolo utente (schema
originario, `Role { SOCIO, ADMIN }`, default `SOCIO`). Lo scenario reale è diverso: tre
popolazioni distinte, `SUPERADMIN` (gestione complessiva), `ADMIN` (moderazione/approvazione),
utenti di una piattaforma pubblica che possono o meno essere soci tesserati dell'associazione;
stima massima 10.000 utenti; il tesseramento resta un dato opzionale (`tesseraNumero`, già
nullable nello schema), indipendente dal ruolo.
Decisione, in quattro parti.
Primo, modello ruoli/tesseramento: `Role` ridotto a un puro asse di autorizzazione, `SUPERADMIN`,
`ADMIN`, `UTENTE`, default `UTENTE`. Il tesseramento resta un dato distinto (`tesseraNumero`
nullable, invariato): un `UTENTE` con tessera è un socio, uno senza è un partecipante pubblico
non tesserato, senza che questo implichi alcuna differenza di autorizzazione nel sistema.
Secondo, strategia di sessione: JWT, non sessione su database per tutti gli utenti, ma con
scadenza breve (dell'ordine di un'ora, non i 30 giorni di default di NextAuth) e un ricontrollo
del ruolo dal database nel callback `jwt` a ogni rinnovo del token, invece di fidarsi ciecamente
del valore incorporato nel token fino a scadenza. Scartata la sessione su database per tutti i
10.000 utenti (una query aggiuntiva per ogni richiesta autenticata, un costo su tutto il
traffico per un beneficio, la revoca istantanea, che serve davvero solo per gli account
`ADMIN`/`SUPERADMIN`, una minoranza). Scartato anche il JWT puro a lunga scadenza della prima
analisi, accettabile quando ogni utente era un socio a basso rischio, non più accettabile con un
ruolo che modera o approva contenuti.
Terzo, provider di autenticazione: credenziali (email e password, `bcryptjs` già in dipendenza)
più un provider OAuth, Google. Le credenziali restano necessarie per `SUPERADMIN`/`ADMIN`
(account legati a un processo di nomina, non a un self-service) e per i soci con iscrizione
verificata; OAuth abbassa l'attrito di registrazione per l'utenza pubblica, rilevante ora che
quella fascia esiste davvero e la scala (10.000, non centinaia) rende quell'attrito una variabile
che conta.
Quarto, adapter: `@auth/prisma-adapter` adottato per collegare più metodi di accesso allo stesso
utente (un partecipante potrebbe registrarsi con Google e in seguito impostare anche una
password). Verificato sul sorgente del pacchetto, non solo sulla documentazione (esplicita solo
in parte su questo punto), che con strategia `jwt` il modello `Session` non è necessario: i
metodi dell'adapter che lo userebbero (`createSession`, `getSessionAndUser`, `updateSession`,
`deleteSession`) restano codice morto, mai invocato dal core di Auth.js quando la sessione non è
basata su database. Schema quindi limitato a `Account` e `VerificationToken` oltre a `User`,
senza `Session`.
Conseguenze sullo schema: `Role` riscritto (enum e default); `User.passwordHash` reso opzionale
(un utente arrivato solo via OAuth non ne ha mai impostata una); aggiunti `User.emailVerified` e
`User.image` (scritti dall'adapter per gli utenti OAuth); aggiunti i modelli `Account` (con i
campi che rispecchiano la risposta del provider OAuth, `refresh_token`/`access_token`/eccetera,
nomi imposti dall'adapter e non convertibili alla convenzione camelCase del resto dello schema) e
`VerificationToken`. Migrazione generata e applicata con la procedura di ADR-009 (`migrate diff
--from-config-datasource --to-schema` seguito da `migrate deploy`, non `migrate dev`), verificata
con `prisma migrate status`.
Motivazione: la combinazione bilancia il costo per richiesta (JWT, non una query di sessione su
ogni richiesta per 10.000 utenti su un'infrastruttura serverless a risorse gratuite) con
l'esigenza di revoca che l'esistenza di ruoli privilegiati introduce (finestra di esposizione
ridotta a minuti/un'ora invece che a giorni), e riflette la reale composizione dell'utenza
(pubblica e mista, non solo soci) nel modello dati e nella scelta dei provider, invece di forzare
uno schema pensato per uno scenario più piccolo e più omogeneo.
Conseguenze operative: il pacchetto `@auth/prisma-adapter` non è stato ancora installato né è
stato scritto il file di configurazione NextAuth (`auth.ts`, route handler, callback
`jwt`/`session`, provider Credentials/Google): resta il prossimo passo implementativo di Fase 1,
fuori dal perimetro di questa ADR. Se in futuro emergesse un requisito di revoca istantanea per
`ADMIN`/`SUPERADMIN` che il bounded-JWT non soddisfa, l'alternativa diretta è una sessione su
database limitata a quei due ruoli soltanto, non ancora necessaria.

## ADR-011 — Modello dati del Quiz: opzioni relazionali, risposte per domanda, tentativi ripetibili con punteggio migliore, sblocco progressivo

Data: 2026-07-15
Stato: accettata
Contesto: prima feature verticale di Fase 2 dopo proposte/votazioni, prima volta che si introduce
un dominio dati completamente nuovo (non un riuso di schema già presente come per eventi, forum,
proposte). Il prototipo di design (`design_handoff_civitanext/civitanext-data.jsx`,
`CN_QUIZZES`/`CN_QUIZ_QUESTIONS`) mostra quiz a scelta multipla, un flag binario `done` per
tentativo, e alcuni quiz marcati `locked`. Quattro decisioni prese insieme, confrontate con
l'utente prima di scrivere schema.
Decisione, in quattro parti.
Primo, rappresentazione di domande e opzioni: modello `QuizOption` relazionale (`questionId`,
`text`, `isCorrect`), non un campo JSON sulla domanda. Coerente con la convenzione già stabilita
in questo schema, che non usa mai JSON nemmeno dove sarebbe stato comodo (il pattern polimorfico
di `Vote` usa un discriminante `targetType`, non JSON): resta interrogabile con query normali e
non chiude future funzionalità (es. statistiche per opzione).
Secondo, granularità di un tentativo: oltre a `QuizAttempt` (punteggio, totale), un modello
`QuizAnswer` (una riga per domanda per tentativo, con l'opzione scelta e se era corretta). Il
valore di un quiz civico è il feedback per imparare, non solo la valutazione: senza salvare quale
opzione è stata scelta per ogni domanda non si può mostrare dopo l'invio quali risposte erano
sbagliate e quali corrette, che è il punto della feature, non un accessorio.
Terzo, tentativi ripetibili: `@@unique([userId, quizId])` su `QuizAttempt`, cioè una sola riga
registrata per utente per quiz, non uno storico di tentativi. Ripetere il quiz aggiorna quella
riga (e le `QuizAnswer` collegate) solo se il nuovo punteggio è migliore del precedente — logica
applicativa, non vincolo di schema. Scelta motivata dallo scopo educativo: penalizzare un errore
per sempre (il flag binario `done` del prototipo) non incoraggia a riprovare; tenere il punteggio
migliore sì.
Quarto, sblocco progressivo: campo `order` su `Quiz`, un quiz con `order` maggiore di zero è
sbloccato solo se esiste un `QuizAttempt` per il quiz con `order` immediatamente precedente
(calcolato in query al momento dell'uso, non un campo booleano salvato che potrebbe disallinearsi
dallo stato reale dei tentativi). Il prototipo mostra alcuni quiz `locked` senza spiegare la
logica dietro: interpretato come sblocco sequenziale reale, non solo un dettaglio visivo del
mockup, perché guida l'utente in un percorso invece di lasciarlo scegliere a caso, coerente con
lo scopo civico/educativo della feature.
Motivazione: le quattro scelte insieme trattano il quiz come strumento di apprendimento
(feedback per domanda, possibilità di riprovare, percorso guidato) invece che come solo verifica
puntuale, allineandosi allo scopo dichiarato della feature ("Educazione civica", non un esame).
Conseguenze: più tabelle e più scritture per tentativo rispetto alla via minima (solo punteggio
aggregato, un tentativo permanente, nessuno sblocco), accettato come compromesso proporzionato al
valore didattico. Non ancora scritte le pagine, le server action, né un seed di quiz reali:
prossimo passo implementativo, fuori dal perimetro di questa ADR.

## ADR-012 — Fase 3: layout responsive unico invece di shell mobile dedicata; PWA installabile con service worker conservativo

Data: 2026-07-16
Stato: accettata
Contesto: apertura di Fase 3 secondo `design_handoff_civitanext/ROADMAP.md` ("Mobile e PWA"),
che pone esplicitamente come prima domanda aperta se adottare un layout responsive unico o una
shell mobile dedicata, prima di PWA e notifiche (queste ultime esplicitamente in due passi,
prima in-app poi push, non affrontate in questa ADR).
Decisione, in due parti.
Primo, layout responsive unico: stesse pagine, stessi componenti, stesse route per desktop e
mobile, adattati con le utility responsive di Tailwind già in uso nel codice esistente (es.
`grid-cols-1 sm:grid-cols-2` nelle liste di eventi e proposte). Scartata la shell mobile dedicata
(un albero di componenti/route separato): per un'associazione con un solo sviluppatore e un
vincolo dichiarato di infrastruttura gratuita (ADR-004 e seguenti), mantenere due interfacce
invece di una raddoppierebbe il costo di manutenzione di ogni feature verticale futura, senza un
beneficio proporzionato. La tab bar mobile che il documento di handoff menziona (Home, Eventi,
Quiz, Forum, Altro) è realizzata come variante responsive dello stesso `SiteHeader` già
esistente (nuovo componente `MobileTabBar`, fisso in basso, visibile solo sotto il breakpoint
`sm`; il `<nav>` orizzontale esistente si nasconde alla stessa soglia), non un componente a
parte scollegato dal resto. Proposte, Profilo e Admin, che sul desktop hanno un chip proprio
nell'header, confluiscono su mobile sotto una quinta voce "Altro" (nuova pagina `/altro`), per
restare a cinque tab fisse invece di otto.
Secondo, PWA installabile: `app/manifest.ts` (convenzione ufficiale Next.js, verificata nei docs
bundled in `node_modules/next/dist/docs`, non assunta dalla versione precedente di Next per la
stessa cautela di `AGENTS.md`), icone generate dal logo esistente (`Logo.tsx`) con Inkscape, già
installato sulla macchina, invece di introdurre una dipendenza npm o un servizio esterno solo
per rasterizzare due PNG. Service worker (`public/sw.js`) deliberatamente conservativo: fornisce
solo una pagina di fallback offline per le richieste di navigazione fallite, senza mettere in
cache aggressivamente le pagine dell'applicazione. Motivo: ogni pagina di questa app legge la
sessione utente a ogni richiesta (`SiteHeader` chiama `auth()`); una cache aggressiva delle
pagine servirebbe HTML che riflette una sessione non più valida (un utente disconnesso vedrebbe
ancora la propria sessione, o viceversa), un rischio più serio del beneficio di un'esperienza
offline più ricca. Le notifiche push, esplicitamente sequenziate nel documento di handoff dopo
le notifiche in-app (non ancora costruite), restano fuori dal perimetro di questa ADR.
Motivazione: entrambe le scelte privilegiano il costo di manutenzione proporzionato alla scala
reale del progetto (un'associazione, un solo sviluppatore, infrastruttura gratuita) rispetto a
un'esperienza mobile più elaborata ma più costosa da mantenere, e trattano l'installabilità PWA
come un miglioramento incrementale sopra l'app web esistente, non come una riscrittura.
Conseguenze: nessuna funzionalità offline reale per i contenuti letti (eventi, proposte, forum,
quiz) in questa prima versione — solo una pagina di cortesia quando la rete manca durante la
navigazione. Se in futuro servirà davvero cache offline dei contenuti, andrà limitata a pagine
che non dipendono dalla sessione utente, o accompagnata da una strategia di invalidazione
esplicita, non aggiunta genericamente. Le notifiche (in-app, poi push) restano il prossimo passo
dichiarato di Fase 3, non affrontato qui.

## ADR-013 — Mappa della città: Leaflet + OpenStreetMap, modello `MapPoint` autonomo, coordinate reali al posto del placeholder x/y

Data: 2026-07-16
Stato: accettata
Contesto: terza feature verticale di Fase 4, la prima del gruppo che il roadmap segnala come
bisognoso di una decisione di infrastruttura prima di scrivere codice ("integrare Leaflet/Mapbox
con pin reali"). Il prototipo di design (`civitanext-features.jsx`, componente `MapView`;
`CN_MAP_POINTS` in `civitanext-data.jsx`) non mostra una mappa reale: e' un div placeholder con
pin posizionati via coordinate x/y percentuali sopra un'immagine statica, non coordinate
geografiche. Decisione presa dopo un confronto esplicito con l'utente su libreria di mappe (non
delegata in autonomia, a differenza di scelte minori come la navigazione di spazi civici).
Decisione, in tre parti.
Primo, libreria: Leaflet (via `react-leaflet` 5, la prima versione con supporto dichiarato a
React 19, già la versione installata nel progetto) con tile raster standard di OpenStreetMap
(`tile.openstreetmap.org`), non MapLibre GL ne' Mapbox GL JS. Confrontate tutte e tre con
l'utente: Mapbox richiede un account e un token, la stessa frizione di un servizio esterno da
configurare che il progetto sta deliberatamente rimandando per Google in questo stesso blocco di
lavoro (vedi nota in `roadmap.md` sul rinvio dell'account Google); MapLibre GL rende meglio ma e'
piu' pesante del bisogno reale (pochi pin su una mappa, non un prodotto cartografico interattivo
complesso), e il tile provider gratuito senza account (OpenFreeMap) e' un progetto volontario di
cui non c'e' verifica di affidabilita' a lungo termine, mentre le alternative con piu' garanzie
(MapTiler) richiedono comunque un account esterno. Leaflet e' l'unica delle tre che non richiede
alcuna chiave API ne' alcun account per l'uso base, coerente con l'impostazione di
"infrastruttura gratuita, niente segnali esterni evitabili" gia' seguita dal progetto (ADR-004 e
seguenti). Il limite noto e' che il tile server pubblico di OSM sconsiglia un uso di produzione
pesante senza attribuzione/caching; per il traffico atteso di un sito associativo e' un rischio
accettato, e se mai superasse la soglia lecita il cambio si limita all'URL del `TileLayer`, non
alla libreria.
Secondo, modello dati: nuovo modello `MapPoint` (`title`, `type`, `place`, `lat`, `lng`),
autonomo, senza relazione con `Event` o `Proposal`. Scartata l'alternativa di aggiungere
coordinate geografiche direttamente a quei due modelli: ne' `Event` ne' `Proposal` hanno oggi una
form di creazione amministrativa (`Event` e' popolato solo dal seed, `Proposal` nasce da un
utente non da un admin), quindi aggiungere `lat`/`lng` la' avrebbe richiesto costruire anche
quelle form, allargando lo scope di questa sola feature ben oltre la mappa. Un admin popola
`MapPoint` a mano con lo stesso pattern CRUD gia' visto per sondaggi e spazi civici
(`createMapPoint`, guardia di ruolo, form con validazione lato server delle coordinate). Le
coordinate sono gradi decimali reali, non le percentuali x/y del prototipo: la differenza e'
voluta, "pin reali" nel testo del roadmap di design si legge come pin geograficamente reali, non
solo una sostituzione grafica del placeholder.
Terzo, integrazione con Next.js App Router: Leaflet legge `window` alla costruzione della mappa e
non puo' essere renderizzato lato server. Il componente che usa `react-leaflet`
(`src/components/CivicMap.tsx`) e' client (`"use client"`), ma caricato tramite un secondo
componente client (`CivicMapLoader.tsx`) che lo importa con `next/dynamic` e `ssr: false`: in App
Router `ssr: false` su `next/dynamic` e' consentito solo dentro un Client Component, non in un
Server Component, quindi la pagina `/mappa` (Server Component, che legge `MapPoint` dal database)
non poteva chiamarlo direttamente. Le icone di default di Leaflet, che puntano a percorsi non
risolti da nessun bundler moderno (bug noto della libreria, non specifico di Next.js), sono
sovrascritte con le tre immagini originali copiate in `public/leaflet/` invece che con un CDN
esterno a runtime, per restare coerenti con l'impostazione offline-first gia' presa per la PWA
(ADR-012): un CDN irraggiungibile lascerebbe la mappa senza icone anche quando il resto della
pagina funziona.
Motivazione: le tre scelte insieme trattano la mappa come la feature piu' semplice possibile che
soddisfi il bisogno reale (mostrare pin geografici su Civitanova Marche), evitando ogni nuovo
account esterno evitabile e ogni allargamento di scope verso modelli che oggi non hanno ancora
un'interfaccia di creazione.
Conseguenze: un admin deve inserire a mano titolo, tipo, luogo e coordinate per ogni punto,
senza collegamento automatico a un evento o una proposta reale gia' esistente nel database — se
in futuro si vorra' sincronizzare automaticamente i pin con gli eventi (es. un pin per ogni
evento con luogo geocodificato), servira' una feature a parte che aggiunga coordinate a `Event`
insieme alla sua form di creazione, non ancora costruita. Il tile server pubblico OSM resta un
punto da rivedere se il traffico reale del sito crescesse molto oltre la scala attuale.

## ADR-014 — Fondazione di test: Vitest per la logica server, Playwright per l'e2e, Postgres reale in CI, husky+lint-staged in pre-commit

Data: 2026-07-20
Stato: accettata
Contesto: cinque fasi chiuse (Fase 0-4, nove verticali) verificate finora solo a mano nel
browser, senza alcun framework di test automatico installato: `dev-testing.md` di Fase 0
rimandava esplicitamente la scelta "a quando si apre Fase 1". L'utente ha chiesto di portare il
progetto a una fase di sviluppo matura con un piano di test affidabile. Decisione presa dopo un
confronto esplicito con l'utente su quattro assi (non delegata in autonomia, per lo stesso
principio gia' seguito in ADR-013): ampiezza della prima suite, se verificare anche il runtime
Cloudflare reale in CI, come procurare un Postgres per i test, se adottare gia' ora husky.
Decisione, in sei parti.
Primo, runner: Vitest, non Jest, per la logica lato server (server action). Non una preferenza:
la documentazione reale spacchettata con Next 16.2.10
(`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`) copre solo Vitest per l'App
Router, non Jest, e dichiara esplicitamente che i Server Component asincroni, quasi tutte le
pagine di questo progetto, non sono renderizzabili con Vitest: per quelli rimanda all'e2e. Le
server action non ricadono in quel limite perche' non sono componenti, sono funzioni asincrone
qualunque, richiamabili direttamente con `await`.
Secondo, e2e: Playwright, non Cypress. La guida ufficiale per validare gli adapter di deploy
custom (`04-testing-adapters.md`, la stessa categoria dell'adapter Cloudflare di questo
progetto) e' scritta interamente attorno a Playwright, non e' una preferenza stilistica.
Terzo, perimetro della prima suite ("fondazione mirata", scelta esplicita tra tre opzioni
presentate): non un test per ognuna delle tredici server action e delle nove verticali gia'
chiuse, ma unit/integration test solo sulla logica gia' toccata da bug reali durante la verifica
manuale (vincolo di voto unico su sondaggi/proposte, sblocco progressivo quiz con punteggio
migliore, guardie di ruolo admin, toggle RSVP), piu' un solo smoke e2e che attraversa quattro
verticali in sequenza (login, RSVP, voto proposta, tentativo quiz). Le feature future si testano
man mano che si scrivono, non retroattivamente sul pregresso.
Quarto, database di test: Postgres reale, non un mock del client Prisma ne' sqlite. In locale un
container Docker dedicato (`docker-compose.test.yml`, porta 5433, mai il Neon di sviluppo); in
CI un service container Postgres di GitHub Actions. Scartata l'alternativa di un branch Neon
effimero per CI: piu' fedele alle quirk del provider di produzione, ma richiede un token Neon
come secret e uno script di gestione branch, dipendenza in piu' per un progetto che usa gia'
l'adapter Postgres standard (`@prisma/adapter-pg`), non funzionalita' Neon-specifiche.
Quinto, verifica del runtime Cloudflare reale: job CI separato e piu' lento
(`test-cloudflare-adapter` in `.github/workflows/ci.yml`) che builda con
`opennextjs-cloudflare build` e fa girare lo stesso smoke e2e contro il preview reale (workerd,
via wrangler), su runner Linux. Chiude la domanda lasciata esplicitamente aperta da ADR-006 (se
il bug di bundling osservato su Windows fosse un limite del toolchain o un problema reale
dell'adapter): non verificabile in locale su questa macchina per lo stesso motivo di ADR-006, la
prima esecuzione reale di questo job in CI e' la verifica stessa.
Sesto, pre-commit: husky + lint-staged adottati nello stesso blocco di lavoro invece che
rimandati (`eslint --fix` sui file staged, poi `tsc --noEmit` sull'intero progetto e la suite
Vitest, che si salta da sola senza Postgres locale attivo, senza bloccare il commit).
Motivazione: le sei scelte insieme allineano lo stack di test ai vincoli reali di questo
progetto (Next 16, adapter Cloudflare, Postgres via `@prisma/adapter-pg`) invece che a
convenzioni generiche, e dimensionano lo sforzo iniziale sul rischio gia' dimostrato (i bug reali
gia' trovati a mano) invece che sulla copertura totale. Tre problemi reali, non ipotetici, sono
emersi scrivendo questa stessa fondazione, non nella logica applicativa gia' esistente: (a)
NextAuth rifiuta ogni richiesta in modalita' produzione con `UntrustedHost` se `trustHost` non e'
impostato, mai visto prima perche' lo sviluppo quotidiano gira solo su `next dev`, dove il
controllo non scatta; risolto in `src/auth.ts` con `trustHost: true`, sicuro perche' nessun
redirect del progetto e' derivato dall'header Host (verificato per tutti i redirect del
codebase); (b) i quattro file di test Vitest, eseguiti in parallelo per default, corrompono i
dati a vicenda perche' condividono un solo Postgres reale con fixture identificate da un marker
comune, risolto forzando `fileParallelism: false`; (c) il seed dei dati e2e non era idempotente,
lo stato di RSVP/voto restava da un'esecuzione all'altra, scoperto rilanciando lo smoke e2e due
volte di seguito, risolto azzerando esplicitamente lo stato transazionale dell'utente e2e a ogni
seed e richiamando il seed da un `beforeEach` cosi' anche un retry di Playwright riparte da zero.
Conseguenze: `npm test`, `npm run test:e2e`, `.github/workflows/ci.yml` (due job),
`docker-compose.test.yml`, il pre-commit husky sono ora parte del ciclo di sviluppo quotidiano.
Attivando il gate di lint in CI e' emersa una lacuna di configurazione preesistente, non
introdotta da questo lavoro: `design_handoff_civitanext/**` (prototipo di sola lettura, non
stack applicativo) e `prisma/seed.js` (script CommonJS deliberato, vedi commento in testa al
file) non erano esclusi dall'ambito di ESLint, ora corretto in `eslint.config.mjs`. Prossimo
passo: nessuno bloccante; la copertura di test si estende feature per feature d'ora in avanti,
non retroattivamente sulle nove verticali gia' chiuse.
