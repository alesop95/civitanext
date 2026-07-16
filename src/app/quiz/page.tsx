import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { btnClassName } from "@/components/ui/Btn";
import { Tag } from "@/components/ui/Tag";

export default async function QuizPage() {
  const session = await auth();
  const prisma = getPrisma();

  const quizzes = await prisma.quiz.findMany({
    orderBy: { order: "asc" },
    include: { questions: { select: { id: true } } },
  });

  const attempts = session?.user?.id
    ? await prisma.quizAttempt.findMany({
        where: { userId: session.user.id, quizId: { in: quizzes.map((q) => q.id) } },
      })
    : [];
  const attemptByQuiz = new Map(attempts.map((a) => [a.quizId, a]));

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/quiz" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">Quiz</h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Quiz di educazione civica. Si può riprovare quante volte si vuole: resta il punteggio
          migliore. Completa un quiz per sbloccare il successivo.
        </p>
      </header>

      {quizzes.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessun quiz disponibile al momento.</p>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {quizzes.map((quiz, index) => {
            const previousQuiz = quizzes[index - 1];
            const locked = index > 0 && !attemptByQuiz.has(previousQuiz.id);
            const attempt = attemptByQuiz.get(quiz.id);

            return (
              <article
                key={quiz.id}
                className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Tag color="var(--ink)">{quiz.questions.length} domande</Tag>
                  {locked && <Tag color="var(--ink)">Bloccato</Tag>}
                </div>
                <h2 className="font-display text-xl font-black">{quiz.title}</h2>
                <p className="font-ui text-sm text-ink-soft">{quiz.description}</p>
                {attempt && (
                  <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                    Punteggio migliore: {attempt.score}/{attempt.total}
                  </p>
                )}

                {locked ? (
                  <p className="font-ui text-xs text-ink-soft">
                    Completa &quot;{previousQuiz.title}&quot; per sbloccarlo.
                  </p>
                ) : session?.user ? (
                  <Link href={`/quiz/${quiz.id}`} className={btnClassName({ kind: "primary" })}>
                    {attempt ? "Riprova" : "Inizia"}
                  </Link>
                ) : (
                  <Link href="/accedi" className={btnClassName({ kind: "secondary" })}>
                    Accedi per iniziare
                  </Link>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
