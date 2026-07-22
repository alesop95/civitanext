import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { createTestEvent, createTestThread, createTestUser, resetTestData } from "@/test/fixtures";

// fixtures.ts importa "@/auth" per setMockSession/mockSession (non usate in questo file, ma
// l'import esiste comunque): senza mockarlo qui, carica il modulo NextAuth reale, che sotto
// Vitest fallisce a risolvere "next/server" (osservato, stesso attrito mai incontrato dagli altri
// file di test perche' mockano tutti "@/auth").
vi.mock("@/auth", () => ({ auth: vi.fn() }));

const sendEmailMock = vi.fn();
vi.mock("@/lib/resend", () => ({
  sendEmail: (...args: unknown[]) => sendEmailMock(...args),
}));

const { buildDigestContent, isDigestEmpty, renderDigestHtml, sendWeeklyDigest } = await import(
  "./digest"
);

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-07-21T09:00:00.000Z");

describe("renderDigestHtml", () => {
  it("fa la fuga HTML di titoli e nomi (contenuto scritto dai soci, non dall'admin)", () => {
    const html = renderDigestHtml({
      events: [],
      threads: [
        { id: "1", title: "<img onerror=alert(1)>", category: "Test", authorName: "Mario" },
      ],
    });

    expect(html).not.toContain("<img onerror");
    expect(html).toContain("&lt;img onerror=alert(1)&gt;");
  });
});

describe("isDigestEmpty", () => {
  it("e' vuoto solo se non ci sono ne' eventi ne' thread", () => {
    expect(isDigestEmpty({ events: [], threads: [] })).toBe(true);
    expect(
      isDigestEmpty({
        events: [{ id: "1", title: "x", date: NOW, location: "x" }],
        threads: [],
      }),
    ).toBe(false);
  });
});

describe.skipIf(!process.env.DATABASE_URL)("buildDigestContent e sendWeeklyDigest", () => {
  afterAll(resetTestData);
  beforeEach(() => sendEmailMock.mockClear());

  it("include solo eventi nei prossimi 7 giorni e thread degli ultimi 7 giorni", async () => {
    // Il DB di test e' condiviso anche col seed e2e (scripts/seed-e2e.ts, evento non taggato
    // MARKER, data relativa a "ora"): si isolano le sole righe create da questo test per titolo,
    // invece di assumere che il database sia vuoto.
    const inWindow = await createTestEvent(new Date(NOW.getTime() + 3 * DAY_MS));
    await createTestEvent(new Date(NOW.getTime() + 10 * DAY_MS)); // troppo avanti, escluso
    await createTestEvent(new Date(NOW.getTime() - 1 * DAY_MS)); // gia' passato, escluso

    const author = await createTestUser();
    const inWindowThread = await createTestThread(author.id, new Date(NOW.getTime() - 2 * DAY_MS));
    await createTestThread(author.id, new Date(NOW.getTime() - 10 * DAY_MS)); // troppo vecchio, escluso

    const content = await buildDigestContent(NOW);
    const ownEvents = content.events.filter((event) => event.id === inWindow.id);
    const ownThreads = content.threads.filter((thread) => thread.id === inWindowThread.id);

    expect(ownEvents).toHaveLength(1);
    expect(ownThreads).toHaveLength(1);
    expect(content.events.some((event) => event.title === "vitest-fixture")).toBe(true);
  });

  it("non invia nulla se il digest e' vuoto", async () => {
    const emptyWindow = new Date("2099-01-01T00:00:00.000Z");
    const result = await sendWeeklyDigest(emptyWindow);

    expect(result).toEqual({ sent: 0, skippedEmpty: true });
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("invia solo agli utenti con digestOptIn attivo", async () => {
    await createTestEvent(new Date(NOW.getTime() + DAY_MS));
    const optedIn = await createTestUser();
    await createTestUser(); // opt-out di default, non deve ricevere nulla

    const prisma = getPrisma();
    await prisma.user.update({ where: { id: optedIn.id }, data: { digestOptIn: true } });

    const result = await sendWeeklyDigest(NOW);

    expect(result.sent).toBe(1);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(sendEmailMock).toHaveBeenCalledWith(
      optedIn.email,
      "Il digest settimanale di CivitaNext",
      expect.any(String),
    );
  });
});
