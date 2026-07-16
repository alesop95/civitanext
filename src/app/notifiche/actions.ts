"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const prisma = getPrisma();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/notifiche");
}
