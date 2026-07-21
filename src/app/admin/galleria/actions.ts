"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/r2";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
  return session;
}

// L'admin apre il contenitore (nome + evento passato opzionale), le foto le aggiungono i soci
// self-service (src/app/galleria/actions.ts): il punto di ingresso pubblico ad alto rischio
// resta gated, il contributo a basso rischio resta libero (ADR-016). Guardia inline (non
// requireAdmin()) perche' qui serve anche session.user.id per createdById.
export async function createAlbum(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const title = String(formData.get("title") ?? "").trim();
  const eventIdRaw = String(formData.get("eventId") ?? "").trim();
  if (!title) redirect("/admin/galleria/nuovo?error=1");

  const prisma = getPrisma();
  const album = await prisma.photoAlbum.create({
    data: {
      title,
      eventId: eventIdRaw || null,
      createdById: session.user.id,
    },
  });

  revalidatePath("/galleria");
  redirect(`/galleria/${album.id}`);
}

// Valvola di moderazione minima: cancella prima gli oggetti R2 (nessun orfano a consumare la
// quota gratuita), poi le righe Photo (FK verso PhotoAlbum e' RESTRICT, non CASCADE), poi
// l'album.
export async function deleteAlbum(albumId: string) {
  await requireAdmin();
  const prisma = getPrisma();

  const photos = await prisma.photo.findMany({ where: { albumId } });
  for (const photo of photos) {
    await deleteObject(photo.r2Key);
  }
  await prisma.photo.deleteMany({ where: { albumId } });
  await prisma.photoAlbum.delete({ where: { id: albumId } });

  revalidatePath("/galleria");
  redirect("/galleria");
}

export async function deletePhoto(photoId: string) {
  await requireAdmin();
  const prisma = getPrisma();

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  await deleteObject(photo.r2Key);
  await prisma.photo.delete({ where: { id: photoId } });

  revalidatePath(`/galleria/${photo.albumId}`);
}
