// Campi condivisi dal form di creazione e di modifica evento. Presentazionale (Server Component),
// riceve i valori di default: vuoti per il nuovo, quelli dell'evento per la modifica. E' il primo
// pattern di form riusato tra "nuovo" e "modifica" del progetto, replicabile per gli altri
// contenuti quando guadagneranno la modifica.

export type EventFormDefaults = {
  title: string;
  description: string;
  // Formato datetime-local "YYYY-MM-DDTHH:mm".
  date: string;
  location: string;
  category: string;
};

const EMPTY: EventFormDefaults = {
  title: "",
  description: "",
  date: "",
  location: "",
  category: "",
};

export function EventFormFields({ defaults = EMPTY }: { defaults?: EventFormDefaults }) {
  return (
    <>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Titolo
        <input
          name="title"
          type="text"
          required
          defaultValue={defaults.title}
          placeholder="es. Assemblea aperta"
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Descrizione
        <textarea
          name="description"
          required
          rows={4}
          defaultValue={defaults.description}
          placeholder="Di cosa si tratta, cosa portare, come partecipare."
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Data e ora
        <input
          name="date"
          type="datetime-local"
          required
          defaultValue={defaults.date}
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Luogo
        <input
          name="location"
          type="text"
          required
          defaultValue={defaults.location}
          placeholder="es. Aula consiliare, Civitanova Marche"
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 font-ui text-sm">
        Categoria
        <input
          name="category"
          type="text"
          required
          defaultValue={defaults.category}
          placeholder="es. Incontri, Volontariato, Cultura"
          className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
        />
      </label>
    </>
  );
}
