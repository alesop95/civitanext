---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - wrangler.jsonc
  - open-next.config.ts
  - prisma.config.ts
last-verified-commit: 6495c68
---

# Deployment

> Popolare leggendo la configurazione reale di infrastruttura e CI. Commit, push e deploy restano
> operazioni manuali dell'utente. Nessun deploy reale eseguito ancora in Fase 0: questa scheda
> descrive la configurazione predisposta, non un ambiente gia' attivo.

## Livelli

Due livelli previsti, nessuno ancora attivato: sviluppo locale (`next dev` su questa macchina,
Postgres locale via `npx prisma dev` durante la Fase 0, prima che esista un progetto Neon reale)
e produzione (Cloudflare Pages/Workers + branch Neon `production`). Un terzo livello di test
è previsto ma non ancora istanziato: un branch Neon `development` per copy-on-write dallo stesso
progetto, con i deployment di anteprima automatici di Cloudflare Pages per ogni branch di
codice non-`main` puntati a quel branch dati invece che a produzione (ADR-007). Nessun dominio
custom scelto in questa fase.

L'anteprima locale del runtime Cloudflare reale (`wrangler dev`/`preview`) restituisce 500 su
ogni rotta su questa macchina (Windows nativo, non WSL2). L'ipotesi originale di ADR-006, un
problema esclusivamente di Windows, è stata smentita: il job CI dedicato
`test-cloudflare-adapter` (build `opennextjs-cloudflare`, smoke e2e contro il preview workerd su
runner Linux) riproduce lo stesso attrito. Durante la sua messa a punto sono stati trovati e
corretti tre problemi reali indipendenti dal sistema operativo (`postinstall: prisma generate`
mancante, `AUTH_SECRET` mancante per NextAuth in produzione, `pg-cloudflare` non esterno nel
bundle di `next.config.ts`). Corretti quelli, resta un blocco più a monte, isolato collegandosi
al debugger del Worker in locale: `CompileError: WebAssembly.Module(): Wasm code generation
disallowed by embedder`, dentro il query compiler WASM di Prisma 7.8, con riscontro diretto
nell'issue upstream `prisma/prisma#28657` (aperta). Il job resta rosso di proposito, senza
`continue-on-error` che lo mascheri. Decisione presa il 2026-07-20: il fix è dichiarare
`runtime = "cloudflare"` nel blocco generator (resta su Prisma 7.8, lega il query compiler
staticamente al deploy), ma la sua applicazione è rimandata al primo deploy reale su Cloudflare,
perché il blocco tocca solo questo job e non lo sviluppo; il downgrade a Prisma 6.19.0 è scartato
in quanto superato dal fix di configurazione. Lo sviluppo quotidiano usa `next dev`/`next build`
(Node standard, nessun problema riscontrato).

## Comandi

Sviluppo: `npm run dev` dalla radice del repository. Build standard: `npm run build` /
`npm run start`. Build e pacchettizzazione per Cloudflare: `npm run preview` (build OpenNext +
`wrangler dev` locale, oggi non funzionante su questa macchina) e `npm run deploy` (build
OpenNext + `wrangler deploy`, mai eseguito).

Migrazioni schema: **non** `npx prisma migrate dev` su questa macchina. Un bug noto e non
confermato dal team Prisma (`prisma/prisma#29366`) fa fallire `migrate dev` con `P1017` contro lo
shadow database del server locale `npx prisma dev` (vedi ADR-009 e
`refactor-05-migrazione-shadow-database.md`). Procedura effettiva a ogni cambio di schema:

Prima migrazione (schema vuoto → schema):

```
npx prisma migrate diff --from-empty --to-schema=prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_<nome>/migration.sql
npx prisma migrate deploy
```

Migrazione incrementale successiva (verificato in ADR-010, non più solo ipotizzato): il lato
`--from-empty` si sostituisce con `--from-config-datasource`, che introspeziona direttamente il
`DATABASE_URL` attivo invece di rigiocare la cronologia (`--from-migrations` richiederebbe uno
shadow database per il replay, lo stesso punto che fallisce in ADR-009):

