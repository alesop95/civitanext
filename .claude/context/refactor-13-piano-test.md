# 13. La fondazione di test: dettaglio

> Deep-dive della voce 13 di `studio-didattico-master.md`. Entra nel codice reale delle scelte
> riassunte li'; le motivazioni complete e la forma ADR sono in ADR-014 (`memory/decisions.md`).

## Il vincolo che ha deciso il perimetro: Server Component asincroni e Vitest

Prima di scrivere una riga di configurazione, la domanda era: cosa si puo' davvero testare con
un unit test in un'app quasi interamente fatta di pagine come questa, `src/app/eventi/page.tsx`?

```tsx
export default async function EventiPage() {
  const session = await auth();
  const prisma = getPrisma();
  const events = await prisma.event.findMany({ orderBy: { date: "asc" }, include: { rsvps: true } });
  // ...
}
```

Una funzione `async` che restituisce JSX non e', per il motore di React, un componente
renderizzabile in modo sincrono: restituisce una `Promise`, che un *reconciler*[^1] React
ordinario non sa attendere. La renderizzazione reale di un Server Component asincrono e' un
lavoro che spetta al renderer RSC[^2] di Next, non a `@testing-library/react`. La guida ufficiale
spacchettata con Next 16.2.10
(`node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md`) lo dichiara esplicitamente:
"Vitest currently does not support [async Server Components]. While you can still run unit tests
for synchronous Server and Client Components, we recommend using E2E tests for async components."

Questo fatto, non una preferenza, ha deciso il confine: `vitest.config.mts` non prova a
renderizzare nessuna pagina.

```ts
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
  },
});
```

`environment: "node"`, non `"jsdom"` (il default della guida): non c'e' nessun DOM da simulare
perche' non si renderizza nulla, si chiamano solo funzioni. Le quattro suite scritte
(`src/app/eventi/actions.test.ts`, `sondaggi/actions.test.ts`, `quiz/actions.test.ts`,
`admin/proposte/actions.test.ts`) testano *server action*, non pagine: una server action come
`toggleRsvp` e' una funzione `async` qualunque, non un componente, quindi il vincolo sopra non la
riguarda affatto.

```ts
// src/app/eventi/actions.ts
export async function toggleRsvp(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) return;
  // ...
}
```

```ts
// src/app/eventi/actions.test.ts
it("crea l'RSVP al primo invio e lo rimuove al secondo (toggle)", async () => {
  const user = await createTestUser();
  const event = await createTestEvent();
  setMockSession(mockSession(user));
  await toggleRsvp(event.id);
  // ...
});
```

Qualunque asserzione del tipo "la pagina mostra gli eventi giusti" resta fuori da Vitest per
costruzione, e passa da `e2e/smoke.spec.ts`, un browser vero che parla con un server Next vero.

## Perche' Playwright, non una preferenza: la stessa guida che valida gli adapter

Il secondo file di documentazione controllato,
`node_modules/next/dist/docs/01-app/03-api-reference/07-adapters/04-testing-adapters.md`, tratta
il meccanismo con cui Next valida gli *adapter* di deploy custom, esattamente la categoria a cui
appartiene `@opennextjs/cloudflare`, l'adapter da cui dipende il deploy di questo progetto.
L'intero harness li' descritto e' costruito attorno a Playwright. Non e' un dettaglio neutro:
la domanda lasciata esplicitamente aperta da ADR-006 (memory/decisions.md), se il fallimento di
`wrangler dev` osservato su Windows fosse un limite del toolchain OpenNext su quella piattaforma o
un problema reale dell'adapter, si chiude proprio facendo girare l'app buildata con l'adapter
dentro una pipeline Linux, con lo stesso strumento che Next usa per lo stesso scopo.

Questo ha reso naturale un secondo job CI, non solo uno:

```yaml
# .github/workflows/ci.yml
test-cloudflare-adapter:
  name: E2E su adapter Cloudflare reale (workerd)
  needs: test
  steps:
    - run: npx opennextjs-cloudflare build
    - run: |
        npx opennextjs-cloudflare preview -- --port 8787 &
        for i in $(seq 1 30); do curl -sf http://localhost:8787 > /dev/null && exit 0; sleep 2; done
        exit 1
    - env: { PW_BASE_URL: "http://localhost:8787", CI: "true" }
      run: npx playwright test
```

`playwright.config.ts` ha dovuto imparare a distinguere tre modi di procurarsi un server, non
due: `next dev` in locale (comodo, nessuna build richiesta), `next start` in CI dopo una build
standard, e un server *esterno* gia' avviato a parte quando il server e' la catena
`build && preview` dell'adapter, che Playwright non puo' gestire in modo pulito come `webServer`.

```ts
const externalBaseURL = process.env.PW_BASE_URL;
const baseURL = externalBaseURL ?? `http://localhost:${PORT}`;

