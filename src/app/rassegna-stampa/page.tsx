import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { deletePressArticle } from "@/app/admin/rassegna-stampa/actions";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function RassegnaStampaPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const prisma = getPrisma();

  const articles = await prisma.pressArticle.findMany({ orderBy: { publishedAt: "desc" } });

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/rassegna-stampa" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Rassegna stampa
        </h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Cosa scrivono i giornali di CivitaNext e delle iniziative dei soci.
        </p>
        {isAdmin && (
          <Link
            href="/admin/rassegna-stampa/nuovo"
            className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
          >
            Nuovo articolo
          </Link>
        )}
      </header>

      {articles.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessun articolo pubblicato ancora.</p>
      ) : (
        <section className="flex max-w-2xl flex-col gap-6">
          {articles.map((article) => (
            <article
              key={article.id}
              className="flex flex-col gap-2 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard"
            >
              <p className="font-ui text-sm text-ink-soft">
                <span className="font-bold text-ink">{article.source}</span>
                {" · "}
                {dateFormatter.format(article.publishedAt)}
              </p>
              <h2 className="font-display text-2xl font-black">{article.title}</h2>
              {article.url && (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnClassName({ kind: "ghost", small: true, className: "self-start" })}
                >
                  Leggi l&apos;articolo
                </a>
              )}
              {isAdmin && (
                <div className="flex gap-3">
                  <Link
                    href={`/admin/rassegna-stampa/${article.id}/modifica`}
                    className={btnClassName({ kind: "secondary", small: true })}
                  >
                    Modifica
                  </Link>
                  <form action={deletePressArticle.bind(null, article.id)}>
                    <Btn type="submit" kind="ghost" small>
                      Elimina
                    </Btn>
                  </form>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
