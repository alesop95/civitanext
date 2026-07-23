import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { MAX_LONG_TEXT } from "@/lib/validation";
import {
  createTestProposal,
  createTestUser,
  mockSession,
  resetTestData,
  setMockSession,
} from "@/test/fixtures";
import { createProposal } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

function proposalFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.append("title", overrides.title ?? "Proposta di prova");
  formData.append("category", overrides.category ?? "Ambiente");
  formData.append("description", overrides.description ?? "Descrizione di prova");
  return formData;
}

describe.skipIf(!process.env.DATABASE_URL)("createProposal", () => {
  afterAll(resetTestData);

  it("reindirizza ad /accedi se non autenticato", async () => {
    setMockSession(null);
    await expect(createProposal(proposalFormData())).rejects.toThrow("NEXT_REDIRECT:/accedi");
  });

  it("rigetta campi vuoti", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));

    await expect(createProposal(proposalFormData({ title: "" }))).rejects.toThrow(
      "NEXT_REDIRECT:/proposte/nuova?error=1",
    );
  });

  it("rigetta un campo oltre la lunghezza massima, nessuna riga creata", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));

    await expect(
      createProposal(proposalFormData({ description: "a".repeat(MAX_LONG_TEXT + 1) })),
    ).rejects.toThrow("NEXT_REDIRECT:/proposte/nuova?error=2");

    const prisma = getPrisma();
    expect(await prisma.proposal.count({ where: { authorId: user.id } })).toBe(0);
  });

  it("rigetta oltre la soglia di rate limit (3 proposte in 60 minuti)", async () => {
    const user = await createTestUser();
    for (let i = 0; i < 3; i++) {
      await createTestProposal("REVISIONE", user.id);
    }
    setMockSession(mockSession(user));

    await expect(createProposal(proposalFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/proposte/nuova?error=3",
    );
  });

  it("crea la proposta per un input valido", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));

    await expect(
      createProposal(proposalFormData({ title: "Proposta valida unica" })),
    ).rejects.toThrow("NEXT_REDIRECT:/proposte");

    const prisma = getPrisma();
    const proposal = await prisma.proposal.findFirstOrThrow({
      where: { title: "Proposta valida unica" },
    });
    expect(proposal.authorId).toBe(user.id);
  });
});
