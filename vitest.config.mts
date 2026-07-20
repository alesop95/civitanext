import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Le action testate sono funzioni async lato server, non componenti: 'node' invece del
    // default 'jsdom' consigliato dalla guida Next. I futuri test di componente possono
    // richiedere jsdom per singolo file con il pragma "// @vitest-environment jsdom".
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Il pattern di default di Vitest include anche *.spec.ts, che e' la convenzione degli spec
    // Playwright sotto e2e/: senza questo restringimento Vitest prova a caricare anche quelli
    // (e fallisce, essendo scritti per un altro test runner).
    include: ["src/**/*.test.ts"],
    // I file di test condividono un solo Postgres reale con fixture identificate da un marker
    // comune (src/test/fixtures.ts): in parallelo, il cleanup di un file puo' cancellare righe
    // create da un test ancora in corso in un altro file (osservato: due FK violation e un
    // conteggio errato, spariti eseguendo i file in sequenza).
    fileParallelism: false,
  },
});
