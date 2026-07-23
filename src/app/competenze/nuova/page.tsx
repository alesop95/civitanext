import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { createSkill } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "La competenza è obbligatoria.",
  "2": "Competenza e offerta fino a 200 caratteri.",
  "3": "Troppe competenze pubblicate di recente: riprova più tardi.",
};

export default async function NuovaCompetenzaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/competenze" />

      <h1 className="font-display text-3xl font-black">Offri una competenza</h1>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={createSkill} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-ui text-sm">
          La tua competenza
          <input
            name="name"
            type="text"
            required
            placeholder="es. Traduzioni, contabilità, video"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Cosa offri (facoltativo)
          <input
            name="offer"
            type="text"
            placeholder="es. Sottotitoli per i webinar"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          Pubblica competenza
        </Btn>
      </form>
    </main>
  );
}
