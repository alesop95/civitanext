# 16. Webinar ed email digest: dettaglio

> Deep-dive della voce 16 di `studio-didattico-master.md`. Entra nel codice reale di
> `src/lib/youtube.ts` e `src/lib/digest.ts`; le motivazioni complete e il confronto delle
> alternative sono in ADR-017 (`memory/decisions.md`).

## Un id, non un URL: la stessa lezione di r2Key applicata a YouTube

`Webinar.youtubeId` salva undici caratteri, non un link. La stessa scelta gia' fatta per
`Photo.r2Key`/`Document.r2Key` (salvare la chiave, comporre l'URL a runtime) si applica qui per un
motivo diverso ma parallelo: chi pubblica un webinar incolla quasi sempre l'URL della pagina di
YouTube, non l'id nudo, quindi il parsing deve accettare piu' forme e restituire sempre la stessa
cosa:

```ts
export function extractYoutubeId(input: string): string | null {
  const value = input.trim();
  if (YOUTUBE_ID_PATTERN.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.hostname === "youtu.be") { ... }
  if (url.hostname === "youtube.com" || url.hostname.endsWith(".youtube.com")) { ... }

  return null;
}
```

Nessuna chiamata di rete per verificare che il video esista davvero o sia effettivamente "non in
elenco": si scoprirebbe solo alla prima visualizzazione dell'embed, e non vale la complessita' di
un controllo preventivo per un contenuto che un admin pubblica di rado. Da questo solo id derivano
sia l'URL di embed (`youtube-nocookie.com`, il dominio a privacy avanzata) sia la thumbnail
(`i.ytimg.com`), due funzioni pure di una riga ciascuna: l'unica fonte di verita' resta il dato in
database, l'URL non e' mai qualcosa che potrebbe disallinearsi da esso.

## Perché il digest riceve `now` invece di calcolarlo

```ts
export async function buildDigestContent(now: Date): Promise<DigestContent> {
  const weekAhead = new Date(now.getTime() + 7 * DAY_MS);
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  ...
}
```

`buildDigestContent` e `sendWeeklyDigest` non chiamano mai `new Date()` al proprio interno:
ricevono l'istante come parametro. E' la differenza tra una funzione che si può testare con date
finte (`new Date("2026-07-21T09:00:00.000Z")` nei test) e una che dipende dall'orologio reale
della macchina che la esegue. La route che le invoca (`src/app/api/digest/route.ts`) e' l'unico
punto che chiama `new Date()` per davvero, esattamente dove serve l'ora vera dell'invio.

## La fuga HTML che il resto del progetto non ha ancora avuto bisogno di scrivere

```ts
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    ...
}
```

E' il primo punto del progetto in cui contenuto scritto da un socio (titolo e categoria di un
`Thread` del forum) finisce dentro un documento HTML costruito a mano invece che renderizzato da
React (che fa la fuga automaticamente per ogni JSX). Un titolo di thread come
`<img onerror=alert(1)>` , se non fosse sfuggito, arriverebbe intatto nell'HTML dell'email
spedita a ogni socio iscritto al digest: non un problema locale a un solo browser, ma un payload
che si propaga a tutti i destinatari in un colpo. Il test lo verifica esplicitamente:

```ts
it("fa la fuga HTML di titoli e nomi (contenuto scritto dai soci, non dall'admin)", () => {
  const html = renderDigestHtml({ events: [], threads: [{ ..., title: "<img onerror=alert(1)>" ... }] });
  expect(html).not.toContain("<img onerror");
  expect(html).toContain("&lt;img onerror=alert(1)&gt;");
});
```

## Un segreto confrontato a tempo costante, non con `!==`

```ts
function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const headerBuf = Buffer.from(request.headers.get("authorization") ?? "");
  const expectedBuf = Buffer.from(`Bearer ${secret}`);
  if (headerBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(headerBuf, expectedBuf);
}
```

`/api/digest` non ha una sessione da controllare: chi la chiama e' un workflow GitHub Actions, non
un browser loggato. Il confronto a tempo costante (`timingSafeEqual`) invece di un semplice `!==`
e' una precauzione a basso costo contro un canale laterale temporale: un confronto carattere per
carattere con uscita anticipata (come fa `!==` su stringhe in molte implementazioni) puo' in
teoria far scoprire quanti caratteri iniziali sono corretti misurando quanto impiega la risposta a
tornare. Su una rotta chiamata una volta a settimana da un solo workflow il rischio pratico e'
minimo, ma la precauzione costa quattro righe e nessuna complessita' aggiuntiva.

## Cosa succede se il digest non ha nulla da dire

```ts
export function isDigestEmpty(content: DigestContent) {
  return content.events.length === 0 && content.threads.length === 0;
}
```

`sendWeeklyDigest` controlla questo prima di interrogare la lista dei destinatari e prima di
chiamare Resend anche una sola volta. Non e' un'ottimizzazione di velocita' (il progetto e' troppo
piccolo perche' conti), e' una decisione di prodotto scritta in codice: un socio che si e' iscritto
al digest non deve ricevere una email vuota "questa settimana non e' successo nulla" ogni lunedi'.
