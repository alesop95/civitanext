"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { MAX_SHORT_TEXT } from "@/lib/validation";
import { exceedsLimit, windowStart } from "@/lib/rate-limit";

// Anti-spam (hardening): non piu' di 10 competenze in 60 minuti per socio (vedi
// src/lib/rate-limit.ts). Tetto piu' alto di proposte/thread: dichiarare piu' competenze in una
// sessione e' un uso legittimo comune, non solo un caso limite.
const SKILL_RATE_LIMIT = { max: 10, minutes: 60 };

// Contenuto autoriale come il forum: guardia di sola autenticazione, non di ruolo. La voce
// appartiene all'utente loggato (userId). name e' obbligatorio; offer e' facoltativo e ripiega
// sul default del prototipo ("Disponibile su richiesta") invece di restare vuoto. name/offer
// sono entrambi "riga breve" (MAX_SHORT_TEXT): coerente col prototipo, dove sono tag brevi, non
// un testo lungo.
export async function createSkill(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const name = String(formData.get("name") ?? "").trim();
  const offer = String(formData.get("offer") ?? "").trim() || "Disponibile su richiesta";
  if (!name) redirect("/competenze/nuova?error=1");
  if (name.length > MAX_SHORT_TEXT || offer.length > MAX_SHORT_TEXT) {
    redirect("/competenze/nuova?error=2");
  }

  const prisma = getPrisma();

  const recentCount = await prisma.skill.count({
    where: {
      userId: session.user.id,
      createdAt: { gte: windowStart(SKILL_RATE_LIMIT.minutes) },
    },
  });
  if (exceedsLimit(recentCount, SKILL_RATE_LIMIT.max)) redirect("/competenze/nuova?error=3");

  await prisma.skill.create({
    data: { name, offer, userId: session.user.id },
  });

  revalidatePath("/competenze");
  redirect("/competenze");
}
