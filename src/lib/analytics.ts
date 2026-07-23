import { getPrisma } from "@/lib/prisma";

// Statistiche del pannello admin (Panoramica + Analytics). Come per la reputazione (ADR-015),
// tutto e' calcolato in lettura dai dati gia' presenti: nessun contatore memorizzato, nessuna
// tabella di aggregazione. La parte deterministica (bucketing per mese, medie, inizio mese) e'
// isolata in funzioni pure senza dipendenze dal database, cosi' e' testabile senza Postgres; le
// funzioni che leggono dal database si limitano a interrogare e delegano a quelle pure il calcolo.

const MONTH_LABELS = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic",
];

export type MonthBucket = { key: string; label: string; count: number };

// Primo istante (UTC) del mese di `now`. Usato come soglia per le metriche "nel mese corrente".
export function startOfMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

// Primo istante (UTC) del mese piu' vecchio di una finestra di `months` mesi che termina nel mese
// di `now` incluso. E' la soglia con cui si filtrano le righe da distribuire nei bucket.
export function windowStart(now: Date, months: number): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
}

// Distribuisce un elenco di date in `months` bucket mensili consecutivi che finiscono nel mese di
// `now` (incluso). Funzione pura: non chiama Date.now() ne' il database, quindi il test la
// esercita con date fisse. Le date fuori dalla finestra vengono ignorate.
export function bucketByMonth(dates: Date[], now: Date, months: number): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const indexByKey = new Map<string, number>();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    indexByKey.set(key, buckets.length);
    buckets.push({ key, label: MONTH_LABELS[d.getUTCMonth()], count: 0 });
  }
  for (const date of dates) {
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    const pos = indexByKey.get(key);
    if (pos !== undefined) buckets[pos].count += 1;
  }
  return buckets;
}

// Media intera, con la divisione per zero resa esplicita a 0 (nessun evento => nessuna media).
export function average(total: number, count: number): number {
  return count === 0 ? 0 : Math.round(total / count);
}

export type AdminOverview = {
  totalUsers: number;
  tesserati: number;
  totalEvents: number;
  avgRsvpPerEvent: number;
  quizAttemptsThisMonth: number;
  forumMessagesThisMonth: number;
  proposalsInReview: number;
  pendingDeletionRequests: number;
};

// Numeri della Panoramica: conteggi diretti piu' due voci "nel mese corrente" (tentativi quiz e
// messaggi forum) e i due contatori di lavoro in attesa (proposte da revisionare, richieste di
// cancellazione account non ancora eseguite).
export async function getAdminOverview(now: Date): Promise<AdminOverview> {
  const prisma = getPrisma();
  const monthStart = startOfMonth(now);
  const [
    totalUsers,
    tesserati,
    totalEvents,
    totalRsvp,
    quizAttemptsThisMonth,
    threadsThisMonth,
    repliesThisMonth,
    proposalsInReview,
    pendingDeletionRequests,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { tesseraNumero: { not: null } } }),
    prisma.event.count(),
    prisma.rsvp.count(),
    prisma.quizAttempt.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.thread.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.reply.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.proposal.count({ where: { status: "REVISIONE" } }),
    prisma.accountDeletionRequest.count({ where: { processedAt: null } }),
  ]);

  return {
    totalUsers,
    tesserati,
    totalEvents,
    avgRsvpPerEvent: average(totalRsvp, totalEvents),
    quizAttemptsThisMonth,
    forumMessagesThisMonth: threadsThisMonth + repliesThisMonth,
    proposalsInReview,
    pendingDeletionRequests,
  };
}

export type ProposalStatusCount = { status: string; label: string; count: number };

export type AdminAnalytics = {
  months: number;
  newMembersByMonth: MonthBucket[];
  forumActivityByMonth: MonthBucket[];
  quizAttemptsByMonth: MonthBucket[];
  proposalsByStatus: ProposalStatusCount[];
  totalRsvp: number;
  totalVotes: number;
};

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  REVISIONE: "In revisione",
  VOTAZIONE: "In votazione",
  APPROVATA: "Approvate",
};

// Serie temporali dell'Analytics: tre andamenti mensili (iscritti, attivita' forum, tentativi
// quiz) sulla stessa finestra di `months` mesi, la distribuzione delle proposte per stato, e due
// totali complessivi (RSVP, voti). Recupera solo le date necessarie ai bucket, non le righe
// intere, e delega il conteggio alle funzioni pure sopra.
export async function getAdminAnalytics(now: Date, months = 6): Promise<AdminAnalytics> {
  const prisma = getPrisma();
  const from = windowStart(now, months);
  const [users, threads, replies, attempts, proposalsGrouped, totalRsvp, totalVotes] =
    await Promise.all([
      prisma.user.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
      prisma.thread.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
      prisma.reply.findMany({ where: { createdAt: { gte: from } }, select: { createdAt: true } }),
      prisma.quizAttempt.findMany({
        where: { createdAt: { gte: from } },
        select: { createdAt: true },
      }),
      prisma.proposal.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.rsvp.count(),
      prisma.vote.count(),
    ]);

  const forumDates = [
    ...threads.map((t) => t.createdAt),
    ...replies.map((r) => r.createdAt),
  ];
  const countByStatus = new Map<string, number>(
    proposalsGrouped.map((g) => [g.status, g._count._all]),
  );

  return {
    months,
    newMembersByMonth: bucketByMonth(
      users.map((u) => u.createdAt),
      now,
      months,
    ),
    forumActivityByMonth: bucketByMonth(forumDates, now, months),
    quizAttemptsByMonth: bucketByMonth(
      attempts.map((a) => a.createdAt),
      now,
      months,
    ),
    proposalsByStatus: (["REVISIONE", "VOTAZIONE", "APPROVATA"] as const).map((status) => ({
      status,
      label: PROPOSAL_STATUS_LABELS[status],
      count: countByStatus.get(status) ?? 0,
    })),
    totalRsvp,
    totalVotes,
  };
}
