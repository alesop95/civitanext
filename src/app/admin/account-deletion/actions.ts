"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

// Esegue la richiesta (ADR-018): anonimizza i dati personali e cancella per davvero le
// credenziali/i dati di dispositivo (Account OAuth — token compresi, PushSubscription,
// VerificationToken residuo sulla vecchia email), NON i contenuti generati (thread, risposte,
// proposte, competenze, RSVP, voti, richieste mentor): potrebbero essere agganciati a
// discussioni di altri soci o essere gia' pubblici (una proposta approvata). La riga User resta,
// con l'identita' sostituita, cosi' i contenuti restano coerenti (autore "Utente cancellato"
// invece di un riferimento rotto) e la richiesta resta ricollegabile. Guardia inline (non un
// requireAdmin() separato) perche' serve anche session.user.id per processedById.
export async function processAccountDeletion(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const prisma = getPrisma();

  const request = await prisma.accountDeletionRequest.findUnique({ where: { id: requestId } });
  if (!request || request.processedAt) return;

  const user = await prisma.user.findUnique({ where: { id: request.userId } });
  if (!user) return;

  // Account ha onDelete: Cascade su userId (schema.prisma), ma lo cancelliamo esplicitamente
  // qui invece di affidarci al cascade implicito: i token OAuth sono credenziali reali, la loro
  // rimozione e' il punto centrale della "pulizia profonda", non un effetto collaterale silente.
  await prisma.account.deleteMany({ where: { userId: user.id } });
  await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
  // VerificationToken non ha una foreign key verso User (identifier e' l'email in chiaro, non
  // l'id): un token residuo sulla vecchia email diventerebbe un riferimento a un indirizzo che
  // dopo questa funzione non esiste piu', ma resterebbe comunque leggibile finche' non scade.
  await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: `deleted-${user.id}@anonimizzato.civitanext.local`,
      name: "Utente cancellato",
      passwordHash: null,
      image: null,
      tesseraNumero: null,
      emailVerified: null,
      digestOptIn: false,
    },
  });

  await prisma.accountDeletionRequest.update({
    where: { id: requestId },
    data: { processedAt: new Date(), processedById: session.user.id },
  });

  revalidatePath("/admin/account-deletion");
}
