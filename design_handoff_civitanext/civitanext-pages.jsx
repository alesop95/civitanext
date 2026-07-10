// CivitaNext: pagine della piattaforma
const { useState: usePState } = React;

/* ================= HOME ================= */
function HomePage({ go }) {
  const next = CN_EVENTS.slice(0, 3);
  const hot = CN_THREADS.slice(0, 2);
  return (
    <div>
      <header className="cn-hero">
        <Starburst size={150} style={{ position: 'absolute', top: -40, right: -30, transform: 'rotate(12deg)' }}></Starburst>
        <Waves rows={4} width={170} style={{ position: 'absolute', bottom: 18, left: 0 }}></Waves>
        <span className="cn-kicker cn-hero-kicker">Ci presentiamo</span>
        <h1>Idee, partecipazione,<br />cambiamento<span style={{ color: 'var(--accent)' }}>.</span></h1>
        <p className="cn-hero-sub">
          CivitaNext è un’associazione di giovani cittadini con l’aspirazione di dare forma
          allo sviluppo di <b style={{ color: 'var(--accent)' }}>Civitanova Marche</b>.
        </p>
        <div className="cn-hero-cta">
          <Btn onClick={() => go('eventi')}>Scopri gli eventi</Btn>
          <Btn kind="ghost" onClick={() => go('forum')}>Entra nel forum</Btn>
        </div>
        <span className="cn-hand cn-hero-hand">No risk, no story</span>
      </header>

      <section className="cn-section">
        <SectionTitle kicker="Calendario" title="Prossimi eventi"></SectionTitle>
        <div className="cn-event-row">
          {next.map(e => (
            <article key={e.id} className="cn-event-card" onClick={() => go('eventi')}>
              <div className="cn-event-date"><b>{e.day}</b><span>{e.month}</span></div>
              <div>
                <Tag color={e.cat === 'Volontariato' ? 'var(--accent)' : 'var(--ink)'}>{e.cat}</Tag>
                <h3>{e.title}</h3>
                <p className="cn-meta">{e.time} · {e.place}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="cn-section cn-section-split">
        <div>
          <SectionTitle kicker="Forum" title="Discussioni calde"></SectionTitle>
          <div className="cn-thread-mini-list">
            {hot.map(t => (
              <article key={t.id} className="cn-thread-mini" onClick={() => go('forum', t.id)}>
                <span className="cn-votes-pill">▲ {t.votes}</span>
                <div>
                  <h4>{t.title}</h4>
                  <p className="cn-meta">{t.author} · {t.replies.length} risposte</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside className="cn-home-aside">
          <div className="cn-quiz-promo" onClick={() => go('quiz')}>
            <Starburst size={64} points={12} style={{ position: 'absolute', top: -22, right: -18 }}></Starburst>
            <span className="cn-kicker" style={{ color: 'var(--paper)' }}>Quiz della settimana</span>
            <h3>Educazione civica: le basi</h3>
            <p>4 domande, 2 minuti. Mettiti in gioco.</p>
            <Btn kind="paper" small>Inizia il quiz</Btn>
          </div>
          <PollCard></PollCard>
        </aside>
      </section>
    </div>
  );
}

/* ================= EVENTI ================= */
function EventiPage() {
  const [filter, setFilter] = usePState('Tutti');
  const [rsvp, setRsvp] = usePState({});
  const [toast, share] = useShare();
  const [synced, setSynced] = usePState(false);
  const [syncToast, setSyncToast] = usePState(false);
  const syncCal = () => {
    setSynced(true); setSyncToast(true);
    setTimeout(() => setSyncToast(false), 2200);
  };
  const cats = ['Tutti', 'Incontri', 'Volontariato', 'Cultura'];
  const list = CN_EVENTS.filter(e => filter === 'Tutti' || e.cat === filter);
  const eventDays = CN_EVENTS.map(e => e.day);

  return (
    <div>
      <SectionTitle kicker="Calendario" title="Eventi" hand="segna in agenda!"></SectionTitle>
      <div className="cn-eventi-layout">
        <div className="cn-cal-card">
          <div className="cn-cal-head">{CN_CAL.monthLabel}</div>
          <div className="cn-cal-grid">
            {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((d, i) => <span key={'h' + i} className="cn-cal-dow">{d}</span>)}
            {Array.from({ length: CN_CAL.startOffset }).map((_, i) => <span key={'b' + i}></span>)}
            {Array.from({ length: CN_CAL.days }).map((_, i) => {
              const d = i + 1;
              const has = eventDays.includes(d);
              const today = d === CN_CAL.today;
              return (
                <span key={d} className={`cn-cal-day ${has ? 'has-event' : ''} ${today ? 'is-today' : ''}`}>
                  {d}{has ? <i className="cn-cal-dot"></i> : null}
                </span>
              );
            })}
          </div>
          <p className="cn-meta" style={{ marginTop: 12 }}><i className="cn-cal-dot" style={{ position: 'static', display: 'inline-block', marginRight: 6 }}></i>giorni con eventi</p>
        </div>

        <div>
          <div className="cn-chip-row">
            {cats.map(c => <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</Chip>)}
            <Btn small kind={synced ? 'done' : 'ghost'} style={{ marginLeft: 'auto' }} onClick={syncCal}>
              {synced ? '✓ Calendario sincronizzato' : 'Sincronizza con Google Calendar'}
            </Btn>
          </div>
          <div className="cn-event-list">
            {list.map(e => (
              <article key={e.id} className="cn-event-full">
                <div className="cn-event-date"><b>{e.day}</b><span>{e.month}</span></div>
                <div className="cn-event-full-body">
                  <Tag color={e.cat === 'Volontariato' ? 'var(--accent)' : 'var(--ink)'}>{e.cat}</Tag>
                  <h3>{e.title}</h3>
                  <p className="cn-meta">{e.time} · {e.place}</p>
                  <p className="cn-event-desc">{e.desc}</p>
                  <div className="cn-event-actions">
                    <Btn small kind={rsvp[e.id] ? 'done' : 'primary'} onClick={() => setRsvp({ ...rsvp, [e.id]: !rsvp[e.id] })}>
                      {rsvp[e.id] ? '✓ Partecipo' : 'Partecipo'}
                    </Btn>
                    <Btn small kind="ghost" onClick={share}>Condividi</Btn>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      <ShareToast visible={toast}></ShareToast>
      <ShareToast visible={syncToast} text="Eventi aggiunti al tuo Google Calendar (simulato)"></ShareToast>
    </div>
  );
}

/* ================= QUIZ ================= */
function QuizPage() {
  const [playing, setPlaying] = usePState(false);
  const [view, setView] = usePState('Quiz');
  const [step, setStep] = usePState(0);
  const [picked, setPicked] = usePState(null);
  const [score, setScore] = usePState(0);
  const [toast, share] = useShare();
  const total = CN_QUIZ_QUESTIONS.length;
  const finished = step >= total;
  const q = CN_QUIZ_QUESTIONS[Math.min(step, total - 1)];

  const reset = () => { setPlaying(false); setStep(0); setPicked(null); setScore(0); };

  if (!playing) {
    return (
      <div>
        <SectionTitle kicker="Mettiti in gioco" title="Quiz" hand="no risk, no story"></SectionTitle>
        <div className="cn-chip-row">
          {['Quiz', 'Classifica'].map(v => <Chip key={v} active={view === v} onClick={() => setView(v)}>{v}</Chip>)}
        </div>
        {view === 'Classifica' ? <LeaderboardView></LeaderboardView> : (
        <div className="cn-quiz-list">
          {CN_QUIZZES.map(z => (
            <article key={z.id} className={`cn-quiz-card ${z.locked ? 'is-locked' : ''}`}>
              <div>
                <h3>{z.title}</h3>
                <p className="cn-meta">{z.desc} · {z.time}</p>
              </div>
              {z.locked
                ? <span className="cn-meta cn-locked-label">In arrivo</span>
                : <Btn small onClick={() => setPlaying(true)}>Inizia</Btn>}
            </article>
          ))}
        </div>
        )}
      </div>
    );
  }

  if (finished) {
    const great = score >= 3;
    return (
      <div className="cn-quiz-stage">
        <div className="cn-quiz-result">
          <Starburst size={110} style={{ margin: '0 auto', display: 'block' }}></Starburst>
          <h2 className="cn-quiz-score">{score}/{total}</h2>
          <p className="cn-quiz-result-text">
            {great ? 'Cittadinanza attiva: superato a pieni voti!' : 'Buon inizio: riprova e punta al pieno!'}
          </p>
          <div className="cn-hero-cta" style={{ justifyContent: 'center' }}>
            <Btn onClick={reset}>Torna ai quiz</Btn>
            <Btn kind="ghost" onClick={share}>Condividi il risultato</Btn>
          </div>
        </div>
        <ShareToast visible={toast}></ShareToast>
      </div>
    );
  }

  return (
    <div className="cn-quiz-stage">
      <div className="cn-quiz-progress">
        <span>Domanda {step + 1} di {total}</span>
        <div className="cn-progress-track"><div className="cn-progress-fill" style={{ width: ((step + (picked !== null ? 1 : 0)) / total) * 100 + '%' }}></div></div>
      </div>
      <h2 className="cn-quiz-q">{q.q}</h2>
      <div className="cn-quiz-opts">
        {q.opts.map((o, i) => {
          let cls = 'cn-quiz-opt';
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
        <div className="cn-quiz-why">
          <p><b>{picked === q.correct ? 'Esatto!' : 'Non proprio.'}</b> {q.why}</p>
          <Btn small onClick={() => { setStep(step + 1); setPicked(null); }}>
            {step + 1 === total ? 'Vedi il risultato' : 'Prossima domanda'}
          </Btn>
        </div>
      ) : null}
    </div>
  );
}

/* ================= FORUM ================= */
function ForumPage({ openThreadId, clearOpen }) {
  const [threads, setThreads] = usePState(CN_THREADS);
  const [openId, setOpenId] = usePState(openThreadId || null);
  const [filter, setFilter] = usePState('Tutte');
  const [draft, setDraft] = usePState('');
  const [voted, setVoted] = usePState({});
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
      <div className="cn-thread-detail">
        <button className="cn-back" onClick={() => { setOpenId(null); clearOpen && clearOpen(); }}>Tutte le discussioni</button>
        <Tag>{open.cat}</Tag>
        <h2 className="cn-thread-title">{open.title}</h2>
        <p className="cn-meta">{open.author} · {open.when}</p>
        <p className="cn-thread-body">{open.body}</p>
        <div className="cn-thread-actions">
          <button className={`cn-vote-btn ${voted[open.id] ? 'is-voted' : ''}`} onClick={() => vote(open.id)}>▲ {open.votes}</button>
          <Btn small kind="ghost" onClick={share}>Condividi</Btn>
        </div>

        <h3 className="cn-replies-head">{open.replies.length} risposte</h3>
        <div className="cn-replies">
          {open.replies.map((r, i) => (
            <div key={i} className="cn-reply">
              <Avatar name={r.author}></Avatar>
              <div>
                <p className="cn-meta"><b style={{ color: 'var(--ink)' }}>{r.author}</b> · {r.when}</p>
                <p className="cn-reply-text">{r.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="cn-composer">
          <textarea value={draft} placeholder="Scrivi una risposta…" rows="3"
            onChange={e => setDraft(e.target.value)}></textarea>
          <Btn small onClick={sendReply}>Rispondi</Btn>
        </div>
        <ShareToast visible={toast}></ShareToast>
      </div>
    );
  }

  const list = threads.filter(t => filter === 'Tutte' || t.cat === filter);
  return (
    <div>
      <SectionTitle kicker="Parliamone" title="Forum" hand="qui si decide insieme"></SectionTitle>
      <div className="cn-chip-row">
        {cats.map(c => <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>{c}</Chip>)}
      </div>
      <div className="cn-thread-list">
        {list.map(t => (
          <article key={t.id} className="cn-thread-row" onClick={() => setOpenId(t.id)}>
            <button className={`cn-vote-btn ${voted[t.id] ? 'is-voted' : ''}`}
              onClick={(ev) => { ev.stopPropagation(); vote(t.id); }}>▲ {t.votes}</button>
            <div className="cn-thread-row-main">
              <Tag>{t.cat}</Tag>
              <h3>{t.title}</h3>
              <p className="cn-meta">{t.author} · {t.when} · {t.replies.length} risposte</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { HomePage, EventiPage, QuizPage, ForumPage });
