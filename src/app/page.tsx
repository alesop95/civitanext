import { Starburst } from "@/components/ui/Starburst";
import { Waves } from "@/components/ui/Waves";
import { Btn } from "@/components/ui/Btn";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { SiteHeader } from "@/components/SiteHeader";

// Vetrina del design system di Fase 0: nessuna feature reale, solo il
// vocabolario visivo (token, grafiche, componenti base) riportato dal
// prototipo di design_handoff_civitanext/ nel codice reale dell'app.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/" />

      <section className="relative flex flex-col items-start gap-6 overflow-hidden rounded-cn border-2 border-ink bg-paper-card p-10 shadow-hard">
        <Starburst
          size={160}
          className="pointer-events-none absolute -right-8 -top-10 opacity-90"
        />
        <p className="font-ui text-xs font-bold uppercase tracking-[0.2em] text-ink-soft">
          Fase 0 &middot; fondamenta
        </p>
        <h1 className="max-w-xl font-display text-4xl font-black leading-tight sm:text-5xl">
          Il vocabolario visivo di CivitaNext, ricostruito in Next.js
        </h1>
        <p className="max-w-lg font-ui text-base text-ink-soft">
          Colori, tipografia, bordi netti e ombre dure portati dal prototipo di design
          nel codice reale dell&apos;applicazione. Nessuna feature ancora collegata al
          database: questa pagina mostra solo i mattoni riusabili.
        </p>
        <div className="flex gap-3">
          <Btn kind="primary">Scopri gli eventi</Btn>
          <Btn kind="secondary">Entra nel forum</Btn>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-6 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard">
        <Avatar name="Maria Rossi" />
        <Avatar name="Luca Bianchi" />
        <Avatar name="Sara Verdi" />
        <Tag color="var(--accent)">Ambiente</Tag>
        <Tag color="var(--ink)">Cultura</Tag>
        <Waves width={160} />
      </section>
    </main>
  );
}
