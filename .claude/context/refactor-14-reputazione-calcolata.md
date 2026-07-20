# 14. La reputazione calcolata: dettaglio

> Deep-dive della voce 14 di `studio-didattico-master.md`. Entra nel codice reale di
> `src/lib/reputation.ts`; le motivazioni complete e la forma ADR sono in ADR-015
> (`memory/decisions.md`).

## La forma del calcolo: funzioni pure sopra, query sotto

Il modulo separa due responsabilita' che di solito si confondono in un'unica funzione che
interroga il database e somma nello stesso punto. Sotto stanno le funzioni pure, che non sanno
nulla di Prisma e ricevono numeri gia' pronti; sopra stanno due funzioni asincrone che vanno a
prendere quei numeri. Il punteggio e' un catalogo esplicito piu' una somma:

```ts
export const POINTS = { rsvp: 20, quizAttempt: 30, proposal: 40, vote: 10 } as const;

export function computePoints(stats: PointStats): number {
  return (
    stats.rsvpCount * POINTS.rsvp +
    stats.quizAttemptCount * POINTS.quizAttempt +
    stats.proposalCount * POINTS.proposal +
    stats.voteCount * POINTS.vote
  );
}
```

Il livello e' derivato dal punteggio scorrendo le soglie dal basso, e restituisce anche il
prossimo traguardo cosi' la UI puo' disegnare la barra di avanzamento senza ricalcolare nulla:

```ts
export const LEVELS = [
  { name: "Nuovo", min: 0 },
  { name: "Attivo", min: 200 },
  { name: "Pilastro", min: 500 },
] as const;
```

I badge sono un catalogo con il criterio accanto, non righe in una tabella: ogni voce e' una
soglia o un traguardo valutato sulle statistiche reali. La conseguenza pratica e' che sbloccare o
ritirare un badge non e' mai una scrittura, e' solo l'esito di un confronto ricalcolato.

## Perche' la classifica non e' un problema diverso

La classifica sembra chiedere qualcosa di piu' della reputazione di un singolo, ma e' la stessa
funzione applicata a tutti. Invece di un giro per utente, si fanno quattro aggregati e si
combinano in memoria:

```ts
const [users, rsvps, attempts, proposals, votes] = await Promise.all([
  prisma.user.findMany({ select: { id: true, name: true } }),
  prisma.rsvp.groupBy({ by: ["userId"], _count: { _all: true } }),
  prisma.quizAttempt.groupBy({ by: ["userId"], _count: { _all: true } }),
  prisma.proposal.groupBy({ by: ["authorId"], _count: { _all: true } }),
  prisma.vote.groupBy({ by: ["userId"], _count: { _all: true } }),
]);
```

Un dettaglio non ovvio del dominio e' nascosto qui: la proposta si aggrega su `authorId`, non su
`userId` come gli altri tre, perche' e' quello il nome della relazione con l'autore nel modello
`Proposal`. Ogni aggregato diventa una mappa da id utente a conteggio, e `computePoints`, la
stessa funzione pura del profilo, produce il punteggio riga per riga prima dell'ordinamento. A
questa scala (soci nell'ordine delle decine) e' lineare nel numero di soci, non serve altro.

## Cosa rende testabile cio' che tocca il database

La separazione non e' estetica, e' cio' che rende la parte importante testabile senza
infrastruttura. `computePoints`, `levelFor` ed `earnedBadges` non aprono mai una connessione:
ricevono numeri e una data e restituiscono numeri e booleani. Per questo
`src/lib/reputation.test.ts` gira senza il Postgres di test, a differenza dei test delle server
action che si saltano da soli quando `.env.test` non c'e' (ADR-014): non ha un database da
saltare. I casi coprono esattamente i punti dove la logica puo' sbagliare in silenzio, cioe' i
confini: il punteggio sulla combinazione dei quattro assi, la promozione di livello esattamente
sulla soglia (199 e' ancora "Nuovo", 200 e' "Attivo"), il badge "5 eventi" che non deve scattare a
quattro, e "Un anno con noi" che distingue undici mesi da dodici. Sono le asserzioni che un
contatore memorizzato non avrebbe reso possibili senza prima costruire uno stato finto nel
database.
