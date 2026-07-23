import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Tag } from "@/components/ui/Tag";
import { Waves } from "@/components/ui/Waves";
import { Btn } from "@/components/ui/Btn";
import { getUserReputation } from "@/lib/reputation";
import { PushToggle } from "@/components/PushToggle";
import { toggleDigestOptIn, requestAccountDeletion } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: "Responsabile generale",
  ADMIN: "Amministratore",
  UTENTE: "Utente",
};

const memberSinceFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const requestedAtFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function ProfiloPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/accedi");

  const pendingDeletion = await prisma.accountDeletionRequest.findFirst({
    where: { userId: user.id, processedAt: null },
  });

  const reputation = await getUserReputation(user.id, new Date());
  const { level, points } = reputation;
  const pointsToNext = level.next ? level.next.at - points : 0;
  const levelProgressPct = level.next
    ? Math.min(100, Math.round(((points - level.min) / (level.next.at - level.min)) * 100))
    : 100;

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/profilo" />

      <header className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Il tuo profilo
        </h1>
      </header>

      <section className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard sm:w-80">
          <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
            Dati account
          </p>
          <p className="font-display text-2xl font-black">{user.name}</p>
          <p className="font-ui text-sm text-ink-soft">{user.email}</p>
          <Tag color="var(--ink)">{ROLE_LABELS[user.role] ?? user.role}</Tag>
          <p className="font-ui text-xs text-ink-soft">
            Membro dal {memberSinceFormatter.format(user.memberSince)}
          </p>
        </div>

        {user.tesseraNumero ? (
          <div className="relative flex flex-col gap-2 overflow-hidden rounded-cn border-2 border-ink bg-accent p-6 text-white shadow-hard sm:w-80">
            <Waves
              width={140}
              color="rgba(255,255,255,0.35)"
              className="pointer-events-none absolute -bottom-6 -right-6"
            />
            <p className="font-ui text-xs font-bold uppercase tracking-[0.2em]">Tessera Socio</p>
            <p className="font-display text-3xl font-black">{user.tesseraNumero}</p>
            <p className="font-ui text-sm">{user.name}</p>
            <p className="font-ui text-xs opacity-80">CivitaNext &middot; Civitanova Marche</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 rounded-cn border-2 border-dashed border-ink bg-paper-card p-6 text-ink-soft shadow-hard sm:w-80">
            <p className="font-ui text-xs font-bold uppercase tracking-wide">Tessera Socio</p>
            <p className="font-ui text-sm">
              Non risulti ancora tesserato. Contatta l&apos;associazione per completare
              l&apos;iscrizione.
            </p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard">
          <div className="flex items-baseline justify-between gap-4">
            <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
              Reputazione
            </p>
            <Tag color="var(--ink)">{level.name}</Tag>
          </div>
          <p className="font-display text-4xl font-black">{points} punti</p>
          {level.next ? (
            <div className="flex flex-col gap-2">
              <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-paper">
                <div className="h-full bg-accent" style={{ width: `${levelProgressPct}%` }} />
              </div>
              <p className="font-ui text-xs text-ink-soft">
                Ti mancano {pointsToNext} punti per il livello {level.next.name}
              </p>
            </div>
          ) : (
            <p className="font-ui text-xs text-ink-soft">Livello massimo raggiunto.</p>
          )}
          <p className="font-ui text-sm text-ink-soft">
            Si guadagnano punti partecipando a eventi, completando quiz, proponendo e votando.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">Badge</p>
          <div className="flex flex-wrap gap-3">
            {reputation.badges.map((badge) => (
              <span
                key={badge.label}
                className={
                  badge.earned
                    ? "rounded-cn border-2 border-ink bg-paper-card px-3 py-2 font-ui text-sm font-bold shadow-hard"
                    : "rounded-cn border-2 border-dashed border-ink/40 px-3 py-2 font-ui text-sm text-ink-soft/60"
                }
              >
                {badge.earned ? "★ " : "☆ "}
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard sm:max-w-md">
        <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
          Preferenze
        </p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-ui text-sm font-bold">Digest settimanale via email</p>
            <p className="font-ui text-xs text-ink-soft">
              Eventi in programma e nuove discussioni del forum, ogni lunedì.
            </p>
          </div>
          <form action={toggleDigestOptIn}>
            <Btn type="submit" kind={user.digestOptIn ? "primary" : "secondary"} small>
              {user.digestOptIn ? "Attivo" : "Disattivo"}
            </Btn>
          </form>
        </div>
        <div className="border-t-2 border-dashed border-ink/20 pt-3">
          <PushToggle />
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-cn border-2 border-dashed border-ink/40 p-6 sm:max-w-md">
        <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
          Zona pericolosa
        </p>
        {pendingDeletion ? (
          <p className="font-ui text-sm text-ink-soft">
            Richiesta di cancellazione inviata il{" "}
            {requestedAtFormatter.format(pendingDeletion.createdAt)}, in attesa che un admin la
            elabori.
          </p>
        ) : (
          <>
            <p className="font-ui text-sm text-ink-soft">
              Puoi richiedere la cancellazione del tuo account. Un admin la esaminerà: i tuoi dati
              personali (email, nome, tessera) verranno rimossi, i contenuti che hai pubblicato
              resteranno visibili con autore &quot;Utente cancellato&quot;.
            </p>
            <form action={requestAccountDeletion}>
              <Btn type="submit" kind="secondary" small>
                Richiedi la cancellazione dell&apos;account
              </Btn>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
