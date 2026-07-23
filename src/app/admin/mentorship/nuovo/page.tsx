import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { createMentor } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Nome, area e descrizione sono obbligatori.",
  "2": "Nome e area fino a 200 caratteri, descrizione fino a 5000.",
};

export default async function NuovoMentorPage({
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
      <SiteHeader activeHref="/mentorship" />

      <h1 className="font-display text-3xl font-black">Nuovo mentor</h1>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={createMentor} className="flex flex-col gap-4">
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
          Area
          <input
            name="area"
            type="text"
            required
            placeholder="es. Burocrazia comunale, Comunicazione, Bandi e fondi"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Descrizione
          <textarea
            name="description"
            required
            rows={3}
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Posti disponibili questo mese
          <input
            name="slots"
            type="number"
            min={0}
            defaultValue={1}
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          Pubblica mentor
        </Btn>
      </form>
    </main>
  );
}
