---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - src/**
  - prisma/**
last-verified-commit: a220a33
---

# Design e sicurezza applicativa

> Popolare leggendo il codice attuale. Nessun diagramma prodotto ancora in Fase 0: la tabella
> sotto resta vuota finché non se ne crea uno reale.

## Paradigmi di software design

Server Component per default, Client Component solo dove serve interattività reale: nessuno dei
componenti del design system (`src/components/ui/`) usa `"use client"`, perché sono puramente
presentazionali e non spediscono JavaScript inutile al browser. I design token (colori, raggio,
ombra) vivono come variabili CSS in `:root` e sono esposti a Tailwind tramite `@theme inline`,
non come valori statici nelle classi: l'accento colore in particolare resta rideclinabile a
runtime da un solo punto, coerente con il fatto che il prototipo lo tratta come tema
personalizzabile.

Accesso al database esclusivamente da codice server-side tramite Prisma, mai da client: nessuna
chiave o connection string è mai esposta al browser. Il client Prisma va istanziato per-richiesta
(non un singleton globale con pool persistente), vincolo imposto dal runtime Cloudflare Workers
di destinazione (vedi ADR-005) e comunque una pratica corretta anche a prescindere dal target di
deploy specifico.

## Sicurezza applicativa

Autenticazione implementata (Fase 1, ADR-010): NextAuth self-hosted, hashing password con
`bcryptjs`, sessione JWT con ricontrollo periodico del ruolo, tre livelli (`SUPERADMIN`, `ADMIN`,
`UTENTE`) con lo stato di tesseramento indipendente dal ruolo. Sopra l'autenticazione, le azioni
riservate applicano una guardia di autorizzazione per ruolo lato server, non solo un nascondere
il comando nella UI: ogni server action interessata ricontrolla il ruolo prima di scrivere. La
lista è cresciuta con le fasi e comprende la coda di approvazione delle proposte, la creazione di
sondaggi, spazi civici, punti mappa, timeline, rassegna stampa, mentori (`admin/mentorship`),
album e documenti (`admin/galleria`, `admin/documenti`), webinar (`admin/webinar`), la
moderazione di forum e competenze (`admin/forum`, `admin/competenze`) e l'esecuzione della
cancellazione account (`admin/account-deletion`). Restano invece a guardia di sola
autenticazione (non di ruolo) le azioni di contenuto autoriale del socio: apertura di thread e
risposte del forum, voto di proposte e sondaggi, upload di foto in un album, dichiarazione di
competenze, richiesta di incontro con un mentore, gestione delle proprie preferenze e
sottoscrizioni push. Anche la validazione degli input è server-side (campi obbligatori, range
delle coordinate, `url` solo `http(s)` assoluto perché reso come `href`, enum chiusi),
irrobustita dopo che una verifica manuale trovò azioni che tornavano senza scrivere né avvisare
su un campo vuoto. Il vincolo di voto unico per utente
(`Vote.@@unique([userId, targetType, targetId])`) è un vincolo di integrità imposto a livello di
database, non solo di validazione applicativa: non è aggirabile da una richiesta malformata.
`.env` e i file di credenziali sono esclusi dalla lettura dell'agente per regola di
`settings.json`, coerente con `rules/security-permissions.md`.

Punto aperto, non ancora deciso: la tabella `Vote` usa `targetId` come riferimento generico
(pattern polimorfico), senza vincolo di chiave esterna reale verso `Thread`/`Proposal`/`Poll` —
un compromesso deliberato (vedi `prisma/schema.prisma`, commento sul modello `Vote`) che
va tenuto presente quando si scriverà la validazione applicativa in Fase 1/2: il database da
solo non garantisce che `targetId` punti a un record esistente del tipo dichiarato in
`targetType`.

## Hardening di Fase 5

L'irrobustimento di Fase 5 aggiunge tre difese trasversali sopra le guardie di ruolo, tutte senza
infrastruttura esterna. La validazione di lunghezza (`src/lib/validation.ts`, `MAX_SHORT_TEXT`
200 e `MAX_LONG_TEXT` 5000) è ora applicata a tutti i file di action che accettano testo libero,
un audit che prima non aveva alcun tetto. Il rate limiting (`src/lib/rate-limit.ts`) è calcolato
contando righe Postgres già esistenti in una finestra temporale, senza Redis né tabella dedicata,
con soglie calibrate sul costo di moderazione del contenuto (forum, proposte, competenze); non
si applica ai voti, già vincolati dal `@@unique`, né al contenuto admin-only. La moderazione dà
agli admin la cancellazione, prima assente, di thread, risposte del forum e voci di competenze.

Gli upload di file binari (galleria, documenti) validano i byte reali del file prima di scrivere
su R2, mai l'estensione o il `File.type` dichiarati dal client: `src/lib/photo-validation.ts`
controlla i magic bytes di JPEG, PNG e WEBP, `src/lib/document-validation.ts` il magic number
`%PDF`. È la difesa contro un file rinominato o con content-type falsificato.

La cancellazione account (GDPR, ADR-018) è un ibrido anonimizzazione più mediazione admin: il
socio la richiede da `/profilo`, un admin la esegue da `/admin/account-deletion`, nessuna
esecuzione automatica. `processAccountDeletion` cancella per davvero le tre categorie di dato non
pubblico (righe `Account` con i token OAuth Google, `PushSubscription` dispositivo-specifiche,
`VerificationToken` residuo) e anonimizza la riga `User` (email deterministica, nome "Utente
cancellato", password e tessera azzerate) lasciando intatti i contenuti pubblicati. La riga
`AccountDeletionRequest` non viene mai cancellata: resta come traccia scritta di chi ha chiesto,
quando e quale admin ha eseguito.

Due superfici non-utente meritano attenzione separata. L'endpoint `/api/digest` non ha sessione,
perché chi lo chiama è un workflow schedulato e non un utente loggato: è protetto da un
`CRON_SECRET` confrontato a tempo costante, non da un uguaglianza di stringa che perderebbe da un
attacco a tempo. Il contenuto del digest (`src/lib/digest.ts`) applica una fuga HTML esplicita
sui titoli e nomi dei thread scritti dai soci, perché finiscono in un corpo email HTML. Le
notifiche push passano da `notifyUser` (`src/lib/notifications.ts`), punto unico sia dell'in-app
sia del push: una sottoscrizione segnalata scaduta dal push service (404/410) viene cancellata,
gli altri errori non la toccano.

## Diagrammi

| Diagramma | Sorgente | Componenti rappresentati |
|---|---|---|
| — | — | nessuno prodotto in Fase 0 |
