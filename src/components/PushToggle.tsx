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
  // Il supporto all'API va rilevato DOPO il mount, non in un lazy initializer: sul server
  // `window`/`navigator` non esistono, quindi l'HTML server-rendered mostrerebbe un ramo (il
  // messaggio "non supportato") e il primo render nel browser un altro (il toggle), causando un
  // errore di hydration. Con `mounted` il primo render client coincide con quello del server
  // (entrambi lo stato di caricamento), poi l'effetto rileva il supporto e aggiorna.
  // mounted e supported in un solo stato: cosi' la rilevazione client-only e' un unico setState
  // una tantum dopo il mount, non un ciclo di render (il render successivo dipende solo dal
  // valore rilevato, non ne innesca altri).
  const [client, setClient] = useState({ mounted: false, supported: false });
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  const { mounted, supported } = client;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- rilevazione client-only post-mount
    setClient({
      mounted: true,
      supported: "serviceWorker" in navigator && "PushManager" in window,
    });
  }, []);

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

  // Prima del mount il server e il primo render client mostrano lo stesso segnaposto neutro:
  // e' cio' che evita il mismatch di hydration.
  if (!mounted) {
    return <p className="font-ui text-xs text-ink-soft">Caricamento notifiche push...</p>;
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
