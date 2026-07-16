"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { VoteTargetType } from "@/generated/prisma/client";

// Vote garantisce un voto per (utente, opzione), non per (utente, sondaggio): il controllo che
// impedisce di votare due opzioni dello stesso sondaggio e' qui, non nello schema (vedi
// commento su Poll in schema.prisma). Cliccare di nuovo la stessa opzione ritira il voto,
// cliccarne un'altra lo sposta: stessa idiomatica di toggle gia' usata per RSVP e proposte.
export async function votePoll(pollId: string, optionId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");
  const userId = session.user.id;

  const prisma = getPrisma();
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: { select: { id: true } } },
  });
  if (!poll) return;

  const optionIds = poll.options.map((o) => o.id);
  const existing = await prisma.vote.findFirst({
    where: { userId, targetType: VoteTargetType.POLL, targetId: { in: optionIds } },
  });

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
    if (existing.targetId === optionId) {
      revalidatePath("/");
      return;
    }
  }

  await prisma.vote.create({
    data: { userId, targetType: VoteTargetType.POLL, targetId: optionId },
  });

  revalidatePath("/");
}
