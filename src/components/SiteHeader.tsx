import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Logo } from "@/components/ui/Logo";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { chipClassName } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { MobileTabBar } from "@/components/MobileTabBar";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/eventi", label: "Eventi" },
  { href: "/proposte", label: "Proposte" },
  { href: "/quiz", label: "Quiz" },
  { href: "/forum", label: "Forum" },
];

// Le voci che sul desktop hanno un proprio chip ma su mobile confluiscono sotto "Altro"
// nella tab bar fissa (vedi MobileTabBar).
const ALTRO_HREFS = ["/proposte", "/profilo", "/admin/proposte", "/accedi", "/registrati"];

export async function SiteHeader({ activeHref }: { activeHref: string }) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  const mobileActiveHref = ALTRO_HREFS.includes(activeHref) ? "/altro" : activeHref;

  return (
    <>
      <header className="flex items-center justify-between gap-6">
        <Logo />
        <nav className="hidden gap-3 sm:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={chipClassName({ active: href === activeHref })}
            >
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/proposte"
              className={chipClassName({ active: activeHref === "/admin/proposte" })}
            >
              Admin
            </Link>
          )}
        </nav>
        {session?.user ? (
          <div className="flex items-center gap-3">
            <Link href="/profilo" aria-label="Il tuo profilo">
              <Avatar name={session.user.name ?? session.user.email ?? "?"} />
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Btn type="submit" kind="ghost" small>
                Esci
              </Btn>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/accedi" className={btnClassName({ kind: "secondary", small: true })}>
              Accedi
            </Link>
            <Link href="/registrati" className={btnClassName({ kind: "primary", small: true })}>
              Registrati
            </Link>
          </div>
        )}
      </header>
      <MobileTabBar activeHref={mobileActiveHref} />
    </>
  );
}
