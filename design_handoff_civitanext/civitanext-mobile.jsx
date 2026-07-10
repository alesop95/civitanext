// CivitaNext Mobile: pagine + shell app (riusa CN_* data e UI kit)
const { useState: useMState, useEffect: useMEffect } = React;

/* ---------- Home ---------- */
function MHome({ go }) {
  return (
    <div className="cnm-page">
      <header className="cnm-hero">
        <Starburst size={92} style={{ position: 'absolute', top: -26, right: -20, transform: 'rotate(12deg)' }}></Starburst>
        <span className="cn-kicker">Ci presentiamo</span>
        <h1>Idee, partecipazione, cambiamento<span style={{ color: 'var(--accent)' }}>.</span></h1>
        <p>Giovani cittadini per lo sviluppo di <b style={{ color: 'var(--accent)' }}>Civitanova Marche</b>.</p>
        <span className="cn-hand" style={{ fontSize: 20 }}>No risk, no story</span>
      </header>

      <div className="cnm-section-head">
        <h2>Prossimi eventi</h2>
        <button className="cnm-link" onClick={() => go('eventi')}>Tutti</button>
      </div>
      <div className="cnm-scroll-row">
        {CN_EVENTS.slice(0, 3).map(e => (
          <article key={e.id} className="cnm-event-card" onClick={() => go('eventi')}>
            <div className="cn-event-date cnm-date"><b>{e.day}</b><span>{e.month}</span></div>
            <Tag color={e.cat === 'Volontariato' ? 'var(--accent)' : 'var(--ink)'}>{e.cat}</Tag>
            <h3>{e.title}</h3>
            <p className="cn-meta">{e.time} · {e.place.split(',')[0]}</p>
          </article>
        ))}
      </div>

      <div className="cnm-quiz-promo" onClick={() => go('quiz')}>
        <div>
          <span className="cn-kicker" style={{ color: 'var(--paper)' }}>Quiz della settimana</span>
          <h3>Educazione civica: le basi</h3>
          <p>4 domande · 2 minuti</p>
        </div>
      </div>

      <div style={{ margin: '14px 0 4px' }}><PollCard></PollCard></div>

      <div className="cnm-section-head">
        <h2>Dal forum</h2>
        <button className="cnm-link" onClick={() => go('forum')}>Apri</button>
      </div>
      <div className="cnm-stack">
        {CN_THREADS.slice(0, 2).map(t => (
          <article key={t.id} className="cnm-thread-row" onClick={() => go('forum', t.id)}>
            <span className="cn-votes-pill">▲ {t.votes}</span>
            <div>
              <h4>{t.title}</h4>
              <p className="cn-meta">{t.author} · {t.replies.length} risposte</p>
            </div>
          </article>
        ))}
      </div>
      <Waves rows={3} width={130} style={{ margin: '8px 0 0' }}></Waves>
    </div>
  );
}

