"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { VoteTargetType } from "@/generated/prisma/client";

export async function createProposal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !category || !description) redirect("/proposte/nuova?error=1");

  const prisma = getPrisma();
  await prisma.proposal.create({
    data: { title, category, description, authorId: session.user.id },
  });

  revalidatePath("/proposte");
  redirect("/proposte");
}

export async function toggleVote(proposalId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const prisma = getPrisma();
  const userId = session.user.id;

  const existing = await prisma.vote.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType: VoteTargetType.PROPOSAL,
        targetId: proposalId,
      },
    },
  });

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
  } else {
    await prisma.vote.create({
      data: { userId, targetType: VoteTargetType.PROPOSAL, targetId: proposalId },
    });
  }

  revalidatePath("/proposte");
}
