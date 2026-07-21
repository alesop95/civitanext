import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import {
  createTestDocument,
  createTestUser,
  mockSession,
  resetTestData,
  setMockSession,
} from "@/test/fixtures";
import { createDocument, deleteDocument } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const putObjectMock = vi.fn();
const deleteObjectMock = vi.fn();
vi.mock("@/lib/r2", () => ({
  putObject: (...args: unknown[]) => putObjectMock(...args),
  deleteObject: (...args: unknown[]) => deleteObjectMock(...args),
}));

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const INVALID_BYTES = new Uint8Array([0x00, 0x01, 0x02, 0x03]);

function pdfFile() {
  return new File([PDF_BYTES], "statuto.pdf", { type: "application/pdf" });
}

// Estensione e MIME dichiarati come PDF valido, ma i byte reali non lo sono: verifica che il
// server non si fidi di cio' che il client dichiara (stesso principio della galleria, ADR-016).
function invalidFile() {
  return new File([INVALID_BYTES], "statuto.pdf", { type: "application/pdf" });
}

function formDataFor(file: File, overrides: { title?: string; category?: string } = {}) {
  const formData = new FormData();
  formData.append("title", overrides.title ?? "Statuto dell'associazione");
  formData.append("category", overrides.category ?? "STATUTO");
  formData.append("file", file);
  return formData;
}

describe.skipIf(!process.env.DATABASE_URL)("guardia di ruolo e validazione su admin/documenti", () => {
  afterAll(resetTestData);
  beforeEach(() => {
    putObjectMock.mockClear();
    deleteObjectMock.mockClear();
  });

  it("un UTENTE viene reindirizzato alla home, nessun documento creato", async () => {
    const utente = await createTestUser("UTENTE");
    setMockSession(mockSession(utente));

    await expect(createDocument(formDataFor(pdfFile()))).rejects.toThrow("NEXT_REDIRECT:/");

    expect(putObjectMock).not.toHaveBeenCalled();
    const prisma = getPrisma();
    expect(await prisma.document.count({ where: { createdById: utente.id } })).toBe(0);
  });

  it("un non autenticato viene reindirizzato ad /accedi", async () => {
    setMockSession(null);

    await expect(createDocument(formDataFor(pdfFile()))).rejects.toThrow("NEXT_REDIRECT:/accedi");

    expect(putObjectMock).not.toHaveBeenCalled();
  });

  it("un ADMIN crea il documento con un PDF valido", async () => {
    const admin = await createTestUser("ADMIN");
    setMockSession(mockSession(admin));

    await expect(createDocument(formDataFor(pdfFile()))).rejects.toThrow(
      "NEXT_REDIRECT:/documenti",
    );

    expect(putObjectMock).toHaveBeenCalledTimes(1);
    const prisma = getPrisma();
    const document = await prisma.document.findFirstOrThrow({
      where: { createdById: admin.id },
    });
    expect(document).toMatchObject({ title: "Statuto dell'associazione", category: "STATUTO" });
  });

  it("non scrive nulla né chiama R2 se i byte reali non sono un PDF valido", async () => {
    const admin = await createTestUser("ADMIN");
    setMockSession(mockSession(admin));

    await expect(createDocument(formDataFor(invalidFile()))).rejects.toThrow(
      "NEXT_REDIRECT:/admin/documenti/nuovo?error=2",
    );

    expect(putObjectMock).not.toHaveBeenCalled();
    const prisma = getPrisma();
    expect(await prisma.document.count({ where: { createdById: admin.id } })).toBe(0);
  });

  it("deleteDocument cancella l'oggetto R2 e la riga solo per un ADMIN", async () => {
    const admin = await createTestUser("ADMIN");
    const document = await createTestDocument(admin.id);
    setMockSession(mockSession(admin));

    await deleteDocument(document.id);

    expect(deleteObjectMock).toHaveBeenCalledWith(document.r2Key);
    const prisma = getPrisma();
    expect(await prisma.document.findUnique({ where: { id: document.id } })).toBeNull();
  });
});
