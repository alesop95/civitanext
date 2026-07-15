"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

export async function toggleRsvp(eventId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const prisma = getPrisma();
  const userId = session.user.id;

  // Nome della chiave composta verificato in src/generated/prisma/models/Rsvp.ts
  // (RsvpUserIdEventIdCompoundUniqueInput): Prisma la genera come
  // "userId_eventId" dall'ordine dei campi in @@unique([userId, eventId]).
  const existing = await prisma.rsvp.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  if (existing) {
    await prisma.rsvp.delete({ where: { id: existing.id } });
  } else {
    await prisma.rsvp.create({ data: { userId, eventId } });
  }

  // La pagina /eventi legge la lista rsvps per calcolare partecipanti e stato
  // dell'utente: senza revalidatePath resterebbe la versione cache precedente
  // alla scrittura, anche dopo il redirect implicito del form.
  revalidatePath("/eventi");
}
