// CivitaNext: dati di esempio per il prototipo
const CN_EVENTS = [
  { id: 1, day: 18, month: 'GIU', title: 'Assemblea aperta: bilancio partecipativo', time: '18:30', place: 'Aula consiliare, Civitanova Marche', cat: 'Incontri', desc: 'Discutiamo insieme le proposte da portare in Comune per il bilancio partecipativo 2026.' },
  { id: 2, day: 21, month: 'GIU', title: 'Pulizia della spiaggia + aperitivo', time: '9:00', place: 'Lungomare Sud, concessione libera', cat: 'Volontariato', desc: 'Guanti e sacchi li portiamo noi. Alla fine, aperitivo offerto per chi ha partecipato.' },
  { id: 3, day: 27, month: 'GIU', title: 'Cineforum sotto le stelle', time: '21:15', place: 'Giardino del Lido Cluana', cat: 'Cultura', desc: 'Proiezione all’aperto e discussione finale. Porta una sedia pieghevole o un telo.' },
  { id: 4, day: 30, month: 'GIU', title: 'Quiz night civico', time: '21:00', place: 'Circolo ARCI, via Buozzi', cat: 'Cultura', desc: 'Squadre da 4. Domande su città, civica e attualità. In palio: gloria eterna.' },
];

const CN_THREADS = [
  {
    id: 1, cat: 'Mobilità', title: 'Una pista ciclabile sul lungomare sud: proposta',
    author: 'Giulia M.', when: '2 ore fa', votes: 24, replies: [
      { author: 'Marco T.', when: '1 ora fa', text: 'Sono d’accordo, ma serve capire come gestire l’incrocio con via Colombo. Qualcuno ha la planimetria?' },
      { author: 'Sara P.', when: '40 min fa', text: 'Al prossimo incontro porto i dati sui flussi di traffico che abbiamo raccolto a maggio.' },
    ],
    body: 'Ho preparato una bozza di proposta per una ciclabile che colleghi il porto al confine con Porto Sant’Elpidio. La condivido qui prima di portarla all’assemblea del 18: commenti e critiche sono benvenuti.'
  },
  {
    id: 2, cat: 'Ambiente', title: 'Organizziamo una pulizia della spiaggia a luglio?',
    author: 'Marco T.', when: '5 ore fa', votes: 18, replies: [
      { author: 'Elena R.', when: '3 ore fa', text: 'Ci sto! Possiamo chiedere al Comune i sacchi e il ritiro come l’altra volta.' },
    ],
    body: 'Quella di giugno sta andando benissimo con le iscrizioni. Replichiamo a luglio, magari di sera con meno caldo?'
  },
  {
    id: 3, cat: 'Città', title: 'Spazi per studiare aperti la sera: chi ci sta?',
    author: 'Elena R.', when: 'ieri', votes: 31, replies: [
      { author: 'Giulia M.', when: 'ieri', text: 'La biblioteca chiude alle 19, è il problema principale per chi lavora di giorno.' },
      { author: 'Luca B.', when: '20 ore fa', text: 'Potremmo proporre un’apertura serale sperimentale di due mesi, con volontari dell’associazione a presidiare.' },
      { author: 'Sara P.', when: '18 ore fa', text: 'Aggiungo: servirebbe anche il wifi decente. Lo metto nella proposta.' },
    ],
    body: 'A Civitanova non c’è un posto dove studiare dopo cena. Vorrei raccogliere firme e proposte per un’apertura serale della biblioteca o di uno spazio comunale.'
  },
  {
    id: 4, cat: 'Associazione', title: 'Recap incontro del 5 giugno + prossimi passi',
    author: 'Luca B.', when: '3 giorni fa', votes: 12, replies: [],
    body: 'Grazie a chi c’era! In breve: approvato il calendario estivo, partito il gruppo di lavoro sul bilancio partecipativo, cerchiamo 2 volontari per i social.'
  },
];

const CN_QUIZZES = [
  { id: 1, title: 'Educazione civica: le basi', desc: '4 domande su voto, comune e partecipazione', n: 4, time: '~2 min', done: false },
  { id: 2, title: 'Quanto conosci la tua città?', desc: 'Storia e luoghi di Civitanova Marche', n: 8, time: '~5 min', done: false, locked: true },
  { id: 3, title: 'Bilancio partecipativo', desc: 'Come funziona e come si vota', n: 6, time: '~4 min', done: false, locked: true },
];

