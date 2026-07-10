// CivitaNext: UI kit condiviso, grafiche collage + componenti base
const { useState, useEffect, useMemo } = React;

/* ---------- Grafiche brand (forme semplici, generate proceduralmente) ---------- */

// Starburst rosso: poligono a raggi generato via JS
function Starburst({ size = 120, points = 14, color = 'var(--accent)', style = {} }) {
  const path = useMemo(() => {
    const cx = 50, cy = 50, outer = 50, inner = 30;
    let d = '';
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (Math.PI * i) / points - Math.PI / 2;
      const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
    }
    return d + 'Z';
  }, [points]);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style} aria-hidden="true">
      <path d={path} fill={color}></path>
    </svg>
  );
}

// Onde blu: righe di sinusoidi
function Waves({ width = 180, rows = 4, color = 'var(--ink)', style = {} }) {
  const wave = 'M0 6 Q 7.5 0, 15 6 T 30 6 T 45 6 T 60 6 T 75 6 T 90 6 T 105 6 T 120 6';
  return (
    <svg width={width} height={rows * 13} viewBox={`0 0 120 ${rows * 13}`} style={style} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <path key={i} d={wave} transform={`translate(0 ${i * 13})`} fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round"></path>
      ))}
    </svg>
  );
}

// Sottolineatura squiggle
function Squiggle({ width = 120, color = 'var(--accent)', style = {} }) {
  return (
    <svg width={width} height="10" viewBox="0 0 120 10" style={style} aria-hidden="true">
      <path d="M0 5 Q 7.5 0, 15 5 T 30 5 T 45 5 T 60 5 T 75 5 T 90 5 T 105 5 T 120 5" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"></path>
    </svg>
  );
}

// Logo CivitaNext (lampadina + freccia stilizzata, geometria semplice)
function Logo({ size = 34 }) {
  return (
    <span className="cn-logo">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="17" r="13" fill="none" stroke="var(--accent)" strokeWidth="3.5"></circle>
        <line x1="14" y1="34" x2="26" y2="34" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round"></line>
        <path d="M14 23 L23 14 M23 14 H16.5 M23 14 V20.5" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
      <span className="cn-logo-word"><b>CIVITA</b><i>NEXT</i></span>
    </span>
  );
}

/* ---------- Componenti base ---------- */

function Btn({ children, kind = 'primary', onClick, style = {}, small = false }) {
  return (
    <button className={`cn-btn cn-btn-${kind} ${small ? 'cn-btn-sm' : ''}`} onClick={onClick} style={style}>
      {children}
    </button>
  );
}

function Chip({ children, active = false, onClick }) {
  return (
    <button className={`cn-chip ${active ? 'is-active' : ''}`} onClick={onClick}>{children}</button>
  );
}

function Tag({ children, color = 'var(--ink)' }) {
  return <span className="cn-tag" style={{ color: color, borderColor: color }}>{children}</span>;
}

function SectionTitle({ kicker, title, hand }) {
  return (
    <div className="cn-section-title">
      {kicker ? <span className="cn-kicker">{kicker}</span> : null}
      <h2>{title}</h2>
      {hand ? <span className="cn-hand">{hand}</span> : null}
      <Squiggle width={90} style={{ display: 'block', marginTop: 6 }}></Squiggle>
    </div>
  );
}

// Avatar con iniziali
function Avatar({ name, size = 36 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('');
  const hues = ['var(--accent)', 'var(--ink)', '#C4853A'];
  const h = hues[name.length % hues.length];
  return (
    <span className="cn-avatar" style={{ width: size, height: size, background: h, fontSize: size * 0.38 }}>
      {initials}
    </span>
  );
}

// Toast di condivisione
function ShareToast({ visible, text = 'Link copiato, pronto da condividere' }) {
  return (
    <div className={`cn-toast ${visible ? 'is-visible' : ''}`}>{text}</div>
  );
}

// Hook condivisione finta
function useShare() {
  const [toast, setToast] = useState(false);
  const share = () => {
    setToast(true);
    setTimeout(() => setToast(false), 1800);
  };
  return [toast, share];
}

Object.assign(window, { Starburst, Waves, Squiggle, Logo, Btn, Chip, Tag, SectionTitle, Avatar, ShareToast, useShare });
