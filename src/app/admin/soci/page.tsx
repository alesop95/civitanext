import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Btn, btnClassName } from "@/components/ui/Btn";
import { Tag } from "@/components/ui/Tag";
import { getPrisma } from "@/lib/prisma";
import { assignableRolesFor, type AppRole } from "@/lib/user-admin";
import { changeUserRole, assignTessera, revokeTessera } from "./actions";

const ROLE_LABELS: Record<AppRole, string> = {
  SUPERADMIN: "Super admin",
  ADMIN: "Admin",
  UTENTE: "Socio",
};

// Gestione soci (sezione "Utenti" del prototipo). Elenca gli utenti e permette di cambiarne il
// ruolo e di assegnare/revocare la tessera. L'interruttore "attivo/disattivato" del prototipo e'
// deliberatamente omesso: non esiste una colonna corrispondente nello schema e introdurla sarebbe
// una scelta di prodotto a se' (sospensione account), non un dettaglio di questa feature.
export default async function AdminSociPage() {
  const session = await auth();
  if (!session?.user) redirect("/accedi");
  if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect("/");

  const actorRole = session.user.role as AppRole;
  const actorId = session.user.id;
  const prisma = getPrisma();

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, tesseraNumero: true },
  });

  const roleOptions = assignableRolesFor(actorRole);

  return (
    <main className="flex flex-1 flex-col gap-12 px-6 py-16 sm:px-16">
      <SiteHeader activeHref="/admin/soci" />

      <header className="flex flex-col gap-4">
        <Link
          href="/admin"
          className={btnClassName({ kind: "secondary", small: true, className: "self-start" })}
        >
          Torna al pannello
        </Link>
        <h1 className="font-display text-4xl font-black leading-tight sm:text-5xl">
          Gestione soci
        </h1>
        <p className="font-ui text-base text-ink-soft">
          Ruolo e tessera dei soci. Il tesseramento e&apos; indipendente dal ruolo: un socio puo&apos;
          essere tesserato senza essere admin, e viceversa.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        {users.map((user) => {
          const targetRole = user.role as AppRole;
          const isSelf = user.id === actorId;
          // Riga gestibile se non e' se stessi e la gerarchia lo consente (un ADMIN non tocca un
          // SUPERADMIN). E' lo stesso invariante che canChangeRole applica lato server per ogni
          // ruolo di destinazione: qui decide solo se mostrare la tendina o un testo statico.
          const canManageRole =
            !isSelf && (actorRole === "SUPERADMIN" || targetRole !== "SUPERADMIN");

          return (
            <article
              key={user.id}
              className="flex flex-col gap-4 rounded-cn border-2 border-ink bg-paper-card p-6 shadow-hard sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-black">{user.name}</h2>
                  {isSelf && <Tag color="var(--ink-soft)">Tu</Tag>}
                </div>
                <p className="font-ui text-sm text-ink-soft">{user.email}</p>
                <p className="font-ui text-xs font-bold uppercase tracking-wide text-ink-soft">
                  {ROLE_LABELS[targetRole]}
                  {" · "}
                  {user.tesseraNumero ? `Tessera ${user.tesseraNumero}` : "Nessuna tessera"}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                {canManageRole ? (
                  <form action={changeUserRole} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    {/*
                      key legata al ruolo attuale: quando l'azione cambia il ruolo e la pagina si
                      rigenera, la tendina (non controllata, con defaultValue) verrebbe altrimenti
                      riusata da React con il valore scelto prima e mostrerebbe il ruolo vecchio.
                      Cambiando la key la tendina si rimonta e riparte dal ruolo aggiornato.
                    */}
                    <select
                      key={targetRole}
                      name="role"
                      defaultValue={targetRole}
                      className="rounded-cn border-2 border-ink bg-paper px-3 py-2 font-ui text-sm"
                      aria-label={`Ruolo di ${user.name}`}
                    >
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                    <Btn type="submit" kind="secondary" small>
                      Salva ruolo
                    </Btn>
                  </form>
                ) : (
                  <span className="font-ui text-xs text-ink-soft">
                    {isSelf ? "Non puoi cambiare il tuo ruolo" : "Ruolo non modificabile"}
                  </span>
                )}

                {user.tesseraNumero ? (
                  <form action={revokeTessera.bind(null, user.id)}>
                    <Btn type="submit" kind="ghost" small>
                      Revoca tessera
                    </Btn>
                  </form>
                ) : (
                  <form action={assignTessera.bind(null, user.id)}>
                    <Btn type="submit" kind="primary" small>
                      Assegna tessera
                    </Btn>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
