---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - src/**
  - .claude/**
last-verified-commit: 4da8cf9
stato: in verifica
---

# Lavoro in corso

> La fonte di verità su cosa è fatto resta `memory/index.md` e il work-log, non le spunte di
> questo file. Ogni feature si descrive con lo schema fisso sotto, così il lavoro pendente è
> leggibile senza ricostruire il contesto da capo.

## Feature: Fase 0 — fondamenta tecniche

Cosa fa: prepara il terreno per lo sviluppo reale (nessuna feature utente): allineamento del
sistema di progetto, scelta e validazione dello stack gratuito, bootstrap applicativo, design
system, schema dati iniziale.

File da creare:

```
(radice del repository)                    scaffold Next.js 16 + TypeScript, fatto
src/components/ui/*.tsx                    design system (Starburst, Waves, Logo, Btn, Chip, Tag, Avatar), fatto
prisma/schema.prisma                       User, Event, Thread, Reply, Proposal, Vote, fatto
```

File da modificare:

```
CLAUDE.md            corretta la dichiarazione stack non reale ("Vite"), fatto
.claude/context/*.md  popolate con contenuto reale, questa voce
```

Definition of done:

- [x] `.claude` allineato al template (memoria ancorata, regole risincronizzate)
- [x] Stack gratuito scelto e motivato (ADR-004/005/006/007)
- [x] Bootstrap Next.js+TypeScript verificato (`npm run build`/`start` puliti)
- [x] Design system visibile su homepage (`npm run build` + verifica HTML)
- [x] Schema Prisma scritto e validato (`prisma validate`)
- [x] Migrazione Prisma eseguita contro un Postgres reale (server locale dedicato
      `npx prisma dev -n civitanext`, porte 51218/51219; `migrate dev` non utilizzabile per un
      bug noto upstream, workaround `migrate diff` + `migrate deploy` adottato e verificato,
      vedi ADR-009 e `refactor-05-migrazione-shadow-database.md`)
- [ ] Sintesi non tecnica per lo stakeholder (Step 2bis del piano)
- [ ] Verifica del runtime Cloudflare reale (bloccata su questa macchina Windows, rimandata a
      deploy/CI, vedi ADR-006)

Domande aperte:

Da decidere più avanti, non bloccante per Fase 0: accesso a un ulteriore progetto personale ai
fini del solo confronto didattico privato in `_notes/` (dettagli non tracciati qui di proposito).
Da verificare quando esisterà un branch Neon di sviluppo (ADR-007): se il bug upstream di
`migrate dev` contro lo shadow database (ADR-009) si manifesta anche contro un Postgres reale in
rete o è specifico del server locale `prisma dev` di questa macchina.

## Feature: Fase 1 — autenticazione reale e ruoli

Cosa fa: introduce l'autenticazione reale (NextAuth) con tre livelli di autorizzazione
(`SUPERADMIN`, `ADMIN`, `UTENTE`) e il tesseramento come dato indipendente dal ruolo, prima
decisione della prima feature verticale di Fase 1 secondo `roadmap.md`.

File da creare:

```
src/lib/prisma.ts                    client Prisma per-richiesta (cache()), fatto
src/types/next-auth.d.ts             augmentation di User/Session/JWT con role/tesseraNumero, fatto
src/auth.ts                          configurazione NextAuth (Credentials+Google, adapter, jwt/session), fatto
src/app/api/auth/[...nextauth]/route.ts   route handler NextAuth, fatto
src/app/api/register/route.ts        registrazione credenziali (il provider Credentials autentica soltanto), fatto
src/app/accedi/page.tsx              pagina di accesso (credenziali + Google), fatto
src/app/registrati/page.tsx          pagina di registrazione, fatto
```

File da modificare:

```
prisma/schema.prisma        Role (SUPERADMIN/ADMIN/UTENTE), passwordHash nullable, emailVerified/image, modelli Account e VerificationToken, fatto
package.json                dipendenza @auth/prisma-adapter, fatto
src/components/ui/Btn.tsx   estratta btnClassName() per riusare lo stile su <Link>, non solo <button>, fatto
src/app/page.tsx            header legge la sessione (auth()) e mostra avatar+Esci oppure Accedi/Registrati, fatto
```

Definition of done:

- [x] Modello ruoli/tesseramento deciso e applicato allo schema (ADR-010)
- [x] Strategia di sessione decisa (JWT con scadenza breve + ricontrollo ruolo al rinnovo, ADR-010)
- [x] Provider di autenticazione decisi (credenziali + Google, ADR-010)
- [x] Migrazione applicata al Postgres locale (procedura ADR-009)
- [x] Dipendenza `@auth/prisma-adapter` installata
- [x] Configurazione NextAuth scritta (`auth.ts`, route handler, callback `jwt`/`session`),
      `npm run build` pulito con typecheck incluso
- [x] Pagine di accesso/registrazione (credenziali + pulsante Google)
- [x] Verifica manuale nel browser del flusso a credenziali (registrazione, accesso), 2026-07-14:
      utente creato nel database con `role: UTENTE`, `tesseraNumero: null`, password hashata
      bcrypt (mai in chiaro); sessione confermata via `/api/auth/session`, scadenza a un'ora
      dalla verifica, coerente con `maxAge` di ADR-010. Quella prima verifica passava dal login
      automatico di `/registrati` (che imposta `redirectTo` esplicitamente): l'accesso diretto da
      `/accedi` aveva un bug distinto, trovato e corretto il 2026-07-15 (vedi `progress.md`),
      ora verificato anch'esso end-to-end
- [ ] Verifica manuale del flusso Google — rimandata di proposito a quando esisterà un account
      Google dedicato all'associazione, non bloccante per il resto (vedi `roadmap.md`); codice
      già scritto e completo, non richiede altro lavoro quando si riprende
- [x] UI minima di stato sessione in home (avatar+Esci se loggato, Accedi/Registrati altrimenti),
      verificata nel browser in entrambe le direzioni (login e logout) il 2026-07-14
- [ ] Sintesi stakeholder di Fase 1 da aggiornare con l'esito della verifica (bozza della sola
      decisione già in `_notes/stakeholder-brief-fase-1-autenticazione.md`)

Domande aperte: nessuna bloccante per il flusso a credenziali. `AUTH_GOOGLE_ID`/
`AUTH_GOOGLE_SECRET` rimandati di proposito, non bloccanti (vedi `roadmap.md`).

## Feature: Eventi (lettura + RSVP)

Cosa fa: prima feature verticale completa di Fase 1 secondo `roadmap.md` — elenco eventi letto
dal database e iscrizione/disiscrizione (RSVP) per utenti loggati.

File da creare:

```
prisma/seed.js                  seed idempotente dei quattro eventi reali del prototipo di design, fatto
src/components/SiteHeader.tsx   header di navigazione condiviso (estratto da page.tsx), fatto
src/app/eventi/page.tsx         elenco eventi con stato RSVP, fatto
src/app/eventi/actions.ts       server action toggleRsvp(eventId), fatto
```

File da modificare:

```
prisma/schema.prisma          modello Rsvp (vincolo @@unique([userId, eventId]), stesso principio di Vote/refactor-04), fatto
src/components/ui/Chip.tsx    estratta chipClassName() per riusare lo stile su <Link>, fatto
src/app/page.tsx              usa <SiteHeader activeHref="/" /> al posto dell'header inline, fatto
src/app/accedi/page.tsx       bugfix: redirectTo mancante, vedi Domande aperte/progress.md, fatto
```

Definition of done:

- [x] Modello `Rsvp` scritto, validato e migrato (procedura ADR-009)
- [x] Seed dei quattro eventi reali (`prisma/seed.js`, ripresi da `design_handoff_civitanext/civitanext-data.jsx`)
- [x] Header di navigazione condiviso tra `/` e `/eventi` (`SiteHeader`), scritto da due agenti
      in parallelo su file disgiunti, verificato con build unica dopo il merge
- [x] Pagina `/eventi`: lista, categoria, data/ora in italiano, luogo, descrizione, conteggio
      partecipanti, pulsante RSVP condizionato allo stato di login
- [x] `npm run build` pulito (typecheck incluso) dopo l'integrazione dei due agenti
- [x] Verifica manuale nel browser, 2026-07-15: login da `/accedi` riuscito (dopo il bugfix),
      RSVP su un evento passa da "0 partecipanti"/"Partecipo" a "1 partecipante"/"Annulla
      partecipazione" nello stesso caricamento di pagina (`revalidatePath`)

Domande aperte: nessuna bloccante. Bug trovato durante questa verifica, non specifico della
feature Eventi ma della pagina `/accedi` di Fase 1 (mai esercitata end-to-end prima d'ora):
`signIn("credentials", formData)` senza indicare `redirectTo` reindirizza di default all'header
`Referer` (cioè torna su `/accedi` stessa), non alla home, dando l'impressione che il login sia
bloccato anche quando riesce. Corretto aggiungendo un campo nascosto `redirectTo` nel form (con
un `FormData`, Auth.js legge `redirectTo` dai campi del form stesso via `Object.fromEntries`, non
da un argomento separato: verificato leggendo `node_modules/next-auth/lib/actions.js`, non
ipotizzato). Vedi la voce di lavoro corrispondente in `memory/progress.md`.

## Feature: Profilo con tessera digitale

Cosa fa: seconda feature verticale di Fase 1 secondo `roadmap.md` — pagina profilo che mostra i
dati dell'account e, se l'utente è tesserato, la tessera digitale; altrimenti un invito a
completare l'iscrizione. Nessuna assegnazione di `tesseraNumero` in questa feature (resta
un'azione amministrativa, fuori scope, da affrontare quando si costruirà la parte admin).

File da creare:

```
src/app/profilo/page.tsx   pagina profilo con tessera digitale condizionale, fatto
```

File da modificare:

```
src/components/SiteHeader.tsx   l'avatar diventa un link a /profilo, fatto
src/app/accedi/page.tsx         bugfix: CredentialsSignin non gestito, vedi Domande aperte, fatto
```

Definition of done:

- [x] Pagina `/profilo`: dati account (nome, email, ruolo, membro dal), tessera digitale se
      `tesseraNumero` presente, messaggio altrimenti
- [x] Avatar nell'header collegato al profilo
- [x] `npm run build` pulito (typecheck incluso)
- [x] Verifica manuale nel browser, 2026-07-15: profilo mostrato correttamente per l'utente di
      prova (non tesserato, messaggio corretto), confermato dall'utente dopo il bugfix di accedi

Domande aperte: nessuna bloccante. Bug trovato durante questa verifica, distinto da quello di
`redirectTo` già corretto: `authorize()` che restituisce `null` (credenziali sbagliate, o più
probabilmente una sessione scaduta dopo un'ora che ha rimandato l'utente su `/accedi` da
`/profilo`) fa lanciare a `signIn` un `CredentialsSignin` — comportamento dichiarato dalla stessa
Auth.js per i form action lato server ("questo errore viene lanciato... invece di reindirizzare
l'utente, quindi va gestito", commento nel sorgente di `@auth/core/errors.js`), ma non gestito
nel nostro form, causando un errore 500 invece di un messaggio. Corretto con un `try/catch`
attorno a `signIn` che cattura `AuthError` e reindirizza con un messaggio leggibile, ripassando
qualunque altro errore (incluso il segnale interno di redirect di Next.js in caso di successo,
che non è un'istanza di `AuthError` e quindi non viene intercettato per errore).

## Riconciliazione

Ultima verifica: 2026-07-15, al commit `4da8cf9` (le modifiche di questa voce non ancora
committate al momento della nota). Migrazione Prisma applicata al Postgres locale dedicato di
questo progetto (schema sincronizzato, cronologia tracciata in `prisma/migrations/`): vedi
`memory/progress.md` e ADR-009/ADR-010 in `memory/decisions.md` per il dettaglio delle indagini
e decisioni principali di questo blocco di lavoro.
