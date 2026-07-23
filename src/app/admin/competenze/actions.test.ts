import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { createTestUser, mockSession, resetTestData, setMockSession } from "@/test/fixtures";
import { deleteSkill } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe.skipIf(!process.env.DATABASE_URL)("guardia di ruolo su admin/competenze", () => {
  afterAll(resetTestData);

  it("un UTENTE viene reindirizzato alla home, la competenza resta", async () => {
    const owner = await createTestUser();
    const utente = await createTestUser("UTENTE");
    const prisma = getPrisma();
    const skill = await prisma.skill.create({
      data: { userId: owner.id, name: "Competenza da non toccare", offer: "x" },
    });
    setMockSession(mockSession(utente));

    await expect(deleteSkill(skill.id)).rejects.toThrow("NEXT_REDIRECT:/");

    expect(await prisma.skill.findUnique({ where: { id: skill.id } })).not.toBeNull();
  });

  it("un ADMIN cancella la competenza", async () => {
    const owner = await createTestUser();
    const admin = await createTestUser("ADMIN");
    const prisma = getPrisma();
    const skill = await prisma.skill.create({
      data: { userId: owner.id, name: "Competenza da cancellare", offer: "x" },
    });
    setMockSession(mockSession(admin));

    await deleteSkill(skill.id);

    expect(await prisma.skill.findUnique({ where: { id: skill.id } })).toBeNull();
  });
});
