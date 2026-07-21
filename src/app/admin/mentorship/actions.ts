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

export async function createMentor(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slotsRaw = Number(formData.get("slots"));
  const slots = Number.isInteger(slotsRaw) && slotsRaw >= 0 ? slotsRaw : 1;

  if (!name || !area || !description) redirect("/admin/mentorship/nuovo?error=1");

  const prisma = getPrisma();
  await prisma.mentor.create({ data: { name, area, description, slots } });

  revalidatePath("/mentorship");
  redirect("/mentorship");
}
