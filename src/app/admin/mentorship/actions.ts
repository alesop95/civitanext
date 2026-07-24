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

export async function createMentor(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slotsRaw = Number(formData.get("slots"));
  const slots = Number.isInteger(slotsRaw) && slotsRaw >= 0 ? slotsRaw : 1;

  if (!name || !area || !description) redirect("/admin/mentorship/nuovo?error=1");
  if (name.length > MAX_SHORT_TEXT || area.length > MAX_SHORT_TEXT || description.length > MAX_LONG_TEXT) {
    redirect("/admin/mentorship/nuovo?error=2");
  }

  const prisma = getPrisma();
  await prisma.mentor.create({ data: { name, area, description, slots } });

  revalidatePath("/mentorship");
  redirect("/mentorship");
}

// Cancella un mentor e, prima, le sue richieste di incontro (FK MentorRequest.mentorId): in
// transazione, cosi' il delete non dipende dalla regola referenziale del database. Le richieste
// non sono contenuto pubblico, solo il collegamento socio-mentor: eliminarle con il mentor e'
// corretto.
export async function deleteMentor(mentorId: string) {
  await requireAdmin();
  const prisma = getPrisma();

  await prisma.$transaction([
    prisma.mentorRequest.deleteMany({ where: { mentorId } }),
    prisma.mentor.delete({ where: { id: mentorId } }),
  ]);

  revalidatePath("/mentorship");
}
