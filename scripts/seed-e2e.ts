// Seed idempotente per lo smoke e2e Playwright: id fissi, upsert dove possibile, altrimenti
// cancella-e-ricrea (relazioni annidate non upsertabili in un colpo solo). Va eseguito solo
// contro il Postgres di test (mai contro il Neon di sviluppo in .env): usa DATABASE_URL cosi'
// com'e', senza sceglierlo da solo, per restare lo stesso identico script sia in locale
// (scripts/test-env.mjs carica .env.test) sia in CI (DATABASE_URL gia' nell'ambiente del job).
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";
import { E2E_EMAIL, E2E_PASSWORD } from "../e2e/credentials";

const EVENT_ID = "e2e-event";
const PROPOSAL_ID = "e2e-proposal";
const QUIZ_ID = "e2e-quiz";
const QUESTION_ID = "e2e-quiz-q1";

async function main() {
  const prisma = getPrisma();
  const passwordHash = await bcrypt.hash(E2E_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: E2E_EMAIL },
    update: { passwordHash },
    create: { email: E2E_EMAIL, name: "Utente e2e", passwordHash, role: "UTENTE" },
  });

  await prisma.event.upsert({
    where: { id: EVENT_ID },
    update: {},
    create: {
      id: EVENT_ID,
      title: "Evento e2e",
      description: "Evento di prova per lo smoke test end-to-end.",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: "Civitanova Marche",
      category: "e2e",
    },
  });

  await prisma.proposal.upsert({
    where: { id: PROPOSAL_ID },
    update: { status: "VOTAZIONE" },
    create: {
      id: PROPOSAL_ID,
      title: "Proposta e2e",
      category: "e2e",
      description: "Proposta di prova gia' in votazione per lo smoke test.",
      authorId: user.id,
      status: "VOTAZIONE",
    },
  });

  // Lo spec e2e assume di partire da "non partecipo"/"non ho votato" ogni volta: senza questo
  // azzeramento, un rerun (o un retry di Playwright) trova lo stato lasciato dall'esecuzione
  // precedente e le azioni di toggle sembrano non funzionare, quando invece e' il seed a non
  // essere idempotente (osservato: RSVP rimasto attivo tra due run successivi).
  await prisma.rsvp.deleteMany({ where: { userId: user.id, eventId: EVENT_ID } });
  await prisma.vote.deleteMany({ where: { userId: user.id, targetId: PROPOSAL_ID } });

  // Le opzioni annidate non si possono upsertare in un colpo solo: si cancella e si ricrea da
  // capo, in ordine che rispetta le foreign key, cosi' il seed resta idempotente a ogni run.
  await prisma.quizAnswer.deleteMany({ where: { attempt: { quizId: QUIZ_ID } } });
  await prisma.quizAttempt.deleteMany({ where: { quizId: QUIZ_ID } });
  await prisma.quizOption.deleteMany({ where: { questionId: QUESTION_ID } });
  await prisma.quizQuestion.deleteMany({ where: { id: QUESTION_ID } });
  await prisma.quiz.deleteMany({ where: { id: QUIZ_ID } });
  await prisma.quiz.create({
    data: {
      id: QUIZ_ID,
      title: "Quiz e2e",
      description: "Quiz di prova per lo smoke test.",
      order: 0,
      questions: {
        create: [
          {
            id: QUESTION_ID,
            text: "Qual e' la capitale d'Italia?",
            order: 0,
            options: {
              create: [
                { text: "Roma", isCorrect: true },
                { text: "Milano", isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Seed e2e completato:", {
    email: E2E_EMAIL,
    eventId: EVENT_ID,
    proposalId: PROPOSAL_ID,
    quizId: QUIZ_ID,
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
