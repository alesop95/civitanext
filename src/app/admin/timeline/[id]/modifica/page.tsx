import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { getPrisma } from "@/lib/prisma";
import { updateTimelineEntry } from "../../actions";
import { TimelineFormFields } from "../../TimelineFormFields";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Periodo, titolo, testo e tipo di voce sono obbligatori.",
  "2": "La posizione, se indicata, deve essere un numero intero.",
  "3": "Periodo e titolo fino a 200 caratteri, testo fino a 5000.",
};

export default async function ModificaVoceTimelinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const { id } = await params;
  const { error } = await searchParams;

  const entry = await getPrisma().timelineEntry.findUnique({ where: { id } });
  if (!entry) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/timeline" />

      <div className="flex flex-col gap-4">
        <Link
          href="/timeline"
          className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
        >
          Torna alla timeline
        </Link>
        <h1 className="font-display text-3xl font-black">Modifica voce della timeline</h1>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={updateTimelineEntry} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={entry.id} />
        <TimelineFormFields
          defaults={{
            when: entry.when,
            title: entry.title,
            text: entry.text,
            kind: entry.kind,
            order: entry.order,
          }}
        />
        <Btn type="submit" kind="primary" className="self-start">
          Salva modifiche
        </Btn>
      </form>
    </main>
  );
}
