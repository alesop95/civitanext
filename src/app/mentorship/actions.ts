"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

// Richiesta di incontro con un mentor. Guardia di sola autenticazione (contenuto del mentee, non
// admin). Una sola richiesta per (mentor, socio): il vincolo @@unique la garantisce a livello di
// database; qui si evita l'eccezione controllando prima, stesso schema di toggleRsvp. Nessun
// decremento di slots: il numero e' informativo (vedi commento su Mentor in schema.prisma).
export async function requestMentor(mentorId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  const prisma = getPrisma();
  const userId = session.user.id;

  const existing = await prisma.mentorRequest.findUnique({
    where: { mentorId_userId: { mentorId, userId } },
  });
  if (!existing) {
    await prisma.mentorRequest.create({ data: { mentorId, userId } });
  }

  revalidatePath("/mentorship");
}
