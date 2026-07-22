import { getPrisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";

const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long" });

export type DigestContent = {
  events: { id: string; title: string; date: Date; location: string }[];
  threads: { id: string; title: string; category: string; authorName: string }[];
};

// Interpretazione del testo del prototipo ("Eventi e discussioni della settimana, ogni
// lunedi'"): eventi in programma nei prossimi 7 giorni, non quelli passati (un digest del
// lunedi' serve a guardare avanti), piu' i thread del forum apparsi negli ultimi 7 giorni
// (discussioni nuove, non l'intero forum). Riceve `now` come parametro, non lo calcola da se',
// cosi' la funzione resta pura e testabile senza dipendere dall'orologio di sistema.
export async function buildDigestContent(now: Date): Promise<DigestContent> {
  const prisma = getPrisma();
  const weekAhead = new Date(now.getTime() + 7 * DAY_MS);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

  const [events, threads] = await Promise.all([
    prisma.event.findMany({
      where: { date: { gte: now, lt: weekAhead } },
      orderBy: { date: "asc" },
    }),
    prisma.thread.findMany({
      where: { createdAt: { gte: weekAgo, lte: now } },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
  ]);

  return {
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      location: event.location,
    })),
    threads: threads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      category: thread.category,
      authorName: thread.author.name,
    })),
  };
}

// Titolo e categoria dei thread sono testo scritto dai soci (contenuto autoriale del forum), non
// dall'admin: senza questa fuga, un titolo come "<img onerror=...>" finirebbe intatto nell'HTML
// dell'email inviata a tutti gli iscritti al digest.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderDigestHtml(content: DigestContent) {
  const eventsHtml = content.events.length
    ? content.events
        .map(
          (event) =>
            `<li>${escapeHtml(event.title)} — ${dateFormatter.format(event.date)}, ${escapeHtml(event.location)}</li>`,
        )
        .join("")
    : "<li>Nessun evento in programma questa settimana.</li>";

  const threadsHtml = content.threads.length
    ? content.threads
        .map(
          (thread) =>
            `<li>${escapeHtml(thread.title)} (${escapeHtml(thread.category)}) — ${escapeHtml(thread.authorName)}</li>`,
        )
        .join("")
    : "<li>Nessuna nuova discussione questa settimana.</li>";

  return `<h1>CivitaNext, il digest della settimana</h1><h2>Eventi in programma</h2><ul>${eventsHtml}</ul><h2>Discussioni nuove sul forum</h2><ul>${threadsHtml}</ul>`;
}

// Nessun invio se non c'e' nulla da dire: un digest vuoto ogni settimana e' rumore, non valore.
export function isDigestEmpty(content: DigestContent) {
  return content.events.length === 0 && content.threads.length === 0;
}

export async function sendWeeklyDigest(now: Date) {
  const content = await buildDigestContent(now);
  if (isDigestEmpty(content)) return { sent: 0, skippedEmpty: true };

  const prisma = getPrisma();
  const recipients = await prisma.user.findMany({
    where: { digestOptIn: true },
    select: { email: true },
  });

  const html = renderDigestHtml(content);
  for (const recipient of recipients) {
    await sendEmail(recipient.email, "Il digest settimanale di CivitaNext", html);
  }

  return { sent: recipients.length, skippedEmpty: false };
}
