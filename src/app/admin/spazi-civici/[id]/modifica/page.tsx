import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { getPrisma } from "@/lib/prisma";
import { updateCivicSpace } from "../../actions";
import { CivicSpaceFormFields } from "../../CivicSpaceFormFields";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Tutti i campi sono obbligatori.",
  "2": "Nome, tipo e orari fino a 200 caratteri, note fino a 5000.",
};

export default async function ModificaSpazioCivicoPage({
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

  const space = await getPrisma().civicSpace.findUnique({ where: { id } });
  if (!space) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/spazi-civici" />

      <div className="flex flex-col gap-4">
        <Link
          href="/spazi-civici"
          className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
        >
          Torna agli spazi civici
        </Link>
        <h1 className="font-display text-3xl font-black">Modifica spazio civico</h1>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={updateCivicSpace} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={space.id} />
        <CivicSpaceFormFields
          defaults={{
            name: space.name,
            type: space.type,
            hours: space.hours,
            note: space.note,
          }}
        />
        <Btn type="submit" kind="primary" className="self-start">
          Salva modifiche
        </Btn>
      </form>
    </main>
  );
}
