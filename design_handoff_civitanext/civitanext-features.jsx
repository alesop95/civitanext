// CivitaNext: componenti feature condivisi tra desktop e mobile
const { useState: useFState, useEffect: useFEffect } = React;

/* ---------- Login ---------- */
function LoginForm({ onLogin }) {
  const [email, setEmail] = useFState('');
  const [pw, setPw] = useFState('');
  const [err, setErr] = useFState(false);
  const submit = (e) => {
    e.preventDefault();
    const u = cnLogin(email, pw);
    if (u) { setErr(false); onLogin(u); } else { setErr(true); }
  };
  return (
    <div className="cnx-login">
      <span className="cn-kicker">Area soci</span>
      <h2 className="cnx-h2">Accedi</h2>
      <form className="cnx-form" onSubmit={submit}>
        <label className="cnx-field">
          <span>Email</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@esempio.it" required></input>
        </label>
        <label className="cnx-field">
          <span>Password</span>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="La tua password" required></input>
        </label>
        {err ? <p className="cnx-error">Credenziali non valide. Riprova.</p> : null}
        <Btn>Entra</Btn>
      </form>
      <div className="cnx-demo-hint">
        <p className="cn-meta"><b>Account demo per il prototipo:</b></p>
        <p className="cn-meta">Socio: socio@civitanext.it · civita2026</p>
        <p className="cn-meta">Admin: admin@civitanext.it · admin2026</p>
      </div>
    </div>
  );
}

