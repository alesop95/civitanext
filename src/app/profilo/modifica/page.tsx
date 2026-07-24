import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { getPrisma } from "@/lib/prisma";
import { updateProfileInfo, changePassword } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  "info-invalid": "Servono un nome non vuoto e un'email valida.",
  "wrong-password": "La password attuale non e' corretta.",
  "email-taken": "Esiste gia' un account con questa email.",
  "password-short": "La nuova password deve avere almeno 8 caratteri.",
  "password-mismatch": "La nuova password e la conferma non coincidono.",
};

const OK_MESSAGES: Record<string, string> = {
  info: "Dati aggiornati.",
  password: "Password aggiornata.",
};

export default async function ModificaProfiloPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/accedi");

  const user = await getPrisma().user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/accedi");

  const { error, ok } = await searchParams;
  const hasPassword = user.passwordHash !== null;

  const fieldClass = "rounded-cn border-2 border-ink bg-paper-card px-3 py-2";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-6 py-16">
      <SiteHeader activeHref="/profilo" />

      <div className="flex flex-col gap-4">
        <Link
          href="/profilo"
          className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
        >
          Torna al profilo
        </Link>
        <h1 className="font-display text-3xl font-black">Modifica profilo</h1>
      </div>

      {error && ERROR_MESSAGES[error] && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error]}
        </p>
      )}
      {ok && OK_MESSAGES[ok] && (
        <p className="rounded-cn border-2 border-ink bg-success px-3 py-2 font-ui text-sm text-white">
          {OK_MESSAGES[ok]}
        </p>
      )}

      <form action={updateProfileInfo} className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-black">Dati personali</h2>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Nome
          <input name="name" type="text" required defaultValue={user.name} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            defaultValue={user.email}
            className={fieldClass}
          />
        </label>
        {hasPassword && (
          <label className="flex flex-col gap-1 font-ui text-sm">
            Password attuale (serve solo se cambi l&apos;email)
            <input name="currentPassword" type="password" className={fieldClass} />
          </label>
        )}
        <Btn type="submit" kind="primary" className="self-start">
          Salva dati
        </Btn>
      </form>

      <form
        action={changePassword}
        className="flex flex-col gap-4 border-t-2 border-dashed border-ink/20 pt-8"
      >
        <h2 className="font-display text-xl font-black">
          {hasPassword ? "Cambia password" : "Imposta una password"}
        </h2>
        {!hasPassword && (
          <p className="font-ui text-sm text-ink-soft">
            Accedi con Google e non hai ancora una password. Impostandone una potrai accedere anche
            con email e password.
          </p>
        )}
        {hasPassword && (
          <label className="flex flex-col gap-1 font-ui text-sm">
            Password attuale
            <input name="currentPassword" type="password" required className={fieldClass} />
          </label>
        )}
        <label className="flex flex-col gap-1 font-ui text-sm">
          Nuova password (almeno 8 caratteri)
          <input name="newPassword" type="password" required minLength={8} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Conferma nuova password
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            className={fieldClass}
          />
        </label>
        <Btn type="submit" kind="primary" className="self-start">
          {hasPassword ? "Cambia password" : "Imposta password"}
        </Btn>
      </form>
    </main>
  );
}
