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

// Moderazione (hardening): il forum non aveva alcuna azione di cancellazione finora. Cancellare
// un thread cancella prima le risposte (FK Reply.threadId e' RESTRICT, non CASCADE), stesso
// ordine gia' visto per deleteAlbum (admin/galleria/actions.ts).
export async function deleteThread(threadId: string) {
  await requireAdmin();
  const prisma = getPrisma();

  await prisma.reply.deleteMany({ where: { threadId } });
  await prisma.thread.delete({ where: { id: threadId } });

  revalidatePath("/forum");
  // Utile sia dalla lista (resta li') sia dal dettaglio del thread appena cancellato (altrimenti
  // renderizzerebbe una pagina per un id che non esiste piu').
  redirect("/forum");
}

export async function deleteReply(replyId: string) {
  await requireAdmin();
  const prisma = getPrisma();

  const reply = await prisma.reply.findUnique({ where: { id: replyId } });
  if (!reply) return;

  await prisma.reply.delete({ where: { id: replyId } });

  revalidatePath(`/forum/${reply.threadId}`);
}
