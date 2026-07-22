import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getPrisma } from "@/lib/prisma";
import { createTestPushSubscription, createTestUser, resetTestData } from "@/test/fixtures";

// fixtures.ts importa "@/auth" (setMockSession, non usata qui): senza mockarlo, carica il
// modulo NextAuth reale, che sotto Vitest fallisce a risolvere "next/server" (stesso attrito di
// digest.test.ts).
vi.mock("@/auth", () => ({ auth: vi.fn() }));

const sendPushNotificationMock = vi.fn();
vi.mock("@/lib/push", () => ({
  sendPushNotification: (...args: unknown[]) => sendPushNotificationMock(...args),
}));

const { notifyUser } = await import("./notifications");

describe.skipIf(!process.env.DATABASE_URL)("notifyUser", () => {
  afterAll(resetTestData);
  beforeEach(() => sendPushNotificationMock.mockReset());

  it("crea sempre la notifica in-app, anche senza sottoscrizioni push", async () => {
    const user = await createTestUser();
    const prisma = getPrisma();

    await notifyUser(prisma, user.id, "Messaggio di prova", "/link");

    const notification = await prisma.notification.findFirstOrThrow({
      where: { userId: user.id },
    });
    expect(notification.message).toBe("Messaggio di prova");
    expect(sendPushNotificationMock).not.toHaveBeenCalled();
  });

  it("invia un push per ogni sottoscrizione dell'utente", async () => {
    const user = await createTestUser();
    await createTestPushSubscription(user.id);
    await createTestPushSubscription(user.id);
    sendPushNotificationMock.mockResolvedValue({ ok: true });

    await notifyUser(getPrisma(), user.id, "Messaggio di prova");

    expect(sendPushNotificationMock).toHaveBeenCalledTimes(2);
  });

  it("cancella la sottoscrizione quando il push service la segnala scaduta", async () => {
    const user = await createTestUser();
    const subscription = await createTestPushSubscription(user.id);
    sendPushNotificationMock.mockResolvedValue({ ok: false, expired: true });

    await notifyUser(getPrisma(), user.id, "Messaggio di prova");

    const prisma = getPrisma();
    expect(
      await prisma.pushSubscription.findUnique({ where: { id: subscription.id } }),
    ).toBeNull();
  });

  it("non cancella la sottoscrizione per un errore non definitivo", async () => {
    const user = await createTestUser();
    const subscription = await createTestPushSubscription(user.id);
    sendPushNotificationMock.mockResolvedValue({ ok: false, expired: false });

    await notifyUser(getPrisma(), user.id, "Messaggio di prova");

    const prisma = getPrisma();
    expect(
      await prisma.pushSubscription.findUnique({ where: { id: subscription.id } }),
    ).not.toBeNull();
  });
});