```
npx prisma migrate diff --from-config-datasource --to-schema=prisma/schema.prisma --script \
  > prisma/migrations/<timestamp>_<nome>/migration.sql
npx prisma migrate deploy
```

In entrambi i casi `migrate deploy` applica e registra in `_prisma_migrations`, verificabile con
`prisma migrate status`. Contro il `DATABASE_URL` attivo (locale in Fase 0/1, poi branch Neon di
sviluppo, mai direttamente in produzione) — da riverificare se `migrate dev` torna utilizzabile
contro un Postgres reale in rete (Neon), vedi Conseguenze di ADR-009.

## Configurazione Google OAuth (procedura replicabile)

Scritta perche' rifacibile da zero, non solo come diario di quanto fatto: se l'associazione
dovesse ricreare l'app OAuth (nuovo account, progetto perso, credenziali revocate), questi sono i
passi esatti, nell'ordine esatto, con le etichette esatte dell'interfaccia vista in italiano il
2026-07-23. Il codice del provider Google in `src/auth.ts` e' gia' scritto (ADR-010) e non
richiede alcuna modifica: questa procedura produce solo le due credenziali che gli servono.

Primo, accedere a `console.cloud.google.com` autenticati con l'account Google dedicato
all'associazione, non un account personale (stesso principio di separazione identita' gia'
adottato per git in `.claude/rules/git-identity-and-repo.md`). La console mostra un banner "Prova
Google Cloud con 300$ di crediti gratuiti": va ignorato, non va avviata alcuna prova. Creare un
progetto e configurare OAuth sono operazioni gratuite di per se', nessuna carta di pagamento
richiesta; il banner riguarda servizi a consumo (macchine virtuali e simili) che questo progetto
non usa.

Secondo, creare il progetto: cliccare il selettore "Seleziona un progetto" in alto a sinistra,
poi "Nuovo progetto". Nel form, scrivere il nome (usato "CivitaNext"): l'ID progetto si genera
automaticamente in minuscolo dal nome ("civitanext") e non e' piu' modificabile dopo la
creazione, quindi va controllato prima di confermare. Il campo "Risorsa padre" resta su "Nessuna
organizzazione" quando l'account Google non appartiene a un'organizzazione Google Workspace, caso
normale per un account creato per una singola associazione. Cliccare "Crea". La console notifica
il completamento (icona a campana in alto a destra, "Crea il progetto: CivitaNext"); cliccare
"Seleziona progetto" nella notifica, oppure riaprire il selettore progetto e scegliere
"CivitaNext" dalla lista, cosi' che compaia selezionato in alto a sinistra invece della dashboard
generica.

Terzo, configurare l'identita' dell'app (quella che Google chiama "Google Auth Platform", il
successore della vecchia "schermata di consenso OAuth"): dal menu ☰ in alto a sinistra, "API e
servizi" → "Schermata consenso OAuth". Se non ancora configurata, cliccare "Inizia": si apre un
wizard a quattro passi. Passo 1 "Informazioni sull'app": "Nome applicazione" = `CivitaNext` (e' il
nome mostrato agli utenti nella schermata di consenso Google), "Email per assistenza utenti" =
l'email dell'account Google dell'associazione (es. `civitanext@gmail.com`), poi "Avanti". Passo 2
"Pubblico": selezionare "Esterno", non "Interno" ("Interno" richiede un'organizzazione Google
Workspace, assente su un account personale/associativo senza Workspace) — "Esterno" fa partire
l'app in modalita' test, utilizzabile solo dagli account aggiunti come utenti di prova finche' non
si decide di pubblicarla; passare in produzione per aprirla a chiunque potrebbe richiedere una
verifica Google, anch'essa gratuita. Poi "Avanti". Passo 3 "Dati di contatto": stessa email
dell'account (dove Google notifica eventuali modifiche al progetto), poi "Avanti". Passo 4 "Fine":
spuntare "Accetto le Norme relative ai dati utente: servizi API di Google", poi "Continua", poi
"Crea". La console mostra "Configurazione OAuth creata." e la pagina "Panoramica di OAuth" con la
sezione "Metriche" che segnala "Non hai ancora configurato nessun client OAuth per questo
progetto": e' normale, il client (le credenziali vere) e' il passo successivo, distinto da questo.

