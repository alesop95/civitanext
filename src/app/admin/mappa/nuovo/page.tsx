import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { MapPointPickerLoader as MapPointPicker } from "@/components/MapPointPickerLoader";
import { createMapPoint } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Servono titolo, tipo, luogo e coordinate valide (latitudine tra -90 e 90, longitudine tra -180 e 180).",
  "2": "Titolo, tipo e luogo fino a 200 caratteri.",
};

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

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      {/* Tutti i campi vivono nel picker (client): il clic sulla mappa deve poterli compilare.
          Il form e la server action restano qui, lato server. */}
      <form action={createMapPoint} className="flex flex-col gap-4">
        <MapPointPicker />
        <Btn type="submit" kind="primary" className="self-start">
          Pubblica punto
        </Btn>
      </form>
    </main>
  );
}
