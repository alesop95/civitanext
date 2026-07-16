import type { PrismaClient } from "@/generated/prisma/client";

// Punto unico di creazione delle notifiche in-app, cosi' ogni feature che ne genera una (per
// ora solo le proposte, vedi ADR-013) passa dalla stessa forma invece di scrivere prisma.notification.create
// sparso nei vari file di action.
export async function notifyUser(
  prisma: PrismaClient,
  userId: string,
  message: string,
  link?: string,
) {
  await prisma.notification.create({ data: { userId, message, link } });
}
