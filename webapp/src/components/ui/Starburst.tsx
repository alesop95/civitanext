interface StarburstProps {
  size?: number;
  points?: number;
  color?: string;
  className?: string;
}

// Genera un poligono a raggi (stella) come path SVG. Nel prototipo il calcolo
// viveva dietro useMemo perche' girava in una SPA client-side rieseguita ad
// ogni render; qui e' un Server Component: il path si calcola una sola volta
// in fase di rendering server e non spedisce alcun JS al browser.
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
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
    >
      <path d={d} fill={color} />
    </svg>
  );
}
