import type { PrismaClient } from "@/generated/prisma/client";
import { sendPushNotification } from "@/lib/push";

// Punto unico di creazione delle notifiche in-app, cosi' ogni feature che ne genera una (per
// ora solo le proposte, vedi ADR-013) passa dalla stessa forma invece di scrivere prisma.notification.create
// sparso nei vari file di action. Da quando esistono le notifiche push, questo e' anche il punto
// unico che le invia: chi chiama notifyUser non deve ricordarsi di farlo separatamente. L'invio
// push e' sempre a valle della scrittura in-app (mai l'opposto): se il push fallisce l'utente
// vede comunque la notifica su /notifiche, il push e' un'aggiunta, non l'unica via.
export async function notifyUser(
  prisma: PrismaClient,
  userId: string,
  message: string,
  link?: string,
) {
  await prisma.notification.create({ data: { userId, message, link } });

  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  for (const subscription of subscriptions) {
    const result = await sendPushNotification(subscription, {
      title: "CivitaNext",
      body: message,
      link,
    });
    if (!result.ok && result.expired) {
      await prisma.pushSubscription.delete({ where: { id: subscription.id } });
    }
  }
}
