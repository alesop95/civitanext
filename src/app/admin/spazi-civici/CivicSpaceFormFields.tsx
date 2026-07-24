import { OrariField } from "@/components/OrariField";

// Campi condivisi dal form di creazione e modifica di uno spazio civico. Server Component che
// include OrariField (client) per il campo orari: gli passa il valore esistente come defaultValue.

export type CivicSpaceFormDefaults = {
  name: string;
  type: string;
  hours: string;
  note: string;
};

const EMPTY: CivicSpaceFormDefaults = { name: "", type: "", hours: "", note: "" };

export function CivicSpaceFormFields({ defaults = EMPTY }: { defaults?: CivicSpaceFormDefaults }) {
  return (
    <>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Nome
        <input
          name="name"
          type="text"
          required
          defaultValue={defaults.name}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Tipo
        <input
          name="type"
          type="text"
          required
          defaultValue={defaults.type}
          placeholder="es. Biblioteca, Centro civico, Parco"
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <OrariField defaultValue={defaults.hours} />
      <label className="flex flex-col gap-1 font-ui text-sm">
        Note
        <textarea
          name="note"
          required
          rows={3}
          defaultValue={defaults.note}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
    </>
  );
}
