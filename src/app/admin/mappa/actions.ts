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

export async function createMapPoint(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const place = String(formData.get("place") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  const coordsValid =
    Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  if (!title || !type || !place || !coordsValid) redirect("/admin/mappa/nuovo?error=1");
  if (title.length > MAX_SHORT_TEXT || type.length > MAX_SHORT_TEXT || place.length > MAX_SHORT_TEXT) {
    redirect("/admin/mappa/nuovo?error=2");
  }

  const prisma = getPrisma();
  await prisma.mapPoint.create({ data: { title, type, place, lat, lng } });

  revalidatePath("/mappa");
  redirect("/mappa");
}
