import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { getPrisma } from "@/lib/prisma";
import { updateEvent } from "../../actions";
import { EventFormFields } from "../../EventFormFields";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Tutti i campi sono obbligatori.",
  "2": "Uno dei campi supera la lunghezza massima consentita.",
  "3": "La data e l'ora non sono valide.",
};

// Formatta una Date nel valore atteso da un input datetime-local ("YYYY-MM-DDTHH:mm"), usando le
// componenti locali del server: stessa interpretazione della lettura in parseEventForm, cosi' la
// modifica mostra gli stessi numeri che salverebbe.
function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export default async function ModificaEventoPage({
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

  const event = await getPrisma().event.findUnique({ where: { id } });
  if (!event) notFound();

  const defaults = {
    title: event.title,
    description: event.description,
    date: toDatetimeLocal(event.date),
    location: event.location,
    category: event.category,
  };

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
        <h1 className="font-display text-3xl font-black">Modifica evento</h1>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={updateEvent} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={event.id} />
        <EventFormFields defaults={defaults} />
        <Btn type="submit" kind="primary" className="self-start">
          Salva modifiche
        </Btn>
      </form>
    </main>
  );
}
