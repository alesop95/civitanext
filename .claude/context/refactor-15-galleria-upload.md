# 15. La galleria foto: dettaglio

> Deep-dive della voce 15 di `studio-didattico-master.md`. Entra nel codice reale di
> `src/lib/photo-validation.ts`, `src/lib/r2.ts` e `src/app/galleria/actions.ts`; le motivazioni
> complete e il confronto delle alternative sono in ADR-016 (`memory/decisions.md`).

## Validare byte che il server ha già in mano

La funzione centrale non chiama nessuna libreria di riconoscimento immagini: confronta a mano i
primi byte del file contro le firme note.

```ts
export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
  if (hasSignature(bytes, 0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (hasSignature(bytes, 0, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (
    hasSignature(bytes, 0, [0x52, 0x49, 0x46, 0x46]) &&
    hasSignature(bytes, 8, [0x57, 0x45, 0x42, 0x50])
  ) {
    return "image/webp";
  }
  return null;
}
```

Questo funziona solo perche' il file arriva intero nella Server Action: `uploadPhoto` chiama
`file.arrayBuffer()` prima di validare, quindi quando `detectImageType` gira ha davanti l'intero
contenuto, non un frammento. Un file rinominato da `.exe` a `.jpg` supera qualsiasi controllo
sull'estensione o sul `File.type` dichiarato dal browser (entrambi metadati, non contenuto), ma
non supera questo confronto: i suoi primi byte non sono `FF D8 FF`. Nessuna dipendenza esterna
(`file-type` o simili) per tre firme fisse: da rivalutare solo se in futuro si vorranno accettare
formati con firme piu' complesse (HEIC, per esempio).

## Il punto in cui la scrittura su R2 diventa irreversibile

`putPhotoObject` e' deliberatamente l'ultima chiamata della catena, non la prima:

```ts
const bytes = new Uint8Array(await file.arrayBuffer());
const result = validatePhotoFile({ size: file.size, bytes });
if (!result.valid) redirect(`/galleria/${albumId}?error=1`);

const key = `photos/${randomUUID()}.${extensionForType(result.contentType)}`;
await putPhotoObject(key, bytes, result.contentType);
await prisma.photo.create({ data: { albumId, uploaderId, r2Key: key, ... } });
```

L'ordine e' quello che rende vera la garanzia "nessun oggetto invalido nel bucket": la validazione
avviene prima di qualunque chiamata a R2, non dopo. Con un flusso presigned l'ordine sarebbe
forzatamente rovesciato (il browser scrive, poi qualcuno verifica), perche' nessun altro codice
vede il file prima che sia gia' nel bucket. La chiave dell'oggetto non usa mai il nome file
originale: `randomUUID()` piu' l'estensione dedotta dal *content-type rilevato*, non da quello
dichiarato, elimina in un colpo path traversal e caratteri non ASCII nel nome che l'utente ha
scelto sul proprio dispositivo.

## Perché il client R2 è isolato in un modulo di tre funzioni

```ts
export function getR2Client() {
  if (!client) client = buildClient();
  return client;
}

export async function putPhotoObject(key: string, bytes: Uint8Array, contentType: string) {
  await getR2Client().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: bytes, ContentType: contentType }));
}
```

`src/lib/r2.ts` non sa nulla di album, foto o validazione: e' un adattatore verso R2 e basta,
sullo stesso principio di `src/lib/prisma.ts` per Postgres. La conseguenza pratica e' nei test:
`src/app/galleria/actions.test.ts` mocka `@/lib/r2` con due righe (`vi.mock("@/lib/r2", () => ({
putPhotoObject: ... }))`), senza mai toccare l'SDK AWS o un bucket reale, mentre
`src/lib/r2.test.ts` verifica in isolamento che quel modulo costruisca i comandi giusti, mockando
`@aws-sdk/client-s3` una volta sola. Nessuno dei due test file ha bisogno di credenziali R2 vere
in CI.

## Il contenitore gated, il contributo libero

`PhotoAlbum` e `Photo` ripetono uno schema che il progetto aveva gia' scoperto con
`Mentor`/`MentorRequest`, applicato qui a un problema diverso (upload, non richiesta di
contatto): la riga che apre un nuovo spazio pubblico e consuma risorsa condivisa (quota storage)
resta dietro una guardia di ruolo, la riga che aggiunge contenuto dentro uno spazio gia' aperto
resta dietro la sola guardia di autenticazione.

```prisma
model PhotoAlbum {
  // creato da un ADMIN (admin/galleria/actions.ts: createAlbum)
  createdById String
  createdBy   User @relation("PhotoAlbumCreatedBy", fields: [createdById], references: [id])
  photos      Photo[]
}

model Photo {
  // aggiunta da chiunque sia autenticato (galleria/actions.ts: uploadPhoto)
  albumId    String
  uploaderId String
}
```

La differenza rispetto a `Skill` (competenze, contenuto interamente self-service, nessun
contenitore) non e' capriccio di modellazione: la galleria aggrega (quante foto per album, quale
copertina mostrare), e un'aggregazione affidabile ha bisogno di un identificatore stabile, non di
un campo testo che due soci potrebbero scrivere in due modi diversi per lo stesso evento.
