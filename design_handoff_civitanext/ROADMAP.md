# ROADMAP di sviluppo · CivitaNext

Sequenza consigliata per trasformare il prototipo in un prodotto reale. L'ordine non è per "importanza visiva" ma per **dipendenze tecniche** e **valore consegnabile prima**: ogni fase produce qualcosa di usabile e testabile. Se ci vuole un anno va benissimo: l'obiettivo qui è tracciare la sequenza giusta, non comprimere i tempi.

Principio guida: **prima le fondamenta (auth + dati + una feature verticale completa), poi si aggiungono le feature una alla volta riusando le stesse fondamenta.** Evitare di costruire tutte le UI in parallelo senza backend: si accumula debito.

---

## Fase 0 · Fondamenta tecniche (1-2 settimane)

Nessuna feature utente, ma sblocca tutto il resto.

1. **Scelta stack.** Raccomandato: **Next.js (App Router) + React + TypeScript**, perché copre rendering pagine pubbliche (SEO per gli eventi), API routes per il backend, e un solo linguaggio. Alternativa: Vue/Nuxt se il team la preferisce. DB: **Postgres** (Supabase o Neon) con **Prisma** come ORM.
2. **Setup progetto**: repo, lint/format, struttura cartelle, CI base.
3. **Design system**: portare i token di `README.md` in variabili CSS / Tailwind config (colori, font, radius, ombra dura). Ricreare i componenti base (`Btn`, `Chip`, `Avatar`, `Tag`, starburst/onde come componenti SVG). Questo è il vocabolario riusato da tutte le pagine: farlo bene ora fa risparmiare dopo.
4. **Schema DB iniziale**: `User`, `Event`, `Thread`, `Reply`, `Proposal`. Le altre tabelle si aggiungono quando arriva la relativa feature.

**Dipendenza**: tutto il resto dipende da questa fase.

---

## Fase 1 · MVP autenticato (3-4 settimane)

Il minimo che rende la piattaforma "viva": un utente entra, vede contenuti, partecipa.

1. **Auth reale** (NextAuth / Supabase Auth / Clerk). Due ruoli: `socio` e `admin`. Sostituisce `cnLogin/cnRegister/cnLogout`. Login socio e login admin **separati nel comportamento** (l'admin vede il tab Admin), stesso meccanismo tecnico con ruoli.
2. **Iscrizione**: flusso a 3 passi. Il pagamento può restare simulato finché non serve davvero (poi Stripe).
3. **Profilo socio**: tessera, dati, preferenze (digest, calendar) persistite su DB.
4. **Eventi (lettura + RSVP)**: pagina pubblica + calendario + RSVP per soci. Prima feature "verticale" completa dal DB alla UI: serve da modello per le successive.
5. **Forum**: lista thread, vista thread, risposte, voto (con vincolo unico su DB). Seconda feature verticale.

**Esce qui un prodotto usabile**: i soci si iscrivono, vedono eventi, partecipano, discutono.

**Dipendenze**: tutto dipende da Fase 0; RSVP e profilo dipendono dall'auth.

---

## Fase 2 · Partecipazione civica (3-4 settimane)

Il cuore della missione: proporre e votare.

1. **Proposte e votazioni**: form (soci), lista con stati, voto unico.
2. **Coda di approvazione admin**: il ciclo revisione → votazione → approvata. Questa è la feature di valore più alta dopo l'MVP: collega utenti e admin.
3. **Pannello admin (prime sezioni)**: Panoramica/stats, Proposte, Moderazione forum, Gestione eventi. (Le stat all'inizio possono essere query semplici.)
4. **Quiz**: motore domande/risposte + risultati. Gestione quiz lato admin.
5. **Attuazione proposte (feedback loop)**: step di avanzamento delle proposte approvate.

**Dipendenze**: proposte/quiz dipendono da auth (Fase 1); admin dipende da proposte e forum esistenti.

---

## Fase 3 · Mobile e PWA (2-3 settimane)

1. **Responsive / mobile**: decidere se layout responsive unico o shell mobile dedicata. Rimuovere il toggle iOS/Android del prototipo (rilevare la piattaforma reale). Tab bar mobile (Home, Eventi, Quiz, Forum, Altro).
2. **PWA**: installabile, cache offline dei contenuti letti, service worker.
3. **Notifiche**: prima in-app (tabella notifications), poi **push** (Web Push) per eventi e proposte.

**Dipendenze**: ha senso solo dopo che le feature core (Fase 1-2) esistono.

---

## Fase 4 · Community e città (3-4 settimane)

Feature ad alto valore ma non bloccanti. Tutte riusano i pattern già costruiti (liste, card, form).

- **Città**: Mappa (integrare Leaflet/Mapbox con pin reali), Spazi civici, Galleria foto (con upload reale: storage S3/Supabase), Documenti (upload PDF), Timeline (richiede raccolta materiale storico, vedi nota).
- **Community**: Mentorship, Competenze (matching), Webinar (embed video/storage), Rassegna stampa.
- **Reputazione e badge**: sistema punti + achievement. Dipende da eventi/quiz/proposte esistenti perché calcola sui loro dati.
- **Sondaggi rapidi** in home.
- **Sync Google Calendar** reale (API Google).
- **Email digest** settimanale (cron + servizio email tipo Resend/SendGrid).

**Dipendenze**: reputazione dipende da quasi tutte le feature precedenti (calcola su di esse), quindi va per ultima tra queste.

---

## Fase 5 · Analytics, testing, deploy (continuo)

1. **Analytics admin** approfondite (engagement, retention, trend): query aggregate + grafici. La sezione esiste già come UI.
2. **Testing**: unit (logica voti, auth, stati proposte) + e2e (Playwright) sui flussi del documento `Flusso di Test.html`. Quel documento è già una **specifica di test pronta**: ogni voce è un caso e2e.
3. **Deploy**: Vercel (Next.js) o Firebase. DB gestito (Supabase/Neon). Storage per immagini. Variabili d'ambiente per le chiavi.
4. **Hardening**: rate limiting su voti/post, validazione server-side, moderazione, GDPR (dati soci, consensi), backup.

---

## Riepilogo dipendenze (in breve)

```
Fase 0 (fondamenta)
   └─> Fase 1 (auth, profilo, eventi, forum)
          └─> Fase 2 (proposte, admin, quiz, attuazione)
                 ├─> Fase 3 (mobile/PWA/notifiche)
                 └─> Fase 4 (community, città, reputazione, email)
                        └─> Fase 5 (analytics, testing, deploy, hardening)
```

## Note pratiche

- **Non costruire tutte le UI prima del backend.** Una feature alla volta, verticale (DB → API → UI), riusando i componenti di Fase 0.
- **La timeline storica della città** ha voci segnate "da completare": è un compito di raccolta contenuti (biblioteca comunale, archivi), non di sviluppo. Va avviato in parallelo, presto, perché ha tempi lunghi non tecnici.
- **Il pagamento della quota** può restare simulato a lungo; integrare Stripe solo quando l'associazione vuole incassare online.
- **`Flusso di Test.html`** va tenuto aggiornato: è insieme guida di QA manuale e mappa dei casi e2e.
