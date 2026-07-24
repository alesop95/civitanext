"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { VoteTargetType } from "@/generated/prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
}

export async function createPoll(formData: FormData) {
  await requireAdmin();

  const question = String(formData.get("question") ?? "").trim();
  const options = formData
    .getAll("option")
    .map((option) => String(option).trim())
    .filter(Boolean);

  if (!question || options.length < 2) redirect("/admin/sondaggi/nuovo?error=1");

  const prisma = getPrisma();
  await prisma.poll.create({
    data: {
      question,
      options: { create: options.map((text) => ({ text })) },
    },
  });

  revalidatePath("/");
  redirect("/");
}

// Cancella un sondaggio. I voti usano il pattern polimorfico di Vote (targetType POLL, targetId =
// PollOption.id) senza foreign key reale verso PollOption, quindi vanno cancellati esplicitamente
// prima delle opzioni: si leggono gli id delle opzioni del sondaggio e si eliminano in transazione
// i voti su quelle, poi le opzioni, poi il sondaggio.
export async function deletePoll(pollId: string) {
  await requireAdmin();
  const prisma = getPrisma();

  const options = await prisma.pollOption.findMany({
    where: { pollId },
    select: { id: true },
  });
  const optionIds = options.map((option) => option.id);

  await prisma.$transaction([
    prisma.vote.deleteMany({
      where: { targetType: VoteTargetType.POLL, targetId: { in: optionIds } },
    }),
    prisma.pollOption.deleteMany({ where: { pollId } }),
    prisma.poll.delete({ where: { id: pollId } }),
  ]);

  revalidatePath("/");
}
