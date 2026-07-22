import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { createWebinar } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Titolo, descrizione, durata e data sono obbligatori.",
  "2": "Il link o l'id del video YouTube non è valido.",
};

export default async function NuovoWebinarPage({
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
      <SiteHeader activeHref="/webinar" />

      <h1 className="font-display text-3xl font-black">Nuovo webinar</h1>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={createWebinar} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-ui text-sm">
          Titolo
          <input
            name="title"
            type="text"
            required
            placeholder="es. Come funziona il bilancio partecipativo"
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
          Link o id del video YouTube (non in elenco pubblico)
          <input
            name="video"
            type="text"
            required
            placeholder="https://youtu.be/xxxxxxxxxxx"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Durata
          <input
            name="duration"
            type="text"
            required
            placeholder="es. 38 min"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Data della registrazione
          <input
            name="recordedAt"
            type="date"
            required
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          Pubblica webinar
        </Btn>
      </form>
    </main>
  );
}
