import { describe, expect, it } from "vitest";
import { MAX_DOCUMENT_BYTES, isPdf, validateDocumentFile } from "./document-validation";

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // "%PDF-1.4"
const INVALID_BYTES = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

describe("isPdf", () => {
  it("riconosce un PDF dal magic number %PDF", () => {
    expect(isPdf(PDF_BYTES)).toBe(true);
  });

  it("rigetta byte non riconosciuti, anche se dichiarati come PDF dal client", () => {
    expect(isPdf(INVALID_BYTES)).toBe(false);
  });
});

describe("validateDocumentFile", () => {
  it("accetta un PDF valido entro il limite di dimensione", () => {
    expect(validateDocumentFile({ size: PDF_BYTES.length, bytes: PDF_BYTES })).toEqual({
      valid: true,
    });
  });

  it("rigetta un file vuoto", () => {
    expect(validateDocumentFile({ size: 0, bytes: new Uint8Array() })).toEqual({
      valid: false,
      reason: "empty",
    });
  });

  it("rigetta un file oltre la dimensione massima anche con byte validi", () => {
    const result = validateDocumentFile(
      { size: MAX_DOCUMENT_BYTES + 1, bytes: PDF_BYTES },
      MAX_DOCUMENT_BYTES,
    );
    expect(result).toEqual({ valid: false, reason: "too-large" });
  });

  it("rigetta byte non validi anche con dimensione entro il limite (estensione falsificata)", () => {
    const result = validateDocumentFile({ size: INVALID_BYTES.length, bytes: INVALID_BYTES });
    expect(result).toEqual({ valid: false, reason: "unsupported-type" });
  });
});
