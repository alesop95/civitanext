import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { Tag } from "@/components/ui/Tag";
import { createReply } from "../actions";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const prisma = getPrisma();

  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!thread) notFound();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/forum" />

      <Link href="/forum" className="font-ui text-sm text-ink-soft underline">
        &larr; Torna al forum
      </Link>

      <article className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard">
        <Tag color="var(--accent)">{thread.category}</Tag>
        <h1 className="font-display text-3xl font-black">{thread.title}</h1>
        <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
          {thread.author.name} &middot; {dateFormatter.format(thread.createdAt)}
        </p>
        <p className="font-ui text-base text-ink-soft">{thread.body}</p>
      </article>

      <section className="flex flex-col gap-4">
        <h2 className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
          {thread.replies.length} {thread.replies.length === 1 ? "risposta" : "risposte"}
        </h2>
        {thread.replies.map((reply) => (
          <div
            key={reply.id}
            className="flex flex-col gap-1 rounded-cn border-2 border-ink bg-paper-card p-4 shadow-hard"
          >
            <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
              {reply.author.name} &middot; {dateFormatter.format(reply.createdAt)}
            </p>
            <p className="font-ui text-sm">{reply.body}</p>
          </div>
        ))}
      </section>

      {session?.user ? (
        <form action={createReply.bind(null, thread.id)} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 font-ui text-sm">
            Rispondi
            <textarea
              name="body"
              required
              rows={3}
              className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
            />
          </label>
          <Btn type="submit" kind="primary" className="self-start">
            Invia risposta
          </Btn>
        </form>
      ) : (
        <Link href="/accedi" className={btnClassName({ kind: "secondary" })}>
          Accedi per rispondere
        </Link>
      )}
    </main>
  );
}
