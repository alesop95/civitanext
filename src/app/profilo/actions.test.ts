import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { createTestUser, mockSession, resetTestData, setMockSession } from "@/test/fixtures";
import { requestAccountDeletion, toggleDigestOptIn } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe.skipIf(!process.env.DATABASE_URL)("toggleDigestOptIn", () => {
  afterAll(resetTestData);

  it("inverte la preferenza a ogni chiamata", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));
    const prisma = getPrisma();

    await toggleDigestOptIn();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).digestOptIn).toBe(
      true,
    );

    await toggleDigestOptIn();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).digestOptIn).toBe(
      false,
    );
  });
});

describe.skipIf(!process.env.DATABASE_URL)("requestAccountDeletion", () => {
  afterAll(resetTestData);

  it("crea una richiesta per l'utente autenticato", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));

    await requestAccountDeletion();

    const prisma = getPrisma();
    expect(
      await prisma.accountDeletionRequest.count({ where: { userId: user.id } }),
    ).toBe(1);
  });

  it("e' idempotente: non crea una seconda richiesta se una e' gia' in attesa", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));

    await requestAccountDeletion();
    await requestAccountDeletion();

    const prisma = getPrisma();
    expect(
      await prisma.accountDeletionRequest.count({ where: { userId: user.id } }),
    ).toBe(1);
  });

  it("non scrive nulla se non autenticato", async () => {
    const user = await createTestUser();
    setMockSession(null);

    await requestAccountDeletion();

    const prisma = getPrisma();
    expect(await prisma.accountDeletionRequest.count({ where: { userId: user.id } })).toBe(0);
  });
});
