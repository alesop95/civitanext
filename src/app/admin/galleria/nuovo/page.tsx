import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { createAlbum } from "../actions";

export default async function NuovoAlbumPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
  const { error } = await searchParams;

  const events = await getPrisma().event.findMany({
    orderBy: { date: "desc" },
    select: { id: true, title: true },
  });

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/galleria" />

      <h1 className="font-display text-3xl font-black">Nuovo album</h1>

      {error && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          Il titolo è obbligatorio.
        </p>
      )}

      <form action={createAlbum} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-ui text-sm">
          Titolo
          <input
            name="title"
            type="text"
            required
            placeholder="es. Pulizia spiaggia"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Evento collegato (facoltativo)
          <select
            name="eventId"
            defaultValue=""
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          >
            <option value="">Nessun evento</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          Crea album
        </Btn>
      </form>
    </main>
  );
}
