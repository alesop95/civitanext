import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { getPrisma } from "@/lib/prisma";
import { updatePressArticle } from "../../actions";
import { PressFormFields } from "../../PressFormFields";

const ERROR_MESSAGES: Record<string, string> = {
  "1": "Testata, titolo e data di pubblicazione sono obbligatori.",
  "2": "Il link, se presente, deve essere un indirizzo completo (https://...).",
  "3": "Testata e titolo fino a 200 caratteri.",
};

export default async function ModificaArticoloStampaPage({
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

  const article = await getPrisma().pressArticle.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/rassegna-stampa" />

      <div className="flex flex-col gap-4">
        <Link
          href="/rassegna-stampa"
          className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
        >
          Torna alla rassegna
        </Link>
        <h1 className="font-display text-3xl font-black">Modifica articolo di stampa</h1>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}

      <form action={updatePressArticle} className="flex flex-col gap-4">
        <input type="hidden" name="id" value={article.id} />
        <PressFormFields
          defaults={{
            source: article.source,
            title: article.title,
            url: article.url ?? "",
            publishedAt: article.publishedAt.toISOString().slice(0, 10),
          }}
        />
        <Btn type="submit" kind="primary" className="self-start">
          Salva modifiche
        </Btn>
      </form>
    </main>
  );
}
