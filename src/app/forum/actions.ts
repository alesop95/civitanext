"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validation";
import { exceedsLimit, windowStart } from "@/lib/rate-limit";

// Anti-spam (hardening): non piu' di N thread/risposte in una finestra di minuti per autore,
// contando le righe che questo stesso file scrive (nessuna tabella dedicata, vedi
// src/lib/rate-limit.ts). Le risposte tollerano un tetto piu' alto: una discussione vera produce
// piu' risposte che thread nello stesso lasso di tempo.
const THREAD_RATE_LIMIT = { max: 5, minutes: 10 };
const REPLY_RATE_LIMIT = { max: 20, minutes: 10 };

export async function createThread(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !category || !body) redirect("/forum/nuovo?error=1");
  if (
    title.length > MAX_SHORT_TEXT ||
    category.length > MAX_SHORT_TEXT ||
    body.length > MAX_LONG_TEXT
  ) {
    redirect("/forum/nuovo?error=2");
  }

  const prisma = getPrisma();

  const recentCount = await prisma.thread.count({
    where: {
      authorId: session.user.id,
      createdAt: { gte: windowStart(THREAD_RATE_LIMIT.minutes) },
    },
  });
  if (exceedsLimit(recentCount, THREAD_RATE_LIMIT.max)) redirect("/forum/nuovo?error=3");

  const thread = await prisma.thread.create({
    data: { title, category, body, authorId: session.user.id },
  });

  revalidatePath("/forum");
  redirect(`/forum/${thread.id}`);
}

export async function createReply(threadId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const body = String(formData.get("body") ?? "").trim();
  if (!body || body.length > MAX_LONG_TEXT) return;

  const prisma = getPrisma();

  const recentCount = await prisma.reply.count({
    where: {
      authorId: session.user.id,
      createdAt: { gte: windowStart(REPLY_RATE_LIMIT.minutes) },
    },
  });
  if (exceedsLimit(recentCount, REPLY_RATE_LIMIT.max)) return;

  await prisma.reply.create({
    data: { threadId, body, authorId: session.user.id },
  });

  revalidatePath(`/forum/${threadId}`);
}
