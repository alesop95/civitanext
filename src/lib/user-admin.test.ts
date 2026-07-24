import { describe, it, expect } from "vitest";
import { canChangeRole, nextTesseraNumero, assignableRolesFor } from "./user-admin";

// Logica pura di autorizzazione: nessun Postgres, gira sempre (anche in pre-commit e CI).

describe("canChangeRole", () => {
  it("nega a un UTENTE qualsiasi cambio di ruolo", () => {
    expect(
      canChangeRole({
        actorRole: "UTENTE",
        targetCurrentRole: "UTENTE",
        newRole: "ADMIN",
        isSelf: false,
      }),
    ).toBe(false);
  });

  it("nega il cambio del proprio ruolo, anche a un superadmin (anti auto-blocco)", () => {
    expect(
      canChangeRole({
        actorRole: "SUPERADMIN",
        targetCurrentRole: "SUPERADMIN",
        newRole: "UTENTE",
        isSelf: true,
      }),
    ).toBe(false);
  });

  it("permette a un SUPERADMIN di impostare qualunque ruolo su un altro utente", () => {
    for (const newRole of ["UTENTE", "ADMIN", "SUPERADMIN"] as const) {
      expect(
        canChangeRole({
          actorRole: "SUPERADMIN",
          targetCurrentRole: "UTENTE",
          newRole,
          isSelf: false,
        }),
      ).toBe(true);
    }
  });

  it("permette a un ADMIN di gestire dentro {UTENTE, ADMIN}", () => {
    expect(
      canChangeRole({
        actorRole: "ADMIN",
        targetCurrentRole: "UTENTE",
        newRole: "ADMIN",
        isSelf: false,
      }),
    ).toBe(true);
    expect(
      canChangeRole({
        actorRole: "ADMIN",
        targetCurrentRole: "ADMIN",
        newRole: "UTENTE",
        isSelf: false,
      }),
    ).toBe(true);
  });

  it("nega a un ADMIN di promuovere a SUPERADMIN o di toccare un SUPERADMIN", () => {
    expect(
      canChangeRole({
        actorRole: "ADMIN",
        targetCurrentRole: "UTENTE",
        newRole: "SUPERADMIN",
        isSelf: false,
      }),
    ).toBe(false);
    expect(
      canChangeRole({
        actorRole: "ADMIN",
        targetCurrentRole: "SUPERADMIN",
        newRole: "UTENTE",
        isSelf: false,
      }),
    ).toBe(false);
  });
});

describe("assignableRolesFor", () => {
  it("da' tutti e tre i ruoli al SUPERADMIN, solo due all'ADMIN, nessuno all'UTENTE", () => {
    expect(assignableRolesFor("SUPERADMIN")).toEqual(["UTENTE", "ADMIN", "SUPERADMIN"]);
    expect(assignableRolesFor("ADMIN")).toEqual(["UTENTE", "ADMIN"]);
    expect(assignableRolesFor("UTENTE")).toEqual([]);
  });
});

describe("nextTesseraNumero", () => {
  it("parte da CN-0001 quando non ci sono tessere", () => {
    expect(nextTesseraNumero([])).toBe("CN-0001");
  });

  it("incrementa il massimo progressivo esistente, con padding a quattro cifre", () => {
    expect(nextTesseraNumero(["CN-0001", "CN-0002"])).toBe("CN-0003");
    expect(nextTesseraNumero(["CN-0009"])).toBe("CN-0010");
    expect(nextTesseraNumero(["CN-9999"])).toBe("CN-10000");
  });

  it("ignora i numeri fuori formato nel calcolo del massimo", () => {
    expect(nextTesseraNumero(["TESSERA-VECCHIA", "CN-0005", "abc"])).toBe("CN-0006");
  });

  it("non dipende dall'ordine dell'elenco", () => {
    expect(nextTesseraNumero(["CN-0003", "CN-0001", "CN-0002"])).toBe("CN-0004");
  });
});
