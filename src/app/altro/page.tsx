import Link from "next/link";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { btnClassName } from "@/components/ui/Btn";

// Punto di raccolta mobile per le voci che sul desktop hanno un chip proprio nell'header
// (Proposte, Profilo, Admin) ma non entrano nelle cinque tab fisse della barra mobile.
export default async function AltroPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-4 px-6 py-16">
      <SiteHeader activeHref="/altro" />

      <h1 className="font-display text-3xl font-black">Altro</h1>

      <Link href="/proposte" className={btnClassName({ kind: "secondary" })}>
        Proposte
      </Link>

      <Link href="/spazi-civici" className={btnClassName({ kind: "secondary" })}>
        Spazi civici
      </Link>

      <Link href="/mappa" className={btnClassName({ kind: "secondary" })}>
        Mappa
      </Link>

      <Link href="/timeline" className={btnClassName({ kind: "secondary" })}>
        Timeline
      </Link>

      <Link href="/rassegna-stampa" className={btnClassName({ kind: "secondary" })}>
        Rassegna stampa
      </Link>

      <Link href="/competenze" className={btnClassName({ kind: "secondary" })}>
        Competenze
      </Link>

      <Link href="/classifica" className={btnClassName({ kind: "secondary" })}>
        Classifica
      </Link>

      <Link href="/mentorship" className={btnClassName({ kind: "secondary" })}>
        Mentorship
      </Link>

      <Link href="/galleria" className={btnClassName({ kind: "secondary" })}>
        Galleria foto
      </Link>

      <Link href="/documenti" className={btnClassName({ kind: "secondary" })}>
        Documenti
      </Link>

      <Link href="/webinar" className={btnClassName({ kind: "secondary" })}>
        Webinar
      </Link>

      {session?.user ? (
        <Link href="/profilo" className={btnClassName({ kind: "secondary" })}>
          Profilo
        </Link>
      ) : (
        <>
          <Link href="/accedi" className={btnClassName({ kind: "secondary" })}>
            Accedi
          </Link>
          <Link href="/registrati" className={btnClassName({ kind: "primary" })}>
            Registrati
          </Link>
        </>
      )}

      {isAdmin && (
        <>
          <Link href="/admin" className={btnClassName({ kind: "primary" })}>
            Pannello admin
          </Link>
          <Link href="/admin/soci" className={btnClassName({ kind: "secondary" })}>
            Gestione soci (admin)
          </Link>
          <Link href="/admin/proposte" className={btnClassName({ kind: "secondary" })}>
            Coda di approvazione (admin)
          </Link>
          <Link href="/admin/spazi-civici/nuovo" className={btnClassName({ kind: "secondary" })}>
            Nuovo spazio civico (admin)
          </Link>
          <Link href="/admin/mappa/nuovo" className={btnClassName({ kind: "secondary" })}>
            Nuovo punto mappa (admin)
          </Link>
          <Link href="/admin/timeline/nuovo" className={btnClassName({ kind: "secondary" })}>
            Nuova voce timeline (admin)
          </Link>
          <Link href="/admin/rassegna-stampa/nuovo" className={btnClassName({ kind: "secondary" })}>
            Nuovo articolo stampa (admin)
          </Link>
          <Link href="/admin/mentorship/nuovo" className={btnClassName({ kind: "secondary" })}>
            Nuovo mentor (admin)
          </Link>
          <Link href="/admin/galleria/nuovo" className={btnClassName({ kind: "secondary" })}>
            Nuovo album galleria (admin)
          </Link>
          <Link href="/admin/documenti/nuovo" className={btnClassName({ kind: "secondary" })}>
            Nuovo documento (admin)
          </Link>
          <Link href="/admin/webinar/nuovo" className={btnClassName({ kind: "secondary" })}>
            Nuovo webinar (admin)
          </Link>
          <Link href="/admin/account-deletion" className={btnClassName({ kind: "secondary" })}>
            Richieste cancellazione account (admin)
          </Link>
        </>
      )}
    </main>
  );
}
