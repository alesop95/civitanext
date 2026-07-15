import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { btnClassName } from "@/components/ui/Btn";
import { Tag } from "@/components/ui/Tag";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ForumPage() {
  const session = await auth();
  const prisma = getPrisma();

  const threads = await prisma.thread.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      _count: { select: { replies: true } },
    },
  });

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/forum" />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">Forum</h1>
          <p className="max-w-lg font-ui text-base text-ink-soft">
            Discussioni aperte tra soci e utenti della piattaforma.
          </p>
        </div>
        {session?.user ? (
          <Link href="/forum/nuovo" className={btnClassName({ kind: "primary" })}>
            Nuovo thread
          </Link>
        ) : (
          <Link href="/accedi" className={btnClassName({ kind: "secondary" })}>
            Accedi per scrivere
          </Link>
        )}
      </header>

      {threads.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">
          Nessun thread ancora. Sii il primo ad aprirne uno.
        </p>
      ) : (
        <section className="flex flex-col gap-4">
          {threads.map((thread) => (
            <Link
              key={thread.id}
              href={`/forum/${thread.id}`}
              className="flex flex-col gap-2 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard transition-transform hover:-translate-y-0.5"
            >
              <Tag color="var(--accent)">{thread.category}</Tag>
              <h2 className="font-display text-xl font-black">{thread.title}</h2>
              <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                {thread.author.name} &middot; {dateFormatter.format(thread.createdAt)} &middot;{" "}
                {thread._count.replies}{" "}
                {thread._count.replies === 1 ? "risposta" : "risposte"}
              </p>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
