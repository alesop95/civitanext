"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

export async function createThread(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !category || !body) redirect("/forum/nuovo?error=1");

  const prisma = getPrisma();
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
  if (!body) return;

  const prisma = getPrisma();
  await prisma.reply.create({
    data: { threadId, body, authorId: session.user.id },
  });

  revalidatePath(`/forum/${threadId}`);
}
