import { cache } from "react";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Cache per-richiesta (React cache()), non un client globale: su Cloudflare Workers un pool
// di connessioni persistente tra richieste diverse non e' ammesso (ADR-005). cache() dedup
// le chiamate multiple nella stessa richiesta senza sopravvivere alla richiesta successiva.
export const getPrisma = cache(() => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "",
    maxUses: 1,
  });
  return new PrismaClient({ adapter });
});
