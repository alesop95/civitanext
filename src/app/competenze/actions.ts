"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

// Contenuto autoriale come il forum: guardia di sola autenticazione, non di ruolo. La voce
// appartiene all'utente loggato (userId). name e' obbligatorio; offer e' facoltativo e ripiega
// sul default del prototipo ("Disponibile su richiesta") invece di restare vuoto.
export async function createSkill(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const name = String(formData.get("name") ?? "").trim();
  const offer = String(formData.get("offer") ?? "").trim() || "Disponibile su richiesta";
  if (!name) redirect("/competenze/nuova?error=1");

  const prisma = getPrisma();
  await prisma.skill.create({
    data: { name, offer, userId: session.user.id },
  });

  revalidatePath("/competenze");
  redirect("/competenze");
}
