"use client";

import { useState } from "react";
import { btnClassName } from "@/components/ui/Btn";

// Campo di selezione file con un controllo chiaro al posto della resa nativa del browser (un
// bottone anonimo "Scegli file" seguito da "Nessun file selezionato", che non comunica di essere
// cliccabile). Qui il bottone e' vistoso e vive dentro la <label>, quindi cliccarlo apre il
// selettore; il testo accanto parte da "Nessun file selezionato" e diventa il nome del file (o
// l'elenco dei nomi, per il multiplo) appena si sceglie. L'input vero resta nel form (stesso
// name), solo nascosto alla vista ma non all'accessibilita' (sr-only, non display:none).
export function FileField({
  name,
  label,
  accept,
  multiple = false,
  required = false,
  buttonLabel = "Scegli file",
}: {
  name: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  buttonLabel?: string;
}) {
  const [fileNames, setFileNames] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-1 font-ui text-sm">
      <span>{label}</span>
      <label className="flex flex-wrap items-center gap-3">
        <span className={btnClassName({ kind: "secondary", small: true })}>{buttonLabel}</span>
        <span className="text-ink-soft">
          {fileNames.length > 0 ? fileNames.join(", ") : "Nessun file selezionato"}
        </span>
        <input
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          required={required}
          className="sr-only"
          onChange={(event) =>
            setFileNames(Array.from(event.target.files ?? []).map((file) => file.name))
          }
        />
      </label>
    </div>
  );
}
