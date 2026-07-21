import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import {
  createTestPhotoAlbum,
  createTestUser,
  mockSession,
  resetTestData,
  setMockSession,
} from "@/test/fixtures";
import { uploadPhoto } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const putObjectMock = vi.fn();
vi.mock("@/lib/r2", () => ({
  putObject: (...args: unknown[]) => putObjectMock(...args),
}));

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
const INVALID_BYTES = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

function jpegFile() {
  return new File([JPEG_BYTES], "foto.jpg", { type: "image/jpeg" });
}

// Estensione e MIME dichiarati come immagine valida, ma i byte reali non lo sono: verifica che
// il server non si fidi di cio' che il client dichiara (ADR-016).
function invalidFile() {
  return new File([INVALID_BYTES], "foto.jpg", { type: "image/jpeg" });
}

describe.skipIf(!process.env.DATABASE_URL)("uploadPhoto", () => {
  afterAll(resetTestData);
  beforeEach(() => putObjectMock.mockClear());

  it("scrive la foto su R2 e su Postgres per un file valido", async () => {
    const user = await createTestUser();
    const album = await createTestPhotoAlbum(user.id);
    setMockSession(mockSession(user));

    const formData = new FormData();
    formData.append("photos", jpegFile());

    await expect(uploadPhoto(album.id, formData)).rejects.toThrow(
      `NEXT_REDIRECT:/galleria/${album.id}`,
    );

    expect(putObjectMock).toHaveBeenCalledTimes(1);
    const prisma = getPrisma();
    expect(await prisma.photo.count({ where: { albumId: album.id } })).toBe(1);
  });

  it("non scrive nulla né chiama R2 se i byte reali non sono un'immagine valida", async () => {
    const user = await createTestUser();
    const album = await createTestPhotoAlbum(user.id);
    setMockSession(mockSession(user));

    const formData = new FormData();
    formData.append("photos", invalidFile());

    await expect(uploadPhoto(album.id, formData)).rejects.toThrow(
      `NEXT_REDIRECT:/galleria/${album.id}?error=1`,
    );

    expect(putObjectMock).not.toHaveBeenCalled();
    const prisma = getPrisma();
    expect(await prisma.photo.count({ where: { albumId: album.id } })).toBe(0);
  });

  it("reindirizza ad /accedi e non scrive nulla se non autenticato", async () => {
    const user = await createTestUser();
    const album = await createTestPhotoAlbum(user.id);
    setMockSession(null);

    const formData = new FormData();
    formData.append("photos", jpegFile());

    await expect(uploadPhoto(album.id, formData)).rejects.toThrow("NEXT_REDIRECT:/accedi");

    expect(putObjectMock).not.toHaveBeenCalled();
    const prisma = getPrisma();
    expect(await prisma.photo.count({ where: { albumId: album.id } })).toBe(0);
  });
});
