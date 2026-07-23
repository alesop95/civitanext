// Rate limiting anti-spam basato su Postgres, non Redis/KV: nessuna nuova infrastruttura, si
// contano le righe che l'azione stessa scrive (Thread, Reply, Proposal, Skill hanno gia'
// authorId/userId + createdAt, nessuna tabella dedicata al rate limit). Non e' un contatore
// esatto sotto concorrenza estrema (due richieste quasi simultanee potrebbero superare il limite
// di una unita'), accettabile alla scala di un'associazione di soci: e' un freno anti-spam, non
// un lock finanziario. windowStart riceve `now` come parametro (default new Date() solo per
// comodita' delle chiamate reali) cosi' resta testabile con date finte, stesso principio gia'
// seguito in src/lib/digest.ts.
export function windowStart(minutes: number, now: Date = new Date()) {
  return new Date(now.getTime() - minutes * 60 * 1000);
}

export function exceedsLimit(recentCount: number, max: number) {
  return recentCount >= max;
}
