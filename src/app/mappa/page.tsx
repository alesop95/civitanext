import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { CivicMapLoader } from "@/components/CivicMapLoader";
import { deleteMapPoint } from "@/app/admin/mappa/actions";

export default async function MappaPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const prisma = getPrisma();

  const points = await prisma.mapPoint.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/mappa" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Mappa della città
        </h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Eventi, proposte e punti di interesse dell&apos;associazione su una mappa reale di
          Civitanova Marche.
        </p>
        {isAdmin && (
          <Link
            href="/admin/mappa/nuovo"
            className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
          >
            Nuovo punto
          </Link>
        )}
      </header>

      <CivicMapLoader points={points} />

      {points.length === 0 && (
        <p className="font-ui text-sm text-ink-soft">Nessun punto pubblicato ancora.</p>
      )}

      {isAdmin && points.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
            Gestione punti
          </h2>
          {points.map((point) => (
            <article
              key={point.id}
              className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-4 shadow-hard sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-lg font-black">{point.title}</h3>
                <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                  {point.type} &middot; {point.place}
                </p>
              </div>
              <div className="flex gap-3 sm:shrink-0">
                <Link
                  href={`/admin/mappa/${point.id}/modifica`}
                  className={btnClassName({ kind: "secondary", small: true })}
                >
                  Modifica
                </Link>
                <form action={deleteMapPoint.bind(null, point.id)}>
                  <Btn type="submit" kind="ghost" small>
                    Elimina
                  </Btn>
                </form>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
