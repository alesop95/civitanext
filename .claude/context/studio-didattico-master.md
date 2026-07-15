# Studio didattico — CivitaNext

> Racconto evolutivo, distinto dalle schede di stato: non registra *cosa* è vero oggi (quello
> vive in `STACK.md` e nelle altre schede), registra *come* e *perché* certe scelte sono un salto
> di qualità rispetto alla forma più ingenua. Cresce per voci numerate in ordine cronologico, mai
> riordinate. Adottata a partire da questo blocco di lavoro (Fase 0), non retroattiva sui commit
> precedenti.

## 1. Il tema colore come variabile CSS, non come classe Tailwind statica

Contesto. Il design system di Fase 0 porta i token del prototipo (`design_handoff_civitanext/README.md`)
in `src/app/globals.css` e nei componenti di `src/components/ui/`.

Com'era e perché era fragile. Nel prototipo (`civitanext-ui.jsx`), l'accento colore è già una
variabile CSS (`var(--accent)`) usata da JavaScript sparso in ogni componente grafico. La
tentazione, ricostruendo in Tailwind, sarebbe stata di "tradurre" quel valore in una classe
statica tipo `bg-[#E8503A]` ripetuta ovunque serve: più vicina alle abitudini Tailwind, ma
fragile esattamente dove il prototipo dichiara che l'accento è "tweakable" (blu, verde, viola
testati come alternative). Con un valore statico, cambiare tema significherebbe trovare e
sostituire la stessa stringa esadecimale in decine di file.

Il salto senior e perché è meglio. La variabile resta un'unica fonte di verità in `:root`
(`src/app/globals.css`), e Tailwind la referenzia tramite `@theme inline` invece di
duplicarne il valore: `--color-accent: var(--accent)` genera comunque le utility `bg-accent`,
`text-accent`, ecc., ma il colore vero resta definito in un solo punto. Cambiare tema, anche a
runtime con un futuro selettore, significa riassegnare quella singola variabile, non toccare il
codice dei componenti. Il compromesso dichiarato: si perde la possibilità di vedere il colore
esatto scorrendo le classi Tailwind nel markup, un costo accettabile per la rideclinabilità.

Dove leggere il dettaglio: `refactor-01-tema-runtime.md`.

## 2. Le grafiche decorative come Server Component, non componenti client con `useMemo`

Contesto. Le grafiche brand del prototipo (`Starburst`, generazione procedurale di un poligono a
raggi SVG) sono state ricostruite in `src/components/ui/Starburst.tsx`.

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

Contesto. Lo schema Prisma di Fase 0 (`prisma/schema.prisma`) definisce il modello
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

## 5. Diagnosticare un bug di tooling con agenti paralleli, non accontentarsi del primo workaround

Contesto. Lo Step 5 di Fase 0 (schema dati) richiedeva applicare `prisma/schema.prisma` a un
Postgres reale locale (`npx prisma dev`) con `prisma migrate dev`, il comando che oltre a creare
le tabelle scrive un file di migrazione tracciato in `prisma/migrations/`.

Com'era e perché era fragile. Il comando falliva sempre con un errore criptico (`P1017`,
"Server has closed the connection"), che suona come un problema di rete o di connessione. Di
fronte a un errore così, la reazione più immediata sarebbe stata o riprovare alla cieca cambiando
parametri a caso nella stringa di connessione, oppure accontentarsi della prima alternativa che
funziona: `prisma db push`, che applica davvero lo schema al database ma non scrive alcun file di
migrazione. Sarebbe stato un downgrade silenzioso dell'obiettivo originale, da "cronologia di
migrazione tracciata e versionabile" a "schema sincronizzato al volo", senza nemmeno aver capito
perché il comando giusto non funzionasse.

Il salto senior e perché è meglio. Prima di accettare il downgrade, isolare la causa esatta con
log verboso (`DEBUG=prisma:*`): l'errore non era nella connessione in sé, dato che una query
singola (`prisma db execute`) funzionava perfettamente, ma in una chiamata interna specifica
(`devDiagnostic`) che il motore nativo di migrazione fa contro lo shadow database, il database
temporaneo che Prisma usa per calcolare il diff tra la cronologia di migrazioni esistente e lo
schema dichiarato. Isolato il punto esatto del fallimento, la ricerca della causa è stata
distribuita su tre agenti paralleli invece che su un'indagine seriale: uno cercava la causa nota
all'esterno (issue tracker, changelog ufficiale); uno testava chirurgicamente in locale quali
operazioni sullo shadow database funzionassero e quali no, senza mai eseguire il comando
incriminato per intero, apposta per non contaminare i risultati con tentativi concorrenti sullo
stesso server; uno verificava se una versione più recente del pacchetto risolvesse il problema. I
tre risultati indipendenti si sono confermati a vicenda sulla stessa causa (un bug tracciato ma
non confermato dal team Prisma) invece di lasciare a un solo canale di ricerca la parola finale.
Trovato il workaround esatto già riportato da chi aveva segnalato lo stesso bug (`migrate diff` +
`migrate deploy`, due comandi che non interpellano mai lo shadow database), l'obiettivo originale
è stato raggiunto per intero: esiste una cronologia di migrazione reale in `prisma/migrations/`,
non solo uno schema sincronizzato senza tracciamento. Il principio generale: quando un comando
fallisce con un errore che sembra ambientale, conviene isolare il livello esatto del fallimento
prima di declassare l'obiettivo a "quello che funziona per ora"; e quando l'indagine si divide in
sotto-domande indipendenti (causa nota, test locale, versioni disponibili), parallelizzarle costa
lo stesso tempo di una ricerca sola ma produce una convergenza che funge da verifica incrociata.

