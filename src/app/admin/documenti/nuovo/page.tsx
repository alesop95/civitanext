import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn } from "@/components/ui/Btn";
import { FileField } from "@/components/ui/FileField";
import { createDocument } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Titolo e categoria sono obbligatori.",
  "2": "Il file deve essere un PDF valido, fino a 15 MB.",
};

export default async function NuovoDocumentoPage({
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
      <SiteHeader activeHref="/documenti" />

      <h1 className="font-display text-3xl font-black">Nuovo documento</h1>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={createDocument} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 font-ui text-sm">
          Titolo
          <input
            name="title"
            type="text"
            required
            placeholder="es. Bilancio preventivo 2026"
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Categoria
          <select
            name="category"
            required
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          >
            <option value="STATUTO">Statuto</option>
            <option value="VERBALI">Verbali</option>
            <option value="BILANCI">Bilanci</option>
          </select>
        </label>
        <FileField
          name="file"
          label="File PDF"
          accept="application/pdf"
          required
          buttonLabel="Scegli un PDF"
        />
        <Btn type="submit" kind="primary" className="self-start">
          Pubblica documento
        </Btn>
      </form>
    </main>
  );
}
