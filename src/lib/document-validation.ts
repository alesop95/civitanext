// Validazione lato server dell'upload proxato di documenti (stesso principio di
// photo-validation.ts per la galleria, ADR-016): il server legge l'intero file prima di
// scriverlo su R2, quindi verifica i byte reali (magic number "%PDF") invece di fidarsi
// dell'estensione o del File.type dichiarato dal browser (entrambi falsificabili).

export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024; // 15 MB, verbali/bilanci scansionati

function hasSignature(bytes: Uint8Array, offset: number, signature: number[]) {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

export function isPdf(bytes: Uint8Array) {
  return hasSignature(bytes, 0, [0x25, 0x50, 0x44, 0x46]); // "%PDF"
}

export type DocumentValidationResult =
  | { valid: true }
  | { valid: false; reason: "empty" | "too-large" | "unsupported-type" };

export function validateDocumentFile(
  file: { size: number; bytes: Uint8Array },
  maxBytes: number = MAX_DOCUMENT_BYTES,
): DocumentValidationResult {
  if (file.size === 0 || file.bytes.length === 0) return { valid: false, reason: "empty" };
  if (file.size > maxBytes) return { valid: false, reason: "too-large" };
  if (!isPdf(file.bytes)) return { valid: false, reason: "unsupported-type" };

  return { valid: true };
}