export default defineConfig({
  // ...
  webServer: externalBaseURL
    ? undefined
    : {
        command: process.env.CI ? `npx next start -p ${PORT}` : `npx next dev -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        env: { DATABASE_URL: process.env.DATABASE_URL ?? "" },
      },
});
```

Questo secondo job non e' verificabile su questa macchina di sviluppo (Windows nativo, lo stesso
limite gia' documentato in ADR-006): la sua prima esecuzione reale su CI e' la verifica stessa,
non ancora confermata al momento in cui questa voce e' stata scritta.

## Tre bug trovati costruendo la fondazione, non nella logica applicativa

Scrivere questi file non e' bastato: farli girare per davvero, ripetutamente, ha fatto emergere
tre problemi che nessuna verifica manuale su `next dev` avrebbe mai potuto mostrare.

Il primo: eseguendo lo smoke e2e contro `next start` (modalita' produzione, mai provata prima
d'ora in locale) invece di `next dev`, il login falliva con `UntrustedHost` di Auth.js. Il
controllo che confronta l'header `Host` contro un elenco fidato non scatta in `next dev`, per
questo non si era mai visto. La correzione, in `src/auth.ts`:

```ts
return {
  // Necessario perche' l'host non e' noto in anticipo a chi ospita l'app (Cloudflare Workers,
  // come qualunque runtime serverless/edge dietro proxy). Sicuro perche' nessun redirect del
  // progetto e' derivato dall'header Host: sono tutti path relativi statici.
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 },
  // ...
};
```

Il secondo: la prima corsa della suite Vitest completa ha prodotto due `PrismaClientKnownRequestError`
per violazione di foreign key e un conteggio di voti sbagliato, tutti e tre nel cleanup o nelle
asserzioni, mai nel codice applicativo. La causa: Vitest esegue i file di test in parallelo per
default, e i quattro file condividono un solo Postgres reale con fixture identificate da un
marker comune (`vitest-fixture` in `src/test/fixtures.ts`); il cleanup di un file cancellava righe
create da un test ancora in corso in un altro file. La correzione e' la riga
`fileParallelism: false` gia' mostrata sopra: i file girano in sequenza, non piu' in corsa tra
loro sullo stesso database.

Il terzo: rilanciando lo smoke e2e una seconda volta senza reseedare, il test falliva cercando il
bottone "Partecipo" che non c'era piu', perche' l'utente e2e risultava gia' iscritto dall'esecuzione
precedente. Il seed (`scripts/seed-e2e.ts`) creava utente/evento/proposta/quiz in modo idempotente
ma non azzerava lo stato transazionale (RSVP, voto) lasciato da un run all'altro:

```ts
// Senza questo azzeramento, un rerun (o un retry di Playwright) trova lo stato lasciato
// dall'esecuzione precedente e le azioni di toggle sembrano non funzionare, quando invece e'
// il seed a non essere idempotente.
await prisma.rsvp.deleteMany({ where: { userId: user.id, eventId: EVENT_ID } });
await prisma.vote.deleteMany({ where: { userId: user.id, targetId: PROPOSAL_ID } });
```

E per lo stesso motivo il seed e' richiamato da un `beforeEach` in `e2e/smoke.spec.ts`, non solo
una volta prima della suite: un *retry* di Playwright (due, in CI) senza reseed avrebbe
riprodotto esattamente lo stesso sintomo al secondo tentativo.

## Un vincolo di loader non ovvio: perche' le credenziali e2e vivono in un file a parte

`e2e/credentials.ts` esiste solo per isolare due costanti (`E2E_EMAIL`, `E2E_PASSWORD`) da
`scripts/seed-e2e.ts`, che altrimenti le esporterebbe insieme alla logica di seed. Il motivo non
e' estetico: `scripts/seed-e2e.ts` importa `@/lib/prisma`, e il client Prisma generato
(`src/generated/prisma/client.ts`) usa `import.meta`, sintassi ESM che il loader interno di
Playwright non transpila. Importare quella costante direttamente da `scripts/seed-e2e.ts` dentro
uno spec Playwright fa fallire l'intera suite con un errore di sintassi prima ancora che un test
parta, un'eccezione da tenere a mente ogni volta che uno spec Playwright deve condividere un
valore con uno script che tocca Prisma: mai un import diretto, sempre un file di soli valori o un
processo esterno (`child_process`, come fa `beforeEach` per richiamare il seed stesso).

## Come estendere il pattern

Aggiungere copertura a una server action nuova o gia' esistente: colocare
`<nome>/actions.test.ts` accanto ad `actions.ts`, `vi.mock("@/auth", () => ({ auth: vi.fn() }))`
in testa al file, `setMockSession(...)` di `src/test/fixtures.ts` per impersonare un utente o
`null` per il caso non autenticato, le funzioni `createTest*` per i dati e `resetTestData()` in
un `afterAll`. Aggiungere un nuovo passo allo smoke e2e (o un secondo spec, se il flusso non
condivide lo stato con quello esistente): estendere `scripts/seed-e2e.ts` con id fissi nuovi,
ricordando di azzerare esplicitamente qualunque stato transazionale che il flusso stesso modifica,
esattamente come sopra per RSVP/voto. Nessuna delle due estensioni richiede toccare
`vitest.config.mts` o `playwright.config.ts`.

[^1]: *Reconciler*, il modulo interno di React che confronta l'albero dei componenti con quello
precedente e calcola gli aggiornamenti al DOM; presuppone di ricevere elementi gia' pronti in modo
sincrono, non promesse da attendere.

[^2]: *RSC*, React Server Components, l'architettura di React che esegue parte dell'albero dei
componenti solo sul server, producendo un formato di serializzazione proprio (*flight*) invece di
HTML o di un albero React ordinario.
