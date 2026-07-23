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

export async function createPressArticle(formData: FormData) {
  await requireAdmin();

  const source = String(formData.get("source") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const publishedAtRaw = String(formData.get("publishedAt") ?? "").trim();

  if (!source || !title || !publishedAtRaw) redirect("/admin/rassegna-stampa/nuovo?error=1");
  if (source.length > MAX_SHORT_TEXT || title.length > MAX_SHORT_TEXT) {
    redirect("/admin/rassegna-stampa/nuovo?error=3");
  }

  // L'input type="date" arriva come "aaaa-mm-gg"; una stringa manomessa produce una data
  // invalida che va respinta qui, non affidata al required del browser.
  const publishedAt = new Date(publishedAtRaw);
  if (Number.isNaN(publishedAt.getTime())) redirect("/admin/rassegna-stampa/nuovo?error=1");

  // url e' opzionale (articolo solo cartaceo), ma se presente deve essere un link http(s)
  // assoluto: la pagina pubblica lo renderizza come <a href>, e un valore arbitrario tipo
  // "javascript:..." diventerebbe un vettore di injection.
  if (url && !/^https?:\/\//.test(url)) redirect("/admin/rassegna-stampa/nuovo?error=2");

  const prisma = getPrisma();
  await prisma.pressArticle.create({
    data: { source, title, url: url || null, publishedAt },
  });

  revalidatePath("/rassegna-stampa");
  redirect("/rassegna-stampa");
}