/* ---------- Eventi ---------- */
function MEventi() {
  const [filter, setFilter] = useMState('Tutti');
  const [rsvp, setRsvp] = useMState({});
  const [toast, share] = useShare();
  const [synced, setSynced] = useMState(false);
  const [syncToast, setSyncToast] = useMState(false);
  const syncCal = () => {
    setSynced(true); setSyncToast(true);
    setTimeout(() => setSyncToast(false), 2200);
  };
  const cats = ['Tutti', 'Incontri', 'Volontariato', 'Cultura'];
  const list = CN_EVENTS.filter(e => filter === 'Tutti' || e.cat === filter);
  const eventDays = CN_EVENTS.map(e => e.day);

  return (
    <div className="cnm-page">
      <h1 className="cnm-title">Eventi <span className="cn-hand" style={{ fontSize: 19 }}>giugno 2026</span></h1>
      <div className="cnm-datestrip">
        {Array.from({ length: 19 }).map((_, i) => {
          const d = i + 12;
          const has = eventDays.includes(d);
          const today = d === CN_CAL.today;
          return (
            <span key={d} className={`cnm-strip-day ${has ? 'has-event' : ''} ${today ? 'is-today' : ''}`}>
              <i>{['V','S','D','L','M','M','G'][(d - 12) % 7]}</i>{d}
              {has ? <em className="cn-cal-dot" style={{ position: 'static', display: 'block', margin: '3px auto 0' }}></em> : null}
            </span>
          );
        })}
      </div>
      <div className="cnm-chips">
        {cats.map(c => <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</Chip>)}
      </div>
      <div style={{ marginBottom: 14 }}>
        <Btn small kind={synced ? 'done' : 'ghost'} onClick={syncCal}>
          {synced ? '✓ Calendario sincronizzato' : 'Sincronizza con Google Calendar'}
        </Btn>
      </div>
      <div className="cnm-stack">
        {list.map(e => (
          <article key={e.id} className="cnm-event-full">
            <div className="cnm-event-full-top">
              <div className="cn-event-date cnm-date"><b>{e.day}</b><span>{e.month}</span></div>
              <div>
                <Tag color={e.cat === 'Volontariato' ? 'var(--accent)' : 'var(--ink)'}>{e.cat}</Tag>
                <h3>{e.title}</h3>
                <p className="cn-meta">{e.time} · {e.place}</p>
              </div>
            </div>
            <p className="cnm-desc">{e.desc}</p>
            <div className="cnm-actions">
              <Btn small kind={rsvp[e.id] ? 'done' : 'primary'} onClick={() => setRsvp({ ...rsvp, [e.id]: !rsvp[e.id] })}>
                {rsvp[e.id] ? '✓ Partecipo' : 'Partecipo'}
              </Btn>
              <Btn small kind="ghost" onClick={share}>Condividi</Btn>
            </div>
          </article>
        ))}
      </div>
      <ShareToast visible={toast}></ShareToast>
      <ShareToast visible={syncToast} text="Eventi aggiunti al calendario (simulato)"></ShareToast>
    </div>
  );
}

