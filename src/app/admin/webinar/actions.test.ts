import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import {
  createTestUser,
  createTestWebinar,
  mockSession,
  resetTestData,
  setMockSession,
} from "@/test/fixtures";
import { createWebinar, deleteWebinar } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

function formDataFor(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.append("title", overrides.title ?? "Come funziona il bilancio partecipativo");
  formData.append("description", overrides.description ?? "Registrazione della lezione");
  formData.append("duration", overrides.duration ?? "38 min");
  formData.append("video", overrides.video ?? "https://youtu.be/dQw4w9WgXcQ");
  formData.append("recordedAt", overrides.recordedAt ?? "2026-05-14");
  return formData;
}

describe.skipIf(!process.env.DATABASE_URL)("guardia di ruolo e validazione su admin/webinar", () => {
  afterAll(resetTestData);

  it("un UTENTE viene reindirizzato alla home, nessun webinar creato", async () => {
    const utente = await createTestUser("UTENTE");
    setMockSession(mockSession(utente));

    await expect(createWebinar(formDataFor())).rejects.toThrow("NEXT_REDIRECT:/");

    const prisma = getPrisma();
    expect(await prisma.webinar.count({ where: { title: "vitest-fixture" } })).toBe(0);
  });

  it("un non autenticato viene reindirizzato ad /accedi", async () => {
    setMockSession(null);

    await expect(createWebinar(formDataFor())).rejects.toThrow("NEXT_REDIRECT:/accedi");
  });

  it("un ADMIN pubblica il webinar estraendo l'id dal link YouTube", async () => {
    const admin = await createTestUser("ADMIN");
    setMockSession(mockSession(admin));

    await expect(createWebinar(formDataFor())).rejects.toThrow("NEXT_REDIRECT:/webinar");

    const prisma = getPrisma();
    const webinar = await prisma.webinar.findFirstOrThrow({
      where: { title: "Come funziona il bilancio partecipativo" },
    });
    expect(webinar.youtubeId).toBe("dQw4w9WgXcQ");
  });

  it("rigetta un link video non valido senza creare nulla", async () => {
    const admin = await createTestUser("ADMIN");
    setMockSession(mockSession(admin));

    await expect(createWebinar(formDataFor({ video: "https://vimeo.com/123" }))).rejects.toThrow(
      "NEXT_REDIRECT:/admin/webinar/nuovo?error=2",
    );
  });

  it("deleteWebinar cancella la riga solo per un ADMIN", async () => {
    const admin = await createTestUser("ADMIN");
    const webinar = await createTestWebinar();
    setMockSession(mockSession(admin));

    await deleteWebinar(webinar.id);

    const prisma = getPrisma();
    expect(await prisma.webinar.findUnique({ where: { id: webinar.id } })).toBeNull();
  });
});
