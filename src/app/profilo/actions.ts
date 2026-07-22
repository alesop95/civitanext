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
