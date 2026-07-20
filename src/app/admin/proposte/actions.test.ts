import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { createTestProposal, createTestUser, mockSession, resetTestData, setMockSession } from "@/test/fixtures";
import { approveForVoting, closeVoting, rejectProposal } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe.skipIf(!process.env.DATABASE_URL)("guardia di ruolo sulle azioni admin/proposte", () => {
  afterAll(resetTestData);

  it("un UTENTE viene reindirizzato alla home, la proposta resta invariata", async () => {
    const author = await createTestUser();
    const utente = await createTestUser("UTENTE");
    const proposal = await createTestProposal("REVISIONE", author.id);
    setMockSession(mockSession(utente));

    await expect(approveForVoting(proposal.id)).rejects.toThrow("NEXT_REDIRECT:/");

    const prisma = getPrisma();
    expect(await prisma.proposal.findUniqueOrThrow({ where: { id: proposal.id } })).toMatchObject({
      status: "REVISIONE",
    });
  });

  it("un non autenticato viene reindirizzato ad /accedi", async () => {
    const author = await createTestUser();
    const proposal = await createTestProposal("REVISIONE", author.id);
    setMockSession(null);

    await expect(approveForVoting(proposal.id)).rejects.toThrow("NEXT_REDIRECT:/accedi");
  });

  it("un ADMIN porta la proposta in REVISIONE a VOTAZIONE", async () => {
    const author = await createTestUser();
    const admin = await createTestUser("ADMIN");
    const proposal = await createTestProposal("REVISIONE", author.id);
    setMockSession(mockSession(admin));

    await approveForVoting(proposal.id);

    const prisma = getPrisma();
    expect(await prisma.proposal.findUniqueOrThrow({ where: { id: proposal.id } })).toMatchObject({
      status: "VOTAZIONE",
    });
  });

  it("un SUPERADMIN porta la proposta in VOTAZIONE a APPROVATA", async () => {
    const author = await createTestUser();
    const superadmin = await createTestUser("SUPERADMIN");
    const proposal = await createTestProposal("VOTAZIONE", author.id);
    setMockSession(mockSession(superadmin));

    await closeVoting(proposal.id);

    const prisma = getPrisma();
    expect(await prisma.proposal.findUniqueOrThrow({ where: { id: proposal.id } })).toMatchObject({
      status: "APPROVATA",
    });
  });

  it("rejectProposal cancella la riga solo per un ADMIN/SUPERADMIN", async () => {
    const author = await createTestUser();
    const admin = await createTestUser("ADMIN");
    const proposal = await createTestProposal("REVISIONE", author.id);
    setMockSession(mockSession(admin));

    await rejectProposal(proposal.id);

    const prisma = getPrisma();
    expect(await prisma.proposal.findUnique({ where: { id: proposal.id } })).toBeNull();
  });
});
