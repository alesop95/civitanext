import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import {
  createTestAccountDeletionRequest,
  createTestOAuthAccount,
  createTestPushSubscription,
  createTestThread,
  createTestUser,
  mockSession,
  resetTestData,
  setMockSession,
} from "@/test/fixtures";
import { processAccountDeletion } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe.skipIf(!process.env.DATABASE_URL)("processAccountDeletion", () => {
  afterAll(resetTestData);

  it("un UTENTE viene reindirizzato alla home, la richiesta resta in attesa", async () => {
    const target = await createTestUser();
    const utente = await createTestUser("UTENTE");
    const request = await createTestAccountDeletionRequest(target.id);
    setMockSession(mockSession(utente));

    await expect(processAccountDeletion(request.id)).rejects.toThrow("NEXT_REDIRECT:/");

    const prisma = getPrisma();
    const reloaded = await prisma.accountDeletionRequest.findUniqueOrThrow({
      where: { id: request.id },
    });
    expect(reloaded.processedAt).toBeNull();
  });

  it("un non autenticato viene reindirizzato ad /accedi", async () => {
    const target = await createTestUser();
    const request = await createTestAccountDeletionRequest(target.id);
    setMockSession(null);

    await expect(processAccountDeletion(request.id)).rejects.toThrow("NEXT_REDIRECT:/accedi");
  });

  it("un ADMIN anonimizza l'utente e cancella credenziali/dispositivi, senza toccare i contenuti", async () => {
    const target = await createTestUser();
    const admin = await createTestUser("ADMIN");
    const prisma = getPrisma();

    // Dati personali reali da anonimizzare, oltre ai default della fixture.
    await prisma.user.update({
      where: { id: target.id },
      data: {
        passwordHash: "hash-fittizio",
        image: "https://example.com/avatar.png",
        tesseraNumero: `TS-${target.id.slice(0, 6)}`,
        emailVerified: new Date(),
        digestOptIn: true,
      },
    });
    const originalEmail = target.email;

    // "Pulizia profonda": credenziali OAuth e sottoscrizione push da cancellare per davvero.
    await createTestOAuthAccount(target.id);
    await createTestPushSubscription(target.id);
    await prisma.verificationToken.create({
      data: { identifier: originalEmail, token: "token-fittizio", expires: new Date() },
    });

    // Contenuto generato dall'utente: deve restare intatto (solo l'autore diventa anonimo).
    const thread = await createTestThread(target.id);

    const request = await createTestAccountDeletionRequest(target.id);
    setMockSession(mockSession(admin));

    await processAccountDeletion(request.id);

    const anonymized = await prisma.user.findUniqueOrThrow({ where: { id: target.id } });
    expect(anonymized.name).toBe("Utente cancellato");
    expect(anonymized.email).toBe(`deleted-${target.id}@anonimizzato.civitanext.local`);
    expect(anonymized.passwordHash).toBeNull();
    expect(anonymized.image).toBeNull();
    expect(anonymized.tesseraNumero).toBeNull();
    expect(anonymized.emailVerified).toBeNull();
    expect(anonymized.digestOptIn).toBe(false);

    expect(await prisma.account.count({ where: { userId: target.id } })).toBe(0);
    expect(await prisma.pushSubscription.count({ where: { userId: target.id } })).toBe(0);
    expect(
      await prisma.verificationToken.count({ where: { identifier: originalEmail } }),
    ).toBe(0);

    // Il contenuto resta: stesso id, ancora agganciato all'utente (ora anonimo).
    const stillThere = await prisma.thread.findUnique({ where: { id: thread.id } });
    expect(stillThere).not.toBeNull();
    expect(stillThere?.authorId).toBe(target.id);

    const processedRequest = await prisma.accountDeletionRequest.findUniqueOrThrow({
      where: { id: request.id },
    });
    expect(processedRequest.processedAt).not.toBeNull();
    expect(processedRequest.processedById).toBe(admin.id);
  });

  it("non fa nulla se la richiesta e' gia' stata elaborata", async () => {
    const target = await createTestUser();
    const admin = await createTestUser("ADMIN");
    const request = await createTestAccountDeletionRequest(target.id);
    setMockSession(mockSession(admin));

    await processAccountDeletion(request.id);
    const firstRun = await getPrisma().user.findUniqueOrThrow({ where: { id: target.id } });

    await processAccountDeletion(request.id);
    const secondRun = await getPrisma().user.findUniqueOrThrow({ where: { id: target.id } });

    expect(secondRun.email).toBe(firstRun.email);
  });
});
