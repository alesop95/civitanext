import { execFileSync } from "node:child_process";
import { test, expect } from "@playwright/test";
import { E2E_EMAIL, E2E_PASSWORD } from "./credentials";

// Reseed a ogni tentativo, non solo prima della suite: senza, un retry di Playwright (in CI,
// due) riparte dallo stato lasciato dal tentativo precedente (RSVP gia' attivo, voto gia' dato)
// invece che da zero, e il test sembra rompersi mentre e' solo il seed a non essere ripetuto.
// child_process, non un import diretto di scripts/seed-e2e.ts: quel modulo tocca @/lib/prisma,
// il client Prisma generato usa import.meta (sintassi ESM che il loader di Playwright non
// transpila), quindi va eseguito come processo esterno, mai importato nel grafo dei moduli
// dello spec.
test.beforeEach(() => {
  execFileSync("npx", ["tsx", "scripts/seed-e2e.ts"], { stdio: "inherit", shell: true });
});

// Un solo percorso end-to-end che attraversa quattro verticali diverse (login, eventi, proposte,
// quiz): copre esattamente il perimetro "fondazione mirata" deciso con l'utente, non ogni
// pagina del progetto.
test("login, RSVP a un evento, voto a una proposta, tentativo quiz", async ({ page }) => {
  await page.goto("/accedi");
  await page.getByLabel("Email").fill(E2E_EMAIL);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Accedi", exact: true }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/eventi");
  const eventCard = page.locator("article", { hasText: "Evento e2e" });
  await eventCard.getByRole("button", { name: "Partecipo" }).click();
  await expect(eventCard.getByRole("button", { name: "Annulla partecipazione" })).toBeVisible();

  await page.goto("/proposte");
  const proposalCard = page.locator("article", { hasText: "Proposta e2e" });
  await proposalCard.getByRole("button", { name: "Vota" }).click();
  await expect(proposalCard.getByRole("button", { name: "Ritira il voto" })).toBeVisible();

  await page.goto("/quiz");
  await page.getByRole("link", { name: "Inizia" }).click();
  await expect(page).toHaveURL(/\/quiz\/.+$/);
  await page.getByRole("radio", { name: "Roma" }).check();
  await page.getByRole("button", { name: "Invia risposte" }).click();
  await expect(page).toHaveURL(/\/quiz\/.+\/risultato$/);
  await expect(page.getByText("Punteggio migliore: 1/1")).toBeVisible();
});
