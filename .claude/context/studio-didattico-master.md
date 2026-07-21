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

## 8. Un quiz civico è uno strumento per imparare, non un esame: e questo cambia lo schema, non solo la UI

Contesto. Il Quiz è la prima feature verticale di Fase 2 che introduce un dominio dati
completamente nuovo, non un riuso di schema già presente come eventi, forum o proposte. Il
prototipo di design mostra quiz a scelta multipla con un flag binario `done` per tentativo e
alcuni quiz marcati come bloccati.

Com'era e perché era fragile. La lettura più diretta del prototipo porterebbe a uno schema
minimo: un punteggio aggregato per tentativo, un solo tentativo permanente per utente per quiz
(il flag `done` non distingue "ho sbagliato" da "ho azzeccato tutto"), nessuna logica di sblocco
reale dietro il flag visivo `locked`. Funzionerebbe, ma tratterebbe il quiz come una verifica
puntuale: un errore resterebbe un voto fisso per sempre, e senza salvare quale risposta è stata
scelta per ogni domanda non si potrebbe mai dire all'utente cosa ha sbagliato, solo quanto.

Il salto e perché è meglio. La domanda giusta non era "come rappresento i dati del prototipo" ma
"a cosa serve davvero questa feature": non a certificare chi sa cosa, ma ad aiutare a imparare
l'educazione civica. Quella domanda cambia lo schema stesso, non solo come si presentano i
risultati: serve una riga per ogni risposta data (`QuizAnswer`, non solo un punteggio aggregato)
per poter mostrare il feedback domanda per domanda; serve poter ripetere il quiz tenendo il
punteggio migliore, non un tentativo permanente, perché sbagliare una volta non dovrebbe chiudere
la porta a riprovare; e lo sblocco progressivo tra quiz visto nel prototipo va implementato
davvero, non lasciato un dettaglio visivo, perché guida un percorso di apprendimento invece di
abbandonare l'utente a scegliere a caso. Il principio generale: quando si porta un prototipo di
design nel codice reale, la domanda "cosa serve salvare" non si risponde guardando solo la UI
mostrata, ma lo scopo dichiarato della feature; due feature che sembrano simili in superficie (un
quiz e una verifica a punteggio) possono richiedere schemi diversi se il loro scopo reale diverge.

Dove leggere il dettaglio: `refactor-08-modello-dati-quiz.md`.

## 9. Un'app installabile non è un'app nativa: rendere "app-like" l'app web esistente, non ricostruirla

Contesto. Fase 3 chiedeva di rendere CivitaNext utilizzabile bene da telefono e installabile
come una PWA, con una prima domanda esplicitamente aperta nel documento di handoff: layout
responsive unico o shell mobile dedicata.

Com'era e perché era fragile. "Rendere l'app mobile" suona come un problema che invita a
costruire qualcosa di nuovo e parallelo: una shell dedicata con le sue route, i suoi componenti,
la sua tab bar propria, pensata da zero per il touch. Per un prodotto con un team grande e budget
per due interfacce, potrebbe anche avere senso. Per un'associazione con un solo sviluppatore, è
il tipo di scelta che raddoppia silenziosamente il costo di ogni feature futura: da quel momento
in poi, ogni nuova pagina andrebbe scritta e verificata due volte, una per desktop e una per la
shell mobile, per anni.

