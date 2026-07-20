import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { createTestQuiz, createTestUser, mockSession, resetTestData, setMockSession } from "@/test/fixtures";
import { submitQuiz } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

function answersFormData(questionIds: string[], optionIds: string[]) {
  const formData = new FormData();
  questionIds.forEach((questionId, i) => formData.set(`question-${questionId}`, optionIds[i]));
  return formData;
}

describe.skipIf(!process.env.DATABASE_URL)("submitQuiz", () => {
  afterAll(resetTestData);

  it("calcola score/total in base alle opzioni corrette", async () => {
    const user = await createTestUser();
    const quiz = await createTestQuiz([
      { correctIndex: 0, optionTexts: ["giusta", "sbagliata"] },
      { correctIndex: 1, optionTexts: ["sbagliata", "giusta"] },
    ]);
    setMockSession(mockSession(user));
    const questionIds = quiz.questions.map((q) => q.id);
    // Risponde giusto alla prima domanda, sbagliato alla seconda: score atteso 1/2.
    const formData = answersFormData(questionIds, [
      quiz.questions[0].options[0].id,
      quiz.questions[1].options[0].id,
    ]);

    await expect(submitQuiz(quiz.id, formData)).rejects.toThrow(`NEXT_REDIRECT:/quiz/${quiz.id}/risultato`);

    const prisma = getPrisma();
    const attempt = await prisma.quizAttempt.findUnique({ where: { userId_quizId: { userId: user.id, quizId: quiz.id } } });
    expect(attempt).toMatchObject({ score: 1, total: 2 });
  });

  it("non sovrascrive il tentativo salvato se il nuovo punteggio e' peggiore (ADR-011)", async () => {
    const user = await createTestUser();
    const quiz = await createTestQuiz([{ correctIndex: 0, optionTexts: ["giusta", "sbagliata"] }]);
    setMockSession(mockSession(user));
    const questionId = quiz.questions[0].id;
    const correctOptionId = quiz.questions[0].options[0].id;
    const wrongOptionId = quiz.questions[0].options[1].id;

    await expect(
      submitQuiz(quiz.id, answersFormData([questionId], [correctOptionId])),
    ).rejects.toThrow("NEXT_REDIRECT:");
    await expect(
      submitQuiz(quiz.id, answersFormData([questionId], [wrongOptionId])),
    ).rejects.toThrow("NEXT_REDIRECT:");

    const prisma = getPrisma();
    const attempt = await prisma.quizAttempt.findUnique({ where: { userId_quizId: { userId: user.id, quizId: quiz.id } } });
    expect(attempt).toMatchObject({ score: 1, total: 1 });
  });

  it("reindirizza ad /accedi se non autenticato, senza creare il tentativo", async () => {
    const quiz = await createTestQuiz([{ correctIndex: 0, optionTexts: ["giusta", "sbagliata"] }]);
    setMockSession(null);

    await expect(
      submitQuiz(quiz.id, answersFormData([quiz.questions[0].id], [quiz.questions[0].options[0].id])),
    ).rejects.toThrow("NEXT_REDIRECT:/accedi");

    const prisma = getPrisma();
    expect(await prisma.quizAttempt.count({ where: { quizId: quiz.id } })).toBe(0);
  });
});
