import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { VoteTargetType } from "@/generated/prisma/client";
import { createTestPoll, createTestUser, mockSession, resetTestData, setMockSession } from "@/test/fixtures";
import { votePoll } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe.skipIf(!process.env.DATABASE_URL)("votePoll", () => {
  afterAll(resetTestData);

  it("il primo voto su un'opzione crea il Vote", async () => {
    const user = await createTestUser();
    const poll = await createTestPoll(["A", "B"]);
    setMockSession(mockSession(user));

    await votePoll(poll.id, poll.options[0].id);

    const prisma = getPrisma();
    const vote = await prisma.vote.findFirst({
      where: { userId: user.id, targetType: VoteTargetType.POLL, targetId: poll.options[0].id },
    });
    expect(vote).not.toBeNull();
  });

  it("rivotare la stessa opzione ritira il voto", async () => {
    const user = await createTestUser();
    const poll = await createTestPoll(["A", "B"]);
    setMockSession(mockSession(user));

    await votePoll(poll.id, poll.options[0].id);
    await votePoll(poll.id, poll.options[0].id);

    const prisma = getPrisma();
    expect(await prisma.vote.count({ where: { userId: user.id, targetType: VoteTargetType.POLL } })).toBe(0);
  });

  it("votare un'altra opzione dello stesso sondaggio sposta il voto, non lo somma", async () => {
    const user = await createTestUser();
    const poll = await createTestPoll(["A", "B"]);
    setMockSession(mockSession(user));

    await votePoll(poll.id, poll.options[0].id);
    await votePoll(poll.id, poll.options[1].id);

    const prisma = getPrisma();
    const votes = await prisma.vote.findMany({ where: { userId: user.id, targetType: VoteTargetType.POLL } });
    expect(votes).toHaveLength(1);
    expect(votes[0].targetId).toBe(poll.options[1].id);
  });

  it("reindirizza ad /accedi se non autenticato, senza scrivere voti", async () => {
    const poll = await createTestPoll(["A", "B"]);
    setMockSession(null);

    await expect(votePoll(poll.id, poll.options[0].id)).rejects.toThrow("NEXT_REDIRECT:/accedi");

    const prisma = getPrisma();
    expect(await prisma.vote.count({ where: { targetType: VoteTargetType.POLL, targetId: { in: poll.options.map((o) => o.id) } } })).toBe(0);
  });
});
