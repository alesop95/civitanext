"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { putObject, deleteObject } from "@/lib/r2";
import { validateDocumentFile } from "@/lib/document-validation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
}

// Documenti istituzionali: solo l'admin carica (nessun testo "caricate dai soci" nel prototipo,
// a differenza della galleria), stesso principio di CivicSpace/PressArticle/MapPoint. Upload
// proxato + validazione sui byte reali (magic number %PDF), stesso meccanismo della galleria
// (ADR-016). Guardia inline (non requireAdmin()) perche' qui serve anche session.user.id per
// createdById.
export async function createDocument(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  if (!title) redirect("/admin/documenti/nuovo?error=1");

  // Il valore del select va riconvalidato qui, stesso principio di timeline/actions.ts: un POST
  // costruito a mano puo' contenere qualsiasi stringa.
  if (category !== "STATUTO" && category !== "VERBALI" && category !== "BILANCI") {
    redirect("/admin/documenti/nuovo?error=1");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/admin/documenti/nuovo?error=2");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = validateDocumentFile({ size: file.size, bytes });
  if (!result.valid) redirect("/admin/documenti/nuovo?error=2");

  const key = `documents/${randomUUID()}.pdf`;
  await putObject(key, bytes, "application/pdf");

  const prisma = getPrisma();
  await prisma.document.create({
    data: {
      title,
      category,
      r2Key: key,
      contentType: "application/pdf",
      size: file.size,
      createdById: session.user.id,
    },
  });

  revalidatePath("/documenti");
  redirect("/documenti");
}

// Valvola di moderazione: cancella prima l'oggetto R2 (nessun orfano sulla quota gratuita), poi
// la riga, stesso ordine di admin/galleria/actions.ts.
export async function deleteDocument(documentId: string) {
  await requireAdmin();
  const prisma = getPrisma();

  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) return;

  await deleteObject(document.r2Key);
  await prisma.document.delete({ where: { id: documentId } });

  revalidatePath("/documenti");
}
