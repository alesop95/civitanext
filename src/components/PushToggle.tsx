"use client";

import { useEffect, useState } from "react";
import { Btn } from "@/components/ui/Btn";
import { subscribeToPush, unsubscribeFromPush } from "@/app/profilo/actions";

// L'endpoint di subscribe() vuole un Uint8Array, non la stringa base64url che VAPID produce:
// conversione standard, identica in ogni guida Web Push.
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function PushToggle() {
  // Lazy initializer, non un effetto: durante l'hydration gira gia' nel browser (navigator e'
  // definito), quindi non serve un giro di render in piu' solo per scoprire se l'API esiste.
  const [supported] = useState(
    () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window,
  );
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!supported) return;

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setSubscribed(subscription !== null))
      .catch(() => {});
  }, [supported]);

  async function handleSubscribe() {
    setPending(true);
    setError(false);
    try {
      const registration = await navigator.serviceWorker.ready;
      // pushManager.subscribe() chiede da solo il permesso di notifica se non e' ancora stato
      // deciso: nessuna chiamata separata a Notification.requestPermission() prima.
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
        ),
      });
      const keys = subscription.toJSON().keys ?? {};
      await subscribeToPush({
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh ?? "",
        auth: keys.auth ?? "",
      });
      setSubscribed(true);
    } catch {
      // Permesso negato dal socio, o revocato dal sistema operativo: non un errore da segnalare
      // come guasto, solo lo stato "non attivo" che resta invariato.
      setError(true);
    } finally {
      setPending(false);
    }
  }

  async function handleUnsubscribe() {
    setPending(true);
    setError(false);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await unsubscribeFromPush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  if (!supported) {
    return (
      <p className="font-ui text-xs text-ink-soft">
        Questo browser non supporta le notifiche push.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-ui text-sm font-bold">Notifiche push su questo dispositivo</p>
        <p className="font-ui text-xs text-ink-soft">
          Un avviso quando una tua proposta avanza.
        </p>
        {error && (
          <p className="font-ui text-xs text-ink-soft">
            Permesso non concesso o non disponibile.
          </p>
        )}
      </div>
      <Btn
        type="button"
        kind={subscribed ? "primary" : "secondary"}
        small
        disabled={pending}
        onClick={subscribed ? handleUnsubscribe : handleSubscribe}
      >
        {subscribed ? "Attivo" : "Attiva"}
      </Btn>
    </div>
  );
}
