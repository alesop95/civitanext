import { MAX_SHORT_TEXT } from "@/lib/validation";

// Validazione pura del payload delle domande di un quiz, prodotto dall'editor client (QuizEditor)
// e serializzato in JSON in un campo nascosto del form. Isolata e senza database, cosi' e'
// testabile: e' il punto in cui ci si difende da un payload malformato costruito a mano, non ci si
// fida della UI. Ogni domanda deve avere un testo, almeno due opzioni non vuote e un indice di
// risposta corretta valido.

export type ParsedQuestion = { text: string; options: string[]; correctIndex: number };
export type QuizQuestionsResult =
  | { ok: true; questions: ParsedQuestion[] }
  | { ok: false; error: string };

export function parseQuizQuestions(raw: string): QuizQuestionsResult {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Formato delle domande non valido." };
  }
  if (!Array.isArray(data) || data.length === 0) {
    return { ok: false, error: "Serve almeno una domanda." };
  }

  const questions: ParsedQuestion[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, error: "Domanda non valida." };
    }
    const record = item as Record<string, unknown>;
    const text = typeof record.text === "string" ? record.text.trim() : "";
    const rawOptions = Array.isArray(record.options) ? record.options : null;
    const correctIndex = record.correctIndex;

    if (!text) return { ok: false, error: "Ogni domanda deve avere un testo." };
    if (text.length > MAX_SHORT_TEXT) {
      return { ok: false, error: "Il testo di una domanda supera la lunghezza massima." };
    }
    if (!rawOptions || rawOptions.length < 2) {
      return { ok: false, error: "Ogni domanda deve avere almeno due opzioni." };
    }

    const options: string[] = [];
    for (const option of rawOptions) {
      const optionText = typeof option === "string" ? option.trim() : "";
      if (!optionText) return { ok: false, error: "Le opzioni non possono essere vuote." };
      if (optionText.length > MAX_SHORT_TEXT) {
        return { ok: false, error: "Il testo di un'opzione supera la lunghezza massima." };
      }
      options.push(optionText);
    }

    if (
      typeof correctIndex !== "number" ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex >= options.length
    ) {
      return { ok: false, error: "Ogni domanda deve avere una risposta corretta valida." };
    }

    questions.push({ text, options, correctIndex });
  }

  return { ok: true, questions };
}
