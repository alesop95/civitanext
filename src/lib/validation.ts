// Limiti condivisi di lunghezza massima per i campi di testo libero scritti dagli utenti o dagli
// admin: nessuna action del progetto ne aveva finora (verificato: zero limiti su tutti gli 8 file
// che accettano testo libero). Due sole taglie, non una costante per campo, perche' la
// distinzione che conta e' "riga breve" (titolo, nome, categoria) contro "testo lungo" (corpo,
// descrizione, nota), non il significato specifico di ciascun campo.
export const MAX_SHORT_TEXT = 200;
export const MAX_LONG_TEXT = 5000;
