import Link from "next/link";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { btnClassName } from "@/components/ui/Btn";
import { CivicMapLoader } from "@/components/CivicMapLoader";

export default async function MappaPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const prisma = getPrisma();

  const points = await prisma.mapPoint.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/mappa" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Mappa della città
        </h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Eventi, proposte e punti di interesse dell&apos;associazione su una mappa reale di
          Civitanova Marche.
        </p>
        {isAdmin && (
          <Link
            href="/admin/mappa/nuovo"
            className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
          >
            Nuovo punto
          </Link>
        )}
      </header>

      <CivicMapLoader points={points} />

      {points.length === 0 && (
        <p className="font-ui text-sm text-ink-soft">Nessun punto pubblicato ancora.</p>
      )}
    </main>
  );
}
