import type { ReactNode } from "react";

// Riquadro statistica del pannello admin: numero grande piu' etichetta, stesso vocabolario
// visivo delle card del resto dell'app (bordo netto, ombra dura, angoli quasi vivi). Puramente
// presentazionale, quindi Server Component senza "use client".
export function StatTile({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-cn border-2 border-ink bg-paper-card p-5 shadow-hard">
      <span className="font-display text-3xl font-black leading-none">{value}</span>
      <span className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </span>
    </div>
  );
}
