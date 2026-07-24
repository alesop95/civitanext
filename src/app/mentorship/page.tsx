import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Tag } from "@/components/ui/Tag";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { Avatar } from "@/components/ui/Avatar";
import { requestMentor } from "./actions";
import { deleteMentor } from "@/app/admin/mentorship/actions";

export default async function MentorshipPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const prisma = getPrisma();

  const mentors = await prisma.mentor.findMany({
    orderBy: { createdAt: "asc" },
    include: { requests: true },
  });

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/mentorship" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">Mentorship</h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Soci esperti che offrono un&apos;ora del loro tempo a chi è alle prime armi.
        </p>
        {isAdmin && (
          <Link
            href="/admin/mentorship/nuovo"
            className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
          >
            Nuovo mentor
          </Link>
        )}
      </header>

      {mentors.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessun mentor disponibile ancora.</p>
      ) : (
        <section className="flex flex-col gap-6">
          {mentors.map((mentor) => {
            const requestCount = mentor.requests.length;
            const hasRequested = mentor.requests.some((r) => r.userId === session?.user?.id);
            return (
              <article
                key={mentor.id}
                className="flex flex-col gap-4 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard sm:flex-row sm:items-start"
              >
                <Avatar name={mentor.name} />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-2xl font-black">{mentor.name}</h2>
                    <Tag color="var(--ink)">{mentor.area}</Tag>
                  </div>
                  <p className="font-ui text-sm text-ink-soft">{mentor.description}</p>
                  <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                    {mentor.slots} {mentor.slots === 1 ? "posto disponibile" : "posti disponibili"}{" "}
                    questo mese
                  </p>
                  {isAdmin && (
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-ui text-xs text-ink-soft">
                        {requestCount} {requestCount === 1 ? "richiesta" : "richieste"} di incontro
                      </p>
                      <form action={deleteMentor.bind(null, mentor.id)}>
                        <Btn type="submit" kind="ghost" small>
                          Elimina
                        </Btn>
                      </form>
                    </div>
                  )}
                </div>
                <div className="sm:self-center">
                  {session?.user ? (
                    hasRequested ? (
                      <span className={btnClassName({ kind: "secondary" })}>Richiesta inviata</span>
                    ) : (
                      <form action={requestMentor.bind(null, mentor.id)}>
                        <Btn type="submit" kind="primary">
                          Chiedi un incontro
                        </Btn>
                      </form>
                    )
                  ) : (
                    <Link
                      href="/accedi?callbackUrl=%2Fmentorship"
                      className={btnClassName({ kind: "secondary" })}
                    >
                      Accedi per chiedere
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
