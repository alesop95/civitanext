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

type MapPointFields = {
  title: string;
  type: string;
  place: string;
  lat: number;
  lng: number;
};

// Validazione condivisa. Codici: 1 = obbligatori mancanti o coordinate fuori range, 2 = testo
// troppo lungo.
function parseMapPointForm(formData: FormData): MapPointFields | number {
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const place = String(formData.get("place") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  const coordsValid =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180;

  if (!title || !type || !place || !coordsValid) return 1;
  if (title.length > MAX_SHORT_TEXT || type.length > MAX_SHORT_TEXT || place.length > MAX_SHORT_TEXT) {
    return 2;
  }

  return { title, type, place, lat, lng };
}

export async function createMapPoint(formData: FormData) {
  await requireAdmin();
  const parsed = parseMapPointForm(formData);
  if (typeof parsed === "number") redirect(`/admin/mappa/nuovo?error=${parsed}`);

  await getPrisma().mapPoint.create({ data: parsed });
  revalidatePath("/mappa");
  redirect("/mappa");
}

export async function updateMapPoint(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/mappa");

  const parsed = parseMapPointForm(formData);
  if (typeof parsed === "number") redirect(`/admin/mappa/${id}/modifica?error=${parsed}`);

  await getPrisma().mapPoint.update({ where: { id }, data: parsed });
  revalidatePath("/mappa");
  redirect("/mappa");
}

export async function deleteMapPoint(id: string) {
  await requireAdmin();
  await getPrisma().mapPoint.delete({ where: { id } });
  revalidatePath("/mappa");
}
