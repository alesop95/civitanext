import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Tag } from "@/components/ui/Tag";
import { btnClassName } from "@/components/ui/Btn";

export default async function TimelinePage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const prisma = getPrisma();

  // L'ordine cronologico e' il campo esplicito order, non when (testo libero, vedi schema);
  // createdAt spareggia le voci a pari order in modo stabile.
  const entries = await prisma.timelineEntry.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/timeline" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          La storia, tappa per tappa
        </h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          La città di Civitanova Marche e il percorso di CivitaNext, sulla stessa linea del
          tempo.
        </p>
        {isAdmin && (
          <Link
            href="/admin/timeline/nuovo"
            className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
          >
            Nuova voce
          </Link>
        )}
      </header>

      {entries.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessuna voce pubblicata ancora.</p>
      ) : (
        <ol className="flex max-w-2xl flex-col gap-8 border-l-2 border-ink pl-6">
          {entries.map((entry) => (
            <li key={entry.id} className="relative flex flex-col gap-2">
              <span
                aria-hidden
                className={`absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-ink ${
                  entry.kind === "ASSOCIAZIONE" ? "bg-accent" : "bg-paper-card"
                }`}
              />
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-ui text-sm font-bold text-ink-soft">{entry.when}</p>
                <Tag color={entry.kind === "ASSOCIAZIONE" ? "var(--accent)" : "var(--ink)"}>
                  {entry.kind === "ASSOCIAZIONE" ? "CivitaNext" : "Città"}
                </Tag>
              </div>
              <h2 className="font-display text-2xl font-black">{entry.title}</h2>
              <p className="font-ui text-sm text-ink-soft">{entry.text}</p>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
