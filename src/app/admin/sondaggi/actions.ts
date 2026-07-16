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
