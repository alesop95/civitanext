# Handoff: CivitaNext · Piattaforma di partecipazione civica

## Panoramica

CivitaNext è una piattaforma web (con versione mobile dedicata) per un'associazione di giovani cittadini di Civitanova Marche. Mette in un unico posto: calendario eventi, quiz civici, forum di discussione, proposte e votazioni, profilo socio con tessera digitale, un pannello admin completo e una serie di sezioni "community" (mentorship, competenze, webinar, rassegna stampa) e "città" (mappa, spazi civici, timeline, galleria, documenti).

Lo scopo è dare ai cittadini un canale per informarsi, partecipare agli eventi, proporre idee per la città, votarle, e seguirne l'attuazione, con un livello pubblico (visitatori), un livello socio (autenticato) e un livello admin (gestione e moderazione).

## I file di questo bundle sono RIFERIMENTI DI DESIGN

I file HTML/JSX qui inclusi sono **prototipi di design realizzati in HTML** che mostrano l'aspetto e il comportamento desiderati. **Non sono codice di produzione da copiare direttamente.** Il compito è **ricostruire questi design nell'ambiente del codebase di destinazione** (React, Next.js, Vue, ecc.) usando i suoi pattern e le sue librerie. Se non esiste ancora un codebase, scegliere il framework più adatto (la raccomandazione è **Next.js + React**, vedi roadmap) e implementare lì.

In particolare:
- La logica di autenticazione è **finta** (utenti hardcoded, sessione in localStorage). Va sostituita con auth reale.
- I dati (eventi, proposte, thread, quiz, ecc.) sono **array statici** in `civitanext-data.jsx`. Vanno spostati in un database.
- La persistenza usa `localStorage`. Va sostituita con backend + DB.

## Fidelity

**Alta fedeltà (hi-fi).** Colori, tipografia, spaziature, stati e interazioni sono definitivi. Ricostruire l'UI fedelmente usando le librerie del codebase. La direzione visiva è un "collage editoriale": carta crema con texture, accenti corallo, grafiche fatte a mano (starburst a raggi, onde, sottolineature ondulate), ombre dure (offset, non sfocate), niente gradienti, niente emoji.

---

## Design tokens

### Colori
| Token | Hex | Uso |
|---|---|---|
| `--paper` | `#F5F0E4` | Sfondo principale (carta crema) |
| `--paper-card` | `#FCF9F1` | Sfondo card, leggermente più chiaro |
| `--ink` | `#1E3A5F` | Testo principale, navy inchiostro; bordi |
| `--ink-soft` | `#5A6E85` | Testo secondario, meta |
| `--accent` | `#E8503A` | Rosso corallo: CTA, evidenze, grafiche |
| Bianco | `#FFFFFF` | Testo su fondi scuri |

L'accento è **tweakable** (vedi sezione Tweaks): alternative testate `#2A6FDB` (blu), `#1F8A5B` (verde), `#7C4DB8` (viola).

### Tipografia
| Ruolo | Font | Pesi | Note |
|---|---|---|---|
| Titoli / display | **Source Serif 4** | 600, 700, 900 | Titoli grandi, serif editoriale |
| UI / corpo / meta | **Archivo** | 500, 700, 900 | Nav, bottoni, etichette, meta |
| Accenti scritti a mano | **Caveat** | 700 | Note "a penna", dettagli informali |

Scala titoli desktop: hero ~76px/900, h2 sezione ~34px, h3 ~20px. Mobile: hero ~32px, titoli sezione ~22px. Meta/etichette: 12-13px Archivo 700, letter-spacing 1.5-2px, uppercase.

### Forma e ombre
- Border radius: **2px di default** (angoli netti). Tweak "Angoli morbidi" porta a ~14px.
- Bordi: `2px` o `2.5px solid var(--ink)` sulle card.
- Ombra dura: `5px 5px 0 rgba(30,58,95,0.14)` (offset, nessun blur). Mai ombre morbide diffuse.
- Texture carta: overlay sottile attivabile/disattivabile via Tweak.

### Grafiche brand (vedi `civitanext-ui.jsx`)
- **Starburst**: stella a molti raggi, riempita di accento, dietro le hero e i risultati quiz.
- **Onde / squiggle**: sottolineature ondulate sotto i titoli e voce di nav attiva.
- **Logo**: monogramma in cerchio con freccia/bussola + wordmark "CIVITA / NEXT" su due righe.

