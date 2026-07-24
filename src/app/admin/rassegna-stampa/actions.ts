"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { MAX_SHORT_TEXT } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
}

type PressFields = {
  source: string;
  title: string;
  url: string | null;
  publishedAt: Date;
};

// Validazione condivisa. Codici: 1 = obbligatori mancanti o data non valida, 2 = url non http(s),
// 3 = testo troppo lungo. url e' opzionale (articolo solo cartaceo), ma se presente deve essere un
// link http(s) assoluto: la pagina lo rende come <a href>, un "javascript:..." sarebbe injection.
function parsePressForm(formData: FormData): PressFields | number {
  const source = String(formData.get("source") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const publishedAtRaw = String(formData.get("publishedAt") ?? "").trim();

  if (!source || !title || !publishedAtRaw) return 1;
  if (source.length > MAX_SHORT_TEXT || title.length > MAX_SHORT_TEXT) return 3;

  const publishedAt = new Date(publishedAtRaw);
  if (Number.isNaN(publishedAt.getTime())) return 1;

  if (url && !/^https?:\/\//.test(url)) return 2;

  return { source, title, url: url || null, publishedAt };
}

export async function createPressArticle(formData: FormData) {
  await requireAdmin();
  const parsed = parsePressForm(formData);
  if (typeof parsed === "number") redirect(`/admin/rassegna-stampa/nuovo?error=${parsed}`);

  await getPrisma().pressArticle.create({ data: parsed });
  revalidatePath("/rassegna-stampa");
  redirect("/rassegna-stampa");
}

export async function updatePressArticle(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/rassegna-stampa");

  const parsed = parsePressForm(formData);
  if (typeof parsed === "number") redirect(`/admin/rassegna-stampa/${id}/modifica?error=${parsed}`);

  await getPrisma().pressArticle.update({ where: { id }, data: parsed });
  revalidatePath("/rassegna-stampa");
  redirect("/rassegna-stampa");
}

export async function deletePressArticle(id: string) {
  await requireAdmin();
  await getPrisma().pressArticle.delete({ where: { id } });
  revalidatePath("/rassegna-stampa");
}