const CN_QUIZ_QUESTIONS = [
  {
    q: 'A che età si può votare per eleggere la Camera dei Deputati?',
    opts: ['16 anni', '18 anni', '21 anni', '25 anni'],
    correct: 1,
    why: 'Dal 2021 anche per il Senato basta la maggiore età: si vota a 18 anni per entrambe le Camere.'
  },
  {
    q: 'Ogni quanti anni si elegge, di norma, il sindaco?',
    opts: ['3 anni', '4 anni', '5 anni', '7 anni'],
    correct: 2,
    why: 'Il mandato del sindaco e del consiglio comunale dura 5 anni.'
  },
  {
    q: 'Che cos’è un bilancio partecipativo?',
    opts: [
      'Un bilancio approvato all’unanimità',
      'Un processo in cui i cittadini decidono come spendere parte del bilancio comunale',
      'Il bilancio di un’associazione di volontariato',
      'Una tassa di partecipazione'
    ],
    correct: 1,
    why: 'I cittadini propongono e votano progetti finanziati con una quota del bilancio del Comune.'
  },
  {
    q: 'Quante firme servono per presentare una proposta di legge di iniziativa popolare?',
    opts: ['5.000', '20.000', '50.000', '500.000'],
    correct: 2,
    why: 'L’articolo 71 della Costituzione richiede almeno 50.000 firme di elettori.'
  },
];

// Calendario giugno 2026: il 1° giugno 2026 è un lunedì, 30 giorni
const CN_CAL = { monthLabel: 'Giugno 2026', startOffset: 0, days: 30, today: 12 };

/* ---------- Utenti e autenticazione (demo, nessun account reale) ---------- */
const CN_USERS = [
  { email: 'socio@civitanext.it', password: 'civita2026', name: 'Giulia Marini', role: 'socio', tessera: 'CN-2026-014', since: 'Gennaio 2026' },
  { email: 'admin@civitanext.it', password: 'admin2026', name: 'Luca Bonifazi', role: 'admin', tessera: 'CN-2026-001', since: 'Gennaio 2026' },
];

function cnGetUser() {
  try { return JSON.parse(localStorage.getItem('cn_user')); } catch (e) { return null; }
}
function cnLogin(email, password) {
  const u = CN_USERS.find(x => x.email === email.trim().toLowerCase() && x.password === password);
  if (!u) return null;
  const session = { name: u.name, role: u.role, tessera: u.tessera, since: u.since, email: u.email };
  localStorage.setItem('cn_user', JSON.stringify(session));
  return session;
}
function cnRegister(name) {
  const session = { name: name, role: 'socio', tessera: 'CN-2026-0' + (40 + Math.floor(Math.random() * 50)), since: 'Giugno 2026', email: '' };
  localStorage.setItem('cn_user', JSON.stringify(session));
  return session;
}
function cnLogout() { localStorage.removeItem('cn_user'); }

/* ---------- Proposte dei cittadini (persistite per la demo) ---------- */
const CN_PROPOSALS_DEFAULT = [
  { id: 1, title: 'Pista ciclabile sul lungomare sud', cat: 'Mobilità', votes: 128, status: 'votazione', author: 'Giulia M.', desc: 'Collegare il porto al confine sud con una ciclabile protetta, separata dal traffico.' },
  { id: 2, title: 'Biblioteca aperta anche la sera', cat: 'Cultura', votes: 96, status: 'votazione', author: 'Elena R.', desc: 'Apertura serale sperimentale per due mesi, presidiata da volontari dell’associazione.' },
  { id: 3, title: 'Più rastrelliere per bici in centro', cat: 'Mobilità', votes: 64, status: 'approvata', author: 'Marco T.', desc: 'Dieci nuove rastrelliere tra corso Umberto e la stazione. Approvata dal Comune a maggio.' },
  { id: 4, title: 'Orti urbani in zona stadio', cat: 'Ambiente', votes: 0, status: 'revisione', author: 'Sara P.', desc: 'Assegnare le aree verdi inutilizzate vicino allo stadio a orti condivisi per residenti.' },
];
function cnGetProposals() {
  try {
    const s = JSON.parse(localStorage.getItem('cn_proposals'));
    if (Array.isArray(s) && s.length) return s;
  } catch (e) {}
  return CN_PROPOSALS_DEFAULT;
}
function cnSaveProposals(list) { localStorage.setItem('cn_proposals', JSON.stringify(list)); }

/* ---------- Sondaggio rapido in home ---------- */
const CN_POLL = {
  id: 'poll-giu-2',
  q: 'Dove organizziamo la prossima assemblea?',
  opts: ['Aula consiliare', 'Giardino del Lido Cluana', 'Online'],
  votes: [18, 11, 7],
};

/* ---------- Classifica quiz mensile ---------- */
const CN_LEADERBOARD = [
  { name: 'Sara P.', pts: 420, quiz: 9 },
  { name: 'Marco T.', pts: 380, quiz: 8 },
  { name: 'Giulia M.', pts: 350, quiz: 8 },
  { name: 'Luca B.', pts: 290, quiz: 6 },
  { name: 'Elena R.', pts: 240, quiz: 5 },
  { name: 'Andrea C.', pts: 180, quiz: 4 },
];

