"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { extractYoutubeId } from "@/lib/youtube";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
}

// Contenuto curato dall'admin, nessuna relazione con User: stesso principio di
// PressArticle/CivicSpace/MapPoint (ADR-017). video accetta sia un URL YouTube completo sia il
// solo id, cosi' l'admin puo' incollare direttamente il link della pagina del video.
export async function createWebinar(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const duration = String(formData.get("duration") ?? "").trim();
  const video = String(formData.get("video") ?? "").trim();
  const recordedAtRaw = String(formData.get("recordedAt") ?? "").trim();

  if (!title || !description || !duration || !recordedAtRaw) {
    redirect("/admin/webinar/nuovo?error=1");
  }

  const recordedAt = new Date(recordedAtRaw);
  if (Number.isNaN(recordedAt.getTime())) redirect("/admin/webinar/nuovo?error=1");

  const youtubeId = extractYoutubeId(video);
  if (!youtubeId) redirect("/admin/webinar/nuovo?error=2");

  const prisma = getPrisma();
  await prisma.webinar.create({
    data: { title, description, duration, youtubeId, recordedAt },
  });

  revalidatePath("/webinar");
  redirect("/webinar");
}

export async function deleteWebinar(webinarId: string) {
  await requireAdmin();
  const prisma = getPrisma();
  await prisma.webinar.delete({ where: { id: webinarId } });
  revalidatePath("/webinar");
}