/* ---------- Iscrizione (3 passi, simulata) ---------- */
function IscrizioneFlow({ onDone }) {
  const [step, setStep] = useFState(0);
  const [nome, setNome] = useFState('');
  const [quota, setQuota] = useFState('ordinario');
  return (
    <div className="cnx-login">
      <span className="cn-kicker">Diventa socio</span>
      <h2 className="cnx-h2">Iscrizione</h2>
      <div className="cnx-steps">
        {['Dati', 'Quota', 'Conferma'].map((s, i) => (
          <span key={s} className={`cnx-step ${i === step ? 'is-active' : ''} ${i < step ? 'is-done' : ''}`}>{i + 1}. {s}</span>
        ))}
      </div>
      {step === 0 ? (
        <form className="cnx-form" onSubmit={e => { e.preventDefault(); if (nome.trim()) setStep(1); }}>
          <label className="cnx-field">
            <span>Nome e cognome</span>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Mario Rossi" required></input>
          </label>
          <Btn>Avanti</Btn>
        </form>
      ) : null}
      {step === 1 ? (
        <div className="cnx-form">
          <button className={`cnx-quota ${quota === 'studente' ? 'is-active' : ''}`} onClick={() => setQuota('studente')}>
            <b>Studente · 10 euro</b>
            <span className="cn-meta">Per chi studia, fino a 26 anni</span>
          </button>
          <button className={`cnx-quota ${quota === 'ordinario' ? 'is-active' : ''}`} onClick={() => setQuota('ordinario')}>
            <b>Ordinario · 15 euro</b>
            <span className="cn-meta">Quota annuale standard</span>
          </button>
          <p className="cn-meta">Il pagamento è simulato in questo prototipo.</p>
          <Btn onClick={() => setStep(2)}>Paga e iscriviti</Btn>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="cnx-form">
          <p className="cnx-welcome">Benvenuto in CivitaNext, <b>{nome}</b>!</p>
          <p className="cn-meta">La tua tessera digitale è pronta nel profilo.</p>
          <Btn onClick={() => onDone(cnRegister(nome))}>Vai al profilo</Btn>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Profilo socio ---------- */
function ProfiloView({ user, onLogout, compact }) {
  const [digest, setDigest] = useFState(() => localStorage.getItem('cn_digest') !== 'off');
  const [gcal, setGcal] = useFState(() => localStorage.getItem('cn_gcal') === 'on');
  const toggleDigest = () => {
    const v = !digest; setDigest(v);
    localStorage.setItem('cn_digest', v ? 'on' : 'off');
  };
  const toggleGcal = () => {
    const v = !gcal; setGcal(v);
    localStorage.setItem('cn_gcal', v ? 'on' : 'off');
  };
  return (
    <div className="cnx-profilo">
      <div className="cnx-tessera">
        <Starburst size={54} points={12} color="rgba(245,240,228,0.25)" style={{ position: 'absolute', top: -14, right: -10 }}></Starburst>
        <Logo size={24}></Logo>
        <h3>{user.name}</h3>
        <p className="cnx-tessera-num">{user.tessera}</p>
        <p className="cnx-tessera-meta">Tessera socio · dal {user.since}{user.role === 'admin' ? ' · Admin' : ''}</p>
      </div>
      <h3 className="cnx-h3">Badge</h3>
      <div className="cnx-badges">
        {CN_BADGES.map(b => (
          <div key={b.id} className={`cnx-badge ${b.earned ? '' : 'is-locked'}`}>
            <span className="cnx-badge-dot"></span>
            <span>{b.label}</span>
          </div>
        ))}
      </div>
      <h3 className="cnx-h3">Reputazione</h3>
      <div className="cnx-rep">
        <div className="cnx-rep-top">
          <b>{CN_REPUTATION.level}</b>
          <span className="cn-meta">{CN_REPUTATION.points} punti · prossimo livello: {CN_REPUTATION.next} a {CN_REPUTATION.nextAt}</span>
        </div>
        <div className="cn-progress-track"><div className="cn-progress-fill" style={{ width: (CN_REPUTATION.points / CN_REPUTATION.nextAt * 100) + '%' }}></div></div>
        <p className="cn-meta">{CN_REPUTATION.how}</p>
      </div>
      <h3 className="cnx-h3">Preferenze</h3>
      <label className="cnx-pref">
        <span>Digest settimanale via email<br /><i className="cn-meta">Eventi e discussioni della settimana, ogni lunedì</i></span>
        <button className={`cnx-switch ${digest ? 'is-on' : ''}`} onClick={toggleDigest} aria-label="Digest settimanale">
          <span></span>
        </button>
      </label>
      <label className="cnx-pref">
        <span>Sincronizza con Google Calendar<br /><i className="cn-meta">Gli eventi a cui partecipi finiscono nel tuo calendario</i></span>
        <button className={`cnx-switch ${gcal ? 'is-on' : ''}`} onClick={toggleGcal} aria-label="Google Calendar">
          <span></span>
        </button>
      </label>
      <Btn kind="ghost" small onClick={onLogout}>Esci dall'account</Btn>
    </div>
  );
}

/* ---------- Sondaggio rapido ---------- */
function PollCard() {
  const [voted, setVoted] = useFState(() => {
    const v = localStorage.getItem('cn_poll_' + CN_POLL.id);
    return v !== null ? parseInt(v, 10) : null;
  });
  const votes = CN_POLL.votes.map((n, i) => n + (voted === i ? 1 : 0));
  const tot = votes.reduce((a, b) => a + b, 0);
  const pick = (i) => {
    if (voted !== null) return;
    setVoted(i);
    localStorage.setItem('cn_poll_' + CN_POLL.id, String(i));
  };
  return (
    <div className="cnx-poll">
      <span className="cn-kicker">Sondaggio rapido</span>
      <h3>{CN_POLL.q}</h3>
      <div className="cnx-poll-opts">
        {CN_POLL.opts.map((o, i) => {
          const pct = Math.round((votes[i] / tot) * 100);
          return (
            <button key={i} className={`cnx-poll-opt ${voted === i ? 'is-mine' : ''}`} disabled={voted !== null} onClick={() => pick(i)}>
              {voted !== null ? <span className="cnx-poll-bar" style={{ width: pct + '%' }}></span> : null}
              <span className="cnx-poll-label">{o}</span>
              {voted !== null ? <span className="cnx-poll-pct">{pct}%</span> : null}
            </button>
          );
        })}
      </div>
      <p className="cn-meta">{voted !== null ? tot + ' voti · grazie per aver partecipato' : tot + ' voti finora · tocca per votare'}</p>
    </div>
  );
}

/* ---------- Classifica quiz ---------- */
function LeaderboardView() {
  return (
    <div className="cnx-board">
      <p className="cn-meta" style={{ marginBottom: 14 }}>Classifica di giugno · si azzera il primo del mese</p>
      <div className="cnx-board-list">
        {CN_LEADERBOARD.map((r, i) => (
          <div key={r.name} className={`cnx-board-row ${i === 0 ? 'is-first' : ''}`}>
            <span className="cnx-board-pos">{i + 1}</span>
            <Avatar name={r.name} size={32}></Avatar>
            <span className="cnx-board-name">{r.name}</span>
            <span className="cn-meta">{r.quiz} quiz</span>
            <b className="cnx-board-pts">{r.pts} pt</b>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Galleria foto ---------- */
function GalleryView() {
  const [albums, setAlbums] = useFState(CN_GALLERY);
  const addAlbum = () => {
    setAlbums([{ id: Date.now(), label: 'Nuovo album', sub: 'Giugno 2026 · 0 foto' }, ...albums]);
  };
  return (
    <div>
      <div className="cnx-row-between">
        <p className="cn-meta">Le foto degli eventi passati, caricate dai soci</p>
        <Btn small kind="ghost" onClick={addAlbum}>Carica foto</Btn>
      </div>
      <div className="cnx-gallery">
        {albums.map(a => (
          <figure key={a.id} className="cnx-album">
            <div className="cnx-ph"><span>foto evento</span></div>
            <figcaption>
              <b>{a.label}</b>
              <span className="cn-meta">{a.sub}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ---------- Mappa della città ---------- */
function MapView() {
  const [sel, setSel] = useFState(CN_MAP_POINTS[0]);
  return (
    <div>
      <div className="cnx-map">
        <span className="cnx-ph-note">mappa di Civitanova Marche · placeholder cartografia</span>
        {CN_MAP_POINTS.map(p => (
          <button key={p.id}
            className={`cnx-pin ${p.type === 'evento' ? 'is-evento' : 'is-proposta'} ${sel && sel.id === p.id ? 'is-sel' : ''}`}
            style={{ left: p.x + '%', top: p.y + '%' }}
            onClick={() => setSel(p)} aria-label={p.title}></button>
        ))}
      </div>
      <div className="cnx-map-legend">
        <span><i className="cnx-dot is-evento"></i>Eventi</span>
        <span><i className="cnx-dot is-proposta"></i>Proposte</span>
      </div>
      {sel ? (
        <div className="cnx-map-card">
          <Tag color={sel.type === 'evento' ? 'var(--ink)' : 'var(--accent)'}>{sel.type}</Tag>
          <h4>{sel.title}</h4>
          <p className="cn-meta">{sel.place}</p>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Documenti e trasparenza ---------- */
function DocsView() {
  const [cat, setCat] = useFState('Tutti');
  const cats = ['Tutti', 'Statuto', 'Verbali', 'Bilanci'];
  const list = CN_DOCS.filter(d => cat === 'Tutti' || d.cat === cat);
  return (
    <div>
      <div className="cn-chip-row" style={{ marginBottom: 16 }}>
        {cats.map(c => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>
      <div className="cnx-docs">
        {list.map(d => (
          <div key={d.title} className="cnx-doc">
            <span className="cnx-doc-ico">PDF</span>
            <div>
              <b>{d.title}</b>
              <p className="cn-meta">{d.cat} · {d.date} · {d.meta}</p>
            </div>
            <Btn small kind="ghost">Scarica</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Notifiche ---------- */
function NotificheView() {
  const [items, setItems] = useFState(CN_NOTIFICATIONS);
  const markAll = () => setItems(items.map(n => ({ ...n, read: true })));
  return (
    <div className="cnx-notif">
      <div className="cnx-row-between">
        <p className="cn-meta">{items.filter(n => !n.read).length} non lette</p>
        <Btn small kind="ghost" onClick={markAll}>Segna tutte come lette</Btn>
      </div>
      <div className="cnx-notif-list">
        {items.map(n => (
          <div key={n.id} className={`cnx-notif-row ${n.read ? '' : 'is-unread'}`}>
            <span className="cnx-notif-dot"></span>
            <div>
              <p>{n.text}</p>
              <span className="cn-meta">{n.when}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Proposte e votazioni ---------- */
function ProposteView({ user }) {
  const [ptab, setPtab] = useFState('Proposte');
  const [proposals, setProposals] = useFState(cnGetProposals);
  const [voted, setVoted] = useFState({});
  const [showForm, setShowForm] = useFState(false);
  const [title, setTitle] = useFState('');
  const [desc, setDesc] = useFState('');

  const vote = (id) => {
    if (voted[id]) return;
    setVoted({ ...voted, [id]: true });
    const next = proposals.map(p => p.id === id ? { ...p, votes: p.votes + 1 } : p);
    setProposals(next); cnSaveProposals(next);
  };
  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const next = [{ id: Date.now(), title: title.trim(), cat: 'Città', votes: 0, status: 'revisione', author: user ? user.name : 'Tu', desc: desc.trim() }, ...proposals];
    setProposals(next); cnSaveProposals(next);
    setTitle(''); setDesc(''); setShowForm(false);
  };
  const statusLabel = { votazione: 'In votazione', approvata: 'Approvata', revisione: 'In revisione' };

  return (
    <div>
      <div className="cn-chip-row" style={{ marginBottom: 16 }}>
        {['Proposte', 'Attuazione'].map(c => <Chip key={c} active={ptab === c} onClick={() => setPtab(c)}>{c}</Chip>)}
      </div>
      {ptab === 'Attuazione' ? <FeedbackView></FeedbackView> : (
      <div>
      <div className="cnx-row-between">
        <p className="cn-meta">Le proposte approvate dalla redazione vanno in votazione pubblica</p>
        {user ? <Btn small onClick={() => setShowForm(!showForm)}>{showForm ? 'Annulla' : 'Nuova proposta'}</Btn> : <p className="cn-meta"><b>Accedi per proporre</b></p>}
      </div>
      {showForm ? (
        <form className="cnx-form cnx-proposta-form" onSubmit={submit}>
          <label className="cnx-field">
            <span>Titolo della proposta</span>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Es. Più panchine in pineta" required></input>
          </label>
          <label className="cnx-field">
            <span>Descrizione</span>
            <textarea rows="3" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Spiega la tua idea in poche righe"></textarea>
          </label>
          <Btn small>Invia in revisione</Btn>
        </form>
      ) : null}
      <div className="cnx-proposte">
        {proposals.map(p => (
          <article key={p.id} className={`cnx-proposta is-${p.status}`}>
            <div className="cnx-proposta-main">
              <div className="cnx-proposta-tags">
                <Tag>{p.cat}</Tag>
                <span className={`cnx-status is-${p.status}`}>{statusLabel[p.status]}</span>
              </div>
              <h3>{p.title}</h3>
              <p className="cnx-proposta-desc">{p.desc}</p>
              <p className="cn-meta">proposta da {p.author}</p>
            </div>
            {p.status === 'votazione' ? (
              <button className={`cn-vote-btn cnx-proposta-vote ${voted[p.id] ? 'is-voted' : ''}`} onClick={() => vote(p.id)}>
                ▲<b>{p.votes}</b>
              </button>
            ) : null}
            {p.status === 'approvata' ? <span className="cnx-proposta-vote-static">{p.votes} voti</span> : null}
          </article>
        ))}
      </div>
      </div>
      )}
    </div>
  );
}

/* ---------- Città: mappa + spazi + timeline + galleria + documenti ---------- */
function CittaView() {
  const [tab, setTab] = useFState('Mappa');
  const tabs = ['Mappa', 'Spazi civici', 'Timeline', 'Galleria', 'Documenti'];
  return (
    <div>
      <div className="cn-chip-row" style={{ marginBottom: 18 }}>
        {tabs.map(c => <Chip key={c} active={tab === c} onClick={() => setTab(c)}>{c}</Chip>)}
      </div>
      {tab === 'Mappa' ? <MapView></MapView> : null}
      {tab === 'Spazi civici' ? <SpaziView></SpaziView> : null}
      {tab === 'Timeline' ? <TimelineView></TimelineView> : null}
      {tab === 'Galleria' ? <GalleryView></GalleryView> : null}
      {tab === 'Documenti' ? <DocsView></DocsView> : null}
    </div>
  );
}

Object.assign(window, {
  LoginForm, IscrizioneFlow, ProfiloView, PollCard, LeaderboardView,
  GalleryView, MapView, DocsView, NotificheView, ProposteView, CittaView,
});
