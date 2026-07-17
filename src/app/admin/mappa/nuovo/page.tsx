import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { createMapPoint } from "../actions";

export default async function NuovoPuntoMappaPage({
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
      <SiteHeader activeHref="/mappa" />

      <h1 className="font-display text-3xl font-black">Nuovo punto sulla mappa</h1>

      {error && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          Servono titolo, tipo, luogo e coordinate valide (latitudine tra -90 e 90, longitudine
          tra -180 e 180).
        </p>
      )}

      <form action={createMapPoint} className="flex flex-col gap-4">
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
          Tipo
          <input
            name="type"
            type="text"
            required
            placeholder="es. Evento, Proposta, Punto di interesse"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Luogo
          <input
            name="place"
            type="text"
            required
            placeholder="es. Piazza XX Settembre"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1 font-ui text-sm">
            Latitudine
            <input
              name="lat"
              type="number"
              step="any"
              required
              placeholder="43.3095"
              className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 font-ui text-sm">
            Longitudine
            <input
              name="lng"
              type="number"
              step="any"
              required
              placeholder="13.7278"
              className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
            />
          </label>
        </div>
        <p className="font-ui text-xs text-ink-soft">
          Per trovare le coordinate di un indirizzo: cercalo su{" "}
          <a
            href="https://www.openstreetmap.org/search?query=Civitanova%20Marche"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            openstreetmap.org
          </a>
          , clic destro sul punto esatto e "Mostra indirizzo" mostra lat/long da copiare qui.
        </p>
        <Btn type="submit" kind="primary" className="self-start">
          Pubblica punto
        </Btn>
      </form>
    </main>
  );
}
