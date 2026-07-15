import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { Tag } from "@/components/ui/Tag";
import { toggleRsvp } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function EventiPage() {
  const session = await auth();
  const prisma = getPrisma();

  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    include: { rsvps: true },
  });

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/eventi" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Eventi
        </h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Gli appuntamenti dell&apos;associazione a Civitanova Marche.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {events.map((event) => {
          const attendeesCount = event.rsvps.length;
          const isAttending = event.rsvps.some((rsvp) => rsvp.userId === session?.user?.id);

          return (
            <article
              key={event.id}
              className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard"
            >
              <Tag color="var(--accent)">{event.category}</Tag>
              <h2 className="font-display text-2xl font-black">{event.title}</h2>
              <p className="font-ui text-sm font-bold text-ink-soft">
                {dateFormatter.format(event.date)} &middot; {event.location}
              </p>
              <p className="font-ui text-sm text-ink-soft">{event.description}</p>
              <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                {attendeesCount} {attendeesCount === 1 ? "partecipante" : "partecipanti"}
              </p>

              {session?.user ? (
                <form action={toggleRsvp.bind(null, event.id)}>
                  <Btn type="submit" kind={isAttending ? "secondary" : "primary"}>
                    {isAttending ? "Annulla partecipazione" : "Partecipo"}
                  </Btn>
                </form>
              ) : (
                <Link href="/accedi" className={btnClassName({ kind: "secondary" })}>
                  Accedi per partecipare
                </Link>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
