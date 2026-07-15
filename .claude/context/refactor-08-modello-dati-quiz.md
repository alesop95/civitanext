# Refactor 08 — Il modello dati del Quiz: dallo schema minimo a uno strumento di apprendimento

Riferimento: voce 8 di `studio-didattico-master.md`.

## Prima (lettura minima del prototipo, non scritta di proposito)

Il prototipo di design (`design_handoff_civitanext/civitanext-data.jsx`) rappresenta un quiz così:

```js
const CN_QUIZZES = [
  { id: 1, title: 'Educazione civica: le basi', desc: '4 domande su voto, comune e partecipazione', n: 4, time: '~2 min', done: false },
  { id: 2, title: 'Quanto conosci la tua città?', desc: 'Storia e luoghi di Civitanova Marche', n: 8, time: '~5 min', done: false, locked: true },
  // ...
];
```

Uno schema minimo che seguisse solo questa forma userebbe un flag `done: Boolean` per tentativo
(nessuna distinzione tra un punteggio basso e uno alto), un solo tentativo per sempre, e nessuna
logica reale dietro `locked` (solo un valore statico deciso a mano nel mockup).

## Dopo (schema reale, `prisma/schema.prisma`)

```prisma
model Quiz {
  id          String   @id @default(cuid())
  title       String
  description String
  order       Int      @default(0)

  questions QuizQuestion[]
  attempts  QuizAttempt[]
}

model QuizOption {
  id         String       @id @default(cuid())
  questionId String
  question   QuizQuestion @relation(fields: [questionId], references: [id])
  text       String
  isCorrect  Boolean      @default(false)

  answers QuizAnswer[]
}

model QuizAttempt {
  id     String @id @default(cuid())
  userId String
  quizId String
  score  Int
  total  Int

  answers QuizAnswer[]

  @@unique([userId, quizId])
}

model QuizAnswer {
  id         String      @id @default(cuid())
  attemptId  String
  questionId String
  optionId   String
  isCorrect  Boolean

  @@unique([attemptId, questionId])
}
```

`QuizAnswer` è la differenza che conta: una riga per ogni risposta data in un tentativo, non solo
il punteggio finale. Senza questa tabella, dopo l'invio del quiz si potrebbe dire solo "hai preso
3 su 4", mai "hai sbagliato la domanda sulla giunta comunale, la risposta giusta era questa" — il
feedback che rende un quiz uno strumento per imparare invece di un voto muto.

`@@unique([userId, quizId])` su `QuizAttempt` significa una sola riga per utente per quiz, non
uno storico: ripetere il quiz aggiorna quella riga (e sostituisce le `QuizAnswer` collegate) solo
se il nuovo punteggio supera il precedente — logica scritta nel codice applicativo che gestirà il
submit, non nello schema stesso, che si limita a impedire due righe per la stessa coppia
utente/quiz.

Lo sblocco progressivo usa il campo `order` su `Quiz`, calcolato al momento dell'uso (una query
che verifica se esiste un `QuizAttempt` per il quiz con `order` immediatamente precedente),
invece di un campo booleano salvato che potrebbe disallinearsi dallo stato reale se un tentativo
viene cancellato o corretto.

## Come estendere il pattern

Quando si porta un prototipo di design nel codice reale, la domanda da farsi prima di scrivere
lo schema non è "che forma ha il dato nel mockup" ma "a cosa serve davvero questa feature per chi
la userà". Un flag binario `done` risponde bene alla domanda "il mockup mostra questo stato?" ma
non risponde a "come faccio a mostrare all'utente cosa ha sbagliato" o "come lo incoraggio a
riprovare" — domande che vengono dallo scopo della feature, non dalla sua forma visiva. Due
funzionalità che sembrano simili in superficie (un quiz e una verifica a punteggio secco) possono
richiedere schemi diversi, anche partendo dallo stesso mockup, se il loro scopo reale diverge.
