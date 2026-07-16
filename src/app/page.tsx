import Link from "next/link";
import { Starburst } from "@/components/ui/Starburst";
import { Waves } from "@/components/ui/Waves";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { SiteHeader } from "@/components/SiteHeader";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { VoteTargetType } from "@/generated/prisma/client";
import { votePoll } from "@/app/sondaggi/actions";

// Vetrina del design system di Fase 0: nessuna feature reale, solo il
// vocabolario visivo (token, grafiche, componenti base) riportato dal
// prototipo di design_handoff_civitanext/ nel codice reale dell'app.
export default async function Home() {
  const session = await auth();
  const prisma = getPrisma();

  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: { options: true },
  });
  const allOptionIds = polls.flatMap((poll) => poll.options.map((option) => option.id));
  const votes = allOptionIds.length
    ? await prisma.vote.findMany({
        where: { targetType: VoteTargetType.POLL, targetId: { in: allOptionIds } },
      })
    : [];
  const voteCountByOption = new Map<string, number>();
  const votedOptionByMe = new Map<string, string>();
  for (const vote of votes) {
    voteCountByOption.set(vote.targetId, (voteCountByOption.get(vote.targetId) ?? 0) + 1);
  }
  for (const poll of polls) {
    const myVote = votes.find(
      (vote) => vote.userId === session?.user?.id && poll.options.some((o) => o.id === vote.targetId),
    );
    if (myVote) votedOptionByMe.set(poll.id, myVote.targetId);
  }

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/" />

      <section className="relative flex flex-col items-start gap-6 overflow-hidden rounded-cn border-2 border-ink bg-paper-card p-10 shadow-hard">
        <Starburst
          size={160}
          className="pointer-events-none absolute -right-8 -top-10 opacity-90"
        />
        <p className="font-ui text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
          Fase 0 &middot; fondamenta
        </p>
        <h1 className="max-w-xl font-display text-4xl font-black leading-tight sm:text-5xl">
          Il vocabolario visivo di CivitaNext, ricostruito in Next.js
        </h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Colori, tipografia, bordi netti e ombre dure portati dal prototipo di design
          nel codice reale dell&apos;applicazione. Nessuna feature ancora collegata al
          database: questa pagina mostra solo i mattoni riusabili.
        </p>
        <div className="flex gap-3">
          <Btn kind="primary">Scopri gli eventi</Btn>
          <Btn kind="secondary">Entra nel forum</Btn>
        </div>
      </section>

      {polls.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
            Sondaggi rapidi
          </h2>
          {polls.map((poll) => {
            const totalVotes = poll.options.reduce(
              (sum, option) => sum + (voteCountByOption.get(option.id) ?? 0),
              0,
            );
            const myOptionId = votedOptionByMe.get(poll.id);

            return (
              <div
                key={poll.id}
                className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard"
              >
                <p className="font-display text-xl font-black">{poll.question}</p>
                {poll.options.map((option) => {
                  const count = voteCountByOption.get(option.id) ?? 0;
                  const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                  const isMine = myOptionId === option.id;
                  const barStyle = {
                    background: isMine
                      ? "var(--accent)"
                      : `linear-gradient(to right, var(--paper) ${percentage}%, var(--paper-card) ${percentage}%)`,
                    color: isMine ? "white" : "var(--ink)",
                  };

                  return session?.user ? (
                    <form key={option.id} action={votePoll.bind(null, poll.id, option.id)}>
                      <button
                        type="submit"
                        className="flex w-full items-center justify-between gap-3 rounded-cn border-2 border-ink px-3 py-2 text-left font-ui text-sm"
                        style={barStyle}
                      >
                        <span>{option.text}</span>
                        <span className="font-bold">{percentage}%</span>
                      </button>
                    </form>
                  ) : (
                    <div
                      key={option.id}
                      className="flex w-full items-center justify-between gap-3 rounded-cn border-2 border-ink px-3 py-2 font-ui text-sm"
                      style={barStyle}
                    >
                      <span>{option.text}</span>
                      <span className="font-bold">{percentage}%</span>
                    </div>
                  );
                })}
                <p className="font-ui text-xs text-ink-soft">
                  {totalVotes} {totalVotes === 1 ? "voto" : "voti"}
                </p>
                {!session?.user && (
                  <Link
                    href="/accedi"
                    className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
                  >
                    Accedi per votare
                  </Link>
                )}
              </div>
            );
          })}
        </section>
      )}

      <section className="flex flex-wrap items-center gap-6 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard">
        <Avatar name="Maria Rossi" />
        <Avatar name="Luca Bianchi" />
        <Avatar name="Sara Verdi" />
        <Tag color="var(--accent)">Ambiente</Tag>
        <Tag color="var(--ink)">Cultura</Tag>
        <Waves width={160} />
      </section>
    </main>
  );
}