---

## Architettura dei file (prototipo)

| File | Contenuto |
|---|---|
| `CivitaNext Piattaforma.html` | Entry point **desktop** (1920px). Carica React+Babel e tutti gli script. |
| `CivitaNext Mobile.html` | Entry point **mobile** (frame iPhone/Android, 412px, toggle nei Tweaks). |
| `civitanext-ui.jsx` | Grafiche brand (Starburst, Wave, Logo) e componenti base: `Btn`, `Chip`, `Avatar`, `Tag`, `ShareToast`, hook `useShare`. |
| `civitanext-data.jsx` | Tutti i dati demo + funzioni auth (`cnLogin`, `cnRegister`, `cnLogout`, `cnGetUser`) + proposte (`cnGetProposals`, `cnSaveProposals`). |
| `civitanext-pages.jsx` | Pagine pubbliche desktop: Home, Eventi, Quiz, Forum. |
| `civitanext-features.jsx` | LoginForm, IscrizioneFlow, ProfiloView, PollCard, LeaderboardView, GalleryView, MapView, DocsView, NotificheView, ProposteView, CittaView. |
| `civitanext-features2.jsx` | MentorshipView, TimelineView, FeedbackView (attuazione), RassegnaView, SpaziView, WebinarView, MatchingView, CommunityView. |
| `civitanext-admin.jsx` | Pannello admin: Panoramica/stats, Proposte/approvazioni, Moderazione, Gestione quiz, Gestione eventi, Gestione utenti, Analytics. |
| `civitanext-app.jsx` | Shell **desktop**: nav, routing per stato, gestione utente, tweaks. |
| `civitanext-mobile.jsx` | Shell **mobile**: tab bar (Home, Eventi, Quiz, Forum, Altro), sotto-pagine, frame device. |
| `civitanext-features.css` | Stili condivisi di tutte le feature e pagine. |
| `tweaks-panel.jsx`, `ios-frame.jsx`, `android-frame.jsx` | Componenti di supporto (pannello tweak, bezel device). |

---

## Schermate e viste

### Pubbliche (visitatore non autenticato)

**Home** · Hero con titolo display e starburst, CTA "Scopri gli eventi" / "Entra nel forum"; fascia "prossimi eventi" (card cliccabili); "discussioni calde" (link al thread); "quiz della settimana"; sondaggio rapido votabile (barre con percentuali, voto persistito).

**Eventi** · Calendario mensile (giugno 2026: oggi=12 evidenziato, giorni con eventi puntinati di rosso); lista eventi con data, ora, luogo, categoria; filtri per categoria (chip); bottone "Partecipo" (toggle), "Condividi" (toast), "Sincronizza con Google Calendar" (simulato, toast).

**Quiz** · Lista quiz (alcuni bloccati); flusso domanda-per-domanda con barra avanzamento; risposta sbagliata = rossa + corretta blu + spiegazione; schermata risultato con punteggio e starburst, condivisione; tab "Classifica" mensile (1° posto con cornice rossa).

**Forum** · Lista thread con voto (freccia ▲, una sola volta), categoria, autore, conteggio risposte; filtri per categoria; vista thread con corpo, risposte e form risposta (utente "Tu · adesso"); condivisione.

**Proposte** · Tab "Proposte" (lista con stati: In votazione / Approvata / In revisione con bordo tratteggiato; voto persistito) e tab "Attuazione" (feedback loop: step di avanzamento con spunte, nota sullo stato reale). Form "Nuova proposta" solo per soci loggati.

**Città** · Tab: Mappa (pin eventi blu / proposte rossi, card dettaglio sotto), Spazi civici (luoghi con orari), Timeline (storia città + tappe CivitaNext, voci storiche segnate "da completare"), Galleria (album, carica foto), Documenti (statuto/verbali/bilanci con filtri).

**Community** · Tab: Mentorship (soci esperti, "Chiedi un incontro"), Competenze (matching: chi offre cosa; soci loggati possono pubblicare), Webinar (registrazioni video placeholder), Rassegna stampa (articoli esterni con commenti).

**Notifiche** · Lista avvisi con non-lette evidenziate, "Segna tutte come lette", contatore badge nel header.

### Autenticate (socio)

**Login** · Email + password (errore in rosso su credenziali errate). Demo: `socio@civitanext.it` / `civita2026`.

