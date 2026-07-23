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

export async function createTimelineEntry(formData: FormData) {
  await requireAdmin();

  const when = String(formData.get("when") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const orderRaw = String(formData.get("order") ?? "").trim();

  if (!when || !title || !text) redirect("/admin/timeline/nuovo?error=1");
  if (when.length > MAX_SHORT_TEXT || title.length > MAX_SHORT_TEXT || text.length > MAX_LONG_TEXT) {
    redirect("/admin/timeline/nuovo?error=3");
  }

  // Il valore del select va riconvalidato qui: un POST costruito a mano puo' contenere
  // qualsiasi stringa, e passarla com'e' a Prisma fallirebbe a runtime invece che con un
  // messaggio controllato.
  if (kind !== "CITTA" && kind !== "ASSOCIAZIONE") redirect("/admin/timeline/nuovo?error=1");

  // L'ordine e' esplicito perche' "when" e' testo libero non ordinabile (vedi schema).
  // Campo vuoto = 0 (il default dello schema); un valore non numerico e' un errore.
  const order = orderRaw === "" ? 0 : Number(orderRaw);
  if (!Number.isInteger(order)) redirect("/admin/timeline/nuovo?error=2");

  const prisma = getPrisma();
  await prisma.timelineEntry.create({ data: { when, title, text, kind, order } });

  revalidatePath("/timeline");
  redirect("/timeline");
}
