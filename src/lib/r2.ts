import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// R2 e' compatibile con l'API S3 (endpoint dedicato, region "auto"): nessun binding nativo
// Workers (`r2_buckets` in wrangler.jsonc), perche' quel binding non esiste sotto `next dev`
// Node standard e funzionerebbe solo dentro un Worker deployato (ADR-005/006, ADR-016).
// requestChecksumCalculation/responseChecksumValidation "WHEN_REQUIRED": le versioni recenti
// dell'AWS SDK v3 attivano di default un calcolo di checksum che R2 non supporta in tutte le
// configurazioni.
function buildClient() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

let client: S3Client | undefined;

export function getR2Client() {
  if (!client) client = buildClient();
  return client;
}

export async function putPhotoObject(key: string, bytes: Uint8Array, contentType: string) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    }),
  );
}

export async function deleteObject(key: string) {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }),
  );
}
