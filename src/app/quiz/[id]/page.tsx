import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { submitQuiz } from "../actions";

export default async function QuizTakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const prisma = getPrisma();

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        // Niente isCorrect qui: non deve mai arrivare al browser prima dell'invio.
        include: { options: { select: { id: true, text: true } } },
      },
    },
  });
  if (!quiz) notFound();

  // Guardia contro lo sblocco progressivo: un quiz con order > 0 richiede un tentativo sul
  // quiz con order immediatamente precedente (stessa logica della pagina /quiz, ADR-011).
  if (quiz.order > 0) {
    const previousQuiz = await prisma.quiz.findFirst({
      where: { order: { lt: quiz.order } },
      orderBy: { order: "desc" },
    });
    const hasPreviousAttempt =
      previousQuiz &&
      (await prisma.quizAttempt.findUnique({
        where: { userId_quizId: { userId: session.user.id, quizId: previousQuiz.id } },
      }));
    if (previousQuiz && !hasPreviousAttempt) redirect("/quiz");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/quiz" />

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-black">{quiz.title}</h1>
        <p className="font-ui text-sm text-ink-soft">{quiz.description}</p>
      </div>

      <form action={submitQuiz.bind(null, quiz.id)} className="flex flex-col gap-8">
        {quiz.questions.map((question, index) => (
          <fieldset key={question.id} className="flex flex-col gap-3">
            <legend className="font-ui text-base font-bold">
              {index + 1}. {question.text}
            </legend>
            {question.options.map((option) => (
              <label key={option.id} className="flex items-center gap-2 font-ui text-sm">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.id}
                  required
                />
                {option.text}
              </label>
            ))}
          </fieldset>
        ))}
        <Btn type="submit" kind="primary" className="self-start">
          Invia risposte
        </Btn>
      </form>
    </main>
  );
}
