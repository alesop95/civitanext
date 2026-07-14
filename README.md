# CivitaNext

CivitaNext è la piattaforma di partecipazione civica pensata per i giovani residenti di
Civitanova Marche: un calendario eventi, quiz civici, un forum di discussione, proposte con
voto, un profilo utente con tessera digitale, un pannello di amministrazione e sezioni di
comunità e città come il mentoring, una mappa degli spazi civici e un archivio documentale. Il
repository ha attraversato due fasi distinte: prima una consegna di design ad alta fedeltà
(il prototipo in `design_handoff_civitanext/`), poi, a partire dalla Fase 0 di sviluppo, la
ricostruzione reale in Next.js alla radice del repository stesso.

## Stato attuale (Fase 0, fondamenta)

Il codice alla radice è un'applicazione Next.js 16 (React 19, TypeScript) vera, non un mockup:
i token visivi e i componenti base del design system (`Logo`, `Waves`, `Starburst`, `Chip`,
`Btn`, `Tag`, `Avatar`) sono stati riportati dal prototipo dentro `src/components/ui/`, e la
homepage (`src/app/page.tsx`) li mostra come vetrina, dichiarando esplicitamente di non avere
ancora nessuna feature collegata al database. In parallelo esiste già lo schema dati reale
(`prisma/schema.prisma`, target PostgreSQL): il modello `User` con ruolo (`SUPERADMIN`,
`ADMIN`, `UTENTE`) e tesseramento opzionale all'associazione, `Account` e `VerificationToken`
per l'autenticazione via NextAuth con sessioni JWT, `Event`, `Thread` e `Reply` per il forum,
`Proposal` con gli stati `REVISIONE`/`VOTAZIONE`/`APPROVATA`, e un modello `Vote` polimorfico
condiviso tra sondaggi, thread e proposte per garantire il vincolo di voto unico per utente.
In sintesi: fondamenta di design system e schema dati sono reali e in repository, ma nessuna
funzionalità è ancora cablata a dati veri.

## Il prototipo di design

`design_handoff_civitanext/` resta come riferimento di sola lettura, non codice di produzione:
mockup in stile React caricato via CDN (JSX/HTML monolitici), utenti e sessioni finti
(hardcoded, con autenticazione simulata in localStorage), contenuti in array statici invece
che in un database. Il linguaggio visivo è distintivo e deliberato: sfondi color carta crema,
ombre nette e sfalsate invece che sfumate, grafiche disegnate a mano come stelle e scarabocchi,
e un abbinamento tipografico serif/sans (Source Serif 4 e Archivo) con un accento corallo,
tutti valori oggi portati nei token Tailwind dell'app reale.

## Stack tecnico

Next.js 16 con React 19 e TypeScript, Tailwind CSS 4 per lo styling, Prisma 7 su PostgreSQL
per la persistenza, NextAuth (Auth.js) in versione 5 beta con sessioni JWT e bcryptjs per le
credenziali locali. Il deploy è pensato per Cloudflare tramite OpenNext (`open-next.config.ts`,
`wrangler.jsonc`), non per un hosting Next.js tradizionale.
