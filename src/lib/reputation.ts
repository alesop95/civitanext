import { getPrisma } from "@/lib/prisma";

// Reputazione e badge (ADR-015). Tutto e' calcolato in lettura dai dati gia' presenti (RSVP,
// tentativi quiz, proposte, voti, data di tesseramento): nessuna colonna di punti memorizzata,
// nessuna tabella Badge. Stessa filosofia "calcola in query" gia' usata per lo sblocco
// progressivo del quiz (ADR-011) e le percentuali dei sondaggi, senza il rischio di drift di un
// contatore da tenere sincronizzato a ogni azione.

// Catalogo dei punti. I quattro assi sono quelli dichiarati dal prototipo (CN_REPUTATION.how):
// partecipare a eventi, completare quiz, proporre, votare.
export const POINTS = {
  rsvp: 20,
  quizAttempt: 30,
  proposal: 40,
  vote: 10,
} as const;

// Livelli progressivi (dal prototipo CN_REPUTATION), soglie in punti totali, dal piu' basso.
export const LEVELS = [
  { name: "Nuovo", min: 0 },
  { name: "Attivo", min: 200 },
  { name: "Pilastro", min: 500 },
] as const;

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export type PointStats = {
  rsvpCount: number;
  quizAttemptCount: number;
  proposalCount: number;
  voteCount: number;
};

export type UserStats = PointStats & {
  hasFullQuiz: boolean;
  memberSince: Date;
};

export function computePoints(stats: PointStats): number {
  return (
    stats.rsvpCount * POINTS.rsvp +
    stats.quizAttemptCount * POINTS.quizAttempt +
    stats.proposalCount * POINTS.proposal +
    stats.voteCount * POINTS.vote
  );
}

export type LevelInfo = {
  name: string;
  min: number;
  // Livello successivo e soglia per raggiungerlo, null se si e' gia' al massimo.
  next: { name: string; at: number } | null;
};

export function levelFor(points: number): LevelInfo {
  let currentIdx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) currentIdx = i;
  }
  const current = LEVELS[currentIdx];
  const next = currentIdx < LEVELS.length - 1 ? LEVELS[currentIdx + 1] : null;
  return {
    name: current.name,
    min: current.min,
    next: next ? { name: next.name, at: next.min } : null,
  };
}

export type Badge = { label: string; earned: boolean };

// Criteri calcolati sulle statistiche reali, allineati ai badge del prototipo (CN_BADGES).
export function earnedBadges(stats: UserStats, now: Date): Badge[] {
  return [
    { label: "Primo evento", earned: stats.rsvpCount >= 1 },
    { label: "5 eventi", earned: stats.rsvpCount >= 5 },
    { label: "Prima proposta", earned: stats.proposalCount >= 1 },
    { label: "Quiz completato", earned: stats.quizAttemptCount >= 1 },
    { label: "Punteggio pieno", earned: stats.hasFullQuiz },
    {
      label: "Un anno con noi",
      earned: now.getTime() - stats.memberSince.getTime() >= ONE_YEAR_MS,
    },
  ];
}

export type Reputation = {
  points: number;
  level: LevelInfo;
  badges: Badge[];
  stats: UserStats;
};

// Reputazione completa di un singolo utente (per la pagina profilo).
export async function getUserReputation(userId: string, now: Date): Promise<Reputation> {
  const prisma = getPrisma();
  const [rsvpCount, quizAttempts, proposalCount, voteCount, user] = await Promise.all([
    prisma.rsvp.count({ where: { userId } }),
    prisma.quizAttempt.findMany({ where: { userId }, select: { score: true, total: true } }),
    prisma.proposal.count({ where: { authorId: userId } }),
    prisma.vote.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { memberSince: true } }),
  ]);

  const stats: UserStats = {
    rsvpCount,
    quizAttemptCount: quizAttempts.length,
    proposalCount,
    voteCount,
    hasFullQuiz: quizAttempts.some((a) => a.total > 0 && a.score === a.total),
    memberSince: user?.memberSince ?? now,
  };

  const points = computePoints(stats);
  return { points, level: levelFor(points), badges: earnedBadges(stats, now), stats };
}

export type LeaderboardRow = {
  userId: string;
  name: string;
  points: number;
  level: string;
  quizCount: number;
};

// Classifica di tutti i soci per punti calcolati. A questa scala (soci nell'ordine delle decine)
// e' un aggregato in lettura, non una vista materializzata: quattro groupBy piu' la combinazione
// in memoria, ricalcolati a ogni caricamento.
export async function getLeaderboard(limit: number): Promise<LeaderboardRow[]> {
  const prisma = getPrisma();
  const [users, rsvps, attempts, proposals, votes] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.rsvp.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.quizAttempt.groupBy({ by: ["userId"], _count: { _all: true } }),
    prisma.proposal.groupBy({ by: ["authorId"], _count: { _all: true } }),
    prisma.vote.groupBy({ by: ["userId"], _count: { _all: true } }),
  ]);

  const rsvpBy = new Map(rsvps.map((r) => [r.userId, r._count._all]));
  const attemptBy = new Map(attempts.map((a) => [a.userId, a._count._all]));
  const proposalBy = new Map(proposals.map((p) => [p.authorId, p._count._all]));
  const voteBy = new Map(votes.map((v) => [v.userId, v._count._all]));

  const rows = users.map((u) => {
    const quizCount = attemptBy.get(u.id) ?? 0;
    const points = computePoints({
      rsvpCount: rsvpBy.get(u.id) ?? 0,
      quizAttemptCount: quizCount,
      proposalCount: proposalBy.get(u.id) ?? 0,
      voteCount: voteBy.get(u.id) ?? 0,
    });
    return { userId: u.id, name: u.name, points, level: levelFor(points).name, quizCount };
  });

  rows.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return rows.slice(0, limit);
}
