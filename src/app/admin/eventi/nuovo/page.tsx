import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { createEvent } from "../actions";
import { EventFormFields } from "../EventFormFields";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Tutti i campi sono obbligatori.",
  "2": "Uno dei campi supera la lunghezza massima consentita.",
  "3": "La data e l'ora non sono valide.",
};

export default async function NuovoEventoPage({
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
      <SiteHeader activeHref="/admin/eventi" />

      <div className="flex flex-col gap-4">
        <Link
          href="/admin/eventi"
          className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
        >
          Torna agli eventi
        </Link>
        <h1 className="font-display text-3xl font-black">Nuovo evento</h1>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={createEvent} className="flex flex-col gap-4">
        <EventFormFields />
        <Btn type="submit" kind="primary" className="self-start">
          Crea evento
        </Btn>
      </form>
    </main>
  );
}
