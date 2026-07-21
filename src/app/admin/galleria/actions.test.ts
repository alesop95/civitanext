import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import {
  createTestPhoto,
  createTestPhotoAlbum,
  createTestUser,
  mockSession,
  resetTestData,
  setMockSession,
} from "@/test/fixtures";
import { createAlbum, deleteAlbum, deletePhoto } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const deleteObjectMock = vi.fn();
vi.mock("@/lib/r2", () => ({
  deleteObject: (...args: unknown[]) => deleteObjectMock(...args),
}));

describe.skipIf(!process.env.DATABASE_URL)("guardia di ruolo sulle azioni admin/galleria", () => {
  afterAll(resetTestData);
  beforeEach(() => deleteObjectMock.mockClear());

  it("un UTENTE viene reindirizzato alla home, nessun album creato", async () => {
    const utente = await createTestUser("UTENTE");
    setMockSession(mockSession(utente));

    const formData = new FormData();
    formData.append("title", "Album di prova");

    await expect(createAlbum(formData)).rejects.toThrow("NEXT_REDIRECT:/");

    const prisma = getPrisma();
    expect(await prisma.photoAlbum.count({ where: { createdById: utente.id } })).toBe(0);
  });

  it("un non autenticato viene reindirizzato ad /accedi", async () => {
    setMockSession(null);
    const formData = new FormData();
    formData.append("title", "Album di prova");

    await expect(createAlbum(formData)).rejects.toThrow("NEXT_REDIRECT:/accedi");
  });

  it("un ADMIN crea l'album", async () => {
    const admin = await createTestUser("ADMIN");
    setMockSession(mockSession(admin));

    const formData = new FormData();
    formData.append("title", "Album di prova");

    await expect(createAlbum(formData)).rejects.toThrow("NEXT_REDIRECT:");

    const prisma = getPrisma();
    const album = await prisma.photoAlbum.findFirstOrThrow({ where: { createdById: admin.id } });
    expect(album.title).toBe("Album di prova");
  });

  it("deletePhoto cancella l'oggetto R2 e la riga solo per un ADMIN", async () => {
    const admin = await createTestUser("ADMIN");
    const album = await createTestPhotoAlbum(admin.id);
    const photo = await createTestPhoto(album.id, admin.id);
    setMockSession(mockSession(admin));

    await deletePhoto(photo.id);

    expect(deleteObjectMock).toHaveBeenCalledWith(photo.r2Key);
    const prisma = getPrisma();
    expect(await prisma.photo.findUnique({ where: { id: photo.id } })).toBeNull();
  });

  it("deleteAlbum cancella prima le foto (R2 e DB) poi l'album", async () => {
    const admin = await createTestUser("ADMIN");
    const album = await createTestPhotoAlbum(admin.id);
    const photo = await createTestPhoto(album.id, admin.id);
    setMockSession(mockSession(admin));

    await expect(deleteAlbum(album.id)).rejects.toThrow("NEXT_REDIRECT:/galleria");

    expect(deleteObjectMock).toHaveBeenCalledWith(photo.r2Key);
    const prisma = getPrisma();
    expect(await prisma.photo.count({ where: { albumId: album.id } })).toBe(0);
    expect(await prisma.photoAlbum.findUnique({ where: { id: album.id } })).toBeNull();
  });
});
