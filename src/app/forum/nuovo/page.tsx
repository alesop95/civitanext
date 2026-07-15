import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { createThread } from "../actions";

export default async function NuovoThreadPage() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/forum" />

      <h1 className="font-display text-3xl font-black">Nuovo thread</h1>

      <form action={createThread} className="flex flex-col gap-4">
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
          Messaggio
          <textarea
            name="body"
            required
            rows={6}
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          Pubblica
        </Btn>
      </form>
    </main>
  );
}
