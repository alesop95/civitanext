# Refactor 11 — Timeline e rassegna stampa: il tipo di un campo si deduce dall'uso, non dal prototipo

Riferimento: voce 11 di `studio-didattico-master.md`. Nessuna ADR dedicata: scelte di
modellazione minori, stessa classe dei sondaggi e degli spazi civici.

## Il punto di partenza: cosa dice il prototipo

Il prototipo di design memorizza le due sezioni come array statici in
`design_handoff_civitanext/civitanext-data.jsx`. È utile guardarli insieme, perché contengono
entrambi una data e una categoria, e la tentazione naturale è trattarle allo stesso modo.

```jsx
const CN_PRESS = [
  { id: 1, source: 'Cronache Maceratesi', date: '8 giugno 2026',
    title: 'I giovani di CivitaNext lanciano la piattaforma...', comments: 6 },
];

const CN_TIMELINE = [
  { id: 1, when: 'Da completare', title: 'Le origini della città',
    text: 'Materiale storico da raccogliere...', photo: true, kind: 'citta' },
  { id: 4, when: 'Gennaio 2026', title: 'Nasce CivitaNext',
    text: 'Dodici giovani fondano l\'associazione.', photo: false, kind: 'cn' },
];
```

Tutto è stringa o flag: la data dell'articolo è testo italiano, il periodo della voce storica è
testo che a volte non è nemmeno una data, il tipo di voce è una sigla libera. Per un prototipo
con dati fissi va benissimo: nessuno ordina, nessuno valida, i dati sono scritti a mano una
volta e letti così come sono. In un database alimentato da un form amministrativo, ognuna di
queste scelte va rimessa in discussione chiedendosi cosa il codice farà davvero con quel valore.

## La data dell'articolo: si ordina, quindi è una data vera

L'unico ordinamento sensato per una rassegna stampa è dal più recente al più vecchio. Una data
memorizzata come "8 giugno 2026" non lo permette: l'ordinamento alfabetico su quelle stringhe
mette "24 maggio 2026" dopo "8 giugno 2026" e non esiste query SQL[^1] ragionevole che le
confronti cronologicamente. La colonna diventa quindi una `DateTime`, e il testo italiano torna
a essere ciò che è sempre stato: una scelta di presentazione, applicata al momento del rendering
con il formatter locale già in uso nelle altre pagine del progetto.

```prisma
// prisma/schema.prisma
model PressArticle {
  id          String   @id @default(cuid())
  source      String
  title       String
  url         String?
  publishedAt DateTime
  createdAt   DateTime @default(now())
}
```

```tsx
// src/app/rassegna-stampa/page.tsx
const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric", month: "long", year: "numeric",
});
// ...
const articles = await prisma.pressArticle.findMany({ orderBy: { publishedAt: "desc" } });
```

La query dichiara l'ordinamento e il database lo esegue su un tipo che sa confrontare; la
stringa "8 giugno 2026" non esiste da nessuna parte se non nel momento in cui l'utente la legge.
Il campo `url` è la seconda differenza rispetto al prototipo, che non lo aveva: una rassegna
stampa reale rimanda agli articoli, ma il campo resta opzionale perché un pezzo uscito solo su
carta è un caso legittimo, non un errore da respingere.

## Il periodo della voce storica: non si ordina, quindi resta testo, e l'ordine diventa un campo

La timeline sembra il caso identico e non lo è. Le voci storiche del prototipo valgono "Da
completare" (la raccolta del materiale con la biblioteca comunale è un compito dichiarato non
tecnico e ancora aperto) oppure varranno epoche come "Anni '50", che nessun tipo data esprime
senza inventare una precisione che la fonte non ha. Forzare una `DateTime` qui costringerebbe
chi inserisce a mentire (un 1 gennaio 1950 fittizio) e la menzogna riaffiorerebbe in pagina.
Il campo `when` resta quindi testo libero.

Questa scelta ha un costo immediato e va pagato esplicitamente: se `when` non è ordinabile,
l'ordine cronologico della timeline non ha più una fonte naturale. La soluzione è lo stesso
meccanismo già adottato per lo sblocco progressivo dei quiz, un campo `order` intero che
l'amministratore controlla.

```prisma
// prisma/schema.prisma
model TimelineEntry {
  id        String       @id @default(cuid())
  when      String
  title     String
  text      String
  kind      TimelineKind
  order     Int          @default(0)
  createdAt DateTime     @default(now())
}
```

```tsx
// src/app/timeline/page.tsx
const entries = await prisma.timelineEntry.findMany({
  orderBy: [{ order: "asc" }, { createdAt: "asc" }],
});
```

Il secondo criterio di ordinamento, `createdAt`, spareggia le voci a pari `order` in modo
stabile: due voci lasciate entrambe a 0 compaiono nell'ordine di inserimento invece che in un
ordine non deterministico. È lo stesso genere di compromesso deliberato del vincolo di voto dei
sondaggi: la correttezza dell'ordinamento non è garantita dallo schema ma affidata a chi
amministra, e in cambio il modello resta capace di rappresentare la realtà com'è, epoche vaghe
comprese.

