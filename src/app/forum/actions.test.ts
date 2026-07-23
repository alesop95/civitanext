import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validation";
import {
  createTestReply,
  createTestThread,
  createTestUser,
  mockSession,
  resetTestData,
  setMockSession,
} from "@/test/fixtures";
import { createReply, createThread } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

function threadFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData();
  formData.append("title", overrides.title ?? "Titolo di prova");
  formData.append("category", overrides.category ?? "Città");
  formData.append("body", overrides.body ?? "Corpo del messaggio di prova");
  return formData;
}

describe.skipIf(!process.env.DATABASE_URL)("createThread", () => {
  afterAll(resetTestData);

  it("reindirizza ad /accedi se non autenticato", async () => {
    setMockSession(null);
    await expect(createThread(threadFormData())).rejects.toThrow("NEXT_REDIRECT:/accedi");
  });

  it("rigetta campi vuoti", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));

    await expect(createThread(threadFormData({ title: "" }))).rejects.toThrow(
      "NEXT_REDIRECT:/forum/nuovo?error=1",
    );
  });

  it("rigetta un campo oltre la lunghezza massima, nessuna riga creata", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));

    await expect(
      createThread(threadFormData({ body: "a".repeat(MAX_LONG_TEXT + 1) })),
    ).rejects.toThrow("NEXT_REDIRECT:/forum/nuovo?error=2");

    const prisma = getPrisma();
    expect(await prisma.thread.count({ where: { authorId: user.id } })).toBe(0);
  });

  it("rigetta oltre la soglia di rate limit (5 thread in 10 minuti)", async () => {
    const user = await createTestUser();
    for (let i = 0; i < 5; i++) {
      await createTestThread(user.id);
    }
    setMockSession(mockSession(user));

    await expect(createThread(threadFormData())).rejects.toThrow(
      "NEXT_REDIRECT:/forum/nuovo?error=3",
    );
  });

  it("crea il thread e reindirizza al dettaglio per un input valido", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));

    await expect(createThread(threadFormData({ title: "Titolo unico" }))).rejects.toThrow(
      "NEXT_REDIRECT:/forum/",
    );

    const prisma = getPrisma();
    const thread = await prisma.thread.findFirstOrThrow({ where: { title: "Titolo unico" } });
    expect(thread.authorId).toBe(user.id);
  });
});

describe.skipIf(!process.env.DATABASE_URL)("createReply", () => {
  afterAll(resetTestData);

  it("reindirizza ad /accedi e non scrive nulla se non autenticato", async () => {
    const author = await createTestUser();
    const thread = await createTestThread(author.id);
    setMockSession(null);

    const formData = new FormData();
    formData.append("body", "Risposta di prova");
    await expect(createReply(thread.id, formData)).rejects.toThrow("NEXT_REDIRECT:/accedi");

    const prisma = getPrisma();
    expect(await prisma.reply.count({ where: { threadId: thread.id } })).toBe(0);
  });

  it("non scrive nulla per un corpo oltre la lunghezza massima", async () => {
    const author = await createTestUser();
    const thread = await createTestThread(author.id);
    setMockSession(mockSession(author));

    const formData = new FormData();
    formData.append("body", "a".repeat(MAX_LONG_TEXT + 1));
    await createReply(thread.id, formData);

    const prisma = getPrisma();
    expect(await prisma.reply.count({ where: { threadId: thread.id } })).toBe(0);
  });

  it("non scrive nulla oltre la soglia di rate limit (20 risposte in 10 minuti)", async () => {
    const author = await createTestUser();
    const thread = await createTestThread(author.id);
    for (let i = 0; i < 20; i++) {
      await createTestReply(thread.id, author.id);
    }
    setMockSession(mockSession(author));

    const formData = new FormData();
    formData.append("body", "Una risposta di troppo");
    await createReply(thread.id, formData);

    const prisma = getPrisma();
    expect(
      await prisma.reply.count({ where: { threadId: thread.id, body: "Una risposta di troppo" } }),
    ).toBe(0);
  });

  it("crea la risposta per un input valido", async () => {
    const author = await createTestUser();
    const thread = await createTestThread(author.id);
    setMockSession(mockSession(author));

    const formData = new FormData();
    formData.append("body", "Risposta valida");
    await createReply(thread.id, formData);

    const prisma = getPrisma();
    expect(await prisma.reply.count({ where: { threadId: thread.id, authorId: author.id } })).toBe(
      1,
    );
  });
});

// title/category oltre MAX_SHORT_TEXT: stesso principio del corpo, un solo caso basta a
// verificare che il controllo esista anche per i campi "riga breve".
describe.skipIf(!process.env.DATABASE_URL)("createThread — campi brevi", () => {
  afterAll(resetTestData);

  it("rigetta un titolo oltre MAX_SHORT_TEXT", async () => {
    const user = await createTestUser();
    setMockSession(mockSession(user));

    await expect(
      createThread(threadFormData({ title: "a".repeat(MAX_SHORT_TEXT + 1) })),
    ).rejects.toThrow("NEXT_REDIRECT:/forum/nuovo?error=2");
  });
});
