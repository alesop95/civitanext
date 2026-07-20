---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - src/**
  - e2e/**
  - scripts/**
  - vitest.config.mts
  - vitest.setup.ts
  - playwright.config.ts
  - docker-compose.test.yml
  - .github/workflows/**
last-verified-commit: 6495c68
---

# Test di sviluppo

> Popolare leggendo la configurazione reale dei test. La checklist operativa locale dei test
> manuali vive invece in `_notes/TEST-CHECKLIST.md`, ignorata da git. Le motivazioni complete
> delle scelte qui sotto sono in ADR-014 (`memory/decisions.md`), non ripetute qui.

## Test runner e comandi

Vitest per la logica server (server action), Playwright per l'end-to-end (ADR-014): scelta
guidata dai fatti concreti trovati in `node_modules/next/dist/docs`, non da preferenza. `npm
test` esegue la suite Vitest una volta (`npm run test:watch` per il modo watch); `npm run
test:e2e` esegue lo smoke Playwright. Entrambi richiedono un Postgres reale: in locale
`npm run test:db:up` avvia il container dedicato di `docker-compose.test.yml` (porta 5433, mai
il Neon di sviluppo in `.env`), `npm run test:db:migrate` applica le migrazioni contro quel
Postgres leggendo `.env.test` (copiare da `.env.test.example`). Le suite Vitest si saltano da
sole (`describe.skipIf`) se `DATABASE_URL`/`.env.test` non sono presenti, cosi' l'assenza del
Postgres di test non blocca comandi che non ne hanno bisogno.

Perimetro coperto oggi ("fondazione mirata", ADR-014): quattro file di test Vitest sulla
logica gia' toccata da bug reali durante la verifica manuale delle fasi precedenti
(`src/app/eventi/actions.test.ts` per il toggle RSVP, `src/app/sondaggi/actions.test.ts` per il
vincolo di voto unico sui sondaggi, `src/app/quiz/actions.test.ts` per lo scoring e la regola
"si sovrascrive solo se il punteggio migliora", `src/app/admin/proposte/actions.test.ts` per le
guardie di ruolo); fixture condivise in `src/test/fixtures.ts` (crea dati con un marker
riconoscibile, `resetTestData()` li cancella in ordine che rispetta le foreign key,
`setMockSession()` mocka `auth()` aggirando la sua firma overloaded). Un solo smoke e2e,
`e2e/smoke.spec.ts`: login, RSVP, voto proposta, tentativo quiz, seedato da
`scripts/seed-e2e.ts` (idempotente, richiamato anche da un `beforeEach` cosi' un retry
Playwright non eredita lo stato del tentativo precedente). Le altre otto verticali gia' chiuse
(forum, spazi civici, mappa, timeline, rassegna stampa...) non hanno ancora test: si aggiungono
mano a mano che si toccano, non retroattivamente.

Vincolo tecnico non ovvio: Vitest non sa renderizzare Server Component asincroni (dichiarato
esplicitamente dalla guida ufficiale Next), e quasi tutte le pagine di questo progetto lo sono:
per questo la copertura Vitest si ferma alle server action (funzioni, non componenti), e
qualunque verifica "la pagina mostra il contenuto giusto" passa da Playwright, mai da un test
di rendering isolato.

`playwright.config.ts` avvia da solo `next dev` in locale o `next start` in CI
(`process.env.CI`) sulla porta 3100; il job CI separato che verifica l'adapter Cloudflare reale
punta invece a un server gia' avviato a parte via `PW_BASE_URL` (vedi sotto).

## CI (GitHub Actions, `.github/workflows/ci.yml`)

Due job. `test`: lint, `tsc --noEmit`, `npm run build`, `npm test`, `npm run test:e2e`, tutto
contro un service container Postgres del job e runtime Node standard (`next start`).
`test-cloudflare-adapter`: builda con `opennextjs-cloudflare build` e fa girare lo stesso smoke
e2e contro il preview reale (workerd, via wrangler) su runner Linux, per chiudere la
verifica lasciata esplicitamente aperta da ADR-006 (se il bug di bundling OpenNext osservato su
Windows fosse del toolchain o dell'adapter). Non riproducibile in locale su questa macchina per
lo stesso motivo di ADR-006: la prima esecuzione reale di questo job in CI e' la verifica
stessa, non ancora confermata.

## Rotte e dati mockati

`src/app/api/diag-fase0/route.ts`: route diagnostica temporanea (non applicativa),
verifica bcryptjs e la connessione Prisma. Da rimuovere quando la verifica del runtime
Cloudflare reale sara' stata eseguita almeno una volta con esito noto (ora demandata al job CI
`test-cloudflare-adapter` sopra). Nessun altro dato mockato nell'app reale: a differenza del
prototipo (`design_handoff_civitanext/civitanext-data.jsx`, array statici), l'app reale non
introduce dati finti propri, a parte le righe di test create dalle fixture Vitest/e2e sopra
(sempre riconoscibili per marker ed eliminate dopo la corsa).

## Hook e controlli di qualita'

husky + lint-staged adottati (ADR-014). Pre-commit (`.husky/pre-commit`): `lint-staged`
(`eslint --fix` sui file staged, `.lintstagedrc.json`), poi `tsc --noEmit` sull'intero progetto
(veloce grazie a `incremental: true` in `tsconfig.json`), poi `npm test` (si salta da solo senza
Postgres di test attivo, non blocca il commit in quel caso). Prima di un commit conviene comunque
un controllo manuale completo dalla radice del repository: `npx tsc --noEmit`, `npm run build`,
`npm run lint`, e se il Postgres di test e' attivo anche `npm test` e `npm run test:e2e`.
