import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { getPrisma } from "@/lib/prisma";
import { deleteQuiz } from "./actions";

export default async function AdminQuizPage() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const quizzes = await getPrisma().quiz.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { questions: true, attempts: true } } },
  });

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/admin/quiz" />

      <header className="flex flex-col gap-4">
        <Link
          href="/admin"
          className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
        >
          Torna al pannello
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">Quiz</h1>
          <Link href="/admin/quiz/nuovo" className={btnClassName({ kind: "primary" })}>
            Nuovo quiz
          </Link>
        </div>
        <p className="font-ui text-base text-ink-soft">
          Crea nuovi quiz con domande e opzioni. Di un quiz esistente si possono modificare titolo,
          descrizione e ordine; per rifare le domande di un quiz gia&apos; svolto va eliminato e
          ricreato (eliminare un quiz rimuove anche i tentativi dei soci).
        </p>
      </header>

      {quizzes.length === 0 ? (
        <p className="font-ui text-sm text-ink-soft">Nessun quiz. Creane uno con il pulsante sopra.</p>
      ) : (
        <section className="flex flex-col gap-4">
          {quizzes.map((quiz) => (
            <article
              key={quiz.id}
              className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-xl font-black">{quiz.title}</h2>
                <p className="font-ui text-sm text-ink-soft">{quiz.description}</p>
                <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                  Ordine {quiz.order} &middot; {quiz._count.questions} domande &middot;{" "}
                  {quiz._count.attempts} tentativi
                </p>
              </div>
              <div className="flex gap-3 sm:shrink-0">
                <Link
                  href={`/admin/quiz/${quiz.id}/modifica`}
                  className={btnClassName({ kind: "secondary", small: true })}
                >
                  Modifica
                </Link>
                <form action={deleteQuiz.bind(null, quiz.id)}>
                  <Btn type="submit" kind="ghost" small>
                    Elimina
                  </Btn>
                </form>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
