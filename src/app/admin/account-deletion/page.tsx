import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getPrisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { processAccountDeletion } from "./actions";

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AccountDeletionPage() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const prisma = getPrisma();
  const requests = await prisma.accountDeletionRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      processedBy: { select: { name: true } },
    },
  });

  const pending = requests.filter((request) => !request.processedAt);
  const processed = requests.filter((request) => request.processedAt);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/profilo" />

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-black">Richieste di cancellazione account</h1>
        <p className="font-ui text-sm text-ink-soft">
          &quot;Cancellazione&quot; qui significa anonimizzazione (ADR-018): i dati personali
          vengono rimossi, i contenuti pubblicati (thread, proposte, competenze...) restano con
          autore &quot;Utente cancellato&quot;.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
          In attesa ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="font-ui text-sm text-ink-soft">Nessuna richiesta in attesa.</p>
        ) : (
          pending.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between gap-3 rounded-cn border-2 border-ink bg-paper-card p-4 shadow-hard"
            >
              <div>
                <p className="font-ui text-sm font-bold">{request.user.name}</p>
                <p className="font-ui text-xs text-ink-soft">
                  {request.user.email} &middot; richiesta il{" "}
                  {dateFormatter.format(request.createdAt)}
                </p>
              </div>
              <form action={processAccountDeletion.bind(null, request.id)}>
                <Btn type="submit" kind="primary" small>
                  Esegui cancellazione
                </Btn>
              </form>
            </div>
          ))
        )}
      </section>

      {processed.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
            Elaborate ({processed.length})
          </h2>
          {processed.map((request) => (
            <div
              key={request.id}
              className="rounded-cn border-2 border-dashed border-ink/40 p-4 text-ink-soft"
            >
              <p className="font-ui text-xs">
                Richiesta del {dateFormatter.format(request.createdAt)}, elaborata il{" "}
                {dateFormatter.format(request.processedAt!)} da{" "}
                {request.processedBy?.name ?? "?"}
              </p>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
