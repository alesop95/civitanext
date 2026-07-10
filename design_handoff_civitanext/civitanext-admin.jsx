// CivitaNext: pannello admin (condiviso desktop e mobile, prop compact)
const { useState: useAdmState } = React;

const CN_ADMIN_STATS = [
  { label: 'Soci attivi', value: 87 },
  { label: 'RSVP medi per evento', value: 32 },
  { label: 'Risposte quiz nel mese', value: 214 },
  { label: 'Messaggi forum nel mese', value: 156 },
];

const CN_FLAGGED = [
  { id: 1, author: 'utente_anonimo', thread: 'Pista ciclabile sul lungomare', text: 'Messaggio segnalato da 3 soci per tono offensivo verso un altro utente.' },
  { id: 2, author: 'mario_72', thread: 'Spazi per studiare la sera', text: 'Possibile spam: link ripetuto a un sito esterno non pertinente.' },
];

const CN_ADMIN_USERS = [
  { id: 1, name: 'Giulia Marini', email: 'socio@civitanext.it', role: 'socio', active: true },
  { id: 2, name: 'Luca Bonifazi', email: 'admin@civitanext.it', role: 'admin', active: true },
  { id: 3, name: 'Sara Properzi', email: 'sara.p@esempio.it', role: 'socio', active: true },
  { id: 4, name: 'Marco Tombesi', email: 'marco.t@esempio.it', role: 'socio', active: false },
];

const CN_ANALYTICS = {
  bars: [
    { m: 'Feb', v: 34 }, { m: 'Mar', v: 52 }, { m: 'Apr', v: 61 }, { m: 'Mag', v: 78 }, { m: 'Giu', v: 92 },
  ],
  retention: 68,
  trends: ['Le proposte di mobilità raccolgono il doppio dei voti della media', 'Il quiz settimanale è la pagina più visitata dopo la home', 'Picco di iscrizioni dopo la pulizia spiaggia di maggio'],
};

