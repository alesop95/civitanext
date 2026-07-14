import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";

// Il provider Credentials di NextAuth autentica soltanto, non registra utenti (vedi ADR-010):
// questa route e' il solo punto che crea un User con password. role resta al default (UTENTE,
// vedi schema.prisma) e tesseraNumero resta nullo: un utente pubblico non tesserato e' un caso
// normale, non un'eccezione da gestire qui.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!email.includes("@") || password.length < 8 || name.length === 0) {
    return NextResponse.json(
      { error: "Email valida, nome e password di almeno 8 caratteri sono obbligatori." },
      { status: 400 },
    );
  }

  const prisma = getPrisma();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Esiste gia' un account con questa email." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
