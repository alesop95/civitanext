// CivitaNext: feature aggiuntive (mentorship, timeline, attuazione, rassegna, spazi, webinar, competenze)
const { useState: useF2State } = React;

/* ---------- Mentorship ---------- */
function MentorshipView({ user }) {
  const [requested, setRequested] = useF2State({});
  return (
    <div>
      <p className="cn-meta" style={{ marginBottom: 16 }}>Soci esperti che offrono un'ora del loro tempo a chi è alle prime armi</p>
      <div className="cnx-table">
        {CN_MENTORS.map(m => (
          <div key={m.id} className="cnx-table-row">
            <Avatar name={m.name} size={40}></Avatar>
            <div>
              <b>{m.name}</b> <span className="cnx-status is-votazione">{m.area}</span>
              <p className="cn-meta">{m.desc}</p>
              <p className="cn-meta">{m.slots} {m.slots === 1 ? 'posto disponibile' : 'posti disponibili'} questo mese</p>
            </div>
            <Btn small kind={requested[m.id] ? 'done' : 'primary'}
              onClick={() => setRequested({ ...requested, [m.id]: true })}>
              {requested[m.id] ? 'Richiesta inviata' : 'Chiedi un incontro'}
            </Btn>
          </div>
        ))}
      </div>
      {user ? <p className="cn-meta" style={{ marginTop: 14 }}>Vuoi offrirti come mentor? Scrivici dal forum o agli eventi.</p> : null}
    </div>
  );
}

