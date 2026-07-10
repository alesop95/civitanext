import { NextResponse } from "next/server";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@/generated/prisma/client";

// Route diagnostica temporanea per la validazione tecnica di Fase 0:
// verifica che bcryptjs e Prisma (via driver adapter pg) girino sul runtime
// Workers di Cloudflare grazie al flag nodejs_compat. Da rimuovere prima
// della fine della Fase 0, non e' una route applicativa.
export async function GET() {
  const result: Record<string, unknown> = {};

  try {
    const hash = await bcrypt.hash("diagnostica-fase-0", 10);
    const matches = await bcrypt.compare("diagnostica-fase-0", hash);
    result.bcryptjs = { ok: true, hashPrefix: hash.slice(0, 7), matches };
  } catch (error) {
    result.bcryptjs = { ok: false, error: String(error) };
  }

  try {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL ?? "",
      maxUses: 1,
    });
    const prisma = new PrismaClient({ adapter });
    const rows = await prisma.$queryRaw`SELECT 1 as ok`;
    result.prisma = { ok: true, rows };
  } catch (error) {
    result.prisma = { ok: false, error: String(error) };
  }

  return NextResponse.json(result);
}