Quarto, creare il client OAuth (le due credenziali che servono a `AUTH_GOOGLE_ID`/
`AUTH_GOOGLE_SECRET`): dalla stessa pagina "Panoramica di OAuth", cliccare "Crea client OAuth"
(oppure dal menu laterale "Client" → "Crea client"). Tipo di applicazione: "Applicazione web".
Nome: un'etichetta solo per riconoscerlo in questa console (es. "CivitaNext web"), non visibile
agli utenti finali. Nessuna "Origine JavaScript autorizzata" necessaria (serve solo per flussi
lato browser; NextAuth usa il flusso lato server). In "URI di reindirizzamento autorizzati"
aggiungere l'URI esatto che NextAuth usa per completare l'accesso Google, uno per ambiente: in
sviluppo locale `http://localhost:3000/api/auth/callback/google` (verificare che `next dev` usi
davvero la porta 3000 su questa macchina), e in produzione
`https://<dominio-reale>/api/auth/callback/google` quando il dominio esistera' (da aggiungere in
un secondo momento, non blocca l'uso in locale adesso). Cliccare "Crea".

Quinto, recuperare le credenziali senza mai farle transitare altrove: il riquadro "Client OAuth
creato" mostra solo l'ID client in chiaro; il client secret non e' visibile li', va preso
cliccando "Scarica JSON" (contiene sia `client_id` sia `client_secret`). Aprire il JSON scaricato
con un editor di testo, copiare i due valori dentro `.env` locale (nella radice del repository,
gia' in `.gitignore` col pattern `.env*`, verificato) come `AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET`
— mai in una scheda tracciata ne' in un commit, e mai passati all'agente, che non legge né scrive
`.env` per regola del progetto. Cancellare poi il JSON scaricato (di norma nella cartella
Download): una volta nei due campi di `.env` non serve piu' tenerne una copia, e ogni copia
aggiuntiva del secret e' rischio senza beneficio; se si perde, si puo' sempre generarne uno nuovo
dalla pagina "Client" della console.

Nota (2026-07-23, riprodotta e risolta durante la prima verifica reale): il service worker
dell'app (`public/sw.js`, Fase 3) intercetta le navigazioni per offrire un fallback offline. Il
ritorno da Google verso `/api/auth/callback/google` e' anch'esso una navigazione, ma arriva da un
redirect cross-origin (accounts.google.com → il sito): richiamare `fetch()` su quella richiesta
dentro il service worker puo' fallire per un vincolo del browser sulle navigazioni reindirizzate
da un'origine esterna, anche quando il server di destinazione e' raggiungibile. Il sintomo era
netto: la pagina "Sei offline" al posto del sito dopo aver cliccato "Continua" sul consenso
Google, riproducibile identico anche in una finestra in incognito (che esclude cronologia ed
estensioni come causa), e nel log del server la richiesta a `/api/auth/callback/google` non
compariva mai, nemmeno come errore — segno che il fallimento avveniva prima di raggiungere la
rete. Gia' corretto nel codice attuale: il service worker esclude le rotte `/api/` dalla propria
intercettazione (nessun fallback offline avrebbe senso su una rotta API comunque). Chi rifa
questa procedura da zero con una copia del codice precedente a questo fix incontrerebbe lo stesso
blocco esatto al primo login Google; con il codice attuale non dovrebbe piu' presentarsi. Dettaglio
tecnico completo in `refactor-17-sw-oauth-redirect.md`.

Sesto, prima di poter davvero testare l'accesso: in modalita' "Esterno"/test (passo 2 sopra),
solo gli account elencati come utenti di prova possono completare l'accesso Google. Da "Pubblico"
nel menu laterale → "Utenti di prova" → "Aggiungi utenti", aggiungere almeno l'account Google con
cui si fara' il test (puo' essere l'account personale di chi sviluppa, non serve che sia
l'account dell'associazione). Verifica finale: riavviare `next dev`, andare su `/accedi`, cliccare
"Accedi con Google", completare il consenso con un account elencato come utente di prova, e
verificare che si crei/autentichi l'utente nel sito.

