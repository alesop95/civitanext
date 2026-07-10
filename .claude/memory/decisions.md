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
