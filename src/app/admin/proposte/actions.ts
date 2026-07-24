"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/notifications";
import { MAX_LONG_TEXT } from "@/lib/validation";
import { parseImplementationSteps } from "@/lib/proposal-implementation";

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

// Attuazione (Fase 2.5): sostituisce l'intera checklist di passi della proposta e aggiorna la
// nota. La sostituzione (deleteMany + createMany in transazione) e' piu' semplice e sicura di un
// diff riga per riga, e i passi non hanno riferimenti esterni; l'ordine dell'array diventa il
// campo order. La nota vuota torna a null.
export async function manageImplementation(formData: FormData) {
  await requireAdmin();

  const proposalId = String(formData.get("proposalId") ?? "");
  if (!proposalId) redirect("/admin/proposte");

  const note = String(formData.get("note") ?? "").trim();
  if (note.length > MAX_LONG_TEXT) {
    redirect(`/admin/proposte/${proposalId}/attuazione?error=note`);
  }

  const parsed = parseImplementationSteps(String(formData.get("steps") ?? "[]"));
  if (!parsed.ok) redirect(`/admin/proposte/${proposalId}/attuazione?error=steps`);

  const prisma = getPrisma();
  await prisma.$transaction([
    prisma.proposalStep.deleteMany({ where: { proposalId } }),
    ...(parsed.steps.length > 0
      ? [
          prisma.proposalStep.createMany({
            data: parsed.steps.map((step, index) => ({
              proposalId,
              label: step.label,
              order: index,
              done: step.done,
            })),
          }),
        ]
      : []),
    prisma.proposal.update({
      where: { id: proposalId },
      data: { implementationNote: note || null },
    }),
  ]);

  revalidatePath("/proposte");
  revalidatePath(`/admin/proposte/${proposalId}/attuazione`);
  redirect(`/admin/proposte/${proposalId}/attuazione?ok=1`);
}
