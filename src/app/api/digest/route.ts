import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendWeeklyDigest } from "@/lib/digest";

// Innescata da un workflow GitHub Actions schedulato (.github/workflows/weekly-digest.yml), non
// da un utente loggato: protetta da un segreto condiviso invece che da una sessione (ADR-017).
// Confronto a tempo costante (non !==) per non regalare un canale laterale a chi tenta di
// indovinare CRON_SECRET a forza di richieste.
function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const headerBuf = Buffer.from(header);
  const expectedBuf = Buffer.from(expected);
  if (headerBuf.length !== expectedBuf.length) return false;

  return timingSafeEqual(headerBuf, expectedBuf);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const result = await sendWeeklyDigest(new Date());
  return NextResponse.json(result, { status: 200 });
}
