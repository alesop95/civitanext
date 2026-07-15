import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Logo } from "@/components/ui/Logo";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { chipClassName } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/eventi", label: "Eventi" },
  { href: "/quiz", label: "Quiz" },
  { href: "/forum", label: "Forum" },
];

export async function SiteHeader({ activeHref }: { activeHref: string }) {
  const session = await auth();

  return (
    <header className="flex items-center justify-between gap-6">
      <Logo />
      <nav className="flex gap-3">
        {NAV_LINKS.map(({ href, label }) => (
          <Link key={href} href={href} className={chipClassName({ active: href === activeHref })}>
            {label}
          </Link>
        ))}
      </nav>
      {session?.user ? (
        <div className="flex items-center gap-3">
          <Avatar name={session.user.name ?? session.user.email ?? "?"} />
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
  );
}