/* ---------- Quiz ---------- */
function MQuiz() {
  const [playing, setPlaying] = useMState(false);
  const [step, setStep] = useMState(0);
  const [picked, setPicked] = useMState(null);
  const [score, setScore] = useMState(0);
  const [toast, share] = useShare();
  const total = CN_QUIZ_QUESTIONS.length;
  const finished = step >= total;
  const q = CN_QUIZ_QUESTIONS[Math.min(step, total - 1)];
  const reset = () => { setPlaying(false); setStep(0); setPicked(null); setScore(0); };

  if (!playing) {
    return (
      <div className="cnm-page">
        <h1 className="cnm-title">Quiz <span className="cn-hand" style={{ fontSize: 19 }}>no risk, no story</span></h1>
        <div className="cnm-stack">
          {CN_QUIZZES.map(z => (
            <article key={z.id} className={`cnm-quiz-card ${z.locked ? 'is-locked' : ''}`}>
              <div>
                <h3>{z.title}</h3>
                <p className="cn-meta">{z.desc} · {z.time}</p>
              </div>
              {z.locked
                ? <span className="cn-meta" style={{ fontStyle: 'italic', flex: 'none' }}>In arrivo</span>
                : <Btn small onClick={() => setPlaying(true)}>Inizia</Btn>}
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (finished) {
    const great = score >= 3;
    return (
      <div className="cnm-page cnm-quiz-result">
        <Starburst size={96} style={{ margin: '24px auto 0', display: 'block' }}></Starburst>
        <h2 className="cnm-score">{score}/{total}</h2>
        <p className="cnm-result-text">{great ? 'Cittadinanza attiva: superato a pieni voti!' : 'Buon inizio: riprova e punta al pieno!'}</p>
        <div className="cnm-actions" style={{ justifyContent: 'center' }}>
          <Btn small onClick={reset}>Torna ai quiz</Btn>
          <Btn small kind="ghost" onClick={share}>Condividi</Btn>
        </div>
        <ShareToast visible={toast}></ShareToast>
      </div>
    );
  }

  return (
    <div className="cnm-page">
      <div className="cnm-progress">
        <button className="cnm-link" onClick={reset}>✕</button>
        <div className="cn-progress-track" style={{ flex: 1 }}>
          <div className="cn-progress-fill" style={{ width: ((step + (picked !== null ? 1 : 0)) / total) * 100 + '%' }}></div>
        </div>
        <span className="cn-meta">{step + 1}/{total}</span>
      </div>
      <h2 className="cnm-q">{q.q}</h2>
      <div className="cnm-stack" style={{ gap: 10 }}>
        {q.opts.map((o, i) => {
          let cls = 'cn-quiz-opt cnm-opt';
          if (picked !== null) {
            if (i === q.correct) cls += ' is-correct';
            else if (i === picked) cls += ' is-wrong';
            else cls += ' is-muted';
          }
          return (
            <button key={i} className={cls} disabled={picked !== null}
              onClick={() => { setPicked(i); if (i === q.correct) setScore(s => s + 1); }}>
              <span className="cn-opt-letter">{'ABCD'[i]}</span>{o}
            </button>
          );
        })}
      </div>
      {picked !== null ? (
        <div className="cnm-why">
          <p><b>{picked === q.correct ? 'Esatto!' : 'Non proprio.'}</b> {q.why}</p>
          <Btn small onClick={() => { setStep(step + 1); setPicked(null); }}>
            {step + 1 === total ? 'Vedi il risultato' : 'Prossima'}
          </Btn>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Forum ---------- */
function MForum({ openThreadId, clearOpen }) {
  const [threads, setThreads] = useMState(CN_THREADS);
  const [openId, setOpenId] = useMState(openThreadId || null);
  const [filter, setFilter] = useMState('Tutte');
  const [draft, setDraft] = useMState('');
  const [voted, setVoted] = useMState({});
  const [toast, share] = useShare();
  const cats = ['Tutte', 'Mobilità', 'Ambiente', 'Città', 'Associazione'];
  const open = threads.find(t => t.id === openId);

  const vote = (id) => {
    if (voted[id]) return;
    setVoted({ ...voted, [id]: true });
    setThreads(threads.map(t => t.id === id ? { ...t, votes: t.votes + 1 } : t));
  };
  const sendReply = () => {
    if (!draft.trim()) return;
    setThreads(threads.map(t => t.id === openId
      ? { ...t, replies: [...t.replies, { author: 'Tu', when: 'adesso', text: draft.trim() }] }
      : t));
    setDraft('');
  };

  if (open) {
    return (
      <div className="cnm-page">
        <button className="cn-back" onClick={() => { setOpenId(null); clearOpen && clearOpen(); }}>Indietro</button>
        <Tag>{open.cat}</Tag>
        <h2 className="cnm-thread-title">{open.title}</h2>
        <p className="cn-meta">{open.author} · {open.when}</p>
        <p className="cnm-thread-body">{open.body}</p>
        <div className="cnm-actions">
          <button className={`cn-vote-btn ${voted[open.id] ? 'is-voted' : ''}`} onClick={() => vote(open.id)}>▲ {open.votes}</button>
          <Btn small kind="ghost" onClick={share}>Condividi</Btn>
        </div>
        <h3 className="cnm-replies-head">{open.replies.length} risposte</h3>
        <div className="cnm-stack" style={{ gap: 16 }}>
          {open.replies.map((r, i) => (
            <div key={i} className="cn-reply">
              <Avatar name={r.author} size={32}></Avatar>
              <div>
                <p className="cn-meta"><b style={{ color: 'var(--ink)' }}>{r.author}</b> · {r.when}</p>
                <p className="cnm-reply-text">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="cnm-composer">
          <textarea value={draft} placeholder="Scrivi una risposta…" rows="2" onChange={e => setDraft(e.target.value)}></textarea>
          <Btn small onClick={sendReply}>Invia</Btn>
        </div>
        <ShareToast visible={toast}></ShareToast>
      </div>
    );
  }

  const list = threads.filter(t => filter === 'Tutte' || t.cat === filter);
  return (
    <div className="cnm-page">
      <h1 className="cnm-title">Forum <span className="cn-hand" style={{ fontSize: 19 }}>si decide insieme</span></h1>
      <div className="cnm-chips">
        {cats.map(c => <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</Chip>)}
      </div>
      <div className="cnm-stack">
        {list.map(t => (
          <article key={t.id} className="cnm-thread-row" onClick={() => setOpenId(t.id)}>
            <button className={`cn-vote-btn ${voted[t.id] ? 'is-voted' : ''}`}
              onClick={(ev) => { ev.stopPropagation(); vote(t.id); }}>▲ {t.votes}</button>
            <div style={{ flex: 1 }}>
              <h4>{t.title}</h4>
              <p className="cn-meta">{t.cat} · {t.author} · {t.replies.length} risposte</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/* ---------- Altro: indice delle sezioni secondarie ---------- */
function MAltro({ go, user }) {
  const items = [
    ['proposte', 'Proposte e votazioni', 'Vota le idee per la città'],
    ['mappa', 'Mappa della città', 'Eventi e proposte sul territorio'],
    ['spazi', 'Spazi civici', 'Luoghi pubblici e orari'],
    ['timeline', 'Timeline', 'La storia della città e nostra'],
    ['mentorship', 'Mentorship', 'Soci esperti che aiutano'],
    ['competenze', 'Competenze', 'Chi offre cosa, gratis'],
    ['webinar', 'Webinar', 'Registrazioni e lezioni'],
    ['rassegna', 'Rassegna stampa', 'Parlano di noi'],
    ['galleria', 'Galleria foto', 'Gli eventi passati'],
    ['documenti', 'Documenti', 'Statuto, verbali, bilanci'],
    ['classifica', 'Classifica quiz', 'Giugno 2026'],
    ['notifiche', 'Notifiche', 'Aggiornamenti e promemoria'],
  ];
  return (
    <div className="cnm-page">
      <h1 className="cnm-title">Altro</h1>
      <div className="cnm-altro-list">
        {user
          ? <button className="cnm-altro-item" onClick={() => go('profilo')}>Il mio profilo<span className="cn-meta">{user.tessera}</span></button>
          : <button className="cnm-altro-item" onClick={() => go('login')}>Accedi<span className="cn-meta">Area soci</span></button>}
        {!user ? <button className="cnm-altro-item" onClick={() => go('iscrizione')}>Iscriviti<span className="cn-meta">Diventa socio</span></button> : null}
        {items.map(([id, label, sub]) => (
          <button key={id} className="cnm-altro-item" onClick={() => go(id)}>{label}<span className="cn-meta">{sub}</span></button>
        ))}
        {user && user.role === 'admin'
          ? <button className="cnm-altro-item" onClick={() => go('admin')}>Pannello admin<span className="cn-meta">Gestione</span></button>
          : null}
      </div>
    </div>
  );
}

function MSub({ title, go, children }) {
  return (
    <div className="cnm-page">
      <button className="cn-back" onClick={() => go('altro')}>Indietro</button>
      {title ? <h1 className="cnm-title" style={{ fontSize: 26 }}>{title}</h1> : null}
      {children}
    </div>
  );
}

/* ---------- Shell ---------- */
const CNM_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#E8503A",
  "texture": true,
  "device": "iPhone"
}/*EDITMODE-END*/;

const CNM_TABS = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'eventi', label: 'Eventi', icon: '▦' },
  { id: 'quiz', label: 'Quiz', icon: '?' },
  { id: 'forum', label: 'Forum', icon: '◌' },
  { id: 'altro', label: 'Altro', icon: '≡' },
];

function CivitaNextMobile() {
  const [t, setTweak] = useTweaks(CNM_TWEAK_DEFAULTS);
  const [page, setPage] = useMState(() => localStorage.getItem('cnm_page') || 'home');
  const [openThread, setOpenThread] = useMState(null);
  const [user, setUser] = useMState(cnGetUser);
  useMEffect(() => { localStorage.setItem('cnm_page', page); }, [page]);

  const go = (p, threadId) => { setPage(p); setOpenThread(threadId || null); };
  const handleLogin = (u) => { setUser(u); go(u.role === 'admin' ? 'admin' : 'profilo'); };
  const handleLogout = () => { cnLogout(); setUser(null); go('home'); };
  const activeTab = CNM_TABS.some(x => x.id === page) ? page : 'altro';

  const isAndroid = t.device === 'Android';
  const appContent = (
    <div className={`cnm-app ${t.texture ? 'has-texture' : ''} ${isAndroid ? 'cnm-android' : 'cnm-iphone'}`} data-screen-label={'mobile-' + page}>
      <div className="cnm-topbar">
        <Logo size={26}></Logo>
        <div className="cnm-topbar-right">
          <button className="cnm-bell" onClick={() => go('notifiche')}>Avvisi<i className="cnm-bell-dot"></i></button>
          {user
            ? <button className="cnm-user" onClick={() => go('profilo')} aria-label="Profilo"><Avatar name={user.name} size={32}></Avatar></button>
            : <button className="cnm-bell" onClick={() => go('login')}>Accedi</button>}
        </div>
      </div>
      <div className="cnm-content" key={page}>
        {page === 'home' ? <MHome go={go}></MHome> : null}
        {page === 'eventi' ? <MEventi></MEventi> : null}
        {page === 'quiz' ? <MQuiz></MQuiz> : null}
        {page === 'forum' ? <MForum openThreadId={openThread} clearOpen={() => setOpenThread(null)}></MForum> : null}
        {page === 'altro' ? <MAltro go={go} user={user}></MAltro> : null}
        {page === 'proposte' ? <MSub title="Proposte" go={go}><ProposteView user={user}></ProposteView></MSub> : null}
        {page === 'mappa' ? <MSub title="Mappa" go={go}><MapView></MapView></MSub> : null}
        {page === 'spazi' ? <MSub title="Spazi civici" go={go}><SpaziView></SpaziView></MSub> : null}
        {page === 'timeline' ? <MSub title="Timeline" go={go}><TimelineView></TimelineView></MSub> : null}
        {page === 'mentorship' ? <MSub title="Mentorship" go={go}><MentorshipView user={user}></MentorshipView></MSub> : null}
        {page === 'competenze' ? <MSub title="Competenze" go={go}><MatchingView user={user}></MatchingView></MSub> : null}
        {page === 'webinar' ? <MSub title="Webinar" go={go}><WebinarView></WebinarView></MSub> : null}
        {page === 'rassegna' ? <MSub title="Rassegna stampa" go={go}><RassegnaView></RassegnaView></MSub> : null}
        {page === 'galleria' ? <MSub title="Galleria" go={go}><GalleryView></GalleryView></MSub> : null}
        {page === 'documenti' ? <MSub title="Documenti" go={go}><DocsView></DocsView></MSub> : null}
        {page === 'classifica' ? <MSub title="Classifica" go={go}><LeaderboardView></LeaderboardView></MSub> : null}
        {page === 'notifiche' ? <MSub title="Notifiche" go={go}><NotificheView></NotificheView></MSub> : null}
        {page === 'login' ? <MSub go={go}><LoginForm onLogin={handleLogin}></LoginForm></MSub> : null}
        {page === 'iscrizione' ? <MSub go={go}><IscrizioneFlow onDone={(u) => { setUser(u); go('profilo'); }}></IscrizioneFlow></MSub> : null}
        {page === 'profilo' ? <MSub go={go}>{user ? <ProfiloView user={user} onLogout={handleLogout}></ProfiloView> : <LoginForm onLogin={handleLogin}></LoginForm>}</MSub> : null}
        {page === 'admin' ? <MSub title="Admin" go={go}>{user && user.role === 'admin' ? <AdminView compact></AdminView> : <LoginForm onLogin={handleLogin}></LoginForm>}</MSub> : null}
      </div>
      <nav className="cnm-tabbar">
        {CNM_TABS.map(tab => (
          <button key={tab.id} className={`cnm-tab ${activeTab === tab.id ? 'is-active' : ''}`} onClick={() => go(tab.id)}>
            <span className="cnm-tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="cnm-stage" style={{ '--accent': t.accent }}>
      {isAndroid
        ? <AndroidDevice>{appContent}</AndroidDevice>
        : <IOSDevice>{appContent}</IOSDevice>}
      <p className="cnm-caption">CivitaNext · versione mobile · <a href="CivitaNext Piattaforma.html">vai alla versione desktop</a></p>

      <TweaksPanel>
        <TweakSection label="Dispositivo"></TweakSection>
        <TweakRadio label="Frame" value={t.device} options={['iPhone', 'Android']}
          onChange={(v) => setTweak('device', v)}></TweakRadio>
        <TweakSection label="Brand"></TweakSection>
        <TweakColor label="Accento" value={t.accent}
          options={['#E8503A', '#1F4E79', '#1F8A5B']}
          onChange={(v) => setTweak('accent', v)}></TweakColor>
        <TweakToggle label="Texture carta" value={t.texture}
          onChange={(v) => setTweak('texture', v)}></TweakToggle>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CivitaNextMobile></CivitaNextMobile>);
