"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

// Preferenza personale, guardia di sola autenticazione: nessun ruolo coinvolto, un socio decide
// solo per se stesso. Stesso schema di toggleRsvp (eventi/actions.ts): letto lo stato attuale e
// invertito, nessun parametro dal form oltre la sessione.
export async function toggleDigestOptIn() {
  const session = await auth();
  if (!session?.user?.id) return;

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { digestOptIn: !user.digestOptIn },
  });

  revalidatePath("/profilo");
}

// Chiamate direttamente come funzioni da un componente client (PushToggle.tsx), non legate a un
// <form>: la sottoscrizione del browser (endpoint + chiavi) e' un oggetto JS prodotto da
// pushManager.subscribe(), non campi di un form testuale. Prima eccezione al pattern
// form-only del resto del progetto, per un motivo tecnico reale, non per comodita'.
export async function subscribeToPush(subscription: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return;

  const prisma = getPrisma();
  // upsert su endpoint (univoco per costruzione, e' l'URL assegnato dal browser a questa
  // sottoscrizione): risottoscrivere lo stesso dispositivo aggiorna la riga invece di violare
  // il vincolo di unicita'.
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { userId: session.user.id, p256dh: subscription.p256dh, auth: subscription.auth },
    create: { userId: session.user.id, ...subscription },
  });
}

export async function unsubscribeFromPush(endpoint: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const prisma = getPrisma();
  // Filtro anche su userId, non solo su endpoint: un utente cancella solo una sottoscrizione
  // propria, mai quella di qualcun altro anche se ne indovinasse l'endpoint.
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });
}

// Richiesta GDPR (ADR-018): il socio la invia, un admin la esegue a mano da
// admin/account-deletion/actions.ts. Idempotente come requestMentor: se esiste gia' una
// richiesta non ancora elaborata per questo utente, non ne crea una seconda.
export async function requestAccountDeletion() {
  const session = await auth();
  if (!session?.user?.id) return;

  const prisma = getPrisma();
  const pending = await prisma.accountDeletionRequest.findFirst({
    where: { userId: session.user.id, processedAt: null },
  });
  if (!pending) {
    await prisma.accountDeletionRequest.create({ data: { userId: session.user.id } });
  }

  revalidatePath("/profilo");
}
