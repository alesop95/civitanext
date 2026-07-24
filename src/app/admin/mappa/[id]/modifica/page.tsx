import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { MapPointPickerLoader as MapPointPicker } from "@/components/MapPointPickerLoader";
import { getPrisma } from "@/lib/prisma";
import { updateMapPoint } from "../../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Servono titolo, tipo, luogo e coordinate valide (latitudine tra -90 e 90, longitudine tra -180 e 180).",
  "2": "Titolo, tipo e luogo fino a 200 caratteri.",
};

export default async function ModificaPuntoMappaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const { id } = await params;
  const { error } = await searchParams;

  const point = await getPrisma().mapPoint.findUnique({ where: { id } });
  if (!point) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/mappa" />

      <div className="flex flex-col gap-4">
        <Link
          href="/mappa"
          className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
        >
          Torna alla mappa
        </Link>
        <h1 className="font-display text-3xl font-black">Modifica punto sulla mappa</h1>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={updateMapPoint} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={point.id} />
        <MapPointPicker
          defaults={{
            title: point.title,
            type: point.type,
            place: point.place,
            lat: String(point.lat),
            lng: String(point.lng),
          }}
        />
        <Btn type="submit" kind="primary" className="self-start">
          Salva modifiche
        </Btn>
      </form>
    </main>
  );
}
