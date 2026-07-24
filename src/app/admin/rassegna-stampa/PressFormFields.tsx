// Campi condivisi dal form di creazione e modifica di un articolo di rassegna stampa.

export type PressFormDefaults = {
  source: string;
  title: string;
  url: string;
  // Formato input date "YYYY-MM-DD".
  publishedAt: string;
};

const EMPTY: PressFormDefaults = {
  source: "",
  title: "",
  url: "",
  publishedAt: "",
};

export function PressFormFields({ defaults = EMPTY }: { defaults?: PressFormDefaults }) {
  return (
    <>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Testata
        <input
          name="source"
          type="text"
          required
          defaultValue={defaults.source}
          placeholder="es. Cronache Maceratesi"
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Titolo dell&apos;articolo
        <input
          name="title"
          type="text"
          required
          defaultValue={defaults.title}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Data di pubblicazione
        <input
          name="publishedAt"
          type="date"
          required
          defaultValue={defaults.publishedAt}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Link all&apos;articolo (facoltativo, solo se online)
        <input
          name="url"
          type="url"
          defaultValue={defaults.url}
          placeholder="https://..."
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
    </>
  );
}
