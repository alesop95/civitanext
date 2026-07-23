import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import {
  createTestReply,
  createTestThread,
  createTestUser,
  mockSession,
  resetTestData,
  setMockSession,
} from "@/test/fixtures";
import { deleteReply, deleteThread } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe.skipIf(!process.env.DATABASE_URL)("guardia di ruolo su admin/forum", () => {
  afterAll(resetTestData);

  it("un UTENTE viene reindirizzato alla home, il thread resta", async () => {
    const author = await createTestUser();
    const utente = await createTestUser("UTENTE");
    const thread = await createTestThread(author.id);
    setMockSession(mockSession(utente));

    await expect(deleteThread(thread.id)).rejects.toThrow("NEXT_REDIRECT:/");

    const prisma = getPrisma();
    expect(await prisma.thread.findUnique({ where: { id: thread.id } })).not.toBeNull();
  });

  it("un ADMIN cancella il thread e prima le sue risposte", async () => {
    const author = await createTestUser();
    const admin = await createTestUser("ADMIN");
    const thread = await createTestThread(author.id);
    await createTestReply(thread.id, author.id);
    setMockSession(mockSession(admin));

    await expect(deleteThread(thread.id)).rejects.toThrow("NEXT_REDIRECT:/forum");

    const prisma = getPrisma();
    expect(await prisma.thread.findUnique({ where: { id: thread.id } })).toBeNull();
    expect(await prisma.reply.count({ where: { threadId: thread.id } })).toBe(0);
  });

  it("un ADMIN cancella una singola risposta senza toccare il thread", async () => {
    const author = await createTestUser();
    const admin = await createTestUser("ADMIN");
    const thread = await createTestThread(author.id);
    const reply = await createTestReply(thread.id, author.id);
    setMockSession(mockSession(admin));

    await deleteReply(reply.id);

    const prisma = getPrisma();
    expect(await prisma.reply.findUnique({ where: { id: reply.id } })).toBeNull();
    expect(await prisma.thread.findUnique({ where: { id: thread.id } })).not.toBeNull();
  });
});
