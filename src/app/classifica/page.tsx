import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { getLeaderboard } from "@/lib/reputation";

export default async function ClassificaPage() {
  const session = await auth();
  const rows = await getLeaderboard(50);

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/classifica" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">Classifica</h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          I soci più attivi della community, per punti guadagnati partecipando alla vita
          dell&apos;associazione.
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessun socio in classifica ancora.</p>
      ) : (
        <section className="flex flex-col gap-3">
          {rows.map((row, i) => {
            const isMe = row.userId === session?.user?.id;
            return (
              <article
                key={row.userId}
                className={
                  isMe
                    ? "flex items-center gap-4 rounded-cn border-2 border-ink bg-accent p-4 text-white shadow-hard"
                    : "flex items-center gap-4 rounded-cn border-2 border-ink bg-paper-card p-4 shadow-hard"
                }
              >
                <span className="w-10 text-center font-display text-2xl font-black">{i + 1}</span>
                <div className="flex flex-1 flex-col">
                  <span className="font-display text-lg font-black">{row.name}</span>
                  <span
                    className={
                      isMe ? "font-ui text-xs opacity-80" : "font-ui text-xs text-ink-soft"
                    }
                  >
                    {row.level} &middot; {row.quizCount} quiz
                  </span>
                </div>
                <span className="font-display text-xl font-black">{row.points}</span>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