/* ---------- Galleria foto post-evento (placeholder) ---------- */
const CN_GALLERY = [
  { id: 1, label: 'Pulizia spiaggia', sub: 'Maggio 2026 · 24 foto' },
  { id: 2, label: 'Assemblea di primavera', sub: 'Aprile 2026 · 18 foto' },
  { id: 3, label: 'Banchetto in piazza', sub: 'Aprile 2026 · 12 foto' },
  { id: 4, label: 'Cineforum', sub: 'Marzo 2026 · 9 foto' },
];

/* ---------- Mappa della città: punti eventi e proposte ---------- */
const CN_MAP_POINTS = [
  { id: 1, x: 62, y: 28, type: 'evento', title: 'Assemblea aperta', place: 'Aula consiliare' },
  { id: 2, x: 78, y: 62, type: 'evento', title: 'Pulizia spiaggia', place: 'Lungomare Sud' },
  { id: 3, x: 70, y: 44, type: 'evento', title: 'Cineforum', place: 'Lido Cluana' },
  { id: 4, x: 74, y: 75, type: 'proposta', title: 'Ciclabile lungomare sud', place: 'Lungomare Sud' },
  { id: 5, x: 48, y: 38, type: 'proposta', title: 'Biblioteca serale', place: 'Centro' },
  { id: 6, x: 30, y: 55, type: 'proposta', title: 'Orti urbani', place: 'Zona stadio' },
];

/* ---------- Area documenti e trasparenza ---------- */
const CN_DOCS = [
  { title: 'Statuto dell’associazione', cat: 'Statuto', date: 'Gennaio 2026', meta: 'PDF · 240 KB' },
  { title: 'Verbale assemblea del 5 giugno', cat: 'Verbali', date: 'Giugno 2026', meta: 'PDF · 96 KB' },
  { title: 'Verbale assemblea del 9 aprile', cat: 'Verbali', date: 'Aprile 2026', meta: 'PDF · 88 KB' },
  { title: 'Bilancio preventivo 2026', cat: 'Bilanci', date: 'Febbraio 2026', meta: 'PDF · 180 KB' },
  { title: 'Regolamento proposte e votazioni', cat: 'Statuto', date: 'Marzo 2026', meta: 'PDF · 120 KB' },
];

/* ---------- Notifiche ---------- */
const CN_NOTIFICATIONS = [
  { id: 1, text: 'La tua proposta "Orti urbani" è in revisione', when: '2 ore fa', read: false },
  { id: 2, text: 'Nuova risposta in "Spazi per studiare aperti la sera"', when: '5 ore fa', read: false },
  { id: 3, text: 'Promemoria: Assemblea aperta giovedì 18 alle 18:30', when: 'ieri', read: true },
  { id: 4, text: 'Quiz della settimana disponibile: Educazione civica', when: '2 giorni fa', read: true },
];

/* ---------- Badge del profilo ---------- */
const CN_BADGES = [
  { id: 1, label: 'Primo evento', earned: true },
  { id: 2, label: '5 eventi', earned: true },
  { id: 3, label: 'Prima proposta', earned: true },
  { id: 4, label: 'Quiz completato', earned: true },
  { id: 5, label: 'Punteggio pieno', earned: false },
  { id: 6, label: 'Un anno con noi', earned: false },
];

/* ---------- Mentorship ---------- */
const CN_MENTORS = [
  { id: 1, name: 'Luca Bonifazi', area: 'Burocrazia comunale', desc: 'Come si presenta una richiesta in Comune, accesso agli atti, PEC e firme.', slots: 2 },
  { id: 2, name: 'Sara Properzi', area: 'Comunicazione e social', desc: 'Raccontare un progetto civico: testi, foto, campagne social.', slots: 3 },
  { id: 3, name: 'Marco Tombesi', area: 'Bandi e fondi', desc: 'Trovare e leggere bandi regionali ed europei per progetti locali.', slots: 1 },
];

/* ---------- Timeline (storia: contenuti placeholder da completare) ---------- */
const CN_TIMELINE = [
  { id: 1, when: 'Da completare', title: 'Le origini della città', text: 'Materiale storico da raccogliere con la biblioteca comunale.', photo: true, kind: 'citta' },
  { id: 2, when: 'Da completare', title: 'Il porto e la marineria', text: 'Foto e testimonianze della tradizione marinara.', photo: true, kind: 'citta' },
  { id: 3, when: 'Da completare', title: 'Il distretto della calzatura', text: 'La crescita industriale e artigiana del territorio.', photo: true, kind: 'citta' },
  { id: 4, when: 'Gennaio 2026', title: 'Nasce CivitaNext', text: 'Dodici giovani fondano l’associazione.', photo: false, kind: 'cn' },
  { id: 5, when: 'Marzo 2026', title: 'Prima assemblea pubblica', text: 'Oltre 60 partecipanti all’aula consiliare.', photo: true, kind: 'cn' },
  { id: 6, when: 'Maggio 2026', title: 'Prima pulizia della spiaggia', text: '40 volontari, 38 sacchi raccolti.', photo: true, kind: 'cn' },
  { id: 7, when: 'Giugno 2026', title: 'Lancio della piattaforma', text: 'Eventi, quiz, forum e proposte in un unico posto.', photo: false, kind: 'cn' },
];

