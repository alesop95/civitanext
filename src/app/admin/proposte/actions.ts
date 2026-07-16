"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
}

export async function approveForVoting(proposalId: string) {
  await requireAdmin();
  const prisma = getPrisma();
  const proposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: "VOTAZIONE" },
  });
  await notifyUser(
    prisma,
    proposal.authorId,
    `La tua proposta "${proposal.title}" è stata approvata per il voto.`,
    "/proposte",
  );
  revalidatePath("/admin/proposte");
  revalidatePath("/proposte");
}

export async function closeVoting(proposalId: string) {
  await requireAdmin();
  const prisma = getPrisma();
  const proposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: "APPROVATA" },
  });
  await notifyUser(
    prisma,
    proposal.authorId,
    `La tua proposta "${proposal.title}" è stata approvata definitivamente.`,
    "/proposte",
  );
  revalidatePath("/admin/proposte");
  revalidatePath("/proposte");
}

// Non esiste uno stato "respinta" nello schema (ADR-... nessuno, scelta pragmatica di questa
// feature): rifiutare una proposta in revisione significa eliminarla, senza storico. Da rivedere
// se in futuro servirà tenere traccia dei rifiuti.
export async function rejectProposal(proposalId: string) {
  await requireAdmin();
  const prisma = getPrisma();
  await prisma.proposal.delete({ where: { id: proposalId } });
  revalidatePath("/admin/proposte");
}
