import { MAX_SHORT_TEXT } from "@/lib/validation";

// Validazione pura degli step di attuazione, prodotti dall'editor client e serializzati in JSON.
// Isolata e senza database: e' il punto in cui ci si difende da un payload malformato. Un elenco
// vuoto e' lecito (una proposta puo' avere solo una nota di aggiornamento, senza passi ancora
// definiti); ogni passo presente deve avere un'etichetta non vuota.

export type ImplementationStep = { label: string; done: boolean };
export type ImplementationStepsResult =
  | { ok: true; steps: ImplementationStep[] }
  | { ok: false; error: string };

export function parseImplementationSteps(raw: string): ImplementationStepsResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Formato dei passi non valido." };
  }
  if (!Array.isArray(data)) {
    return { ok: false, error: "Formato dei passi non valido." };
  }

  const steps: ImplementationStep[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, error: "Passo non valido." };
    }
    const record = item as Record<string, unknown>;
    const label = typeof record.label === "string" ? record.label.trim() : "";
    const done = record.done === true;

    if (!label) return { ok: false, error: "Ogni passo deve avere un'etichetta." };
    if (label.length > MAX_SHORT_TEXT) {
      return { ok: false, error: "L'etichetta di un passo supera la lunghezza massima." };
    }
    steps.push({ label, done });
  }

  return { ok: true, steps };
}