Il salto e perché è meglio. La domanda giusta non era "come costruisco l'esperienza mobile" ma
"quanto della mia app web esistente è già mobile, se la guardo bene": le griglie di eventi e
proposte usavano già `grid-cols-1 sm:grid-cols-2`, una colonna su schermi stretti, senza che
nessuno l'avesse deciso esplicitamente come strategia. Il salto è stato riconoscere che l'app era
già per buona parte responsive, e che il pezzo mancante (una navigazione che regge su uno
schermo stretto) si poteva aggiungere come una variante dello stesso componente header già
esistente, non come un sistema a parte. Lo stesso principio vale per l'installabilità: una PWA
non è un'app nativa ricostruita, è la stessa app web con due file in più (un manifesto, un
service worker) che le permettono di comportarsi come un'app quando l'utente la installa. Il
service worker scritto è stato tenuto deliberatamente minimo (solo una pagina di cortesia
offline, nessuna cache aggressiva dei contenuti) proprio perché l'app esistente non è stata
pensata per funzionare offline: dichiarare quel limite è più onesto che promettere un'esperienza
offline ricca e non mantenerla. Il principio generale: quando un requisito nuovo (mobile,
installabilità, un'altra piattaforma) sembra chiedere una ricostruzione, vale la pena controllare
quanto del lavoro esistente lo soddisfa già in parte, e innestare il resto come estensione
incrementale invece di duplicare quello che già funziona.

Dove leggere il dettaglio: `refactor-09-responsive-e-pwa.md`.

## 10. La libreria più famosa non è per questo la scelta giusta: il bisogno reale decide, non il nome che viene in mente per primo

Contesto. La Mappa della città (Fase 4) è la prima feature che richiede scegliere una libreria
esterna per una capacità che il codice del progetto non ha mai avuto: disegnare una mappa
geografica interattiva con pin. Il prototipo di design non aiuta a scegliere, perché il suo
`MapView` non è una mappa vera: è un'immagine statica con pin posizionati via coordinate x/y
percentuali, un placeholder dichiarato tale dal roadmap stesso ("da integrare Leaflet/Mapbox con
pin reali").

Com'era e perché era fragile. Di fronte a "ci serve una mappa", il primo nome che viene in mente
quasi a chiunque è Google Maps: è la mappa che tutti hanno già usato, la documentazione è ottima,
funziona bene. Scegliere per notorietà, però, avrebbe agganciato la feature a un account Google
da configurare e a una chiave fatturabile, esattamente la stessa frizione di account esterno che
nello stesso blocco di lavoro si è appena deciso di rimandare per il login ("Procediamo con B",
la scelta di aspettare l'account dedicato dell'associazione invece di usarne uno personale). Il
secondo nome che viene in mente, Mapbox, è più aperto ma ha lo stesso problema: un account e un
token da creare, un'altra dipendenza esterna con soglie di utilizzo gratuito da monitorare, per un
bisogno reale che è solo "pochi pin su una mappa di una città", non un prodotto cartografico
interattivo complesso.

Il salto senior e perché è meglio. La domanda giusta non è "qual è la libreria di mappe più
famosa o più potente", ma "cosa richiede davvero questo bisogno, e cosa costa in più ogni
alternativa oltre alla libreria in sé". Leaflet, la scelta meno appariscente delle tre, è anche
l'unica che non chiede nessun account né chiave API per l'uso base: nessuna dipendenza da un
servizio esterno da configurare, nessuna soglia di utilizzo da monitorare, coerente con lo stesso
principio appena applicato al login (rimandare un account esterno finché non è l'associazione
stessa a possederlo). Il costo esatto della scelta più semplice non sparisce, si sposta soltanto:
il tile server pubblico di OpenStreetMap sconsiglia un uso di produzione pesante, un limite
accettato oggi perché il traffico reale del sito è piccolo, e risolvibile in futuro cambiando solo
l'indirizzo del livello di tile, non la libreria. Il principio generale: quando una scelta tecnica
sembra ovvia perché è il nome più noto, vale la pena chiedersi cosa quella notorietà porta con sé
oltre alla funzionalità (un account, una fatturazione, una dipendenza da un'azienda terza), e
confrontarlo con quello che il bisogno reale, oggi, effettivamente richiede.

Dove leggere il dettaglio: `refactor-10-mappa-leaflet.md`.

## 11. Lo stesso concetto non merita sempre lo stesso tipo: come si modellano una data e una categoria dipende da cosa se ne fa il codice

Contesto. Timeline della città e rassegna stampa (Fase 4) sono due feature gemelle nel pattern
(contenuto informativo curato da un admin, elenco pubblico, nessuna relazione con altri modelli,
lo stesso schema di spazi civici) e sono state costruite insieme. Il punto interessante non è il
pattern, già consolidato, ma il fatto che i due modelli contengono entrambi una data e una
categoria, e in ciascun caso la scelta di tipo è stata opposta.

Com'era e perché era fragile. Il prototipo di design memorizza tutto come testo: la data di un
articolo di stampa è la stringa italiana "8 giugno 2026", il periodo di una voce di timeline è
"Gennaio 2026" oppure "Da completare", il tipo di voce è la stringa 'citta' o 'cn'. Copiare quei
campi alla lettera nello schema del database sarebbe stata la via più rapida, ma avrebbe
incorporato tre fragilità diverse. Una data testuale non si ordina: "24 maggio 2026" viene dopo
"8 giugno 2026" in ordine alfabetico, e una rassegna stampa che non sa mostrare l'articolo più
recente per primo ha fallito il suo unico compito. Una categoria a stringa libera accetta
qualsiasi refuso ('cittá', 'CN') e ogni consumatore deve difendersene. E il prototipo trascina
anche campi che puntano a sistemi che non esistono (il conteggio commenti degli articoli, il
flag foto delle voci storiche): copiarli avrebbe creato colonne vuote in attesa di feature mai
decise.

Il salto senior e perché è meglio. La domanda giusta per ogni campo non è "che tipo ha nel
prototipo" ma "che operazioni farà il codice su questo valore". La data dell'articolo serve a
ordinare l'elenco, quindi diventa una data vera (`DateTime`) e il testo italiano torna a essere
solo una formattazione di presentazione. Il periodo della voce di timeline non serve a ordinare
ma a raccontare, e deve poter valere "Anni '50" o "Da completare", valori che nessun tipo data
esprime: resta testo libero, e l'ordinamento, che così perde la sua fonte naturale, viene
promosso a campo esplicito (`order`, lo stesso meccanismo dello sblocco progressivo dei quiz).
Il tipo di voce pilota il rendering con due soli valori possibili, quindi diventa un enum che il
database stesso fa rispettare, mentre la categoria di un evento resta stringa libera perché lì
l'insieme è aperto per natura. Anche le omissioni seguono lo stesso criterio: i commenti dei
soci hanno già una casa (il forum) e il flag foto aspetterebbe una decisione di storage non
ancora presa, quindi nessuno dei due entra nello schema. Il principio generale: il prototipo
documenta l'aspetto dei dati, non il loro contratto; il tipo giusto di ogni campo si deduce
dall'uso che il sistema ne farà, e due campi che sembrano "la stessa cosa" in due modelli vicini
possono legittimamente avere tipi opposti.

Dove leggere il dettaglio: `refactor-11-modellare-tempo-e-categorie.md`.

## 12. L'automatismo è un ospite dei campi, non il padrone: il picker sulla mappa e la geocodifica inversa

Contesto. Durante la verifica browser della mappa (Fase 4), l'utente ha osservato che scrivere
latitudine e longitudine a mano è ostile per chi amministra: le coordinate non le conosce
nessuno a memoria. Da quel feedback, in due passi confrontati insieme, il form del punto mappa
ha guadagnato prima un selettore visuale (clic sulla mappa) e poi la compilazione automatica di
luogo e titolo dal punto cliccato.

Com'era e perché era fragile. Il form chiedeva numeri nudi, con una nota che rimandava a
openstreetmap.org per trovarli: funzionava, ma spostava sull'utente un lavoro di trascrizione
che la macchina sa fare meglio, con il rischio concreto di invertire lat/lng o sbagliare un
segno, errori che il range check lato server non può riconoscere (una coordinata valida ma
sbagliata è comunque valida). C'era anche un vincolo architetturale nascosto: i campi del form
vivevano nella pagina, un Server Component, e nessun clic su una mappa client avrebbe mai
potuto scriverli da lì.

Il salto senior e perché è meglio. Tre mosse distinte. La prima è di confine: i campi che un
componente client deve poter compilare devono appartenere a quel componente client; il form e
la server action restano lato server, e il contratto tra i due mondi è solo l'attributo `name`
dei campi, che la action riceve identico a prima. La seconda è di rispetto dell'input umano:
l'automatismo compila un campo finché l'utente non ci scrive dentro, e da quel momento non lo
tocca mai più (un flag "dirty" per campo); il valore calcolato è un suggerimento, quello
scritto a mano è una decisione. La terza è di degrado controllato verso il servizio esterno:
la geocodifica inversa usa Nominatim di OpenStreetMap, che come Leaflet non chiede né account
né chiave (coerente con ADR-013), ma resta un servizio di rete che può fallire; il fallimento
mostra un avviso e lascia il form pienamente utilizzabile a mano, e un nuovo clic annulla la
richiesta precedente ancora in volo così che vinca sempre l'ultimo punto scelto, mai una
risposta arrivata in ritardo. Il principio generale: quando si automatizza la compilazione di
un form, l'automatismo va trattato come un ospite, che aiuta finché l'umano non ha parlato e
sparisce senza danni quando la rete non risponde.

Dove leggere il dettaglio: `refactor-12-picker-geocodifica.md`.

## 13. Testare senza poter renderizzare: una fondazione scelta dai vincoli reali del progetto, non da convenzione

Contesto. Cinque fasi chiuse, nove verticali, zero framework di test installato: ogni feature
verificata solo a mano nel browser, compresi i bug reali gia' trovati cosi' (il ritorno
silenzioso di `createProposal`/`createThread` su un campo vuoto, il redirect mancante in
`/accedi`). Su richiesta dell'utente di arrivare a una fase di sviluppo matura con un piano di
test affidabile, prima di scrivere una riga di configurazione si e' cercata la documentazione
reale spacchettata con Next 16.2.10 in `node_modules/next/dist/docs`, non affidandosi a
convenzioni generiche su Next.js.

Com'era e perche' era fragile. La verifica manuale nel browser, per quanto disciplinata (ogni
fase di questo progetto la documenta con dettaglio), non lascia una rete di sicurezza contro la
regressione: niente impedisce che una modifica a una feature rompa silenziosamente un'altra
gia' verificata mesi prima, e ogni nuova fase aumenta la superficie da ricontrollare a mano.
Inoltre la scelta ovvia, "Jest perche' e' il piu' noto", si sarebbe rivelata disallineata dalla
piattaforma reale: la guida ufficiale di Next 16 per l'App Router copre solo Vitest, non lo
cita nemmeno, e Jest avrebbe richiesto una configurazione aggiuntiva (`next/jest`, trasformazione
Babel) per una piattaforma che gia' lo sconsiglia implicitamente.

Il salto senior e perche' e' meglio. La fondazione scelta non e' un pacchetto di convenzioni
generiche "come si testa un'app Next.js", ma la conseguenza diretta di due fatti concreti
verificati nella documentazione reale del progetto. Primo: Vitest non sa renderizzare Server
Component asincroni (dichiarazione esplicita della guida ufficiale), e quasi tutte le pagine di
questo progetto lo sono, quindi la copertura Vitest si ferma dove il vincolo lo permette, le
server action (funzioni asincrone, non componenti), e tutto cio' che richiede vedere una pagina
renderizzata passa da un browser vero, Playwright. Secondo: la guida che Next stesso usa per
validare un adapter di deploy custom, la stessa categoria dell'adapter Cloudflare di questo
progetto, e' scritta attorno a Playwright, non a caso lo stesso strumento scelto per l'e2e:
questo ha permesso di aggiungere un secondo job CI che builda con l'adapter OpenNext reale e
chiude una domanda lasciata esplicitamente aperta da ADR-006 (se il bug di build osservato su
Windows fosse del toolchain o dell'adapter), invece di continuare a rimandarla al primo deploy.
Il perimetro della prima suite e' stato dimensionato sul rischio gia' dimostrato (la logica gia'
toccata da bug reali) piuttosto che sulla copertura totale del pregresso, una scelta esplicita
tra tre opzioni presentate, non decisa in autonomia. Un effetto laterale non pianificato ma
istruttivo: costruire ed eseguire davvero questa fondazione, non solo scriverla, ha fatto
emergere tre problemi reali che la sola verifica manuale su `next dev` non avrebbe mai potuto
mostrare, perche' vivono esattamente nella differenza tra ambiente di sviluppo e produzione
(NextAuth che rifiuta le richieste in modalita' produzione senza `trustHost`), tra test isolati e
test paralleli su un database condiviso (corruzione reciproca dei dati senza
`fileParallelism: false`), e tra un'esecuzione singola e una ripetuta (un seed non idempotente
che sembra un test rotto quando e' solo lo stato residuo del run precedente). Nessuno dei tre era
un bug della logica applicativa: erano tutti bug della fondazione di test stessa, trovati solo
perche' si e' insistito a farla girare per davvero invece di fermarsi alla scrittura del codice.

Dove leggere il dettaglio: `refactor-13-piano-test.md`.

## 14. Un numero che si calcola non si disallinea: la reputazione come funzione dei dati, non come contatore

Com'era la tentazione fragile. La reputazione di un socio, punti piu' livello piu' badge, sembra
il caso tipico di un contatore da mantenere: una colonna `points` su `User`, incrementata a ogni
iscrizione a un evento, a ogni quiz completato, a ogni proposta o voto. E' l'implementazione che
viene in mente per prima ed e' anche quella che si rompe per prima. Ogni azione che da' punti deve
ricordarsi di aggiornare il contatore, e basta una che se ne dimentica, o un record cancellato a
monte senza decremento, perche' il numero mostrato smetta di corrispondere alla realta'. Peggio,
le nove verticali gia' chiuse hanno prodotto attivita' reale, iscrizioni, tentativi, proposte e
voti, senza alcun contatore: adottarne uno ora significherebbe scrivere anche un backfill che
ricostruisce lo storico, cioe' esattamente il calcolo che si voleva evitare di rifare a ogni
caricamento, eseguito una volta e poi congelato in un numero destinato a divergere di nuovo.

Il salto senior e perche' e' meglio. La reputazione non e' un dato da conservare, e' una domanda
da porre ai dati che gia' esistono. Punti, livelli e badge sono una funzione pura di cio' che c'e'
gia' in database: quante iscrizioni, quanti tentativi di quiz, quante proposte, quanti voti, da
quanto tempo si e' tesserati. Calcolarla in lettura a ogni caricamento significa che il numero
mostrato e', per costruzione, sempre la verita' corrente: non esiste uno stato parallelo che possa
disallinearsi, non c'e' un backfill da scrivere, non c'e' un aggancio da ricordare su ogni azione
futura. E' la stessa mossa gia' fatta due volte nel progetto senza chiamarla per nome: lo sblocco
progressivo del quiz e' calcolato in query dall'esistenza del tentativo precedente (ADR-011), e le
percentuali dei sondaggi si contano al momento invece di mantenere un totale. Il prezzo teorico e'
ricalcolare a ogni caricamento; alla scala reale, soci nell'ordine delle decine e quattro conteggi
aggregati, e' trascurabile, e in cambio la logica di punteggio diventa una funzione pura testabile
senza database, coperta da otto casi che girano anche in pre-commit, dove il Postgres di test non
c'e'. La stessa scelta porta con se' la propria estensibilita': aggiungere un nuovo modo di
guadagnare punti e' una riga nel catalogo, non una migrazione ne' un campo nuovo da mantenere.

Dove leggere il dettaglio: `refactor-14-reputazione-calcolata.md`.

## 15. Il file che il server non vede per intero non si puo' validare davvero: perche' la galleria foto passa dal server, non dal browser dritto su R2

Com'era la tentazione fragile. Per il primo upload di file del progetto, l'opzione che si
presenta come piu' moderna e piu' economica in banda e' una URL presigned: il server firma un
permesso di scrittura verso R2, il browser carica il file direttamente sul bucket senza che i
byte passino mai dal server Next.js, e solo dopo il fatto una seconda chiamata conferma
l'avvenuto upload. E' un pattern reale e diffuso, non un'invenzione sbagliata in se': ma applicato
a questo progetto introduce una fragilita' specifica. La validazione vera, quella che guarda i
byte reali di un file per distinguere una foto autentica da un eseguibile rinominato con
estensione `.jpg`, puo' avvenire solo *dopo* che l'oggetto e' gia' scritto nel bucket, perche' e'
l'unico momento in cui qualcosa che non sia il browser stesso vede il file per intero. Nel
frattempo il bucket deve accettare scritture dirette da un'origine browser (configurazione CORS
altrimenti non necessaria), e il client deve orchestrare due chiamate in sequenza con uno stato
intermedio scomodo: upload riuscito ma conferma mai arrivata lascia un oggetto orfano nel bucket,
proprio la stessa quota gratuita di 10 GB che il progetto vuole preservare.

Il salto senior e perche' e' meglio. La domanda giusta non e' "qual e' il pattern piu' efficiente
in astratto" ma "qual e' l'unico punto in cui questo server puo' vedere l'intero file prima che
esista da qualche parte al di fuori del suo controllo". La risposta e' una sola: se il file passa
dal server, il server lo vede tutto, sempre, prima di scriverlo su R2. Per questo la galleria
proxa l'upload attraverso una Server Action che legge l'intero corpo del file e ne confronta i
primi byte contro le firme note di JPEG, PNG e WEBP (`src/lib/photo-validation.ts`) prima di
chiamare R2: nessun oggetto non valido raggiunge mai il bucket, non c'e' un momento "scritto ma
non ancora verificato" da gestire, non serve aprire il bucket a scritture dirette dal browser.
E' anche la mossa che costa meno attrito architetturale: il progetto non ha mai una Route Handler
dedicata, ogni scrittura passa da una Server Action con un form che funziona anche senza
JavaScript, e il flusso proxato e' l'unico dei due che non rompe quella coerenza. Il prezzo
accettato e' reale, non negato: il body di una Server Action ha un tetto (alzato da 1 MB a 25 MB,
un'impostazione globale, non solo per le foto) e il tempo CPU sotto Cloudflare Workers per
leggere e riscrivere un file resta da verificare quando avverra' il primo deploy vero, non prima
(lo stesso tipo di incertezza gia' accettato con ADR-006 per l'intero runtime Workers). Un secondo
salto, minore ma della stessa famiglia, riguarda il modello dati: l'album e' un'entita' propria
(`PhotoAlbum`) invece di un campo testo libero su `Photo`, perche' qui, a differenza di
`Skill.offer` o `CivicSpace.hours`, la feature aggrega davvero (quante foto in questo album) e un
campo libero avrebbe frammentato lo stesso album in due per un semplice errore di digitazione.

Dove leggere il dettaglio: `refactor-15-galleria-upload.md`.
