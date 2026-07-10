# Studio didattico — CivitaNext

> Racconto evolutivo, distinto dalle schede di stato: non registra *cosa* è vero oggi (quello
> vive in `STACK.md` e nelle altre schede), registra *come* e *perché* certe scelte sono un salto
> di qualità rispetto alla forma più ingenua. Cresce per voci numerate in ordine cronologico, mai
> riordinate. Adottata a partire da questo blocco di lavoro (Fase 0), non retroattiva sui commit
> precedenti.

## 1. Il tema colore come variabile CSS, non come classe Tailwind statica

Contesto. Il design system di Fase 0 porta i token del prototipo (`design_handoff_civitanext/README.md`)
in `webapp/src/app/globals.css` e nei componenti di `webapp/src/components/ui/`.

Com'era e perché era fragile. Nel prototipo (`civitanext-ui.jsx`), l'accento colore è già una
variabile CSS (`var(--accent)`) usata da JavaScript sparso in ogni componente grafico. La
tentazione, ricostruendo in Tailwind, sarebbe stata di "tradurre" quel valore in una classe
statica tipo `bg-[#E8503A]` ripetuta ovunque serve: più vicina alle abitudini Tailwind, ma
fragile esattamente dove il prototipo dichiara che l'accento è "tweakable" (blu, verde, viola
testati come alternative). Con un valore statico, cambiare tema significherebbe trovare e
sostituire la stessa stringa esadecimale in decine di file.

Il salto senior e perché è meglio. La variabile resta un'unica fonte di verità in `:root`
(`webapp/src/app/globals.css`), e Tailwind la referenzia tramite `@theme inline` invece di
duplicarne il valore: `--color-accent: var(--accent)` genera comunque le utility `bg-accent`,
`text-accent`, ecc., ma il colore vero resta definito in un solo punto. Cambiare tema, anche a
runtime con un futuro selettore, significa riassegnare quella singola variabile, non toccare il
codice dei componenti. Il compromesso dichiarato: si perde la possibilità di vedere il colore
esatto scorrendo le classi Tailwind nel markup, un costo accettabile per la rideclinabilità.

Dove leggere il dettaglio: `refactor-01-tema-runtime.md`.

## 2. Le grafiche decorative come Server Component, non componenti client con `useMemo`

Contesto. Le grafiche brand del prototipo (`Starburst`, generazione procedurale di un poligono a
raggi SVG) sono state ricostruite in `webapp/src/components/ui/Starburst.tsx`.

Com'era e perché era fragile. Nel prototipo (`civitanext-ui.jsx`), `Starburst` gira dentro una
SPA React interamente client-side: il calcolo del path SVG è avvolto in `useMemo` per evitare di
rifarlo ad ogni render dell'intera applicazione. Portare lo stesso pattern pari pari in Next.js
avrebbe significato marcare il componente `"use client"` solo per poter usare `useMemo`,
spedendo JavaScript al browser per generare un disegno che non cambia mai dopo il primo render.

Il salto senior e perché è meglio. In un framework con Server Component, la domanda giusta non è
"come memoizzo il calcolo" ma "il calcolo deve girare nel browser?". Qui la risposta è no: il
path SVG dipende solo dalle prop (`size`, `points`, `color`), non da stato del browser né da
interazione, quindi il componente resta un Server Component di default, il calcolo gira una sola
volta lato server in fase di rendering, e zero JavaScript aggiuntivo raggiunge il client per
questo componente. Il principio generale: `useMemo` risolve un problema di re-render ripetuti in
un componente client; se il componente non ha bisogno di essere client, il problema stesso
sparisce, non va solo mitigato.

Dove leggere il dettaglio: `refactor-02-server-component-grafiche.md`.

## 3. La data di un evento come `DateTime` unico, non come coppia di stringhe `day`/`month`

Contesto. Lo schema Prisma di Fase 0 (`webapp/prisma/schema.prisma`) definisce il modello
`Event` per la futura feature calendario.

Com'era e perché era fragile. Nei dati demo del prototipo (`civitanext-data.jsx`), ogni evento
ha campi separati `day: 18, month: 'GIU'`: comodissimo per popolare a mano una manciata di eventi
di giugno 2026 in un file statico, ma strutturalmente fragile per un calendario reale. Non
esprime l'anno, non ordina correttamente eventi a cavallo di più mesi o anni, non distingue
eventi allo stesso giorno per orario, e richiederebbe comunque una conversione ogni volta che
serve una vera operazione di data (confronto, filtro per intervallo, fuso orario).

Il salto senior e perché è meglio. Il modello `Event` usa un singolo campo `date: DateTime`,
il tipo nativo con cui Postgres e Prisma rappresentano un istante nel tempo completo di anno,
fuso e ora. Giorno e mese, quando servono per la UI (es. "18 GIU"), si derivano a valle con le
funzioni di formattazione data, non si duplicano come sorgente di verità separata. Il principio
generale: un dato derivabile (la rappresentazione testuale di una data) non è un campo a sé, è
una funzione di un dato più ricco già presente.

Dove leggere il dettaglio: `refactor-03-modello-data-eventi.md`.

## 4. Il vincolo di voto unico come regola di database, non come stato client sparso

Contesto. Lo schema Prisma di Fase 0 introduce la tabella `Vote`, anticipata rispetto al
perimetro letterale della Fase 0 del ROADMAP di handoff (che la colloca implicitamente dentro le
feature di Fase 1/2), per decisione esplicita discussa con l'utente.

Com'era e perché era fragile. Nel prototipo, "un voto per utente" su sondaggi, thread e proposte
è una convenzione applicata a mano in `localStorage`: chiavi diverse per tipo di contenuto,
nessun vincolo strutturale che impedisca a un bug (o a un utente che svuota selettivamente lo
storage) di produrre un doppio voto. La regola vive nella disciplina di chi scrive il codice
client, non in una garanzia del sistema.

Il salto senior e perché è meglio. La tabella `Vote` porta il vincolo `@@unique([userId,
targetType, targetId])` direttamente nello schema del database: un secondo tentativo di voto
sullo stesso bersaglio dallo stesso utente fallisce a livello di database, indipendentemente da
qualunque bug lato client o server. Il compromesso dichiarato, da non dimenticare: `targetId` è
generico (pattern polimorfico, punta a `Thread`, `Proposal` o un futuro `Poll` a seconda di
`targetType`) e quindi non è una vera foreign key, quindi il database garantisce l'unicità del
voto ma non che `targetId` esista davvero nella tabella dichiarata da `targetType` — quella
verifica resta responsabilità del codice applicativo che scriverà i voti, in Fase 1/2.

Dove leggere il dettaglio: `refactor-04-vincolo-voto-unico.md`.