/* ---------- Timeline della città ---------- */
function TimelineView() {
  return (
    <div className="cnx-timeline">
      {CN_TIMELINE.map(t => (
        <div key={t.id} className={`cnx-tl-item ${t.kind === 'cn' ? 'is-cn' : ''}`}>
          <span className="cnx-tl-dot"></span>
          <div className="cnx-tl-body">
            <span className="cnx-tl-when">{t.when}</span>
            <h4>{t.title}</h4>
            <p>{t.text}</p>
            {t.photo ? <div className="cnx-ph cnx-tl-ph"><span>foto storica o dell'evento</span></div> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Attuazione proposte (feedback loop) ---------- */
function FeedbackView() {
  return (
    <div>
      <p className="cn-meta" style={{ marginBottom: 16 }}>Cosa succede dopo l'approvazione: lo stato reale di ogni proposta vinta</p>
      {CN_FEEDBACK.map(f => (
        <div key={f.id} className="cnx-feedback">
          <h3>{f.title}</h3>
          <p className="cn-meta">{f.votes} voti raccolti</p>
          <div className="cnx-fb-steps">
            {f.steps.map((s, i) => (
              <div key={i} className={`cnx-fb-step ${s.done ? 'is-done' : ''}`}>
                <span className="cnx-fb-check">{s.done ? '✓' : ''}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <p className="cnx-fb-note">{f.note}</p>
        </div>
      ))}
      <div className="cnx-empty" style={{ marginTop: 14 }}>Le prossime proposte approvate appariranno qui con il loro stato di attuazione.</div>
    </div>
  );
}

/* ---------- Rassegna stampa ---------- */
function RassegnaView() {
  return (
    <div className="cnx-table" style={{ maxWidth: 680 }}>
      {CN_PRESS.map(p => (
        <div key={p.id} className="cnx-table-row">
          <div>
            <p className="cn-meta"><b style={{ color: 'var(--ink)' }}>{p.source}</b> · {p.date}</p>
            <b>{p.title}</b>
            <p className="cn-meta">{p.comments} commenti dei soci</p>
          </div>
          <div className="cnx-admin-actions">
            <Btn small kind="ghost">Leggi</Btn>
            <Btn small kind="ghost">Commenta</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Spazi civici ---------- */
function SpaziView() {
  return (
    <div>
      <p className="cn-meta" style={{ marginBottom: 16 }}>I luoghi pubblici della città: dove trovarsi, studiare, organizzare</p>
      <div className="cnx-spaces">
        {CN_SPACES.map(s => (
          <div key={s.id} className="cnx-space">
            <Tag>{s.type}</Tag>
            <h4>{s.name}</h4>
            <p className="cnx-space-hours">{s.hours}</p>
            <p className="cn-meta">{s.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Webinar e registrazioni ---------- */
function WebinarView() {
  return (
    <div>
      <p className="cn-meta" style={{ marginBottom: 16 }}>Le registrazioni delle assemblee e le lezioni sui temi civici</p>
      <div className="cnx-gallery">
        {CN_WEBINARS.map(w => (
          <figure key={w.id} className="cnx-album">
            <div className="cnx-ph cnx-video-ph">
              <span className="cnx-play"></span>
              <span>video · {w.dur}</span>
            </div>
            <figcaption>
              <b>{w.title}</b>
              <span className="cn-meta">{w.date} · {w.views} visualizzazioni</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ---------- Competenze (matching cittadini) ---------- */
function MatchingView({ user }) {
  const [people, setPeople] = useF2State(CN_SKILLS);
  const [showForm, setShowForm] = useF2State(false);
  const [skill, setSkill] = useF2State('');
  const [offer, setOffer] = useF2State('');
  const [contacted, setContacted] = useF2State({});
  const submit = (e) => {
    e.preventDefault();
    if (!skill.trim()) return;
    setPeople([{ id: Date.now(), name: user ? user.name : 'Tu', skills: skill.trim(), offer: offer.trim() || 'Disponibile su richiesta' }, ...people]);
    setSkill(''); setOffer(''); setShowForm(false);
  };
  return (
    <div>
      <div className="cnx-row-between">
        <p className="cn-meta">Soci che mettono a disposizione le proprie competenze, gratis, per i progetti civici</p>
        {user ? <Btn small onClick={() => setShowForm(!showForm)}>{showForm ? 'Annulla' : 'Offri una competenza'}</Btn> : <p className="cn-meta"><b>Accedi per offrirti</b></p>}
      </div>
      {showForm ? (
        <form className="cnx-form cnx-proposta-form" onSubmit={submit}>
          <label className="cnx-field">
            <span>La tua competenza</span>
            <input type="text" value={skill} onChange={e => setSkill(e.target.value)} placeholder="Es. Traduzioni, contabilità, video" required></input>
          </label>
          <label className="cnx-field">
            <span>Cosa offri</span>
            <input type="text" value={offer} onChange={e => setOffer(e.target.value)} placeholder="Es. Sottotitoli per i webinar"></input>
          </label>
          <Btn small>Pubblica</Btn>
        </form>
      ) : null}
      <div className="cnx-table" style={{ maxWidth: 680 }}>
        {people.map(p => (
          <div key={p.id} className="cnx-table-row">
            <Avatar name={p.name} size={40}></Avatar>
            <div>
              <b>{p.name}</b> <span className="cnx-status is-approvata">{p.skills}</span>
              <p className="cn-meta">{p.offer}</p>
            </div>
            <Btn small kind={contacted[p.id] ? 'done' : 'ghost'} onClick={() => setContacted({ ...contacted, [p.id]: true })}>
              {contacted[p.id] ? 'Messaggio inviato' : 'Contatta'}
            </Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Community: contenitore con sotto-sezioni ---------- */
function CommunityView({ user }) {
  const [tab, setTab] = useF2State('Mentorship');
  const tabs = ['Mentorship', 'Competenze', 'Webinar', 'Rassegna stampa'];
  return (
    <div>
      <div className="cn-chip-row" style={{ marginBottom: 18 }}>
        {tabs.map(c => <Chip key={c} active={tab === c} onClick={() => setTab(c)}>{c}</Chip>)}
      </div>
      {tab === 'Mentorship' ? <MentorshipView user={user}></MentorshipView> : null}
      {tab === 'Competenze' ? <MatchingView user={user}></MatchingView> : null}
      {tab === 'Webinar' ? <WebinarView></WebinarView> : null}
      {tab === 'Rassegna stampa' ? <RassegnaView></RassegnaView> : null}
    </div>
  );
}

Object.assign(window, {
  MentorshipView, TimelineView, FeedbackView, RassegnaView, SpaziView, WebinarView, MatchingView, CommunityView,
});
