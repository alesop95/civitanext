"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

export async function submitQuiz(quizId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");
  const userId = session.user.id;

  const prisma = getPrisma();
  const questions = await prisma.quizQuestion.findMany({
    where: { quizId },
    include: { options: true },
  });

  const answers = questions.map((question) => {
    const selectedOptionId = String(formData.get(`question-${question.id}`) ?? "");
    const option = question.options.find((o) => o.id === selectedOptionId);
    return { questionId: question.id, optionId: option?.id, isCorrect: option?.isCorrect ?? false };
  });
  const score = answers.filter((a) => a.isCorrect).length;
  const total = questions.length;

  const existing = await prisma.quizAttempt.findUnique({
    where: { userId_quizId: { userId, quizId } },
  });

  // Si sovrascrive solo se il nuovo punteggio e' migliore (ADR-011): un tentativo peggiore non
  // tocca il record esistente. La pagina risultato mostra sempre il tentativo salvato (il
  // migliore), non necessariamente le risposte appena date se questo giro e' andato peggio.
  if (!existing || score > existing.score) {
    await prisma.$transaction(async (tx) => {
      const attempt = existing
        ? await tx.quizAttempt.update({ where: { id: existing.id }, data: { score, total } })
        : await tx.quizAttempt.create({ data: { userId, quizId, score, total } });

      if (existing) {
        await tx.quizAnswer.deleteMany({ where: { attemptId: attempt.id } });
      }
      await tx.quizAnswer.createMany({
        data: answers
          .filter((a): a is { questionId: string; optionId: string; isCorrect: boolean } =>
            Boolean(a.optionId),
          )
          .map((a) => ({
            attemptId: attempt.id,
            questionId: a.questionId,
            optionId: a.optionId,
            isCorrect: a.isCorrect,
          })),
      });
    });
  }

  revalidatePath("/quiz");
  redirect(`/quiz/${quizId}/risultato`);
}
