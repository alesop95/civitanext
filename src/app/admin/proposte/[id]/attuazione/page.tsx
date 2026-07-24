import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { ImplementationEditor } from "@/components/ImplementationEditor";
import { getPrisma } from "@/lib/prisma";
import { manageImplementation } from "../../actions";

const ERROR_MESSAGES: Record<string, string> = {
  note: "La nota supera la lunghezza massima.",
  steps: "Controlla i passi: ognuno deve avere un'etichetta.",
};

export default async function AttuazioneProposalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const { id } = await params;
  const { error, ok } = await searchParams;

  const proposal = await getPrisma().proposal.findUnique({
    where: { id },
    include: { implementationSteps: { orderBy: { order: "asc" } } },
  });
  if (!proposal) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/admin/proposte" />

      <div className="flex flex-col gap-4">
        <Link
          href="/admin/proposte"
          className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
        >
          Torna alle proposte
        </Link>
        <h1 className="font-display text-3xl font-black">Attuazione</h1>
        <p className="font-ui text-sm text-ink-soft">{proposal.title}</p>
      </div>

      {proposal.status !== "APPROVATA" && (
        <p className="rounded-cn border-2 border-dashed border-ink/40 p-4 font-ui text-sm text-ink-soft">
          L&apos;attuazione si traccia sulle proposte approvate. Questa proposta e&apos; ancora in{" "}
          {proposal.status === "REVISIONE" ? "revisione" : "votazione"}: potrai aggiungere i passi
          quando sara&apos; approvata.
        </p>
      )}

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      {ok && (
        <p className="rounded-cn border-2 border-ink bg-success px-3 py-2 font-ui text-sm text-white">
          Attuazione aggiornata.
        </p>
      )}

      <form action={manageImplementation} className="flex flex-col gap-4">
        <input type="hidden" name="proposalId" value={proposal.id} />

        <div className="flex flex-col gap-2">
          <span className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
            Passi (spunta quelli completati)
          </span>
          <ImplementationEditor
            defaults={proposal.implementationSteps.map((step) => ({
              label: step.label,
              done: step.done,
            }))}
          />
        </div>

        <label className="flex flex-col gap-1 font-ui text-sm">
          Nota di aggiornamento (facoltativa)
          <textarea
            name="note"
            rows={3}
            defaultValue={proposal.implementationNote ?? ""}
            placeholder="es. Il Comune ha stanziato i fondi: installazione prevista entro settembre."
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>

        <Btn type="submit" kind="primary" className="self-start">
          Salva attuazione
        </Btn>
      </form>
    </main>
  );
}
