import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { getPrisma } from "@/lib/prisma";

// Quanto spesso ricontrollare il ruolo dal database dentro un token gia' emesso (ADR-010):
// limita a questa soglia, non alla scadenza del token, la finestra in cui un ADMIN/SUPERADMIN
// rimosso resta operativo.
const ROLE_RECHECK_MS = 5 * 60 * 1000;

// Inizializzazione lazy (funzione, non oggetto statico): rieseguita a ogni richiesta, cosi'
// getPrisma() crea un client per-richiesta invece di un client globale con pool persistente,
// non ammesso sul runtime Workers (ADR-005).
export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const prisma = getPrisma();

  return {
    // Con un adapter configurato, Auth.js userebbe sessioni su database di default: va forzato
    // esplicitamente "jwt", anche perche' il provider Credentials lo richiede comunque (non
    // persiste utenti autenticati via credenziali come sessione database).
    session: {
      strategy: "jwt",
      maxAge: 60 * 60,
    },
    adapter: PrismaAdapter(prisma),
    providers: [
      Credentials({
        credentials: {
          email: { label: "Email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = credentials?.email;
          const password = credentials?.password;
          if (typeof email !== "string" || typeof password !== "string") {
            return null;
          }

          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.passwordHash) return null;

          const matches = await bcrypt.compare(password, user.passwordHash);
          if (!matches) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tesseraNumero: user.tesseraNumero,
          };
        },
      }),
      Google({}),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.role = user.role;
          token.tesseraNumero = user.tesseraNumero;
          token.roleCheckedAt = Date.now();
          return token;
        }

        const isStale = Date.now() - Number(token.roleCheckedAt ?? 0) > ROLE_RECHECK_MS;
        if (isStale && token.sub) {
          const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
          if (dbUser) {
            token.role = dbUser.role;
            token.tesseraNumero = dbUser.tesseraNumero;
          }
          token.roleCheckedAt = Date.now();
        }

        return token;
      },
      async session({ session, token }) {
        session.user.role = token.role;
        session.user.tesseraNumero = token.tesseraNumero;
        return session;
      },
    },
  };
});
