"use client";

import { useState } from "react";
import { Btn } from "@/components/ui/Btn";

// Editor della checklist di attuazione di una proposta. Tiene l'elenco dei passi (etichetta +
// spunta "fatto"), con aggiunta/rimozione e riordino implicito dall'ordine dell'array, e lo
// serializza in un campo nascosto `steps` JSON validato lato server da parseImplementationSteps.
// La nota vive fuori, come textarea normale del form.

export type EditorStep = { label: string; done: boolean };

const fieldClass = "rounded-cn border-2 border-ink bg-paper-card px-3 py-2 font-ui text-sm";

export function ImplementationEditor({ defaults = [] }: { defaults?: EditorStep[] }) {
  const [steps, setSteps] = useState<EditorStep[]>(defaults);

  const addStep = () => setSteps((prev) => [...prev, { label: "", done: false }]);
  const removeStep = (index: number) => setSteps((prev) => prev.filter((_, i) => i !== index));
  const setLabel = (index: number, label: string) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, label } : s)));
  const toggleDone = (index: number) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, done: !s.done } : s)));

  return (
    <div className="flex flex-col gap-3">
      {steps.length === 0 && (
        <p className="font-ui text-sm text-ink-soft">
          Nessun passo. Aggiungine uno per iniziare a tracciare l&apos;avanzamento.
        </p>
      )}
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={step.done}
            onChange={() => toggleDone(index)}
            aria-label={`Passo ${index + 1} completato`}
          />
          <input
            type="text"
            value={step.label}
            onChange={(event) => setLabel(index, event.target.value)}
            placeholder={`Passo ${index + 1} (es. Presentata in Comune)`}
            className={`${fieldClass} flex-1`}
          />
          <Btn type="button" kind="ghost" small onClick={() => removeStep(index)}>
            &times;
          </Btn>
        </div>
      ))}
      <Btn type="button" kind="secondary" small className="self-start" onClick={addStep}>
        Aggiungi passo
      </Btn>
      <input type="hidden" name="steps" value={JSON.stringify(steps)} readOnly />
    </div>
  );
}
