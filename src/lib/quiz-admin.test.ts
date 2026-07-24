import { describe, it, expect } from "vitest";
import { parseQuizQuestions } from "./quiz-admin";

// Logica pura: nessun Postgres, gira sempre.

function payload(questions: unknown): string {
  return JSON.stringify(questions);
}

const validQuestion = {
  text: "Capitale d'Italia?",
  options: ["Roma", "Milano"],
  correctIndex: 0,
};

describe("parseQuizQuestions", () => {
  it("accetta un payload valido e ripulisce gli spazi", () => {
    const result = parseQuizQuestions(
      payload([{ text: "  Domanda?  ", options: [" A ", "B"], correctIndex: 1 }]),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.questions[0]).toEqual({ text: "Domanda?", options: ["A", "B"], correctIndex: 1 });
    }
  });

  it("rifiuta JSON non valido", () => {
    expect(parseQuizQuestions("non-json").ok).toBe(false);
  });

  it("rifiuta un elenco vuoto", () => {
    expect(parseQuizQuestions(payload([])).ok).toBe(false);
  });

  it("rifiuta una domanda senza testo", () => {
    expect(parseQuizQuestions(payload([{ ...validQuestion, text: "  " }])).ok).toBe(false);
  });

  it("rifiuta meno di due opzioni", () => {
    expect(parseQuizQuestions(payload([{ ...validQuestion, options: ["Sola"] }])).ok).toBe(false);
  });

  it("rifiuta un'opzione vuota", () => {
    expect(parseQuizQuestions(payload([{ ...validQuestion, options: ["A", "  "] }])).ok).toBe(false);
  });

  it("rifiuta un indice di risposta corretta fuori range", () => {
    expect(parseQuizQuestions(payload([{ ...validQuestion, correctIndex: 5 }])).ok).toBe(false);
    expect(parseQuizQuestions(payload([{ ...validQuestion, correctIndex: -1 }])).ok).toBe(false);
    expect(parseQuizQuestions(payload([{ ...validQuestion, correctIndex: 1.5 }])).ok).toBe(false);
  });

  it("valida piu' domande insieme", () => {
    const result = parseQuizQuestions(
      payload([validQuestion, { text: "Altra?", options: ["X", "Y", "Z"], correctIndex: 2 }]),
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.questions).toHaveLength(2);
  });
});
