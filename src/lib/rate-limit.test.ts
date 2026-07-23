import { describe, expect, it } from "vitest";
import { exceedsLimit, windowStart } from "./rate-limit";

describe("windowStart", () => {
  it("calcola l'istante N minuti prima di now", () => {
    const now = new Date("2026-07-22T10:00:00.000Z");
    expect(windowStart(10, now)).toEqual(new Date("2026-07-22T09:50:00.000Z"));
  });
});

describe("exceedsLimit", () => {
  it("non supera il limite quando il conteggio e' sotto la soglia", () => {
    expect(exceedsLimit(4, 5)).toBe(false);
  });

  it("supera il limite quando il conteggio raggiunge la soglia", () => {
    expect(exceedsLimit(5, 5)).toBe(true);
  });

  it("supera il limite quando il conteggio e' oltre la soglia", () => {
    expect(exceedsLimit(9, 5)).toBe(true);
  });
});
