import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { createProposal } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Titolo, categoria e descrizione sono tutti obbligatori.",
  "2": "Titolo e categoria fino a 200 caratteri, descrizione fino a 5000.",
  "3": "Troppe proposte inviate di recente: riprova più tardi.",
};

export default async function NuovaPropostaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/proposte" />

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-black">Nuova proposta</h1>
        <p className="font-ui text-sm text-ink-soft">
          La proposta entra prima in revisione: comparirà pubblicamente solo dopo essere stata
          approvata per la votazione.
        </p>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={createProposal} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-ui text-sm">
          Titolo
          <input
            name="title"
            type="text"
            required
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Categoria
          <input
            name="category"
            type="text"
            required
            placeholder="es. Mobilità, Ambiente, Città, Associazione"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Descrizione
          <textarea
            name="description"
            required
            rows={6}
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          Invia in revisione
        </Btn>
      </form>
    </main>
  );
}