**Iscrizione** · 3 passi: Dati → scelta quota → pagamento simulato → benvenuto → vai al profilo (tessera nuova generata).

**Profilo** · Tessera digitale navy (nome, numero socio, data iscrizione); badge (guadagnati + bloccati tratteggiati); reputazione (livello, punti, barra verso il prossimo livello); preferenze (digest settimanale, sync Google Calendar, entrambi persistiti); logout.

### Admin (`admin@civitanext.it` / `admin2026`)

Tab "Admin" che appare solo da admin. 7 sezioni:
1. **Panoramica** · stat soci, RSVP, quiz, forum + riepilogo elementi in attesa.
2. **Proposte** · coda approvazioni; "Approva" sposta la proposta in stato "votazione" (visibile pubblicamente).
3. **Moderazione** · segnalazioni forum (Nascondi / Ignora).
4. **Quiz** · crea / modifica / attiva-disattiva.
5. **Eventi** · crea / modifica / cancella.
6. **Utenti** · cambia ruolo, attiva/disattiva.
7. **Analytics** · grafico iscritti mensili (Feb-Giu), retention, tendenze.

---

## Interazioni e comportamento

- **Routing**: stato `page` in React (no router vero). Da reimplementare con il router del framework (es. Next.js App Router). Pagina corrente persistita in localStorage.
- **Voti** (sondaggio, thread, proposte): una sola volta per item, contatore +1, stato persistito; bottone diventa rosso.
- **Toast** condivisione/sync: appare e scompare dopo ~2.2s.
- **Quiz**: feedback immediato su ogni risposta (colori + spiegazione), punteggio finale.
- **Approvazione admin**: la proposta in "revisione" passa a "votazione" e diventa pubblica (è il ciclo end-to-end chiave da preservare).
- **Responsive**: desktop e mobile sono **due shell separate** nel prototipo. In produzione valutare se unificare con layout responsive o mantenere componenti dedicati per il mobile. Il mobile ha frame iOS/Android (toggle solo per la demo, da rimuovere in produzione: rileva la piattaforma reale).
- **Animazioni d'ingresso**: lo stato finale è la base; le animazioni partono da nascosto e sono gated su `prefers-reduced-motion`.

## State management (prototipo → produzione)

| Stato (demo, localStorage) | In produzione |
|---|---|
| `cn_user` (sessione) | Auth provider (NextAuth/Clerk/Supabase Auth), JWT/session cookie |
| `cn_proposals` | Tabella `proposals` |
| `cn_page` | URL / router |
| `cn_digest`, `cn_gcal` | Tabella `user_preferences` |
| voti sondaggio/thread | Tabelle `votes` con vincolo unico (user, item) |
| notifiche lette | Tabella `notifications` con flag read |

## Modello dati (entità principali)

`User` (email, name, role: socio|admin, tessera, since, preferences) · `Event` (day, month, title, time, place, cat, desc, rsvps) · `Thread` (cat, title, author, body, votes, replies[]) · `Quiz` + `Question` (q, opts[], correct, why) · `Proposal` (title, cat, votes, status: revisione|votazione|approvata, author, desc, implementationSteps[]) · `Poll` · `Notification` · `Badge` · `Mentor` · `Skill` · `Webinar` · `PressItem` · `Space` · `TimelineEntry` · `Document` · `GalleryAlbum`.

## Tweaks (solo prototipo)

Pannello tweak con: colore Accento (swatch), texture carta on/off, angoli morbidi on/off, frame mobile iOS/Android. **In produzione i tweak non vanno portati** se non come eventuale tema: l'accento può diventare una variabile di tema.

## Assets

Nessuna immagine reale: tutte le foto sono placeholder (`.cnx-ph`) etichettati. Le grafiche (starburst, onde, logo) sono **SVG/CSS generati in `civitanext-ui.jsx`**, riutilizzabili. Le foto storiche della timeline e le immagini eventi/galleria sono da fornire. I font sono Google Fonts (Source Serif 4, Archivo, Caveat).

## File inclusi nel bundle

Tutti i file `.html`, `.jsx` e `.css` elencati nella sezione Architettura, più `Flusso di Test.html` (checklist interattiva che copre ogni feature, desktop e mobile) e `ROADMAP.md` (cronologia di sviluppo consigliata).

---

Vedi **ROADMAP.md** per la sequenza di sviluppo consigliata (fasi, priorità, dipendenze).
