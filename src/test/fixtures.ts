import { randomUUID } from "node:crypto";
import type { Mock } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/client";
import type { Session } from "next-auth";

// Costruisce una Session Auth.js valida per i test, con i soli campi che auth.ts legge davvero
// (id, role, tesseraNumero): evita di ripetere la forma in ogni file di test delle action.
export function mockSession(user: { id: string; role: Role; tesseraNumero?: string | null }): Session {
  return {
    user: { id: user.id, role: user.role, tesseraNumero: user.tesseraNumero ?? null },
    expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

// auth() e' tipizzato in modo overloaded da Auth.js (chiamabile anche come middleware Next, che
// prende (request, event)): vi.mocked(auth) prova a conciliare entrambe le firme e finisce per
// dedurre il tipo sbagliato per mockResolvedValue. Il cast esplicito qui, in un solo punto
// invece che in ogni file di test, restringe al solo utilizzo reale del progetto, auth() senza
// argomenti che restituisce la sessione.
export function setMockSession(session: Session | null) {
  (auth as unknown as Mock<() => Promise<Session | null>>).mockResolvedValue(session);
}

// Prefisso riconoscibile su ogni riga creata dai test, cosi' la pulizia (vedi resetTestData) puo'
// cancellare per pattern invece di dover tracciare a mano ogni id creato in ogni test.
const MARKER = "vitest-fixture";

function uniqueEmail() {
  return `${MARKER}-${randomUUID()}@test.local`;
}

export async function createTestUser(role: Role = "UTENTE") {
  const prisma = getPrisma();
  return prisma.user.create({
    data: { email: uniqueEmail(), name: MARKER, role },
  });
}

export async function createTestEvent() {
  const prisma = getPrisma();
  return prisma.event.create({
    data: {
      title: MARKER,
      description: MARKER,
      date: new Date(),
      location: MARKER,
      category: MARKER,
    },
  });
}

export async function createTestMentor(slots = 1) {
  const prisma = getPrisma();
  return prisma.mentor.create({
    data: { name: MARKER, area: MARKER, description: MARKER, slots },
  });
}

export async function createTestProposal(status: "REVISIONE" | "VOTAZIONE" | "APPROVATA", authorId: string) {
  const prisma = getPrisma();
  return prisma.proposal.create({
    data: { title: MARKER, category: MARKER, description: MARKER, authorId, status },
  });
}

export async function createTestPoll(optionTexts: string[]) {
  const prisma = getPrisma();
  return prisma.poll.create({
    data: {
      question: MARKER,
      options: { create: optionTexts.map((text) => ({ text })) },
    },
    include: { options: true },
  });
}

export async function createTestQuiz(questions: Array<{ correctIndex: number; optionTexts: string[] }>) {
  const prisma = getPrisma();
  return prisma.quiz.create({
    data: {
      title: MARKER,
      description: MARKER,
      questions: {
        create: questions.map((q, questionOrder) => ({
          text: MARKER,
          order: questionOrder,
          options: {
            create: q.optionTexts.map((text, i) => ({ text, isCorrect: i === q.correctIndex })),
          },
        })),
      },
    },
    include: { questions: { include: { options: true } } },
  });
}

// Cancellazione per pattern sul marker, in ordine che rispetta le foreign key (figli prima dei
// genitori). Va chiamata in afterEach/afterAll dai file di test che usano queste fixture: senza,
// ogni run lascia righe MARKER nel Postgres di test, innocue ma che si accumulano.
export async function resetTestData() {
  const prisma = getPrisma();
  await prisma.quizAnswer.deleteMany({ where: { attempt: { user: { name: MARKER } } } });
  await prisma.quizAttempt.deleteMany({ where: { user: { name: MARKER } } });
  await prisma.quizOption.deleteMany({ where: { question: { quiz: { title: MARKER } } } });
  await prisma.quizQuestion.deleteMany({ where: { quiz: { title: MARKER } } });
  await prisma.quiz.deleteMany({ where: { title: MARKER } });
  await prisma.vote.deleteMany({ where: { user: { name: MARKER } } });
  await prisma.pollOption.deleteMany({ where: { poll: { question: MARKER } } });
  await prisma.poll.deleteMany({ where: { question: MARKER } });
  await prisma.rsvp.deleteMany({ where: { user: { name: MARKER } } });
  await prisma.notification.deleteMany({ where: { user: { name: MARKER } } });
  await prisma.mentorRequest.deleteMany({
    where: { OR: [{ user: { name: MARKER } }, { mentor: { name: MARKER } }] },
  });
  await prisma.mentor.deleteMany({ where: { name: MARKER } });
  await prisma.proposal.deleteMany({ where: { title: MARKER } });
  await prisma.event.deleteMany({ where: { title: MARKER } });
  await prisma.user.deleteMany({ where: { name: MARKER } });
}
