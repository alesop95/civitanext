import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { getPrisma } from "@/lib/prisma";
import { updateQuizMeta } from "../../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Titolo e descrizione sono obbligatori (titolo fino a 200 caratteri).",
  "2": "L'ordine deve essere un numero intero.",
};

const fieldClass = "rounded-cn border-2 border-ink bg-paper-card px-3 py-2";

export default async function ModificaQuizPage({
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

  const quiz = await getPrisma().quiz.findUnique({
    where: { id },
    include: { _count: { select: { questions: true, attempts: true } } },
  });
  if (!quiz) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/admin/quiz" />

      <div className="flex flex-col gap-4">
        <Link
          href="/admin/quiz"
          className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
        >
          Torna ai quiz
        </Link>
        <h1 className="font-display text-3xl font-black">Modifica quiz</h1>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={updateQuizMeta} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={quiz.id} />
        <label className="flex flex-col gap-1 font-ui text-sm">
          Titolo
          <input name="title" type="text" required defaultValue={quiz.title} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Descrizione
          <input
            name="description"
            type="text"
            required
            defaultValue={quiz.description}
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Ordine
          <input
            name="order"
            type="number"
            step="1"
            defaultValue={quiz.order}
            className={fieldClass}
          />
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          Salva modifiche
        </Btn>
      </form>

      <p className="rounded-cn border-2 border-dashed border-ink/40 p-4 font-ui text-sm text-ink-soft">
        Le domande ({quiz._count.questions}) non sono modificabili qui: un quiz con tentativi
        gia&apos; svolti ({quiz._count.attempts}) ha risposte agganciate alle domande, e cambiarle
        invaliderebbe quei tentativi. Per rifare le domande, elimina il quiz dall&apos;elenco e
        ricrealo.
      </p>
    </main>
  );
}
