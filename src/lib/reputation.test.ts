import { describe, it, expect } from "vitest";
import { computePoints, levelFor, earnedBadges, POINTS } from "./reputation";

// Logica pura: nessun Postgres, quindi (a differenza dei test delle server action) questo file
// non si salta mai, gira anche in pre-commit e CI senza database di test.

describe("computePoints", () => {
  it("somma i quattro assi con i pesi del catalogo", () => {
    const points = computePoints({
      rsvpCount: 5,
      quizAttemptCount: 3,
      proposalCount: 1,
      voteCount: 5,
    });
    // 5*20 + 3*30 + 1*40 + 5*10 = 100 + 90 + 40 + 50 = 280
    expect(points).toBe(280);
    expect(points).toBe(
      5 * POINTS.rsvp + 3 * POINTS.quizAttempt + 1 * POINTS.proposal + 5 * POINTS.vote,
    );
  });

  it("vale zero senza attivita'", () => {
    expect(
      computePoints({ rsvpCount: 0, quizAttemptCount: 0, proposalCount: 0, voteCount: 0 }),
    ).toBe(0);
  });
});

describe("levelFor", () => {
  it("assegna Nuovo sotto la prima soglia", () => {
    const lvl = levelFor(0);
    expect(lvl.name).toBe("Nuovo");
    expect(lvl.next).toEqual({ name: "Attivo", at: 200 });
  });

  it("promuove ad Attivo esattamente sulla soglia (200)", () => {
    expect(levelFor(199).name).toBe("Nuovo");
    expect(levelFor(200).name).toBe("Attivo");
    expect(levelFor(200).next).toEqual({ name: "Pilastro", at: 500 });
  });

  it("Pilastro e' il massimo, senza livello successivo", () => {
    const lvl = levelFor(500);
    expect(lvl.name).toBe("Pilastro");
    expect(lvl.next).toBeNull();
    expect(levelFor(999).name).toBe("Pilastro");
  });
});

describe("earnedBadges", () => {
  const now = new Date("2026-07-20T00:00:00Z");

  it("sblocca i badge di soglia sugli eventi e sulle attivita'", () => {
    const badges = earnedBadges(
      {
        rsvpCount: 5,
        quizAttemptCount: 1,
        proposalCount: 1,
        voteCount: 0,
        hasFullQuiz: false,
        memberSince: now,
      },
      now,
    );
    const earned = Object.fromEntries(badges.map((b) => [b.label, b.earned]));
    expect(earned["Primo evento"]).toBe(true);
    expect(earned["5 eventi"]).toBe(true);
    expect(earned["Prima proposta"]).toBe(true);
    expect(earned["Quiz completato"]).toBe(true);
    expect(earned["Punteggio pieno"]).toBe(false);
  });

  it("non sblocca '5 eventi' con 4 RSVP", () => {
    const badges = earnedBadges(
      {
        rsvpCount: 4,
        quizAttemptCount: 0,
        proposalCount: 0,
        voteCount: 0,
        hasFullQuiz: false,
        memberSince: now,
      },
      now,
    );
    const earned = Object.fromEntries(badges.map((b) => [b.label, b.earned]));
    expect(earned["Primo evento"]).toBe(true);
    expect(earned["5 eventi"]).toBe(false);
  });

  it("sblocca 'Un anno con noi' solo dopo dodici mesi di tesseramento", () => {
    const almostAYear = new Date("2025-08-01T00:00:00Z"); // meno di un anno prima di now
    const overAYear = new Date("2025-07-01T00:00:00Z"); // piu' di un anno prima di now
    const base = {
      rsvpCount: 0,
      quizAttemptCount: 0,
      proposalCount: 0,
      voteCount: 0,
      hasFullQuiz: false,
    };
    const near = earnedBadges({ ...base, memberSince: almostAYear }, now);
    const over = earnedBadges({ ...base, memberSince: overAYear }, now);
    expect(near.find((b) => b.label === "Un anno con noi")?.earned).toBe(false);
    expect(over.find((b) => b.label === "Un anno con noi")?.earned).toBe(true);
  });
});
