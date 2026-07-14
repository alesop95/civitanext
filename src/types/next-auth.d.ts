import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

// Estende i tipi di Auth.js con i due campi decisi in ADR-010: role (autorizzazione) e
// tesseraNumero (tesseramento, indipendente dal ruolo). L'augmentation va dichiarata sui moduli
// che DEFINISCONO le interfacce ("@auth/core/types", "@auth/core/jwt"), non su "next-auth" /
// "next-auth/jwt": questi ultimi le ri-esportano con `export *`, che non crea una dichiarazione
// di interfaccia propria del modulo e quindi non partecipa al declaration merging di TypeScript
// (verificato per tentativi: l'augmentation su "next-auth"/"next-auth/jwt" compila ma i campi
// restano `unknown` a runtime dei tipi, cioè viene ignorata).
declare module "@auth/core/types" {
  interface User {
    role: Role;
    tesseraNumero: string | null;
  }

  interface Session {
    user: {
      role: Role;
      tesseraNumero: string | null;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    tesseraNumero: string | null;
    roleCheckedAt: number;
  }
}
