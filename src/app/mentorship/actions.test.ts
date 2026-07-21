import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import {
  createTestMentor,
  createTestUser,
  mockSession,
  resetTestData,
  setMockSession,
} from "@/test/fixtures";
import { requestMentor } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe.skipIf(!process.env.DATABASE_URL)("requestMentor", () => {
  afterAll(resetTestData);

  it("registra la richiesta una sola volta anche a invii ripetuti (idempotente)", async () => {
    const user = await createTestUser();
    const mentor = await createTestMentor();
    setMockSession(mockSession(user));
    const prisma = getPrisma();

    await requestMentor(mentor.id);
    await requestMentor(mentor.id);

    expect(await prisma.mentorRequest.count({ where: { mentorId: mentor.id } })).toBe(1);
  });

  it("non scrive nulla se non autenticato", async () => {
    const mentor = await createTestMentor();
    setMockSession(null);

    await requestMentor(mentor.id);

    const prisma = getPrisma();
    expect(await prisma.mentorRequest.count({ where: { mentorId: mentor.id } })).toBe(0);
  });
});
