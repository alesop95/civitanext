import { describe, it, expect } from "vitest";
import { parseImplementationSteps } from "./proposal-implementation";

// Logica pura: nessun Postgres, gira sempre.

describe("parseImplementationSteps", () => {
  it("accetta un elenco valido e ripulisce le etichette", () => {
    const result = parseImplementationSteps(
      JSON.stringify([
        { label: "  Approvata dai soci ", done: true },
        { label: "Installazione", done: false },
      ]),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.steps).toEqual([
        { label: "Approvata dai soci", done: true },
        { label: "Installazione", done: false },
      ]);
    }
  });

  it("accetta un elenco vuoto (solo nota, nessun passo)", () => {
    const result = parseImplementationSteps("[]");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.steps).toEqual([]);
  });

  it("interpreta done non-true come false", () => {
    const result = parseImplementationSteps(JSON.stringify([{ label: "X", done: "si" }]));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.steps[0].done).toBe(false);
  });

  it("rifiuta JSON non valido o non-array", () => {
    expect(parseImplementationSteps("nope").ok).toBe(false);
    expect(parseImplementationSteps(JSON.stringify({})).ok).toBe(false);
  });

  it("rifiuta un passo senza etichetta", () => {
    expect(parseImplementationSteps(JSON.stringify([{ label: "   ", done: true }])).ok).toBe(false);
  });
});
