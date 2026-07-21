// Validazione lato server dell'upload proxato (ADR-016): il server legge l'intero file prima di
// scriverlo su R2, quindi puo' verificare i byte reali invece di fidarsi dell'estensione o del
// File.type dichiarato dal browser (entrambi falsificabili rinominando un file qualsiasi).

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB, da ricalibrare quando si conoscono volumi reali

export type DetectedImageType = "image/jpeg" | "image/png" | "image/webp";

const EXTENSION_BY_TYPE: Record<DetectedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function hasSignature(bytes: Uint8Array, offset: number, signature: number[]) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

// Confronta solo i primi byte contro le firme note (magic bytes), non l'intero contenuto: basta
// a distinguere un'immagine reale da un file rinominato con estensione falsa.
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

export function extensionForType(contentType: DetectedImageType) {
  return EXTENSION_BY_TYPE[contentType];
}

export type PhotoValidationResult =
  | { valid: true; contentType: DetectedImageType }
  | { valid: false; reason: "empty" | "too-large" | "unsupported-type" };

export function validatePhotoFile(
  file: { size: number; bytes: Uint8Array },
  maxBytes: number = MAX_PHOTO_BYTES,
): PhotoValidationResult {
  if (file.size === 0 || file.bytes.length === 0) return { valid: false, reason: "empty" };
  if (file.size > maxBytes) return { valid: false, reason: "too-large" };

  const contentType = detectImageType(file.bytes);
  if (!contentType) return { valid: false, reason: "unsupported-type" };

  return { valid: true, contentType };
}
