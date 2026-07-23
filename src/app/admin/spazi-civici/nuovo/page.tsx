import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { OrariField } from "@/components/OrariField";
import { createCivicSpace } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Tutti i campi sono obbligatori.",
  "2": "Nome, tipo e orari fino a 200 caratteri, note fino a 5000.",
};

export default async function NuovoSpazioCivicoPage({
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
      <SiteHeader activeHref="/spazi-civici" />

      <h1 className="font-display text-3xl font-black">Nuovo spazio civico</h1>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={createCivicSpace} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-ui text-sm">
          Nome
          <input
            name="name"
            type="text"
            required
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Tipo
          <input
            name="type"
            type="text"
            required
            placeholder="es. Biblioteca, Centro civico, Parco"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <OrariField />
        <label className="flex flex-col gap-1 font-ui text-sm">
          Note
          <textarea
            name="note"
            required
            rows={3}
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          Pubblica spazio civico
        </Btn>
      </form>
    </main>
  );
}
