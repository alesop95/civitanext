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

type EventFields = {
  title: string;
  description: string;
  date: Date;
  location: string;
  category: string;
};

// Legge e valida i campi comuni a creazione e modifica. Ritorna i campi puliti, oppure un codice
// di errore (1 = campo obbligatorio mancante, 2 = testo troppo lungo, 3 = data non valida) che il
// chiamante trasforma in un redirect sulla pagina giusta (nuovo o modifica). La data arriva da un
// input datetime-local ("YYYY-MM-DDTHH:mm") ed e' interpretata come ora locale del server, coerente
// tra creazione e modifica; il fuso di visualizzazione pubblica resta una preoccupazione separata.
function parseEventForm(formData: FormData): EventFields | number {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const dateRaw = String(formData.get("date") ?? "").trim();

  if (!title || !description || !location || !category || !dateRaw) return 1;
  if (
    title.length > MAX_SHORT_TEXT ||
    location.length > MAX_SHORT_TEXT ||
    category.length > MAX_SHORT_TEXT ||
    description.length > MAX_LONG_TEXT
  ) {
    return 2;
  }

  const date = new Date(dateRaw);
  if (Number.isNaN(date.getTime())) return 3;

  return { title, description, date, location, category };
}

export async function createEvent(formData: FormData) {
  await requireAdmin();

  const parsed = parseEventForm(formData);
  if (typeof parsed === "number") redirect(`/admin/eventi/nuovo?error=${parsed}`);

  const prisma = getPrisma();
  await prisma.event.create({ data: parsed });

  revalidatePath("/eventi");
  revalidatePath("/admin/eventi");
  redirect("/admin/eventi");
}

export async function updateEvent(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/eventi");

  const parsed = parseEventForm(formData);
  if (typeof parsed === "number") redirect(`/admin/eventi/${id}/modifica?error=${parsed}`);

  const prisma = getPrisma();
  await prisma.event.update({ where: { id }, data: parsed });

  revalidatePath("/eventi");
  revalidatePath("/admin/eventi");
  redirect("/admin/eventi");
}

// Cancellazione con pulizia esplicita delle dipendenze in transazione: gli RSVP (dato di
// partecipazione, privo di senso senza l'evento) vengono eliminati; gli album fotografici
// collegati sopravvivono, solo scollegati (eventId a null), perche' sono contenuto a se'. Cosi'
// il delete non dipende dalla regola referenziale del database e l'intento resta leggibile.
export async function deleteEvent(eventId: string) {
  await requireAdmin();
  const prisma = getPrisma();

  await prisma.$transaction([
    prisma.rsvp.deleteMany({ where: { eventId } }),
    prisma.photoAlbum.updateMany({ where: { eventId }, data: { eventId: null } }),
    prisma.event.delete({ where: { id: eventId } }),
  ]);

  revalidatePath("/eventi");
  revalidatePath("/admin/eventi");
}
