import { Resend } from "resend";

// Isolato come src/lib/r2.ts: nessuna nozione di "digest" qui, solo invio di una email generica
// tramite Resend (ADR-017). Riusabile per qualunque altra email futura del progetto.
let client: Resend | undefined;

function getResendClient() {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail(to: string, subject: string, html: string) {
  const from = process.env.DIGEST_FROM_EMAIL ?? "";
  await getResendClient().emails.send({ from, to, subject, html });
}
