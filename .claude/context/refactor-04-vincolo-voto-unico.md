# Refactor 04 — Il vincolo di voto unico come regola di database, non stato client sparso

Riferimento: voce 4 di `studio-didattico-master.md`.

## Prima (prototipo, concettuale)

Il prototipo persiste i voti su sondaggi, thread e proposte in `localStorage`, con chiavi
distinte per tipo di contenuto e nessuna struttura condivisa: la regola "un voto per utente" è
rispettata perché il codice client controlla una chiave prima di permettere un secondo voto, non
perché il sistema lo impedisca strutturalmente. Se quella chiave viene persa, corrotta, o il
controllo ha un bug, nulla a un livello più basso impedisce un doppio voto.

## Dopo (`webapp/prisma/schema.prisma`)

```prisma
enum VoteTargetType {
  THREAD
  PROPOSAL
  POLL
}

model Vote {
  id         String         @id @default(cuid())
  userId     String
  user       User           @relation(fields: [userId], references: [id])
  targetType VoteTargetType
  targetId   String
  createdAt  DateTime       @default(now())

  @@unique([userId, targetType, targetId])
}
```

Il vincolo `@@unique([userId, targetType, targetId])` è imposto da Postgres stesso: un secondo
`INSERT` con la stessa combinazione fallisce con un errore di violazione di vincolo, a
prescindere da quale percorso di codice (una route API, uno script, un bug futuro) abbia provato
a scriverlo. La garanzia si sposta dal "il client si comporta bene" al "il database non lo
permette".

Il compromesso dichiarato: `targetId` non è una vera foreign key, perché punta a tabelle diverse
a seconda di `targetType` (pattern polimorfico). Questo significa che il database garantisce
l'unicità del voto ma non l'esistenza del bersaglio: un `Vote` con `targetId` di un thread
cancellato resterebbe orfano senza che Postgres se ne accorga. La mitigazione prevista per
quando la feature verrà davvero scritta (Fase 1/2): validare l'esistenza del bersaglio nel
codice applicativo prima di scrivere il voto, o valutare una cancellazione a cascata applicativa
quando si cancella un thread/proposta.

## Come estendere il pattern

Quando una regola di business è "al massimo una volta per combinazione di due o più campi" (un
voto, una prenotazione, un'iscrizione), la prima domanda è se quella regola può essere espressa
come vincolo di unicità nello schema invece che come controllo applicativo prima di scrivere. Se
sì, il vincolo di database va sempre scritto, anche quando esiste già un controllo applicativo:
il controllo applicativo migliora l'esperienza (un messaggio di errore chiaro prima di tentare
la scrittura), il vincolo di database garantisce la correttezza anche quando il controllo
applicativo ha un bug o viene bypassato da un percorso di codice non previsto.
