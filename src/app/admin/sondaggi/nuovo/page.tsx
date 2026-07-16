import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { createPoll } from "../actions";

export default async function NuovoSondaggioPage({
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
      <SiteHeader activeHref="/admin/proposte" />

      <h1 className="font-display text-3xl font-black">Nuovo sondaggio</h1>

      {error && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          Servono una domanda e almeno due opzioni.
        </p>
      )}

      <form action={createPoll} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-ui text-sm">
          Domanda
          <input
            name="question"
            type="text"
            required
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Opzione 1
          <input
            name="option"
            type="text"
            required
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Opzione 2
          <input
            name="option"
            type="text"
            required
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Opzione 3 (facoltativa)
          <input
            name="option"
            type="text"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Opzione 4 (facoltativa)
          <input
            name="option"
            type="text"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          Pubblica sondaggio
        </Btn>
      </form>
    </main>
  );
}
