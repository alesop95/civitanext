import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { StatTile } from "@/components/ui/StatTile";
import { BarChart } from "@/components/ui/BarChart";
import { getAdminAnalytics } from "@/lib/analytics";

// Analytics admin. Tre andamenti mensili sugli ultimi sei mesi (nuovi iscritti, attivita' forum,
// tentativi quiz), la distribuzione delle proposte per stato e due totali complessivi. Tutto
// calcolato in lettura dai dati reali; nessun dato inventato e nessuna narrazione di "tendenze"
// non verificabile, a differenza dei trend testuali statici del prototipo.

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const a = await getAdminAnalytics(new Date(), 6);

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/admin/analytics" />

      <header className="flex flex-col gap-2">
        <Link
          href="/admin"
          className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft hover:text-ink"
        >
          &larr; Pannello admin
        </Link>
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">Analytics</h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Andamento della partecipazione negli ultimi {a.months} mesi. L&apos;ultima barra e&apos;
          il mese in corso.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-black">Nuovi iscritti per mese</h2>
        <BarChart data={a.newMembersByMonth} caption="Nuovi iscritti per mese" />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-black">Attivita&apos; forum per mese</h2>
        <p className="font-ui text-xs text-ink-soft">Thread e risposte pubblicati.</p>
        <BarChart data={a.forumActivityByMonth} caption="Attivita' forum per mese" />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-black">Tentativi quiz per mese</h2>
        <BarChart data={a.quizAttemptsByMonth} caption="Tentativi quiz per mese" />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-black">Proposte per stato</h2>
        <div className="grid grid-cols-3 gap-4 sm:max-w-xl">
          {a.proposalsByStatus.map((p) => (
            <StatTile key={p.status} value={p.count} label={p.label} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-black">Totali</h2>
        <div className="grid grid-cols-2 gap-4 sm:max-w-md">
          <StatTile value={a.totalRsvp} label="RSVP totali" />
          <StatTile value={a.totalVotes} label="Voti totali" />
        </div>
      </section>
    </main>
  );
}