Dove leggere il dettaglio: `refactor-05-migrazione-shadow-database.md`.

## 6. Autorizzazione e tesseramento come assi separati, e la sessione calibrata sul rischio reale, non su un aut-aut da manuale

Contesto. L'apertura di Fase 1 richiedeva decidere come autenticare con NextAuth tre popolazioni
reali (superadmin, admin, utenti pubblici eventualmente tesserati), prima di scrivere qualunque
route.

Com'era e perché era fragile. Lo schema di Fase 0 (`Role { SOCIO, ADMIN }`, default `SOCIO`)
trattava "essere socio" come se fosse un livello di permesso invece che un dato di appartenenza:
comodo finché si immagina che ogni utente registrato sia per definizione un socio, ma la
piattaforma reale ammette anche partecipanti pubblici non tesserati, per cui quel default
avrebbe reso ogni nuovo utente "socio" per errore strutturale, non per scelta. Nella stessa prima
analisi, la scelta della sessione era stata impostata come un aut-aut tra due sole opzioni da
manuale (JWT senza stato, oppure sessione su database), decisa guardando solo al costo per
richiesta su un'infrastruttura serverless gratuita, senza che esistesse ancora un ruolo
abbastanza sensibile da rendere quel costo un compromesso vero da soppesare.

Il salto e perché è meglio. Quando lo scenario è stato corretto (tre popolazioni, tesseramento
indipendente dal ruolo, scala di 10.000 utenti), la stessa domanda ha prodotto risposte diverse
proprio perché il modello ora distingue due cose che prima erano fuse: l'autorizzazione (`Role`,
cosa un account può fare) e il tesseramento (`tesseraNumero`, un dato nullable su chi è
quell'account rispetto all'associazione). Un utente pubblico non tesserato e un socio tesserato
hanno esattamente lo stesso ruolo di default; la differenza è solo un campo, non un ramo diverso
del sistema di permessi. Sulla sessione, invece di scegliere tra i due estremi del manuale, la
soluzione calibrata sul rischio reale è un punto intermedio: JWT (evita una query di sessione per
ognuna delle richieste di 10.000 utenti) con scadenza breve e un ricontrollo mirato del ruolo al
rinnovo (limita a minuti, non a giorni, la finestra in cui un admin rimosso resta operativo). Il
principio generale: un ruolo utente e un attributo di dominio che gli somiglia (qui, l'appartenenza
a un'associazione) vanno tenuti su assi separati anche quando nella pratica coincidono spesso,
perché smettono di coincidere proprio nel caso che conta (l'utente pubblico non tesserato); e una
scelta binaria da manuale (stateless contro stateful) è quasi sempre una semplificazione dei casi
reali, che ammettono un punto intermedio calibrato sul profilo di rischio specifico, non sulla
ricetta generica.

Dove leggere il dettaglio: `refactor-06-ruoli-tesseramento-sessione.md`.

## 7. Parallelizzare due agenti per file disgiunti e contratto d'interfaccia esplicito, non per compiti che "sembrano" indipendenti

Contesto. Costruire la feature Eventi (lettura + RSVP) richiedeva sia un header di navigazione
condiviso (fino ad allora scritto solo inline nella home) sia una nuova pagina `/eventi` con la
relativa azione di RSVP. Su richiesta esplicita dell'utente di velocizzare, il lavoro è stato
diviso tra due agenti lanciati in parallelo invece che in sequenza.

Com'era e perché era fragile. La tentazione, dividendo un lavoro tra due esecutori paralleli, è
separare per "argomento" (uno fa l'header, l'altro fa gli eventi) senza guardare ai file toccati
né a chi dipende da chi: se i due compiti avessero condiviso anche un solo file, o se uno dei due
avesse dovuto indovinare la forma esatta di un componente scritto dall'altro, il risultato
sarebbe stato un conflitto in scrittura o un'incoerenza scoperta solo in fase di build, quando
ormai il lavoro di entrambi è già stato speso.

Il salto e perché è meglio. Prima di lanciare i due agenti, la divisione è stata fatta per
insiemi di file disgiunti verificati in anticipo (uno tocca solo `SiteHeader.tsx` e `page.tsx`,
l'altro solo `src/app/eventi/**`, nessuna sovrapposizione), e il punto di contatto tra i due
lavori, cioè la firma esatta del componente condiviso (`SiteHeader({ activeHref })`, non ancora
scritto quando il secondo agente ne aveva già bisogno per importarlo), è stato reso esplicito nel
prompt di ciascuno invece di lasciarlo all'inferenza: il secondo agente ha scritto codice contro
un'interfaccia dichiarata, non contro un file che poteva leggere. L'integrazione tra i due lavori
è stata verificata con un'unica build sequenziale dopo che entrambi avevano finito, non con build
concorrenti nella stessa cartella di lavoro, che avrebbero potuto corrompersi a vicenda scrivendo
nella stessa cache `.next`. Il principio generale: parallelizzare codice richiede innanzitutto
partizionare per file ed effetti collaterali disgiunti, non per compiti che sembrano indipendenti
a un primo sguardo; e ogni punto di contatto tra le parti va reso un contratto esplicito dichiarato
in anticipo a entrambi gli esecutori, non un dettaglio lasciato scoprire durante l'integrazione.

Dove leggere il dettaglio: `refactor-07-parallelizzazione-file-disgiunti.md`.
