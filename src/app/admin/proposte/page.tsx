import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { Tag } from "@/components/ui/Tag";
import { VoteTargetType } from "@/generated/prisma/client";
import { approveForVoting, closeVoting, rejectProposal } from "./actions";

export default async function AdminPropostePage() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const prisma = getPrisma();

  const [inRevisione, inVotazione] = await Promise.all([
    prisma.proposal.findMany({
      where: { status: "REVISIONE" },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { name: true } } },
    }),
    prisma.proposal.findMany({
      where: { status: "VOTAZIONE" },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { name: true } } },
    }),
  ]);

  const votes = await prisma.vote.findMany({
    where: {
      targetType: VoteTargetType.PROPOSAL,
      targetId: { in: inVotazione.map((p) => p.id) },
    },
  });
  const voteCounts = new Map<string, number>();
  for (const vote of votes) {
    voteCounts.set(vote.targetId, (voteCounts.get(vote.targetId) ?? 0) + 1);
  }

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/admin/proposte" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Coda di approvazione proposte
        </h1>
        <Link href="/admin/sondaggi/nuovo" className={btnClassName({ kind: "secondary" })}>
          Nuovo sondaggio
        </Link>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
          In revisione ({inRevisione.length})
        </h2>
        {inRevisione.length === 0 ? (
          <p className="font-ui text-sm text-ink-soft">Nessuna proposta da revisionare.</p>
        ) : (
          inRevisione.map((proposal) => (
            <article
              key={proposal.id}
              className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard"
            >
              <Tag color="var(--accent)">{proposal.category}</Tag>
              <h3 className="font-display text-xl font-black">{proposal.title}</h3>
              <p className="font-ui text-sm text-ink-soft">{proposal.description}</p>
              <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                {proposal.author.name}
              </p>
              <div className="flex gap-3">
                <form action={approveForVoting.bind(null, proposal.id)}>
                  <Btn type="submit" kind="primary">
                    Approva per il voto
                  </Btn>
                </form>
                <form action={rejectProposal.bind(null, proposal.id)}>
                  <Btn type="submit" kind="ghost">
                    Rifiuta
                  </Btn>
                </form>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
          In votazione ({inVotazione.length})
        </h2>
        {inVotazione.length === 0 ? (
          <p className="font-ui text-sm text-ink-soft">Nessuna proposta in votazione.</p>
        ) : (
          inVotazione.map((proposal) => (
            <article
              key={proposal.id}
              className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard"
            >
              <Tag color="var(--accent)">{proposal.category}</Tag>
              <h3 className="font-display text-xl font-black">{proposal.title}</h3>
              <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                {proposal.author.name} &middot; {voteCounts.get(proposal.id) ?? 0} voti
              </p>
              <form action={closeVoting.bind(null, proposal.id)}>
                <Btn type="submit" kind="primary" className="self-start">
                  Segna come approvata
                </Btn>
              </form>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
