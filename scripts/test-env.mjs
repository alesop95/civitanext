// Carica .env.test e rilancia il comando ricevuto come argomenti con quell'ambiente, in modo
// identico su PowerShell e bash: serve solo per comandi CLI esterni a Vitest (es. prisma migrate
// deploy) che non passano da vitest.setup.ts e quindi non caricherebbero .env.test da soli.
import { config } from "dotenv";
import { spawn } from "node:child_process";

config({ path: ".env.test" });

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error("Uso: node scripts/test-env.mjs <comando> [argomenti...]");
  process.exit(1);
}

const child = spawn(command, args, { stdio: "inherit", shell: true, env: process.env });
child.on("exit", (code) => process.exit(code ?? 1));