function AdminView({ compact }) {
  const [section, setSection] = useAdmState('Panoramica');
  const [proposals, setProposals] = useAdmState(cnGetProposals);
  const [flagged, setFlagged] = useAdmState(CN_FLAGGED);
  const [quizzes, setQuizzes] = useAdmState(CN_QUIZZES.map(q => ({ ...q, active: !q.locked })));
  const [events, setEvents] = useAdmState(CN_EVENTS);
  const [users, setUsers] = useAdmState(CN_ADMIN_USERS);
  const sections = ['Panoramica', 'Proposte', 'Moderazione', 'Quiz', 'Eventi', 'Utenti', 'Analytics'];

  const decideProposal = (id, ok) => {
    const next = ok
      ? proposals.map(p => p.id === id ? { ...p, status: 'votazione' } : p)
      : proposals.filter(p => p.id !== id);
    setProposals(next); cnSaveProposals(next);
  };
  const pending = proposals.filter(p => p.status === 'revisione');

  return (
    <div className={`cnx-admin ${compact ? 'is-compact' : ''}`}>
      <nav className="cnx-admin-nav">
        {sections.map(s => (
          <button key={s} className={`cnx-admin-navbtn ${section === s ? 'is-active' : ''}`} onClick={() => setSection(s)}>
            {s}{s === 'Proposte' && pending.length ? ' · ' + pending.length : ''}
          </button>
        ))}
      </nav>
      <div>
        {section === 'Panoramica' ? (
          <div>
            <div className="cnx-stats">
              {CN_ADMIN_STATS.map(s => (
                <div key={s.label} className="cnx-stat"><b>{s.value}</b><span>{s.label}</span></div>
              ))}
            </div>
            <p className="cn-meta">In attesa: {pending.length} proposte da revisionare, {flagged.length} segnalazioni forum.</p>
          </div>
        ) : null}

        {section === 'Proposte' ? (
          <div className="cnx-table">
            {pending.length === 0 ? <div className="cnx-empty">Nessuna proposta in revisione. Tutto fatto.</div> : null}
            {pending.map(p => (
              <div key={p.id} className="cnx-table-row">
                <div>
                  <b>{p.title}</b>
                  <p className="cn-meta">{p.cat} · proposta da {p.author}</p>
                  <p className="cn-meta">{p.desc}</p>
                </div>
                <div className="cnx-admin-actions">
                  <Btn small onClick={() => decideProposal(p.id, true)}>Approva</Btn>
                  <Btn small kind="ghost" onClick={() => decideProposal(p.id, false)}>Rifiuta</Btn>
                </div>
              </div>
            ))}
            <p className="cn-meta">Le proposte approvate diventano pubbliche e vanno in votazione.</p>
          </div>
        ) : null}

        {section === 'Moderazione' ? (
          <div className="cnx-table">
            {flagged.length === 0 ? <div className="cnx-empty">Nessuna segnalazione aperta.</div> : null}
            {flagged.map(f => (
              <div key={f.id} className="cnx-table-row cnx-flag">
                <div>
                  <b>{f.author}</b> <span className="cn-meta">in "{f.thread}"</span>
                  <p className="cn-meta">{f.text}</p>
                </div>
                <div className="cnx-admin-actions">
                  <Btn small onClick={() => setFlagged(flagged.filter(x => x.id !== f.id))}>Nascondi messaggio</Btn>
                  <Btn small kind="ghost" onClick={() => setFlagged(flagged.filter(x => x.id !== f.id))}>Ignora</Btn>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {section === 'Quiz' ? (
          <div className="cnx-table">
            {quizzes.map(q => (
              <div key={q.id} className="cnx-table-row">
                <div>
                  <b>{q.title}</b>
                  <p className="cn-meta">{q.desc}</p>
                </div>
                <div className="cnx-admin-actions">
                  <Btn small kind={q.active ? 'done' : 'ghost'}
                    onClick={() => setQuizzes(quizzes.map(x => x.id === q.id ? { ...x, active: !x.active } : x))}>
                    {q.active ? 'Attivo' : 'Disattivato'}
                  </Btn>
                  <Btn small kind="ghost">Modifica</Btn>
                </div>
              </div>
            ))}
            <Btn small onClick={() => setQuizzes([...quizzes, { id: Date.now(), title: 'Nuovo quiz senza titolo', desc: 'Bozza · 0 domande', active: false }])}>Nuovo quiz</Btn>
          </div>
        ) : null}

        {section === 'Eventi' ? (
          <div className="cnx-table">
            {events.map(e => (
              <div key={e.id} className="cnx-table-row">
                <div>
                  <b>{e.title}</b>
                  <p className="cn-meta">{e.day} {e.month} · {e.time} · {e.place}</p>
                </div>
                <div className="cnx-admin-actions">
                  <Btn small kind="ghost">Modifica</Btn>
                  <Btn small kind="ghost" onClick={() => setEvents(events.filter(x => x.id !== e.id))}>Cancella</Btn>
                </div>
              </div>
            ))}
            <Btn small onClick={() => setEvents([...events, { id: Date.now(), day: 4, month: 'LUG', title: 'Nuovo evento senza titolo', time: 'da definire', place: 'da definire' }])}>Nuovo evento</Btn>
          </div>
        ) : null}

        {section === 'Utenti' ? (
          <div className="cnx-table">
            {users.map(u => (
              <div key={u.id} className="cnx-table-row">
                <div>
                  <b>{u.name}</b>
                  <p className="cn-meta">{u.email}</p>
                </div>
                <div className="cnx-admin-actions">
                  <select className="cnx-select" value={u.role}
                    onChange={ev => setUsers(users.map(x => x.id === u.id ? { ...x, role: ev.target.value } : x))}>
                    <option value="socio">Socio</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Btn small kind={u.active ? 'done' : 'ghost'}
                    onClick={() => setUsers(users.map(x => x.id === u.id ? { ...x, active: !x.active } : x))}>
                    {u.active ? 'Attivo' : 'Disattivato'}
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {section === 'Analytics' ? (
          <div>
            <h3 className="cnx-h3" style={{ marginTop: 0 }}>Soci attivi per mese</h3>
            <div className="cnx-bars">
              {CN_ANALYTICS.bars.map((b, i) => (
                <div key={b.m} className={`cnx-bar ${i === CN_ANALYTICS.bars.length - 1 ? 'is-hot' : ''}`}>
                  <i style={{ height: b.v + '%' }}></i>
                  <span>{b.m}</span>
                </div>
              ))}
            </div>
            <div className="cnx-stats" style={{ maxWidth: 480 }}>
              <div className="cnx-stat"><b>{CN_ANALYTICS.retention}%</b><span>Retention a 3 mesi</span></div>
              <div className="cnx-stat"><b>+18%</b><span>Engagement vs maggio</span></div>
            </div>
            <h3 className="cnx-h3">Tendenze</h3>
            <ul className="cnx-trends">
              {CN_ANALYTICS.trends.map(t => <li key={t}>{t}</li>)}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

Object.assign(window, { AdminView });
