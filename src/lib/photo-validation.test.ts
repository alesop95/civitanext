import { describe, expect, it } from "vitest";
import { MAX_PHOTO_BYTES, detectImageType, extensionForType, validatePhotoFile } from "./photo-validation";

// Solo i primi byte contano per il riconoscimento (magic bytes), non serve un file reale intero.
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_BYTES = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const INVALID_BYTES = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

describe("detectImageType", () => {
  it("riconosce JPEG dai magic bytes", () => {
    expect(detectImageType(JPEG_BYTES)).toBe("image/jpeg");
  });

  it("riconosce PNG dai magic bytes", () => {
    expect(detectImageType(PNG_BYTES)).toBe("image/png");
  });

  it("riconosce WEBP dai magic bytes (RIFF....WEBP)", () => {
    expect(detectImageType(WEBP_BYTES)).toBe("image/webp");
  });

  it("rigetta byte non riconosciuti, anche se dichiarati come immagine dal client", () => {
    expect(detectImageType(INVALID_BYTES)).toBeNull();
  });
});

describe("validatePhotoFile", () => {
  it("accetta un JPEG valido entro il limite di dimensione", () => {
    expect(validatePhotoFile({ size: JPEG_BYTES.length, bytes: JPEG_BYTES })).toEqual({
      valid: true,
      contentType: "image/jpeg",
    });
  });

  it("rigetta un file vuoto", () => {
    expect(validatePhotoFile({ size: 0, bytes: new Uint8Array() })).toEqual({
      valid: false,
      reason: "empty",
    });
  });

  it("rigetta un file oltre la dimensione massima anche con byte validi", () => {
    const result = validatePhotoFile(
      { size: MAX_PHOTO_BYTES + 1, bytes: JPEG_BYTES },
      MAX_PHOTO_BYTES,
    );
    expect(result).toEqual({ valid: false, reason: "too-large" });
  });

  it("rigetta byte non validi anche con dimensione entro il limite (estensione falsificata)", () => {
    const result = validatePhotoFile({ size: INVALID_BYTES.length, bytes: INVALID_BYTES });
    expect(result).toEqual({ valid: false, reason: "unsupported-type" });
  });
});

describe("extensionForType", () => {
  it("mappa ogni tipo rilevato alla sua estensione", () => {
    expect(extensionForType("image/jpeg")).toBe("jpg");
    expect(extensionForType("image/png")).toBe("png");
    expect(extensionForType("image/webp")).toBe("webp");
  });
});