/* ---------- Attuazione proposte (feedback loop) ---------- */
const CN_FEEDBACK = [
  {
    id: 1, title: 'Più rastrelliere per bici in centro', votes: 64,
    steps: [
      { label: 'Proposta approvata dai soci', done: true },
      { label: 'Presentata in Comune', done: true },
      { label: 'Sopralluogo e scelta dei punti', done: true },
      { label: 'Installazione', done: false },
    ],
    note: 'Il Comune ha stanziato i fondi: installazione prevista entro settembre 2026.'
  },
];

/* ---------- Reputazione ---------- */
const CN_REPUTATION = {
  points: 350,
  level: 'Attivo',
  next: 'Pilastro',
  nextAt: 500,
  levels: ['Nuovo (0)', 'Attivo (200)', 'Pilastro (500)'],
  how: 'Si guadagnano punti partecipando a eventi, completando quiz, proponendo e votando.',
};

/* ---------- Rassegna stampa ---------- */
const CN_PRESS = [
  { id: 1, source: 'Cronache Maceratesi', date: '8 giugno 2026', title: 'I giovani di CivitaNext lanciano la piattaforma di partecipazione', comments: 6 },
  { id: 2, source: 'Il Resto del Carlino', date: '24 maggio 2026', title: 'Pulizia della spiaggia: 40 volontari sul lungomare sud', comments: 4 },
  { id: 3, source: 'Vivere Civitanova', date: '12 aprile 2026', title: 'Bilancio partecipativo, le proposte dei cittadini under 30', comments: 9 },
];

/* ---------- Spazi civici ---------- */
const CN_SPACES = [
  { id: 1, name: 'Biblioteca comunale Zavatti', type: 'Studio e cultura', hours: 'Lun-Sab 9:00-19:00', note: 'Sale studio, wifi, emeroteca' },
  { id: 2, name: 'Aula consiliare', type: 'Incontri pubblici', hours: 'Su richiesta al Comune', note: 'Sede delle assemblee aperte' },
  { id: 3, name: 'Pineta del lungomare', type: 'Verde pubblico', hours: 'Sempre aperta', note: 'Area eventi all’aperto' },
  { id: 4, name: 'Circolo ARCI via Buozzi', type: 'Socialità', hours: 'Mar-Dom 17:00-24:00', note: 'Quiz night e serate a tema' },
];

/* ---------- Webinar e registrazioni ---------- */
const CN_WEBINARS = [
  { id: 1, title: 'Assemblea aperta di giugno (registrazione)', date: '5 giugno 2026', dur: '1h 12min', views: 89 },
  { id: 2, title: 'Come funziona il bilancio partecipativo', date: '14 maggio 2026', dur: '38 min', views: 156 },
  { id: 3, title: 'Leggere il bilancio del Comune in 30 minuti', date: '20 aprile 2026', dur: '31 min', views: 203 },
];

/* ---------- Competenze (matching cittadini) ---------- */
const CN_SKILLS = [
  { id: 1, name: 'Elena Ricci', skills: 'Grafica e illustrazione', offer: 'Locandine e materiali per gli eventi' },
  { id: 2, name: 'Andrea Castellani', skills: 'Consulenza legale', offer: 'Statuti, privacy, richieste al Comune' },
  { id: 3, name: 'Francesca Donati', skills: 'Fotografia', offer: 'Copertura foto degli eventi' },
  { id: 4, name: 'Paolo Marinelli', skills: 'Sviluppo web', offer: 'Manutenzione del sito e della piattaforma' },
];

Object.assign(window, {
  CN_EVENTS, CN_THREADS, CN_QUIZZES, CN_QUIZ_QUESTIONS, CN_CAL,
  CN_USERS, cnGetUser, cnLogin, cnRegister, cnLogout,
  cnGetProposals, cnSaveProposals,
  CN_POLL, CN_LEADERBOARD, CN_GALLERY, CN_MAP_POINTS, CN_DOCS, CN_NOTIFICATIONS, CN_BADGES,
  CN_MENTORS, CN_TIMELINE, CN_FEEDBACK, CN_REPUTATION, CN_PRESS, CN_SPACES, CN_WEBINARS, CN_SKILLS,
});
