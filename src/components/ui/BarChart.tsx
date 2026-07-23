// Grafico a barre reso interamente lato server con CSS (altezze in percentuale), senza libreria
// di charting ne' JavaScript al browser: coerente con la scelta "Server Component per default"
// del progetto e con il target Cloudflare Workers. L'ultima barra e' evidenziata con l'accento,
// come le barre del prototipo (cnx-bar is-hot), per marcare il mese corrente.
//
// Accessibilita': l'insieme e' un'unica immagine con una descrizione testuale (role="img" +
// aria-label che riassume i valori), cosi' un lettore di schermo non legge una sfilza di div
// vuoti ma la serie di numeri.

export type BarDatum = { label: string; count: number };

export function BarChart({
  data,
  caption,
  highlightLast = true,
}: {
  data: BarDatum[];
  caption: string;
  highlightLast?: boolean;
}) {
  // Il massimo non scende mai sotto 1: evita la divisione per zero quando tutti i valori sono a
  // zero (in quel caso tutte le barre restano all'altezza minima visibile).
  const max = Math.max(1, ...data.map((d) => d.count));
  const summary = `${caption}: ${data.map((d) => `${d.label} ${d.count}`).join(", ")}`;

  return (
    <div role="img" aria-label={summary} className="flex items-end gap-2 sm:gap-3">
      {data.map((d, i) => {
        const heightPct = Math.max(Math.round((d.count / max) * 100), 3);
        const isHot = highlightLast && i === data.length - 1;
        return (
          <div key={`${d.label}-${i}`} className="flex flex-1 flex-col items-center gap-2">
            <span className="font-ui text-xs font-bold">{d.count}</span>
            <div className="flex h-40 w-full items-end">
              <div
                className={
                  isHot
                    ? "w-full rounded-cn border-2 border-ink bg-accent"
                    : "w-full rounded-cn border-2 border-ink bg-ink"
                }
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="font-ui text-xs text-ink-soft">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
