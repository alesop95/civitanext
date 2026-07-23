import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { MAX_SHORT_TEXT } from "@/lib/validation";
import { createTestUser, mockSession, resetTestData, setMockSession } from "@/test/fixtures";
import { createSkill } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

function skillFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.append("name", overrides.name ?? "Traduzioni");
  formData.append("offer", overrides.offer ?? "Sottotitoli per i webinar");
  return formData;
}

describe.skipIf(!process.env.DATABASE_URL)("createSkill", () => {
  afterAll(resetTestData);

  it("reindirizza ad /accedi se non autenticato", async () => {
    setMockSession(null);
    await expect(createSkill(skillFormData())).rejects.toThrow("NEXT_REDIRECT:/accedi");
  });

  it("rigetta un nome oltre la lunghezza massima, nessuna riga creata", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));

    await expect(
      createSkill(skillFormData({ name: "a".repeat(MAX_SHORT_TEXT + 1) })),
    ).rejects.toThrow("NEXT_REDIRECT:/competenze/nuova?error=2");

    const prisma = getPrisma();
    expect(await prisma.skill.count({ where: { userId: user.id } })).toBe(0);
  });

  it("rigetta oltre la soglia di rate limit (10 competenze in 60 minuti)", async () => {
    const user = await createTestUser();
    const prisma = getPrisma();
    for (let i = 0; i < 10; i++) {
      await prisma.skill.create({ data: { userId: user.id, name: `Competenza ${i}`, offer: "x" } });
    }
    setMockSession(mockSession(user));

    await expect(createSkill(skillFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/competenze/nuova?error=3",
    );
  });

  it("crea la competenza per un input valido", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));

    await expect(createSkill(skillFormData({ name: "Competenza unica" }))).rejects.toThrow(
      "NEXT_REDIRECT:/competenze",
    );

    const prisma = getPrisma();
    const skill = await prisma.skill.findFirstOrThrow({ where: { name: "Competenza unica" } });
    expect(skill.userId).toBe(user.id);
  });
});
