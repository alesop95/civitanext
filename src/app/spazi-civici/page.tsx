import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Tag } from "@/components/ui/Tag";
import { btnClassName } from "@/components/ui/Btn";

export default async function SpaziCiviciPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const prisma = getPrisma();

  const spaces = await prisma.civicSpace.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/spazi-civici" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Spazi civici
        </h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          I luoghi dell&apos;associazione e della città aperti ai soci: biblioteche, centri
          civici, parchi.
        </p>
        {isAdmin && (
          <Link
            href="/admin/spazi-civici/nuovo"
            className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
          >
            Nuovo spazio civico
          </Link>
        )}
      </header>

      {spaces.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessuno spazio civico pubblicato ancora.</p>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {spaces.map((space) => (
            <article
              key={space.id}
              className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard"
            >
              <Tag color="var(--ink)">{space.type}</Tag>
              <h2 className="font-display text-2xl font-black">{space.name}</h2>
              <p className="font-ui text-sm font-bold text-ink-soft">{space.hours}</p>
              <p className="font-ui text-sm text-ink-soft">{space.note}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
