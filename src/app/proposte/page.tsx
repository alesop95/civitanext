import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { Tag } from "@/components/ui/Tag";
import { VoteTargetType } from "@/generated/prisma/client";
import { toggleVote } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  VOTAZIONE: "In votazione",
  APPROVATA: "Approvata",
};

export default async function PropostePage() {
  const session = await auth();
  const prisma = getPrisma();

  // REVISIONE resta fuori dall'elenco pubblico: e' in attesa di controllo admin, non ancora
  // una proposta su cui la comunita' puo' esprimersi (vedi coda in /admin/proposte).
  const proposals = await prisma.proposal.findMany({
    where: { status: { in: ["VOTAZIONE", "APPROVATA"] } },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  // Vote e' polimorfico (nessuna relazione diretta con Proposal, vedi refactor-04): il conteggio
  // e lo stato "ho già votato" si calcolano qui, non con un include Prisma.
  const votes = await prisma.vote.findMany({
    where: {
      targetType: VoteTargetType.PROPOSAL,
      targetId: { in: proposals.map((p) => p.id) },
    },
  });
  const voteCounts = new Map<string, number>();
  const votedByMe = new Set<string>();
  for (const vote of votes) {
    voteCounts.set(vote.targetId, (voteCounts.get(vote.targetId) ?? 0) + 1);
    if (vote.userId === session?.user?.id) votedByMe.add(vote.targetId);
  }

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/proposte" />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
            Proposte
          </h1>
          <p className="max-w-lg font-ui text-base text-ink-soft">
            Proposte in votazione e già approvate. Una proposta nuova passa prima da una
            revisione dell&apos;associazione.
          </p>
        </div>
        {session?.user ? (
          <Link href="/proposte/nuova" className={btnClassName({ kind: "primary" })}>
            Nuova proposta
          </Link>
        ) : (
          <Link href="/accedi" className={btnClassName({ kind: "secondary" })}>
            Accedi per proporre
          </Link>
        )}
      </header>

      {proposals.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">
          Nessuna proposta in votazione al momento.
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {proposals.map((proposal) => {
            const count = voteCounts.get(proposal.id) ?? 0;
            const hasVoted = votedByMe.has(proposal.id);

            return (
              <article
                key={proposal.id}
                className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Tag color="var(--accent)">{proposal.category}</Tag>
                  <Tag color="var(--ink)">{STATUS_LABELS[proposal.status] ?? proposal.status}</Tag>
                </div>
                <h2 className="font-display text-xl font-black">{proposal.title}</h2>
                <p className="font-ui text-sm text-ink-soft">{proposal.description}</p>
                <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                  {proposal.author.name} &middot; {count} {count === 1 ? "voto" : "voti"}
                </p>

                {proposal.status === "VOTAZIONE" &&
                  (session?.user ? (
                    <form action={toggleVote.bind(null, proposal.id)}>
                      <Btn type="submit" kind={hasVoted ? "secondary" : "primary"}>
                        {hasVoted ? "Ritira il voto" : "Vota"}
                      </Btn>
                    </form>
                  ) : (
                    <Link href="/accedi" className={btnClassName({ kind: "secondary" })}>
                      Accedi per votare
                    </Link>
                  ))}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
