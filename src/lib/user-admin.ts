// Logica di autorizzazione della gestione soci (sezione "Utenti" del prototipo admin) e
// generazione del numero tessera. Parte pura, senza database: e' la regola di sicurezza piu'
// delicata del pannello (chi puo' cambiare il ruolo di chi), quindi vive in funzioni pure
// testabili in isolamento, come per la reputazione. Le server action la richiamano dopo aver
// letto ruolo dell'attore e stato del bersaglio dal database.

export type AppRole = "SUPERADMIN" | "ADMIN" | "UTENTE";

// Ordine dei ruoli assegnabili nella tendina, dal meno al piu' privilegiato.
export const ASSIGNABLE_ROLES: AppRole[] = ["UTENTE", "ADMIN", "SUPERADMIN"];

// I ruoli che un attore puo' materialmente assegnare dalla UI. Un ADMIN non vede nemmeno l'opzione
// SUPERADMIN; un SUPERADMIN le vede tutte. Serve a costruire la tendina, ma non e' la guardia: la
// guardia vera resta canChangeRole lato server (la UI si puo' aggirare, il controllo no).
export function assignableRolesFor(actorRole: AppRole): AppRole[] {
  if (actorRole === "SUPERADMIN") return ASSIGNABLE_ROLES;
  if (actorRole === "ADMIN") return ["UTENTE", "ADMIN"];
  return [];
}

// Puo' l'attore cambiare il ruolo del bersaglio a newRole? Regole:
//  - solo ADMIN e SUPERADMIN gestiscono ruoli;
//  - nessuno cambia il proprio ruolo (evita l'auto-blocco: un admin che si declassa e perde
//    l'accesso, o l'unico superadmin che si toglie i poteri);
//  - un SUPERADMIN puo' impostare qualunque ruolo su chiunque altro;
//  - un ADMIN opera solo dentro {UTENTE, ADMIN}: non puo' toccare un SUPERADMIN esistente ne'
//    promuovere qualcuno a SUPERADMIN.
export function canChangeRole(params: {
  actorRole: AppRole;
  targetCurrentRole: AppRole;
  newRole: AppRole;
  isSelf: boolean;
}): boolean {
  const { actorRole, targetCurrentRole, newRole, isSelf } = params;
  if (actorRole !== "ADMIN" && actorRole !== "SUPERADMIN") return false;
  if (isSelf) return false;
  if (actorRole === "SUPERADMIN") return true;
  if (targetCurrentRole === "SUPERADMIN") return false;
  if (newRole === "SUPERADMIN") return false;
  return true;
}

// Prossimo numero tessera nel formato CN-NNNN, dato l'elenco dei numeri gia' assegnati. Prende il
// massimo progressivo esistente che rispetta il formato e incrementa; i numeri fuori formato
// (eventuali tessere storiche con schema diverso) vengono ignorati nel calcolo del massimo.
export function nextTesseraNumero(existing: string[]): string {
  let max = 0;
  for (const t of existing) {
    const match = /^CN-(\d+)$/.exec(t);
    if (match) max = Math.max(max, parseInt(match[1], 10));
  }
  return `CN-${String(max + 1).padStart(4, "0")}`;
}
