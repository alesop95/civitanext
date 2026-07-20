import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Stesso principio di vitest.setup.ts: .env.test si carica solo se DATABASE_URL non e' gia'
// nell'ambiente, cosi' in CI (che la imposta a livello di job contro il service container
// Postgres) questo non tocca nulla, e in locale punta sempre e solo al Postgres di test di
// docker-compose.test.yml, mai al Neon di sviluppo in .env.
if (!process.env.DATABASE_URL) {
  loadEnv({ path: ".env.test" });
}

const PORT = 3100;

// PW_BASE_URL e' usato solo dal job CI che verifica l'adapter Cloudflare reale (vedi
// .github/workflows/ci.yml): in quel caso il server (wrangler/workerd tramite
// opennextjs-cloudflare preview) e' gia' avviato a parte, in background, perche' non e' un
// comando che Playwright possa gestire in modo pulito come webServer (e' la catena build+preview
// dell'adapter, non un semplice next start). In ogni altro caso Playwright avvia e gestisce da
// solo next dev/next start, come sempre.
const externalBaseURL = process.env.PW_BASE_URL;
const baseURL = externalBaseURL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: externalBaseURL
    ? undefined
    : {
        // In CI il job builda prima (npm run build) e Playwright fa partire il server di
        // produzione; in locale next dev evita di dover ribuildare a ogni run manuale.
        command: process.env.CI ? `npx next start -p ${PORT}` : `npx next dev -p ${PORT}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { DATABASE_URL: process.env.DATABASE_URL ?? "" },
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
