import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { Btn } from "@/components/ui/Btn";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email o password non corretti.",
};

export default async function AccediPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-8 px-6 py-16">
      <h1 className="font-display text-3xl font-black">Accedi</h1>

      {error && (
        <p className="rounded-cn border-2 border-ink bg-accent px-3 py-2 font-ui text-sm text-white">
          {ERROR_MESSAGES[error] ?? "Accesso non riuscito. Riprova."}
        </p>
      )}

      <form
        action={async (formData) => {
          "use server";
          // authorize() che restituisce null (credenziali sbagliate) fa lanciare a signIn un
          // CredentialsSignin invece di limitarsi a un redirect: senza questo try/catch la
          // richiesta va in errore 500 anziche' mostrare un messaggio. redirect() qui dentro
          // rilancia il proprio segnale interno normalmente, non va "ricatturato".
          try {
            await signIn("credentials", formData);
          } catch (err) {
            if (err instanceof AuthError) {
              redirect(`/accedi?error=${err.type}`);
            }
            throw err;
          }
        }}
        className="flex flex-col gap-4"
      >
        {/* signIn legge redirectTo dai campi del FormData stesso (Object.fromEntries), non da
            un argomento separato: senza questo campo il redirect di default cade sul Referer
            header, cioe' torna su /accedi invece di portare l'utente alla home. */}
        <input type="hidden" name="redirectTo" value="/" />
        <label className="flex flex-col gap-1 font-ui text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 font-ui text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>
        <Btn type="submit" kind="primary">
          Accedi
        </Btn>
      </form>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <Btn type="submit" kind="secondary" className="w-full">
          Accedi con Google
        </Btn>
      </form>

      <p className="font-ui text-sm text-ink-soft">
        Non hai un account?{" "}
        <a href="/registrati" className="underline">
          Registrati
        </a>
      </p>
    </main>
  );
}
