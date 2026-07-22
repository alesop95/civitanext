import webpush, { WebPushError } from "web-push";

// Isolato come src/lib/r2.ts/resend.ts: nessuna nozione di "notifica" qui, solo invio di un
// messaggio push a una sottoscrizione. setVapidDetails va chiamato una sola volta (la libreria
// tiene le chiavi in stato di modulo), non a ogni invio.
let configured = false;

function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "",
    process.env.VAPID_PUBLIC_KEY ?? "",
    process.env.VAPID_PRIVATE_KEY ?? "",
  );
  configured = true;
}

export type PushSubscriptionKeys = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushSendResult = { ok: true } | { ok: false; expired: boolean };

// expired=true solo quando il push service risponde 404/410: la sottoscrizione non esiste piu'
// lato browser (permesso revocato, sito disinstallato, dispositivo cambiato), e il chiamante
// (notifyUser) la cancella dal database. Ogni altro errore (rete, 5xx del push service) non
// implica che la sottoscrizione sia morta: si ignora e si ritenta alla prossima notifica, non si
// cancella per un problema temporaneo.
export async function sendPushNotification(
  subscription: PushSubscriptionKeys,
  payload: { title: string; body: string; link?: string },
): Promise<PushSendResult> {
  ensureConfigured();

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify(payload),
    );
    return { ok: true };
  } catch (error) {
    if (error instanceof WebPushError && (error.statusCode === 404 || error.statusCode === 410)) {
      return { ok: false, expired: true };
    }
    return { ok: false, expired: false };
  }
}
