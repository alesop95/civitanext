import { vi } from "vitest";
import { config as loadEnv } from "dotenv";

// In CI la pipeline imposta DATABASE_URL direttamente (service container Postgres): qui si
// carica .env.test solo come comodo per lo sviluppo locale, e mai in sovrascrittura di una
// DATABASE_URL gia' presente nell'ambiente (cosi' non si tocca mai per errore il Neon di
// sviluppo, che vive solo in .env, mai in .env.test).
if (!process.env.DATABASE_URL) {
  loadEnv({ path: ".env.test" });
}

// redirect() e revalidatePath() presuppongono uno scope di richiesta Next che nei test non
// esiste: si mockano una volta sola qui invece che in ogni file di test. redirect lancia,
// come fa davvero in Next, cosi' i test possono verificare il redirect con
// expect(...).rejects.toThrow("NEXT_REDIRECT:/percorso").
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
