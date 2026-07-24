import { describe, it, expect } from "vitest";
import { isValidName, isValidEmail, isValidPassword, PASSWORD_MIN_LENGTH } from "./profile-validation";

// Logica pura: nessun Postgres, gira sempre.

describe("isValidName", () => {
  it("accetta un nome non vuoto, rifiuta vuoto o soli spazi", () => {
    expect(isValidName("Giulia")).toBe(true);
    expect(isValidName("   ")).toBe(false);
    expect(isValidName("")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("richiede una chiocciola (controllo lasco come la registrazione)", () => {
    expect(isValidEmail("socio@civitanext.local")).toBe(true);
    expect(isValidEmail("senza-chiocciola")).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("richiede almeno la lunghezza minima", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(isValidPassword("1234567")).toBe(false);
    expect(isValidPassword("12345678")).toBe(true);
  });
});
