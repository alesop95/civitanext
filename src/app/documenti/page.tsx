import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Tag } from "@/components/ui/Tag";
import { btnClassName } from "@/components/ui/Btn";
import { chipClassName } from "@/components/ui/Chip";
import type { DocumentCategory } from "@/generated/prisma/client";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  STATUTO: "Statuto",
  VERBALI: "Verbali",
  BILANCI: "Bilanci",
};

function isDocumentCategory(value: string): value is DocumentCategory {
  return value in CATEGORY_LABELS;
}

const dateFormatter = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" });

export default async function DocumentiPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const activeCategory = categoria && isDocumentCategory(categoria) ? categoria : undefined;

  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const prisma = getPrisma();

  const documents = await prisma.document.findMany({
    where: activeCategory ? { category: activeCategory } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/documenti" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">Documenti</h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Statuto, verbali e bilanci dell&apos;associazione, sempre consultabili.
        </p>
        {isAdmin && (
          <Link
            href="/admin/documenti/nuovo"
            className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
          >
            Nuovo documento
          </Link>
        )}
      </header>

      <nav className="flex flex-wrap gap-2">
        <Link href="/documenti" className={chipClassName({ active: !activeCategory })}>
          Tutti
        </Link>
        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
          <Link
            key={value}
            href={`/documenti?categoria=${value}`}
            className={chipClassName({ active: activeCategory === value })}
          >
            {label}
          </Link>
        ))}
      </nav>

      {documents.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessun documento pubblicato ancora.</p>
      ) : (
        <section className="flex flex-col gap-4">
          {documents.map((document) => (
            <article
              key={document.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-cn border-2 border-ink bg-paper-card p-4 shadow-hard"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <Tag color="var(--ink)">{CATEGORY_LABELS[document.category]}</Tag>
                  <h2 className="font-display text-lg font-black">{document.title}</h2>
                </div>
                <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                  {dateFormatter.format(document.createdAt)} · PDF ·{" "}
                  {Math.round(document.size / 1024)} KB
                </p>
              </div>
              <a
                href={`${process.env.R2_PUBLIC_BASE_URL}/${document.r2Key}`}
                download
                className={btnClassName({ kind: "ghost", small: true })}
              >
                Scarica
              </a>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
