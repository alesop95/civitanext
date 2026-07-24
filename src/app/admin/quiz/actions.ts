"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validation";
import { parseQuizQuestions } from "@/lib/quiz-admin";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
}

type QuizMeta = { title: string; description: string; order: number };

// Valida i metadati comuni. Codici: 1 = titolo/descrizione mancanti o troppo lunghi, 2 = ordine
// non intero.
function parseQuizMeta(formData: FormData): QuizMeta | number {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const orderRaw = String(formData.get("order") ?? "").trim();

  if (!title || !description) return 1;
  if (title.length > MAX_SHORT_TEXT || description.length > MAX_LONG_TEXT) return 1;

  const order = orderRaw === "" ? 0 : Number(orderRaw);
  if (!Number.isInteger(order)) return 2;

  return { title, description, order };
}

export async function createQuiz(formData: FormData) {
  await requireAdmin();

  const meta = parseQuizMeta(formData);
  if (typeof meta === "number") redirect(`/admin/quiz/nuovo?error=${meta}`);

  const parsed = parseQuizQuestions(String(formData.get("payload") ?? ""));
  if (!parsed.ok) redirect("/admin/quiz/nuovo?error=3");

  const prisma = getPrisma();
  // Quiz + domande + opzioni in un'unica create annidata: la posizione della domanda diventa il
  // suo order, e l'opzione all'indice corretto e' l'unica con isCorrect true.
  await prisma.quiz.create({
    data: {
      title: meta.title,
      description: meta.description,
      order: meta.order,
      questions: {
        create: parsed.questions.map((question, questionIndex) => ({
          text: question.text,
          order: questionIndex,
          options: {
            create: question.options.map((optionText, optionIndex) => ({
              text: optionText,
              isCorrect: optionIndex === question.correctIndex,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/quiz");
  revalidatePath("/admin/quiz");
  redirect("/admin/quiz");
}

// Modifica dei soli metadati (titolo, descrizione, ordine): le domande NON sono modificabili dopo
// la creazione perche' un quiz gia' tentato ha QuizAttempt/QuizAnswer agganciati a domande e
// opzioni, e cambiarle invaliderebbe quei tentativi. Per rifare le domande si elimina e si ricrea
// il quiz (scelta di scope, segnalata).
export async function updateQuizMeta(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/quiz");

  const meta = parseQuizMeta(formData);
  if (typeof meta === "number") redirect(`/admin/quiz/${id}/modifica?error=${meta}`);

  await getPrisma().quiz.update({ where: { id }, data: meta });

  revalidatePath("/quiz");
  revalidatePath("/admin/quiz");
  redirect("/admin/quiz");
}

// Cancellazione a cascata in transazione, nell'ordine che rispetta le foreign key: prima le
// risposte, poi i tentativi, poi le opzioni, poi le domande, infine il quiz. Elimina anche i
// tentativi dei soci (con impatto sui punti reputazione, che li contano): e' il prezzo di
// rimuovere del tutto un quiz, non un effetto nascosto.
export async function deleteQuiz(id: string) {
  await requireAdmin();
  const prisma = getPrisma();

  await prisma.$transaction([
    prisma.quizAnswer.deleteMany({ where: { attempt: { quizId: id } } }),
    prisma.quizAttempt.deleteMany({ where: { quizId: id } }),
    prisma.quizOption.deleteMany({ where: { question: { quizId: id } } }),
    prisma.quizQuestion.deleteMany({ where: { quizId: id } }),
    prisma.quiz.delete({ where: { id } }),
  ]);

  revalidatePath("/quiz");
  revalidatePath("/admin/quiz");
}
