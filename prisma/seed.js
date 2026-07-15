// Seed di sviluppo: i quattro eventi demo di design_handoff_civitanext/civitanext-data.jsx,
// ripresi come dati reali invece di eventi inventati (vedi refactor-03-modello-data-eventi.md).
// Idempotente (controlla l'esistenza per titolo prima di inserire, non ha vincolo di unicita'
// dedicato). Uso pg direttamente, non il client Prisma generato (sorgente TypeScript, non
// eseguibile con node diretto senza un transpiler installato nel progetto). id via
// crypto.randomUUID(), non un cuid: irrilevante, la colonna e' solo TEXT.
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

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

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

  await client.end();
  console.log(`Seed completato: ${inserted} eventi inseriti, ${EVENTS.length - inserted} già presenti.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
