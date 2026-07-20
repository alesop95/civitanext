// Isolato da scripts/seed-e2e.ts apposta: quel file importa @/lib/prisma (il client Prisma
// generato usa import.meta, sintassi ESM che il loader di Playwright non transpila). Lo spec
// e2e deve poter importare solo le credenziali, senza trascinarsi dietro l'intero client Prisma.
export const E2E_EMAIL = "e2e@civitanext.test";
export const E2E_PASSWORD = "PasswordE2E123!";
