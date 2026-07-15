# Refactor 07 — Parallelizzare per file disgiunti e contratto d'interfaccia esplicito

Riferimento: voce 7 di `studio-didattico-master.md`.

## Il compito da dividere

Costruire "Eventi (lettura + RSVP)" toccava due aree: un header di navigazione condiviso (fino
ad allora scritto solo dentro `src/app/page.tsx`) e una nuova pagina `/eventi` con la sua server
action di RSVP. Due agenti in parallelo, non uno dopo l'altro.

## Prima (divisione ingenua, non fatta così di proposito)

Dividere per "argomento" senza guardare i file: "un agente fa l'header, un altro fa gli eventi"
sembra una divisione pulita finché non si nota che la pagina eventi deve *usare* l'header, e
l'header in quel momento non esiste ancora. Senza specificare la forma esatta di quel punto di
contatto, il secondo agente avrebbe dovuto indovinare nome, percorso e firma del componente
condiviso, oppure aspettare che il primo agente finisse, perdendo il vantaggio della
parallelizzazione.

## Dopo (partizione per file + contratto esplicito)

Prompt del primo agente (estratto): crea `src/components/SiteHeader.tsx`, esportato come

```ts
export async function SiteHeader({ activeHref }: { activeHref: string }) { ... }
```

Prompt del secondo agente (estratto): "Assumi che esista (scritto in parallelo da un altro
agente, stessa interfaccia) un componente `src/components/SiteHeader.tsx` che esporta
`export async function SiteHeader({ activeHref }: { activeHref: string })` [...] non toccare
`src/app/page.tsx` né altri file fuori da `src/app/eventi/`."

Le due istruzioni si completano: la firma è identica in entrambi i prompt (non lasciata
all'inferenza), e i file toccati non si sovrappongono (`src/components/SiteHeader.tsx` +
`src/app/page.tsx` da un lato, `src/app/eventi/**` dall'altro). Il secondo agente ha potuto
scrivere `import { SiteHeader } from "@/components/SiteHeader";` e usarlo prima ancora che il
file esistesse su disco, perché il contratto era già certo.

Dopo che entrambi hanno finito, l'integrazione si verifica con una sola build:

```
npm run build
```

non con una build per agente. Due build concorrenti nella stessa cartella di lavoro avrebbero
scritto nella stessa cache `.next` contemporaneamente, con un rischio di corruzione reciproca
che una singola build sequenziale, dopo che entrambi i lavori sono fermi, non corre.

## Come estendere il pattern

Prima di dividere un lavoro di codice tra esecutori paralleli, due domande, non una: quali file
tocca ciascuna parte, e sono davvero disgiunti? E dove le parti si toccano (un componente
condiviso, un tipo, un'interfaccia), quella forma va dichiarata per iscritto a entrambi gli
esecutori prima che partano, non scoperta durante l'integrazione. Se la divisione naturale del
lavoro produce una dipendenza che non si lascia rendere esplicita in anticipo (es. l'esecutore B
ha davvero bisogno di vedere il codice finito dell'esecutore A per procedere), quella non è una
buona coppia da parallelizzare: va fatta in sequenza, o la dipendenza va isolata in un terzo pezzo
da fare prima, per conto proprio, così le due parti restano davvero indipendenti.
