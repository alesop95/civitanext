"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { putObject } from "@/lib/r2";
import { validatePhotoFile, extensionForType } from "@/lib/photo-validation";

// Upload proxato dal server (ADR-016): il browser invia il/i file a questa Server Action, il
// server legge l'intero contenuto e lo valida (dimensione + magic bytes reali, non l'estensione
// o il File.type dichiarato dal client) prima di scriverlo su R2, cosi' nessun oggetto non
// valido raggiunge mai il bucket. Guardia di sola autenticazione: l'album e' gia' stato aperto
// da un admin (vedi admin/galleria/actions.ts), aggiungere foto e' il contributo self-service.
export async function uploadPhoto(albumId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/accedi?callbackUrl=${encodeURIComponent(`/galleria/${albumId}`)}`);
  }

  const prisma = getPrisma();
  const album = await prisma.photoAlbum.findUnique({ where: { id: albumId } });
  if (!album) redirect("/galleria");

  const files = formData
    .getAll("photos")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) redirect(`/galleria/${albumId}?error=1`);

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = validatePhotoFile({ size: file.size, bytes });
    if (!result.valid) redirect(`/galleria/${albumId}?error=1`);

    const key = `photos/${randomUUID()}.${extensionForType(result.contentType)}`;
    await putObject(key, bytes, result.contentType);
    await prisma.photo.create({
      data: {
        albumId,
        uploaderId: session.user.id,
        r2Key: key,
        contentType: result.contentType,
        size: file.size,
      },
    });
  }

  revalidatePath(`/galleria/${albumId}`);
  redirect(`/galleria/${albumId}`);
}
