import Link from "next/link";

// Le cinque voci fisse indicate in design_handoff_civitanext/ROADMAP.md (Fase 3) per la tab
// bar mobile. Proposte, Profilo e Admin (sul desktop, chip separati in SiteHeader) confluiscono
// qui sotto "Altro": cinque tab, non otto, per restare utilizzabile su schermi stretti.
const TABS = [
  { href: "/", label: "Home" },
  { href: "/eventi", label: "Eventi" },
  { href: "/quiz", label: "Quiz" },
  { href: "/forum", label: "Forum" },
  { href: "/altro", label: "Altro" },
];

export function MobileTabBar({ activeHref }: { activeHref: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex gap-1 border-t-2 border-ink bg-paper-card px-2 py-2 sm:hidden">
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={[
            "flex-1 rounded-cn border-2 px-1 py-2 text-center font-ui text-[11px] font-bold uppercase tracking-wide",
            href === activeHref
              ? "border-ink bg-accent text-white"
              : "border-transparent text-ink-soft",
          ].join(" ")}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
