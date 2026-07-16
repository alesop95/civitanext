import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { btnClassName } from "@/components/ui/Btn";

export default async function QuizRisultatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const prisma = getPrisma();

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: true },
      },
    },
  });
  if (!quiz) notFound();

  const attempt = await prisma.quizAttempt.findUnique({
    where: { userId_quizId: { userId: session.user.id, quizId: id } },
    include: { answers: true },
  });
  if (!attempt) redirect(`/quiz/${id}`);

  const answerByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/quiz" />

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-black">{quiz.title}</h1>
        <p className="font-ui text-base font-bold">
          Punteggio migliore: {attempt.score}/{attempt.total}
        </p>
        <p className="font-ui text-xs text-ink-soft">
          Il risultato qui sotto è del tuo tentativo con il punteggio più alto, non
          necessariamente dell&apos;ultimo che hai fatto: puoi riprovare quante volte vuoi, ma un
          punteggio più basso non sostituisce quello migliore già registrato.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        {quiz.questions.map((question, index) => {
          const given = answerByQuestion.get(question.id);
          const correctOption = question.options.find((o) => o.isCorrect);

          return (
            <div
              key={question.id}
              className="flex flex-col gap-2 rounded-cn border-2 border-ink bg-paper-card p-4 shadow-hard"
            >
              <p className="font-ui text-sm font-bold">
                {index + 1}. {question.text}
              </p>
              <p
                className={`font-ui text-sm font-bold ${given?.isCorrect ? "text-success" : "text-accent"}`}
              >
                {given?.isCorrect
                  ? "Risposta corretta."
                  : `Risposta sbagliata. La risposta giusta era: ${correctOption?.text ?? "—"}`}
              </p>
            </div>
          );
        })}
      </section>

      <div className="flex gap-3">
        <Link href={`/quiz/${quiz.id}`} className={btnClassName({ kind: "secondary" })}>
          Riprova
        </Link>
        <Link href="/quiz" className={btnClassName({ kind: "primary" })}>
          Torna ai quiz
        </Link>
      </div>
    </main>
  );
}
