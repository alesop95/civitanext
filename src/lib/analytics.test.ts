import { describe, it, expect } from "vitest";
import { bucketByMonth, startOfMonth, windowStart, average } from "./analytics";

// Logica pura del pannello admin: nessun Postgres, quindi (come reputation.test.ts) questo file
// non si salta mai, gira anche in pre-commit e CI senza database di test.

describe("startOfMonth", () => {
  it("azzera giorno e ora al primo istante UTC del mese", () => {
    const start = startOfMonth(new Date("2026-07-23T14:30:00Z"));
    expect(start.toISOString()).toBe("2026-07-01T00:00:00.000Z");
  });
});

describe("windowStart", () => {
  it("torna al primo del mese piu' vecchio di una finestra di N mesi (inclusivo)", () => {
    // Finestra di 6 mesi che termina a luglio 2026 => parte da febbraio 2026.
    const from = windowStart(new Date("2026-07-23T00:00:00Z"), 6);
    expect(from.toISOString()).toBe("2026-02-01T00:00:00.000Z");
  });

  it("attraversa il confine d'anno senza sballare il mese", () => {
    // Finestra di 6 mesi che termina a gennaio 2026 => parte da agosto 2025.
    const from = windowStart(new Date("2026-01-15T00:00:00Z"), 6);
    expect(from.toISOString()).toBe("2025-08-01T00:00:00.000Z");
  });
});

describe("bucketByMonth", () => {
  const now = new Date("2026-07-15T00:00:00Z");

  it("produce esattamente N bucket, dal piu' vecchio al mese corrente", () => {
    const buckets = bucketByMonth([], now, 6);
    expect(buckets).toHaveLength(6);
    expect(buckets.map((b) => b.label)).toEqual(["Feb", "Mar", "Apr", "Mag", "Giu", "Lug"]);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });

  it("conta le date nel bucket del loro mese", () => {
    const dates = [
      new Date("2026-07-01T00:00:00Z"),
      new Date("2026-07-31T23:59:59Z"),
      new Date("2026-05-10T12:00:00Z"),
    ];
    const buckets = bucketByMonth(dates, now, 6);
    const byLabel = Object.fromEntries(buckets.map((b) => [b.label, b.count]));
    expect(byLabel["Lug"]).toBe(2);
    expect(byLabel["Mag"]).toBe(1);
    expect(byLabel["Giu"]).toBe(0);
  });

  it("ignora le date fuori dalla finestra (piu' vecchie del primo bucket o nel futuro)", () => {
    const dates = [
      new Date("2026-01-31T00:00:00Z"), // prima di Feb: fuori
      new Date("2026-08-01T00:00:00Z"), // dopo Lug: fuori
      new Date("2026-02-15T00:00:00Z"), // dentro
    ];
    const buckets = bucketByMonth(dates, now, 6);
    const total = buckets.reduce((s, b) => s + b.count, 0);
    expect(total).toBe(1);
    expect(buckets[0].label).toBe("Feb");
    expect(buckets[0].count).toBe(1);
  });

  it("distingue mesi con lo stesso nome ma anno diverso", () => {
    // Finestra che attraversa l'anno: nessuna collisione tra due 'stesso mese' di anni diversi.
    const december2025 = new Date("2025-12-20T00:00:00Z");
    const buckets = bucketByMonth([december2025], new Date("2026-02-15T00:00:00Z"), 6);
    const byLabel = Object.fromEntries(buckets.map((b) => [b.label, b.count]));
    expect(byLabel["Dic"]).toBe(1);
  });
});

describe("average", () => {
  it("arrotonda la media all'intero piu' vicino", () => {
    expect(average(32, 10)).toBe(3);
    expect(average(35, 10)).toBe(4);
  });

  it("vale 0 quando non c'e' nulla da mediare (nessuna divisione per zero)", () => {
    expect(average(0, 0)).toBe(0);
    expect(average(100, 0)).toBe(0);
  });
});
