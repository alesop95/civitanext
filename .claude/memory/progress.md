# Work-log

> Append-only, in ordine cronologico inverso (la voce più recente in alto). Ogni passo
> significativo di codice e ogni intervento manuale rilevante lascia una voce con data, file
> toccati, motivo e commit di riferimento. Qui confluisce anche il log di riconciliazione dei
> documenti `.docx`, con il nome del documento sorgente e l'esito, così la data di allineamento
> sopravvive a un clone.

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
