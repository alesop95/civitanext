"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { MAX_LONG_TEXT, MAX_SHORT_TEXT } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
}

export async function createCivicSpace(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const hours = String(formData.get("hours") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!name || !type || !hours || !note) redirect("/admin/spazi-civici/nuovo?error=1");
  if (
    name.length > MAX_SHORT_TEXT ||
    type.length > MAX_SHORT_TEXT ||
    hours.length > MAX_SHORT_TEXT ||
    note.length > MAX_LONG_TEXT
  ) {
    redirect("/admin/spazi-civici/nuovo?error=2");
  }

  const prisma = getPrisma();
  await prisma.civicSpace.create({ data: { name, type, hours, note } });

  revalidatePath("/spazi-civici");
  redirect("/spazi-civici");
}
