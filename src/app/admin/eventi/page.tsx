import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { getPrisma } from "@/lib/prisma";
import { deleteEvent } from "./actions";

const DATE_FORMAT = new Intl.DateTimeFormat("it-IT", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminEventiPage() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const prisma = getPrisma();
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    include: { _count: { select: { rsvps: true } } },
  });

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/admin/eventi" />

      <header className="flex flex-col gap-4">
        <Link
          href="/admin"
          className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
        >
          Torna al pannello
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">Eventi</h1>
          <Link href="/admin/eventi/nuovo" className={btnClassName({ kind: "primary" })}>
            Nuovo evento
          </Link>
        </div>
        <p className="font-ui text-base text-ink-soft">
          Crea, modifica ed elimina gli eventi. Eliminare un evento rimuove anche gli RSVP raccolti;
          gli album fotografici collegati restano, scollegati dall&apos;evento.
        </p>
      </header>

      {events.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessun evento. Creane uno con il pulsante sopra.</p>
      ) : (
        <section className="flex flex-col gap-4">
          {events.map((event) => (
            <article
              key={event.id}
              className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-black">{event.title}</h2>
                <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                  {DATE_FORMAT.format(event.date)} &middot; {event.location} &middot; {event.category}
                </p>
                <p className="font-ui text-xs text-ink-soft">
                  {event._count.rsvps} RSVP
                </p>
              </div>
              <div className="flex gap-3 sm:shrink-0">
                <Link
                  href={`/admin/eventi/${event.id}/modifica`}
                  className={btnClassName({ kind: "secondary", small: true })}
                >
                  Modifica
                </Link>
                <form action={deleteEvent.bind(null, event.id)}>
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
