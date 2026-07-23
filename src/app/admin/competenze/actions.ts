"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
}

// Moderazione (hardening): le competenze non avevano alcuna azione di cancellazione finora.
export async function deleteSkill(skillId: string) {
  await requireAdmin();
  const prisma = getPrisma();
  await prisma.skill.delete({ where: { id: skillId } });
  revalidatePath("/competenze");
}
