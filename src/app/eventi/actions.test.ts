import { afterAll, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { createTestEvent, createTestUser, mockSession, resetTestData, setMockSession } from "@/test/fixtures";
import { toggleRsvp } from "./actions";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

describe.skipIf(!process.env.DATABASE_URL)("toggleRsvp", () => {
  afterAll(resetTestData);

  it("crea l'RSVP al primo invio e lo rimuove al secondo (toggle)", async () => {
    const user = await createTestUser();
    const event = await createTestEvent();
    setMockSession(mockSession(user));
    const prisma = getPrisma();

    await toggleRsvp(event.id);
    expect(
      await prisma.rsvp.findUnique({ where: { userId_eventId: { userId: user.id, eventId: event.id } } }),
    ).not.toBeNull();

    await toggleRsvp(event.id);
    expect(
      await prisma.rsvp.findUnique({ where: { userId_eventId: { userId: user.id, eventId: event.id } } }),
    ).toBeNull();
  });

  it("non scrive nulla se non autenticato", async () => {
    const event = await createTestEvent();
    setMockSession(null);

    await toggleRsvp(event.id);

    const prisma = getPrisma();
    expect(await prisma.rsvp.count({ where: { eventId: event.id } })).toBe(0);
  });
});
