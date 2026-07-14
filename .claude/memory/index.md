# Snapshot di sincronizzazione

> Da leggere per primo a inizio sessione. Fotografa lo stato del progetto al commit di
> riferimento e mappa ogni scheda al suo stato di verifica. È la fonte di verità su cosa è fatto,
> non le spunte del diario.

## Stato

```
Branch attivo:        main
Commit di riferimento: 4da8cf9
Data snapshot:        2026-07-13
```

## Stato di verifica delle schede

| Scheda | last-verified | Stato |
|---|---|---|
| STACK.md | 4da8cf9 | aggiornata |
| design-and-security.md | 4da8cf9 | aggiornata |
| deployment.md | 4da8cf9 | aggiornata |
| dev-testing.md | 4da8cf9 | aggiornata |
| current-work.md | 4da8cf9 | aggiornata |
| roadmap.md | 4da8cf9 | aggiornata (direzione e priorità; il dettaglio in fasi resta `design_handoff_civitanext/ROADMAP.md`) |
| studio-didattico-master.md | 4da8cf9 | 5 voci |

## Punto di ripresa

Fase 0 (fondamenta) chiusa nella sostanza. Storia git riscritta e forzata sul remote pubblico
(vedi `progress.md`), poi riorganizzazione strutturale (applicazione portata alla radice del
repository, mockup legacy spostati in `_notes/`) committata in `4da8cf9`; il drift rilevato tra
quel commit e lo snapshot precedente era di sola forma (rename dell'intero modulo `webapp/` →
radice, contenuto delle schede già corretto in anticipo). L'ultimo punto sostanziale, la
migrazione Prisma contro un Postgres reale, è stato chiuso il 2026-07-13: server locale dedicato
`npx prisma dev -n civitanext` (porte 51218/51219, isolato da un'istanza di un altro progetto
dell'utente su 51213-51215), workaround `migrate diff` + `migrate deploy` per un bug noto e non
confermato di `migrate dev` contro lo shadow database (`prisma/prisma#29366`), registrato come
ADR-009. Cronologia di migrazione ora tracciata in `prisma/migrations/`. Restano aperti solo la
sintesi non tecnica per lo stakeholder e la verifica del runtime Cloudflare reale (ADR-006,
invariato). Fase 1 (auth NextAuth, iscrizione socio, eventi) aperta in parallelo a questo blocco,
non ancora dettagliata in `current-work.md`.
