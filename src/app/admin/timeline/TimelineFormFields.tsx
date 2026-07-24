// Campi condivisi dal form di creazione e modifica di una voce timeline. Presentazionale.

export type TimelineFormDefaults = {
  when: string;
  title: string;
  text: string;
  kind: "CITTA" | "ASSOCIAZIONE";
  order: number;
};

const EMPTY: TimelineFormDefaults = {
  when: "",
  title: "",
  text: "",
  kind: "CITTA",
  order: 0,
};

export function TimelineFormFields({ defaults = EMPTY }: { defaults?: TimelineFormDefaults }) {
  return (
    <>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Periodo
        <input
          name="when"
          type="text"
          required
          defaultValue={defaults.when}
          placeholder="es. Anni &#39;50, Marzo 2026"
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Titolo
        <input
          name="title"
          type="text"
          required
          defaultValue={defaults.title}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Testo
        <textarea
          name="text"
          required
          rows={3}
          defaultValue={defaults.text}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Tipo di voce
        <select
          name="kind"
          required
          defaultValue={defaults.kind}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        >
          <option value="CITTA">Storia della città</option>
          <option value="ASSOCIAZIONE">Tappa di CivitaNext</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Posizione nella timeline (numero: più basso = più in alto, vuoto = 0)
        <input
          name="order"
          type="number"
          step="1"
          defaultValue={defaults.order}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
    </>
  );
}
