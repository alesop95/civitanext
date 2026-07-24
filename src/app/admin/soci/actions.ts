"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { canChangeRole, nextTesseraNumero, ASSIGNABLE_ROLES, type AppRole } from "@/lib/user-admin";

async function requireAdminSession() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
  return session.user;
}

// Cambio ruolo. La UI passa userId e role via FormData (una tendina per riga). La guardia vera e'
// canChangeRole lato server, ricontrollata qui leggendo lo stato reale del bersaglio dal database:
// non ci si fida di cosa la tendina permetteva di selezionare.
export async function changeUserRole(formData: FormData) {
  const actor = await requireAdminSession();
  const userId = String(formData.get("userId") ?? "");
  const newRole = String(formData.get("role") ?? "") as AppRole;
  if (!userId || !ASSIGNABLE_ROLES.includes(newRole)) return;

  const prisma = getPrisma();
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return;

  const allowed = canChangeRole({
    actorRole: actor.role as AppRole,
    targetCurrentRole: target.role as AppRole,
    newRole,
    isSelf: actor.id === userId,
  });
  if (!allowed) return;

  await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
  revalidatePath("/admin/soci");
}

// Assegna la tessera a un socio che non ne ha una. Il numero e' calcolato dal massimo progressivo
// esistente (funzione pura nextTesseraNumero). tesseraNumero e' unique nello schema: a questa
// scala una gara tra due assegnazioni simultanee e' improbabile e, se capitasse, la update
// fallirebbe per il vincolo e l'admin riproverebbe, senza rischio di duplicati.
export async function assignTessera(userId: string) {
  await requireAdminSession();
  const prisma = getPrisma();

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { tesseraNumero: true },
  });
  if (!target || target.tesseraNumero) return;

  const withTessera = await prisma.user.findMany({
    where: { tesseraNumero: { not: null } },
    select: { tesseraNumero: true },
  });
  const numero = nextTesseraNumero(
    withTessera.map((u) => u.tesseraNumero).filter((t): t is string => t !== null),
  );

  await prisma.user.update({ where: { id: userId }, data: { tesseraNumero: numero } });
  revalidatePath("/admin/soci");
}

// Revoca la tessera (torna a socio non tesserato). Il tesseramento e' indipendente dal ruolo
// (ADR-010): revocare la tessera non tocca il ruolo dell'utente.
export async function revokeTessera(userId: string) {
  await requireAdminSession();
  const prisma = getPrisma();
  await prisma.user.update({ where: { id: userId }, data: { tesseraNumero: null } });
  revalidatePath("/admin/soci");
}
