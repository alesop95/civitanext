"use client";

import dynamic from "next/dynamic";
import type { MapPointDefaults } from "./MapPointPicker";

// Stesso confine client/server di CivicMapLoader: Leaflet legge `window` alla costruzione,
// quindi il picker si carica dinamicamente senza SSR da un Client Component dedicato.
const MapPointPicker = dynamic(
  () => import("./MapPointPicker").then((mod) => mod.MapPointPicker),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] w-full items-center justify-center rounded-cn border-2 border-ink bg-paper-card font-ui text-sm text-ink-soft shadow-hard">
        Caricamento mappa…
      </div>
    ),
  },
);

export function MapPointPickerLoader({ defaults }: { defaults?: MapPointDefaults }) {
  return <MapPointPicker defaults={defaults} />;
}
