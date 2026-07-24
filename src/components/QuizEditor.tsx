"use client";

import { useState } from "react";
import { Btn } from "@/components/ui/Btn";

// Editor dinamico delle domande di un quiz. Tiene lo stato dell'elenco domande (ciascuna con testo,
// opzioni e indice della risposta corretta) e lo serializza in un campo nascosto `payload` che la
// server action valida con parseQuizQuestions. La UI e' l'unica parte client; la verita' resta la
// validazione lato server. Vincoli minimi imposti anche qui per guidare l'admin: almeno una
// domanda, almeno due opzioni per domanda.

type EditorQuestion = { text: string; options: string[]; correctIndex: number };

const emptyQuestion = (): EditorQuestion => ({ text: "", options: ["", ""], correctIndex: 0 });

const fieldClass = "rounded-cn border-2 border-ink bg-paper-card px-3 py-2 font-ui text-sm";

export function QuizEditor() {
  const [questions, setQuestions] = useState<EditorQuestion[]>([emptyQuestion()]);

  const updateQuestion = (qi: number, patch: Partial<EditorQuestion>) =>
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);

  const removeQuestion = (qi: number) =>
    setQuestions((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== qi) : prev));

  const setOptionText = (qi: number, oi: number, text: string) =>
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? text : o)) } : q,
      ),
    );

  const addOption = (qi: number) =>
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, options: [...q.options, ""] } : q)),
    );

  const removeOption = (qi: number, oi: number) =>
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi || q.options.length <= 2) return q;
        const options = q.options.filter((_, j) => j !== oi);
        // La risposta corretta segue lo spostamento degli indici: se tolgo un'opzione prima di
        // quella corretta, scala di uno; se tolgo proprio quella corretta, ricado sulla prima.
        let correctIndex = q.correctIndex;
        if (oi === q.correctIndex) correctIndex = 0;
        else if (oi < q.correctIndex) correctIndex = q.correctIndex - 1;
        return { ...q, options, correctIndex };
      }),
    );

  return (
    <div className="flex flex-col gap-6">
      {questions.map((question, qi) => (
        <fieldset
          key={qi}
          className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper p-4 shadow-hard"
        >
          <div className="flex items-center justify-between gap-3">
            <legend className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
              Domanda {qi + 1}
            </legend>
            {questions.length > 1 && (
              <Btn type="button" kind="ghost" small onClick={() => removeQuestion(qi)}>
                Rimuovi domanda
              </Btn>
            )}
          </div>

          <label className="flex flex-col gap-1 font-ui text-sm">
            Testo della domanda
            <input
              type="text"
              value={question.text}
              onChange={(event) => updateQuestion(qi, { text: event.target.value })}
              className={fieldClass}
            />
          </label>

          <div className="flex flex-col gap-2">
            <span className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
              Opzioni (seleziona quella corretta)
            </span>
            {question.options.map((option, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${qi}`}
                  checked={question.correctIndex === oi}
                  onChange={() => updateQuestion(qi, { correctIndex: oi })}
                  aria-label={`Opzione ${oi + 1} corretta`}
                />
                <input
                  type="text"
                  value={option}
                  onChange={(event) => setOptionText(qi, oi, event.target.value)}
                  placeholder={`Opzione ${oi + 1}`}
                  className={`${fieldClass} flex-1`}
                />
                {question.options.length > 2 && (
                  <Btn type="button" kind="ghost" small onClick={() => removeOption(qi, oi)}>
                    &times;
                  </Btn>
                )}
              </div>
            ))}
            <Btn
              type="button"
              kind="secondary"
              small
              className="self-start"
              onClick={() => addOption(qi)}
            >
              Aggiungi opzione
            </Btn>
          </div>
        </fieldset>
      ))}

      <Btn type="button" kind="secondary" className="self-start" onClick={addQuestion}>
        Aggiungi domanda
      </Btn>

      <input type="hidden" name="payload" value={JSON.stringify(questions)} readOnly />
    </div>
  );
}
