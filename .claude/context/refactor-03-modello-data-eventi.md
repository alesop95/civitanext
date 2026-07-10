# Refactor 03 — La data di un evento come `DateTime` unico, non `day`/`month` separati

Riferimento: voce 3 di `studio-didattico-master.md`.

## Prima (prototipo, `design_handoff_civitanext/civitanext-data.jsx`)

I dati demo modellano ogni evento con campi pensati per essere scritti a mano in un array
statico di giugno 2026 (struttura ricostruita dalla lettura del file, non citazione letterale
riga per riga):

```js
{ day: 18, month: 'GIU', title: '...', time: '18:30', place: '...', cat: '...' }
```

Funziona per una manciata di eventi in un solo mese di demo. Non regge un calendario reale:
niente anno (eventi del 2027 sarebbero indistinguibili da quelli del 2026), niente ordinamento
cronologico corretto senza una mappa manuale mese-stringa → numero, niente modo nativo di
rispondere a "quali eventi sono tra il 10 e il 20 del mese prossimo" senza logica di parsing
scritta a mano.

## Dopo (`prisma/schema.prisma`)

```prisma
model Event {
  id          String   @id @default(cuid())
  title       String
  description String
  date        DateTime
  location    String
  category    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Un solo campo `date: DateTime` è la fonte di verità completa (anno, mese, giorno, ora, fuso).
Quando la UI del calendario avrà bisogno di "18 GIU", quella stringa si deriva formattando
`date` al momento del rendering (per esempio con `Intl.DateTimeFormat` o una utility dedicata),
non si legge da un campo parallelo che potrebbe disallinearsi dal vero valore.

## Come estendere il pattern

Quando un nuovo modello dati sembra richiedere due o più campi che rappresentano aspetti diversi
della stessa informazione (un timestamp scomposto, un prezzo diviso in interi e centesimi, un
nome diviso in nome e cognome quando basterebbe un campo unico ricercabile), la domanda è se uno
dei campi è derivabile dall'altro con una funzione pura. Se sì, si conserva solo la
rappresentazione più ricca e si derivano le altre a valle, in UI o in una funzione di utilità
condivisa, non in un secondo campo persistito che può andare fuori sincrono.
