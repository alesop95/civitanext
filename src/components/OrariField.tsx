"use client";

import { useState } from "react";
import { Btn } from "@/components/ui/Btn";

const GIORNI_PRESET = [
  "Lun-Ven",
  "Sab-Dom",
  "Lun-Sab",
  "Tutti i giorni",
  "Lun",
  "Mar",
  "Mer",
  "Gio",
  "Ven",
  "Sab",
  "Dom",
];

const ORE = Array.from({ length: 24 }, (_, h) => h);

// Aiuto solo di superficie: compone la stringa standard nello stesso campo di testo libero,
// che resta sempre modificabile a mano per i casi che i menu non esprimono (su prenotazione,
// chiusure stagionali). Nessuna modifica al modello dati: CivicSpace.hours resta una stringa.
export function OrariField({ defaultValue = "" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [giorni, setGiorni] = useState(GIORNI_PRESET[0]);
  const [daOra, setDaOra] = useState(9);
  const [aOra, setAOra] = useState(18);

  return (
    <div className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 font-ui text-sm">
        Orari
        <input
          name="hours"
          type="text"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="es. Lun-Ven 9-18"
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={giorni}
          onChange={(e) => setGiorni(e.target.value)}
          className="rounded-cn border-2 border-ink bg-paper-card px-2 py-1.5 font-ui text-sm"
        >
          {GIORNI_PRESET.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={daOra}
          onChange={(e) => setDaOra(Number(e.target.value))}
          className="rounded-cn border-2 border-ink bg-paper-card px-2 py-1.5 font-ui text-sm"
        >
          {ORE.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="font-ui text-sm text-ink-soft">-</span>
        <select
          value={aOra}
          onChange={(e) => setAOra(Number(e.target.value))}
          className="rounded-cn border-2 border-ink bg-paper-card px-2 py-1.5 font-ui text-sm"
        >
          {ORE.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <Btn
          type="button"
          kind="secondary"
          small
          onClick={() => setValue(`${giorni} ${daOra}-${aOra}`)}
        >
          Componi
        </Btn>
      </div>
    </div>
  );
}
