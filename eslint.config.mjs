import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prototipo di design di sola lettura (React 18 + Babel via CDN, senza bundler): non e'
    // lo stack applicativo (vedi CLAUDE.md), non ha senso linterlo con le regole del progetto
    // reale.
    "design_handoff_civitanext/**",
    // Script CommonJS piano, eseguito con `node` diretto senza transpiler (vedi il commento in
    // testa al file): require() qui e' la sintassi corretta, non un errore.
    "prisma/seed.js",
    // Output generato dall'adapter Cloudflare (`npx opennextjs-cloudflare build`), gia'
    // gitignored: codice di bundle/vendor, non sorgente del progetto. Emerso lintando in
    // locale dopo aver verificato il fix di `pg-cloudflare` (ADR-014 seguito).
    ".open-next/**",
    ".wrangler/**",
  ]),
]);

export default eslintConfig;
