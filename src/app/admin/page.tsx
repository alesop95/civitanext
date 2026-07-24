import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { StatTile } from "@/components/ui/StatTile";
import { getAdminOverview } from "@/lib/analytics";

// Cruscotto admin (Panoramica). Prima pagina radice di /admin del progetto: unifica in un solo
// punto le statistiche di sintesi, i contatori di lavoro in attesa e i collegamenti alle sezioni
// amministrative, che finora esistevano solo come rotte separate raggiungibili da "Altro".
// Sola lettura (a parte i link): le azioni vere restano nelle rispettive pagine.

// Raggruppamenti dei collegamenti alle sezioni admin gia' esistenti. La Panoramica e' un hub, non
// duplica le azioni: rimanda alle pagine che le contengono.
const HUB_GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Partecipazione",
    links: [
      { href: "/admin/proposte", label: "Coda proposte" },
      { href: "/admin/sondaggi/nuovo", label: "Nuovo sondaggio" },
    ],
  },
  {
    title: "Contenuti citta'",
    links: [
      { href: "/admin/spazi-civici/nuovo", label: "Nuovo spazio civico" },
      { href: "/admin/mappa/nuovo", label: "Nuovo punto mappa" },
      { href: "/admin/timeline/nuovo", label: "Nuova tappa timeline" },
      { href: "/admin/rassegna-stampa/nuovo", label: "Nuovo articolo stampa" },
    ],
  },
  {
    title: "Media e documenti",
    links: [
      { href: "/admin/galleria/nuovo", label: "Nuovo album galleria" },
      { href: "/admin/documenti/nuovo", label: "Nuovo documento" },
      { href: "/admin/webinar/nuovo", label: "Nuovo webinar" },
    ],
  },
  {
    title: "Community",
    links: [{ href: "/admin/mentorship/nuovo", label: "Nuovo mentore" }],
  },
  {
    title: "Moderazione",
    links: [
      { href: "/forum", label: "Modera forum" },
      { href: "/competenze", label: "Modera competenze" },
    ],
  },
  {
    title: "Sistema",
    links: [
      { href: "/admin/analytics", label: "Analytics" },
      { href: "/admin/soci", label: "Gestione soci" },
      { href: "/admin/account-deletion", label: "Cancellazioni account" },
    ],
  },
];

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const overview = await getAdminOverview(new Date());

  const stats = [
    { value: overview.totalUsers, label: "Utenti registrati" },
    { value: overview.tesserati, label: "Soci tesserati" },
    { value: overview.avgRsvpPerEvent, label: "RSVP medi per evento" },
    { value: overview.quizAttemptsThisMonth, label: "Tentativi quiz nel mese" },
    { value: overview.forumMessagesThisMonth, label: "Messaggi forum nel mese" },
    { value: overview.totalEvents, label: "Eventi totali" },
  ];

  const hasPending = overview.proposalsInReview > 0 || overview.pendingDeletionRequests > 0;

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/admin" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Pannello admin
        </h1>
        <p className="font-ui text-base text-ink-soft">
          Panoramica dell&apos;attivita&apos; della community e accesso rapido alle sezioni di
          gestione.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
          Panoramica
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <StatTile key={s.label} value={s.value} label={s.label} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
          Da gestire
        </h2>
        {hasPending ? (
          <div className="flex flex-col gap-3">
            {overview.proposalsInReview > 0 && (
              <Link
                href="/admin/proposte"
                className="flex items-center justify-between gap-4 rounded-cn border-2 border-ink bg-accent p-4 text-white shadow-hard"
              >
                <span className="font-display text-lg font-black">
                  {overview.proposalsInReview} proposte da revisionare
                </span>
                <span className="font-ui text-xs font-bold uppercase tracking-wide">Apri &rarr;</span>
              </Link>
            )}
            {overview.pendingDeletionRequests > 0 && (
              <Link
                href="/admin/account-deletion"
                className="flex items-center justify-between gap-4 rounded-cn border-2 border-ink bg-accent p-4 text-white shadow-hard"
              >
                <span className="font-display text-lg font-black">
                  {overview.pendingDeletionRequests} richieste di cancellazione account
                </span>
                <span className="font-ui text-xs font-bold uppercase tracking-wide">Apri &rarr;</span>
              </Link>
            )}
          </div>
        ) : (
          <p className="font-ui text-sm text-ink-soft">
            Nessuna proposta in revisione ne&apos; richiesta di cancellazione in attesa. Tutto
            fatto.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">Sezioni</h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {HUB_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h3 className="font-display text-lg font-black">{group.title}</h3>
              <div className="flex flex-col gap-2">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-cn border-2 border-ink bg-paper-card px-4 py-2 font-ui text-sm font-bold shadow-hard transition-transform hover:-translate-y-0.5"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
