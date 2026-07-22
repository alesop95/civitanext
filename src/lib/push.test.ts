import { beforeEach, describe, expect, it, vi } from "vitest";

const sendNotificationMock = vi.fn();
const setVapidDetailsMock = vi.fn();

class FakeWebPushError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Isola l'SDK web-push, mai un push service reale in CI: WebPushError e' la stessa classe che
// push.ts importa (il mock sostituisce l'intero modulo), quindi l'instanceof al suo interno
// funziona esattamente come a runtime.
vi.mock("web-push", () => ({
  default: {
    sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
    setVapidDetails: (...args: unknown[]) => setVapidDetailsMock(...args),
  },
  WebPushError: FakeWebPushError,
}));

const { sendPushNotification } = await import("./push");

const subscription = { endpoint: "https://push.example/abc", p256dh: "p", auth: "a" };

beforeEach(() => {
  sendNotificationMock.mockReset();
  process.env.VAPID_SUBJECT = "mailto:test@example.com";
  process.env.VAPID_PUBLIC_KEY = "public-key";
  process.env.VAPID_PRIVATE_KEY = "private-key";
});

describe("sendPushNotification", () => {
  it("invia il payload come JSON e ritorna ok", async () => {
    sendNotificationMock.mockResolvedValue({ statusCode: 201 });

    const result = await sendPushNotification(subscription, { title: "t", body: "b" });

    expect(result).toEqual({ ok: true });
    expect(sendNotificationMock).toHaveBeenCalledWith(
      { endpoint: subscription.endpoint, keys: { p256dh: "p", auth: "a" } },
      JSON.stringify({ title: "t", body: "b" }),
    );
  });

  it("segnala expired:true su 410 (sottoscrizione scaduta)", async () => {
    sendNotificationMock.mockRejectedValue(new FakeWebPushError("Gone", 410));

    const result = await sendPushNotification(subscription, { title: "t", body: "b" });

    expect(result).toEqual({ ok: false, expired: true });
  });

  it("segnala expired:true su 404 (sottoscrizione non trovata)", async () => {
    sendNotificationMock.mockRejectedValue(new FakeWebPushError("Not found", 404));

    const result = await sendPushNotification(subscription, { title: "t", body: "b" });

    expect(result).toEqual({ ok: false, expired: true });
  });

  it("non segnala expired per un errore non definitivo (es. 500 del push service)", async () => {
    sendNotificationMock.mockRejectedValue(new FakeWebPushError("Server error", 500));

    const result = await sendPushNotification(subscription, { title: "t", body: "b" });

    expect(result).toEqual({ ok: false, expired: false });
  });

  it("non segnala expired per un errore che non e' un WebPushError (es. rete)", async () => {
    sendNotificationMock.mockRejectedValue(new Error("network down"));

    const result = await sendPushNotification(subscription, { title: "t", body: "b" });

    expect(result).toEqual({ ok: false, expired: false });
  });
});
