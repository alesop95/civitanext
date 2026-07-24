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

type TimelineFields = {
  when: string;
  title: string;
  text: string;
  kind: "CITTA" | "ASSOCIAZIONE";
  order: number;
};

// Validazione condivisa da creazione e modifica. Ritorna i campi puliti o un codice d'errore
// (1 = obbligatori/tipo non valido, 2 = ordine non intero, 3 = testo troppo lungo). Il valore del
// select va riconvalidato: un POST costruito a mano puo' contenere qualsiasi stringa.
function parseTimelineForm(formData: FormData): TimelineFields | number {
  const when = String(formData.get("when") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const kind = String(formData.get("kind") ?? "");
  const orderRaw = String(formData.get("order") ?? "").trim();

  if (!when || !title || !text) return 1;
  if (when.length > MAX_SHORT_TEXT || title.length > MAX_SHORT_TEXT || text.length > MAX_LONG_TEXT) {
    return 3;
  }
  if (kind !== "CITTA" && kind !== "ASSOCIAZIONE") return 1;

  // L'ordine e' esplicito perche' "when" e' testo libero non ordinabile (vedi schema). Campo vuoto
  // = 0 (default dello schema); un valore non numerico e' un errore.
  const order = orderRaw === "" ? 0 : Number(orderRaw);
  if (!Number.isInteger(order)) return 2;

  return { when, title, text, kind, order };
}

export async function createTimelineEntry(formData: FormData) {
  await requireAdmin();
  const parsed = parseTimelineForm(formData);
  if (typeof parsed === "number") redirect(`/admin/timeline/nuovo?error=${parsed}`);

  await getPrisma().timelineEntry.create({ data: parsed });
  revalidatePath("/timeline");
  redirect("/timeline");
}

export async function updateTimelineEntry(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/timeline");

  const parsed = parseTimelineForm(formData);
  if (typeof parsed === "number") redirect(`/admin/timeline/${id}/modifica?error=${parsed}`);

  await getPrisma().timelineEntry.update({ where: { id }, data: parsed });
  revalidatePath("/timeline");
  redirect("/timeline");
}

export async function deleteTimelineEntry(id: string) {
  await requireAdmin();
  await getPrisma().timelineEntry.delete({ where: { id } });
  revalidatePath("/timeline");
}
