import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { createPressArticle } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Testata, titolo e data di pubblicazione sono obbligatori.",
  "2": "Il link, se presente, deve essere un indirizzo completo (https://...).",
};

export default async function NuovoArticoloStampaPage({
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
      <SiteHeader activeHref="/rassegna-stampa" />

      <h1 className="font-display text-3xl font-black">Nuovo articolo di stampa</h1>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={createPressArticle} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-ui text-sm">
          Testata
          <input
            name="source"
            type="text"
            required
            placeholder="es. Cronache Maceratesi"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Titolo dell&apos;articolo
          <input
            name="title"
            type="text"
            required
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Data di pubblicazione
          <input
            name="publishedAt"
            type="date"
            required
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Link all&apos;articolo (facoltativo, solo se online)
          <input
            name="url"
            type="url"
            placeholder="https://..."
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          Pubblica articolo
        </Btn>
      </form>
    </main>
  );
}
