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

export async function approveForVoting(proposalId: string) {
  await requireAdmin();
  const prisma = getPrisma();
  await prisma.proposal.update({ where: { id: proposalId }, data: { status: "VOTAZIONE" } });
  revalidatePath("/admin/proposte");
  revalidatePath("/proposte");
}

export async function closeVoting(proposalId: string) {
  await requireAdmin();
  const prisma = getPrisma();
  await prisma.proposal.update({ where: { id: proposalId }, data: { status: "APPROVATA" } });
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