## Il tipo di voce: insieme chiuso che pilota il rendering, quindi enum

Il campo `kind` distingue le voci sulla storia della città dalle tappe dell'associazione, e la
pagina lo usa per differenziare il rendering (il pallino della timeline e l'etichetta cambiano
colore). Il progetto ha già un campo che assomiglia a questo, `Event.category`, e lì la scelta
era stata la stringa libera: le categorie di eventi sono un insieme aperto, l'associazione ne
inventerà di nuove e nessun consumatore prende decisioni di codice sul valore. Qui è vero
l'opposto su entrambi i fronti: i valori possibili sono esattamente due e il codice ci fa
branching. La forma giusta è un enum, che PostgreSQL fa rispettare a livello di colonna.

```prisma
// prisma/schema.prisma
enum TimelineKind {
  CITTA
  ASSOCIAZIONE
}
```

La server action riconvalida il valore prima di passarlo a Prisma, perché il `select` del form
è una cortesia dell'interfaccia, non una garanzia: un POST[^2] costruito a mano può contenere
qualsiasi stringa, e senza il controllo esplicito l'errore emergerebbe come eccezione Prisma a
runtime invece che come risposta controllata.

```ts
// src/app/admin/timeline/actions.ts
if (kind !== "CITTA" && kind !== "ASSOCIAZIONE") redirect("/admin/timeline/nuovo?error=1");
```

Lo stesso principio di diffidenza verso l'input vale per il link dell'articolo di stampa: la
pagina pubblica lo renderizza come `href` di un'ancora, e un valore arbitrario come
`javascript:...` diventerebbe codice eseguibile al clic. Il controllo lato server accetta solo
indirizzi assoluti `http(s)`.

```ts
// src/app/admin/rassegna-stampa/actions.ts
if (url && !/^https?:\/\//.test(url)) redirect("/admin/rassegna-stampa/nuovo?error=2");
```

È la prima volta che il pattern del form amministrativo ha due errori distinti da comunicare, e
la soluzione è rimasta dentro la convenzione esistente (`?error=N` nella query string) con una
mappa di messaggi nella pagina, invece di introdurre un sistema di messaggistica nuovo per un
bisogno così piccolo.

## Le omissioni deliberate: comments e photo non entrano nello schema

Il prototipo assegna agli articoli un conteggio `comments` ("6 commenti dei soci") e alle voci
di timeline un flag `photo`. Nessuno dei due è entrato nello schema, per lo stesso criterio dei
tipi: un campo si aggiunge quando il sistema ne fa qualcosa. Un conteggio di commenti
presuppone un sistema di commenti agli articoli che non esiste, e le discussioni dei soci hanno
già una casa nel forum; se un giorno si vorrà commentare la rassegna, la strada naturale sarà
collegare o creare thread, non una colonna intera anticipata oggi. Il flag `photo` presuppone
immagini caricate, e l'upload aspetta la decisione di storage della galleria fotografica
(ADR-004/005, confronto ancora da fare): un boolean che promette una foto impossibile da
mostrare sarebbe debito puro. Omettere è reversibile: aggiungere una colonna dopo è una
migrazione additiva banale, togliere una colonna sbagliata dopo che qualcuno l'ha riempita non
lo è mai.

## Come estendere il pattern

Quando una prossima feature porterà un campo che assomiglia a una data o a una categoria, la
sequenza di domande è questa. Il codice ordinerà o filtrerà per quel valore? Allora serve un
tipo che il database sa confrontare (`DateTime`, numero), e la forma leggibile è compito del
rendering. Il valore deve poter essere vago o non ancora noto? Allora testo libero, e ogni
funzione che prima derivava dall'ordinabilità (l'ordinamento, il raggruppamento) va promossa a
campo esplicito, con il suo costo dichiarato. L'insieme dei valori è chiuso e il codice ci fa
branching? Enum nello schema e riconvalida nella server action. È aperto e puramente
descrittivo? Stringa libera, come `Event.category`. E un campo che il sistema oggi non usa non
si aggiunge, nemmeno se il prototipo lo mostra: il prototipo documenta l'aspetto delle
interfacce, il contratto dei dati lo scrive chi sa cosa il codice ne farà.

[^1]: *SQL*, Structured Query Language - il linguaggio con cui si interrogano i database
relazionali; l'ordinamento di una query (`ORDER BY`) confronta i valori con la semantica del
loro tipo di colonna, quindi testo alfabeticamente e date cronologicamente.

[^2]: *POST*, uno dei metodi del protocollo HTTP - il tipo di richiesta con cui un form invia
dati al server; chiunque può costruirne una senza passare dal form, quindi i vincoli
dell'interfaccia (campi `required`, opzioni di un `select`) non sono garanzie per il server.
