# Refactor 02 — Le grafiche decorative come Server Component, non client con `useMemo`

Riferimento: voce 2 di `studio-didattico-master.md`.

## Prima (prototipo, `design_handoff_civitanext/civitanext-ui.jsx`)

```jsx
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
  return (/* ... */);
}
```

`useMemo` qui risolve un problema reale nel contesto del prototipo: l'intera applicazione è una
SPA client-side (React montato via `ReactDOM.createRoot` su un'unica pagina), quindi ogni
interazione (cambio tab, voto, apertura di un pannello) causa un re-render che, senza
memoizzazione, ricalcolerebbe il path SVG da zero anche se le prop non sono cambiate.

## Dopo (`src/components/ui/Starburst.tsx`)

```tsx
export function Starburst({
  size = 120,
  points = 14,
  color = "var(--accent)",
  className,
}: StarburstProps) {
  const cx = 50;
  const cy = 50;
  const outer = 50;
  const inner = 30;
  let d = "";
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / points - Math.PI / 2;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2);
  }
  d += "Z";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <path d={d} fill={color} />
    </svg>
  );
}
```

Nessun `"use client"`, nessun hook. Il file compare come Server Component nel build: la build di
Fase 0 conferma che `/` (la pagina che usa `Starburst`) è prerenderizzata come contenuto statico
(`○ (Static) prerendered as static content` nell'output di `next build`), segno che l'intero
albero, grafiche comprese, non richiede runtime client.

## Come estendere il pattern

Prima di scrivere un nuovo componente puramente visivo (un'altra grafica brand, un badge, un
separatore), la domanda da farsi non è "mi serve la memoizzazione" ma "questo componente legge
stato del browser, gestisce un evento, o cambia nel tempo senza un nuovo giro di rendering dal
server?". Se la risposta è no, resta un Server Component senza hook. Il bisogno di `"use client"`
va dimostrato dal componente stesso (uno stato, un `onClick` che fa qualcosa lato client, un
`useEffect`), non ereditato per abitudine dal prototipo che girava in un contesto architetturale
diverso.
