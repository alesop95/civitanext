// Seed di sviluppo: contenuto demo di design_handoff_civitanext/civitanext-data.jsx ripreso
// come dati reali invece di inventato (eventi: refactor-03; quiz: ADR-011/refactor-08).
// Idempotente (controlla l'esistenza per titolo prima di inserire, nessun vincolo di unicita'
// dedicato su questi campi). Uso pg direttamente, non il client Prisma generato (sorgente
// TypeScript, non eseguibile con node diretto senza un transpiler installato nel progetto). id
// via crypto.randomUUID(), non un cuid: irrilevante, le colonne sono solo TEXT.
require("dotenv/config");
const crypto = require("crypto");
const { Client } = require("pg");

const EVENTS = [
  {
    title: "Assemblea aperta: bilancio partecipativo",
    description:
      "Discutiamo insieme le proposte da portare in Comune per il bilancio partecipativo 2026.",
    date: new Date("2026-06-18T18:30:00+02:00"),
    location: "Aula consiliare, Civitanova Marche",
    category: "Incontri",
  },
  {
    title: "Pulizia della spiaggia + aperitivo",
    description:
      "Guanti e sacchi li portiamo noi. Alla fine, aperitivo offerto per chi ha partecipato.",
    date: new Date("2026-06-21T09:00:00+02:00"),
    location: "Lungomare Sud, concessione libera",
    category: "Volontariato",
  },
  {
    title: "Cineforum sotto le stelle",
    description:
      "Proiezione all'aperto e discussione finale. Porta una sedia pieghevole o un telo.",
    date: new Date("2026-06-27T21:15:00+02:00"),
    location: "Giardino del Lido Cluana",
    category: "Cultura",
  },
  {
    title: "Quiz night civico",
    description: "Squadre da 4. Domande su città, civica e attualità. In palio: gloria eterna.",
    date: new Date("2026-06-30T21:00:00+02:00"),
    location: "Circolo ARCI, via Buozzi",
    category: "Cultura",
  },
];

// Solo il primo quiz del prototipo ("Educazione civica: le basi") ha domande reali in
// CN_QUIZ_QUESTIONS di civitanext-data.jsx. Gli altri due (locked nel mockup) non vengono
// seminati: niente domande inventate, coerente con la stessa scelta gia' fatta per il forum
// (nessun autore fittizio). order 0 = primo quiz, sempre sbloccato (ADR-011).
const QUIZ = {
  title: "Educazione civica: le basi",
  description: "4 domande su voto, comune e partecipazione",
  order: 0,
  questions: [
    {
      text: "A che età si può votare per eleggere la Camera dei Deputati?",
      options: ["16 anni", "18 anni", "21 anni", "25 anni"],
      correct: 1,
    },
    {
      text: "Ogni quanti anni si elegge, di norma, il sindaco?",
      options: ["3 anni", "4 anni", "5 anni", "7 anni"],
      correct: 2,
    },
    {
      text: "Che cos'è un bilancio partecipativo?",
      options: [
        "Un bilancio approvato all'unanimità",
        "Un processo in cui i cittadini decidono come spendere parte del bilancio comunale",
        "Il bilancio di un'associazione di volontariato",
        "Una tassa di partecipazione",
      ],
      correct: 1,
    },
    {
      text: "Quante firme servono per presentare una proposta di legge di iniziativa popolare?",
      options: ["5.000", "20.000", "50.000", "500.000"],
      correct: 2,
    },
  ],
};

async function seedEvents(client) {
  let inserted = 0;
  for (const event of EVENTS) {
    const existing = await client.query('SELECT id FROM "Event" WHERE title = $1', [
      event.title,
    ]);
    if (existing.rowCount > 0) continue;

    await client.query(
      `INSERT INTO "Event" (id, title, description, date, location, category, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, now(), now())`,
      [
        crypto.randomUUID(),
        event.title,
        event.description,
        event.date,
        event.location,
        event.category,
      ],
    );
    inserted += 1;
  }
  console.log(`Eventi: ${inserted} inseriti, ${EVENTS.length - inserted} già presenti.`);
}

async function seedQuiz(client) {
  const existing = await client.query('SELECT id FROM "Quiz" WHERE title = $1', [QUIZ.title]);
  if (existing.rowCount > 0) {
    console.log("Quiz: già presente, non risembrato.");
    return;
  }

  const quizId = crypto.randomUUID();
  await client.query(
    `INSERT INTO "Quiz" (id, title, description, "order", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, now(), now())`,
    [quizId, QUIZ.title, QUIZ.description, QUIZ.order],
  );

  for (let qIndex = 0; qIndex < QUIZ.questions.length; qIndex += 1) {
    const question = QUIZ.questions[qIndex];
    const questionId = crypto.randomUUID();
    await client.query(
      `INSERT INTO "QuizQuestion" (id, "quizId", text, "order") VALUES ($1, $2, $3, $4)`,
      [questionId, quizId, question.text, qIndex],
    );

    for (let oIndex = 0; oIndex < question.options.length; oIndex += 1) {
      await client.query(
        `INSERT INTO "QuizOption" (id, "questionId", text, "isCorrect") VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), questionId, question.options[oIndex], oIndex === question.correct],
      );
    }
  }

  console.log(`Quiz: creato "${QUIZ.title}" con ${QUIZ.questions.length} domande.`);
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  await seedEvents(client);
  await seedQuiz(client);

  await client.end();
  console.log("Seed completato.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
