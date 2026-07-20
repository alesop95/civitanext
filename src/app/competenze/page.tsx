import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Tag } from "@/components/ui/Tag";
import { btnClassName } from "@/components/ui/Btn";

export default async function CompetenzePage() {
  const session = await auth();
  const prisma = getPrisma();

  const skills = await prisma.skill.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/competenze" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Competenze
        </h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Soci che mettono a disposizione le proprie competenze, gratis, per i progetti civici.
        </p>
        {session?.user ? (
          <Link
            href="/competenze/nuova"
            className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
          >
            Offri una competenza
          </Link>
        ) : (
          <p className="font-ui text-sm text-ink-soft">
            <Link href="/accedi?callbackUrl=%2Fcompetenze" className="font-bold underline">
              Accedi
            </Link>{" "}
            per offrire una competenza.
          </p>
        )}
      </header>

      {skills.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessuna competenza offerta ancora.</p>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {skills.map((skill) => (
            <article
              key={skill.id}
              className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard"
            >
              <Tag color="var(--ink)">{skill.name}</Tag>
              <h2 className="font-display text-2xl font-black">{skill.user.name}</h2>
              <p className="font-ui text-sm text-ink-soft">{skill.offer}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
