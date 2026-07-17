import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { createTimelineEntry } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Periodo, titolo, testo e tipo di voce sono obbligatori.",
  "2": "La posizione, se indicata, deve essere un numero intero.",
};

export default async function NuovaVoceTimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/timeline" />

      <h1 className="font-display text-3xl font-black">Nuova voce della timeline</h1>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={createTimelineEntry} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-ui text-sm">
          Periodo
          <input
            name="when"
            type="text"
            required
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
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Testo
          <textarea
            name="text"
            required
            rows={3}
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Tipo di voce
          <select
            name="kind"
            required
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
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          Pubblica voce
        </Btn>
      </form>
    </main>
  );
}
