"use client";

import dynamic from "next/dynamic";
import type { CivicMapPoint } from "./CivicMap";

// Leaflet legge `window` alla costruzione della mappa: caricamento dinamico senza SSR, unico
// modo corretto in App Router di disattivare il rendering server per un componente client
// (ssr: false su next/dynamic non e' consentito nei Server Component).
const CivicMap = dynamic(() => import("./CivicMap").then((mod) => mod.CivicMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-cn border-2 border-ink bg-paper-card font-ui text-sm text-ink-soft shadow-hard">
      Caricamento mappa…
    </div>
  ),
});

export function CivicMapLoader({ points }: { points: CivicMapPoint[] }) {
  return <CivicMap points={points} />;
}
