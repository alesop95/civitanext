"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { VoteTargetType } from "@/generated/prisma/client";
import { MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validation";
import { exceedsLimit, windowStart } from "@/lib/rate-limit";

// Anti-spam (hardening): non piu' di 3 proposte in 60 minuti per autore, contando le righe
// Proposal gia' scritte da questo autore (vedi src/lib/rate-limit.ts). Tetto piu' basso di
// forum/eventi: una proposta apre una coda di revisione admin, un costo reale per chi modera.
const PROPOSAL_RATE_LIMIT = { max: 3, minutes: 60 };

export async function createProposal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title || !category || !description) redirect("/proposte/nuova?error=1");
  if (
    title.length > MAX_SHORT_TEXT ||
    category.length > MAX_SHORT_TEXT ||
    description.length > MAX_LONG_TEXT
  ) {
    redirect("/proposte/nuova?error=2");
  }

  const prisma = getPrisma();

  const recentCount = await prisma.proposal.count({
    where: {
      authorId: session.user.id,
      createdAt: { gte: windowStart(PROPOSAL_RATE_LIMIT.minutes) },
    },
  });
  if (exceedsLimit(recentCount, PROPOSAL_RATE_LIMIT.max)) redirect("/proposte/nuova?error=3");

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
