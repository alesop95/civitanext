import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { QuizEditor } from "@/components/QuizEditor";
import { createQuiz } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Titolo e descrizione sono obbligatori (titolo fino a 200 caratteri).",
  "2": "L'ordine deve essere un numero intero.",
  "3": "Controlla le domande: ognuna con testo, almeno due opzioni non vuote e una risposta corretta.",
};

const fieldClass = "rounded-cn border-2 border-ink bg-paper-card px-3 py-2";

export default async function NuovoQuizPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");
  const { error } = await searchParams;

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
        <h1 className="font-display text-3xl font-black">Nuovo quiz</h1>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={createQuiz} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-ui text-sm">
          Titolo
          <input name="title" type="text" required className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Descrizione
          <input
            name="description"
            type="text"
            required
            placeholder="es. 4 domande su voto, comune e partecipazione"
            className={fieldClass}
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Ordine (numero: più basso = prima; lo sblocco progressivo segue questo)
          <input name="order" type="number" step="1" defaultValue={0} className={fieldClass} />
        </label>

        <div className="flex flex-col gap-2">
          <span className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
            Domande
          </span>
          <QuizEditor />
        </div>

        <Btn type="submit" kind="primary" className="self-start">
          Crea quiz
        </Btn>
      </form>
    </main>
  );
}
