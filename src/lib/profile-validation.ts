// Validazione pura dei dati del profilo, condivisa e testabile senza database. Allineata alle
// regole gia' usate in fase di registrazione (src/app/api/register/route.ts): email con "@",
// nome non vuoto, password di almeno 8 caratteri.

export const PASSWORD_MIN_LENGTH = 8;

export function isValidName(name: string): boolean {
  return name.trim().length > 0;
}

// Controllo volutamente lasco, identico alla registrazione: non e' compito nostro validare
// l'esistenza reale dell'indirizzo, solo scartare stringhe palesemente non-email.
export function isValidEmail(email: string): boolean {
  return email.includes("@");
}

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}