## Variabili d'ambiente e segreti

`.env` (ignorato da git, mai letto dall'agente per regola di `settings.json`): contiene
`DATABASE_URL` e `SHADOW_DATABASE_URL` (server locale dedicato `npx prisma dev -n civitanext`,
ADR-009), più, da Fase 1 (ADR-010): `AUTH_SECRET` (obbligatoria in produzione, NextAuth la
richiede e lancia un errore se assente; un valore distinto per ambiente test/produzione),
`AUTH_GOOGLE_ID` e `AUTH_GOOGLE_SECRET` (nomi inferiti automaticamente da NextAuth v5 per il
provider Google, formato `AUTH_{PROVIDER}_{ID|SECRET}`, nessuna configurazione esplicita nel
codice). `.dev.vars` (creato dall'adapter Cloudflare per le variabili lette in emulazione locale
Workers): `NEXTJS_ENV`. Da Fase 4, galleria foto (ADR-016): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY` (credenziali del token API R2, permesso limitato al bucket, mai
admin-wide), `R2_BUCKET_NAME` (un solo nome per ambiente attivo: `civitanext-media-dev` in
sviluppo/test, `civitanext-media-prod` in produzione, selezionati dal valore di questa stessa
variabile per ambiente, non da due nomi di variabile diversi nel codice — chiude la domanda
aperta di ADR-007 sui due bucket dev/produzione), `R2_PUBLIC_BASE_URL` (dominio pubblico di
lettura del bucket, usato solo per comporre l'URL delle immagini, mai per firmare richieste). Da
Fase 4, email digest (ADR-017): `RESEND_API_KEY` (credenziale del servizio Resend),
`DIGEST_FROM_EMAIL` (indirizzo mittente verificato su un dominio dell'associazione),
`CRON_SECRET` (segreto condiviso che protegge `/api/digest`, confrontato a tempo costante — non
una credenziale di un servizio esterno, generato una volta e messo sia in `.env` sia nei secret
GitHub del repository). Da Fase 3 completata in Fase 4, notifiche push: `VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY` (coppia generata in locale con `npx web-push generate-vapid-keys`, nessun
account esterno: e' pura crittografia, non una credenziale di servizio), `VAPID_SUBJECT` (un
recapito di contatto per i push service, formato `mailto:...` o un URL `https://`),
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` (stesso valore di `VAPID_PUBLIC_KEY`, ma col prefisso che Next.js
richiede per le variabili leggibili anche lato client — usata da `PushToggle.tsx` per
`pushManager.subscribe()`). Nessun valore reale va mai scritto in una scheda tracciata o in un
commit: solo i nomi delle variabili e dove sono gestite.

## Backup

Non affrontato (quarto asse di hardening del `ROADMAP.md` di handoff, distinto dalla
cancellazione account GDPR di ADR-018). Dipende dalle garanzie del piano gratuito Neon
(point-in-time recovery, retention), non verificate: da confermare quando si arrivera' a questo
punto, non un compito di codice applicativo ma di configurazione/verifica del servizio esterno
gia' scelto in ADR-004.

Secret del repository GitHub (non `.env`, gestiti in Settings → Secrets and variables → Actions),
usati dal workflow `.github/workflows/weekly-digest.yml`: `DEPLOY_URL` (URL pubblico dell'app
deployata, non ancora esistente: vedi "Interventi manuali in sospeso" in `current-work.md`) e
`CRON_SECRET` (lo stesso valore scritto in `.env` come variabile applicativa).
