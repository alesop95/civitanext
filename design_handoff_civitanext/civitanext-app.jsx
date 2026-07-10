// CivitaNext: app shell desktop + tweaks
const { useState: useAState, useEffect: useAEffect } = React;

const CN_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#E8503A",
  "texture": true,
  "corners": "vivi"
}/*EDITMODE-END*/;

function CivitaNextApp() {
  const [t, setTweak] = useTweaks(CN_TWEAK_DEFAULTS);
  const [page, setPage] = useAState(() => localStorage.getItem('cn_page') || 'home');
  const [openThread, setOpenThread] = useAState(null);
  const [user, setUser] = useAState(cnGetUser);

  useAEffect(() => { localStorage.setItem('cn_page', page); }, [page]);

  const go = (p, threadId) => {
    setPage(p);
    setOpenThread(threadId || null);
    window.scrollTo(0, 0);
  };
  const handleLogin = (u) => { setUser(u); go(u.role === 'admin' ? 'admin' : 'profilo'); };
  const handleLogout = () => { cnLogout(); setUser(null); go('home'); };

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'eventi', label: 'Eventi' },
    { id: 'quiz', label: 'Quiz' },
    { id: 'forum', label: 'Forum' },
    { id: 'proposte', label: 'Proposte' },
    { id: 'citta', label: 'Città' },
    { id: 'community', label: 'Community' },
  ];
  if (user && user.role === 'admin') tabs.push({ id: 'admin', label: 'Admin' });

  const rootStyle = {
    '--accent': t.accent,
    '--radius': t.corners === 'vivi' ? '2px' : '14px',
  };

  const titles = {
    proposte: ['Partecipa', 'Proposte e votazioni', 'la città la facciamo noi'],
    citta: ['La città', 'Civitanova Marche', null],
    community: ['Insieme', 'Community', null],
    notifiche: ['Aggiornamenti', 'Notifiche', null],
    admin: ['Pannello di controllo', 'Admin', null],
  };

  return (
    <div className={`cn-root ${t.texture ? 'has-texture' : ''}`} style={rootStyle}>
      <nav className="cn-nav">
        <Logo></Logo>
        <div className="cn-nav-tabs">
          {tabs.map(tab => (
            <button key={tab.id} className={`cn-nav-tab ${page === tab.id ? 'is-active' : ''}`}
              onClick={() => go(tab.id)}>
              {tab.label}
              {page === tab.id ? <Squiggle width={46} style={{ display: 'block', margin: '2px auto 0' }}></Squiggle> : null}
            </button>
          ))}
        </div>
        <div className="cn-nav-right">
          <button className={`cn-bell ${page === 'notifiche' ? 'is-active' : ''}`} onClick={() => go('notifiche')}>
            Avvisi<i className="cn-bell-dot"></i>
          </button>
          {user ? (
            <button className="cn-userbtn" onClick={() => go('profilo')}>
              <Avatar name={user.name} size={32}></Avatar>
              <span>{user.name.split(' ')[0]}</span>
            </button>
          ) : (
            <Btn small kind="ghost" onClick={() => go('login')}>Accedi</Btn>
          )}
          {user ? null : <Btn small onClick={() => go('iscrizione')}>Iscriviti</Btn>}
        </div>
      </nav>

      <main className="cn-main" data-screen-label={page}>
        {titles[page] ? (
          <SectionTitle kicker={titles[page][0]} title={titles[page][1]} hand={titles[page][2]}></SectionTitle>
        ) : null}
        {page === 'home' ? <HomePage go={go}></HomePage> : null}
        {page === 'eventi' ? <EventiPage></EventiPage> : null}
        {page === 'quiz' ? <QuizPage></QuizPage> : null}
        {page === 'forum' ? <ForumPage openThreadId={openThread} clearOpen={() => setOpenThread(null)}></ForumPage> : null}
        {page === 'proposte' ? <ProposteView user={user}></ProposteView> : null}
        {page === 'citta' ? <CittaView></CittaView> : null}
        {page === 'community' ? <CommunityView user={user}></CommunityView> : null}
        {page === 'notifiche' ? <NotificheView></NotificheView> : null}
        {page === 'login' ? <LoginForm onLogin={handleLogin}></LoginForm> : null}
        {page === 'iscrizione' ? <IscrizioneFlow onDone={(u) => { setUser(u); go('profilo'); }}></IscrizioneFlow> : null}
        {page === 'profilo' ? (user
          ? <ProfiloView user={user} onLogout={handleLogout}></ProfiloView>
          : <LoginForm onLogin={handleLogin}></LoginForm>) : null}
        {page === 'admin' ? (user && user.role === 'admin'
          ? <AdminView></AdminView>
          : <LoginForm onLogin={handleLogin}></LoginForm>) : null}
      </main>

      <footer className="cn-footer">
        <Waves rows={3} width={140}></Waves>
        <p><b>CIVITANEXT</b> · Idee, partecipazione, cambiamento · Civitanova Marche · <a href="CivitaNext Mobile.html" style={{ color: 'var(--accent)', fontWeight: 700 }}>versione mobile</a></p>
      </footer>

      <TweaksPanel>
        <TweakSection label="Brand"></TweakSection>
        <TweakColor label="Accento" value={t.accent}
          options={['#E8503A', '#1F4E79', '#1F8A5B']}
          onChange={(v) => setTweak('accent', v)}></TweakColor>
        <TweakToggle label="Texture carta" value={t.texture}
          onChange={(v) => setTweak('texture', v)}></TweakToggle>
        <TweakRadio label="Angoli" value={t.corners} options={['vivi', 'morbidi']}
          onChange={(v) => setTweak('corners', v)}></TweakRadio>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<CivitaNextApp></CivitaNextApp>);
