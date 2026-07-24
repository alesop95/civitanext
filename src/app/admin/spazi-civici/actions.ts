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

type CivicSpaceFields = {
  name: string;
  type: string;
  hours: string;
  note: string;
};

// Validazione condivisa. Codici: 1 = campo obbligatorio mancante, 2 = testo troppo lungo.
function parseCivicSpaceForm(formData: FormData): CivicSpaceFields | number {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const hours = String(formData.get("hours") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!name || !type || !hours || !note) return 1;
  if (
    name.length > MAX_SHORT_TEXT ||
    type.length > MAX_SHORT_TEXT ||
    hours.length > MAX_SHORT_TEXT ||
    note.length > MAX_LONG_TEXT
  ) {
    return 2;
  }

  return { name, type, hours, note };
}

export async function createCivicSpace(formData: FormData) {
  await requireAdmin();
  const parsed = parseCivicSpaceForm(formData);
  if (typeof parsed === "number") redirect(`/admin/spazi-civici/nuovo?error=${parsed}`);

  await getPrisma().civicSpace.create({ data: parsed });
  revalidatePath("/spazi-civici");
  redirect("/spazi-civici");
}

export async function updateCivicSpace(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/spazi-civici");

  const parsed = parseCivicSpaceForm(formData);
  if (typeof parsed === "number") redirect(`/admin/spazi-civici/${id}/modifica?error=${parsed}`);

  await getPrisma().civicSpace.update({ where: { id }, data: parsed });
  revalidatePath("/spazi-civici");
  redirect("/spazi-civici");
}

export async function deleteCivicSpace(id: string) {
  await requireAdmin();
  await getPrisma().civicSpace.delete({ where: { id } });
  revalidatePath("/spazi-civici");
}
