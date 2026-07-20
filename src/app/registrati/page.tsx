"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Btn } from "@/components/ui/Btn";

// Il provider Credentials autentica soltanto: la registrazione passa da /api/register
// (che crea lo User con password), poi da qui si accede con le stesse credenziali appena
// scelte, lato client perche' serve reagire all'esito del fetch prima di reindirizzare.
export default function RegistratiPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Registrazione non riuscita.");
      setPending(false);
      return;
    }

    await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirectTo: "/",
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-8 px-6 py-16">
      <h1 className="font-display text-3xl font-black">Registrati</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            minLength={8}
            className="rounded-cn border-2 border-ink bg-paper-card px-3 py-2"
          />
        </label>

        {error && <p className="font-ui text-sm text-accent">{error}</p>}

        <Btn type="submit" kind="primary" disabled={pending}>
          {pending ? "Attendere..." : "Crea account"}
        </Btn>
      </form>

      <p className="font-ui text-sm text-ink-soft">
        Hai già un account?{" "}
        <a href="/accedi" className="underline">
          Accedi
        </a>
      </p>
    </main>
  );
}
