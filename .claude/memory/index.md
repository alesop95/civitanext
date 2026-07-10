# Snapshot di sincronizzazione

> Da leggere per primo a inizio sessione. Fotografa lo stato del progetto al commit di
> riferimento e mappa ogni scheda al suo stato di verifica. È la fonte di verità su cosa è fatto,
> non le spunte del diario.

## Stato

```
Branch attivo:        main
Commit di riferimento: 7ba6100
Data snapshot:        2026-07-10
```

## Stato di verifica delle schede

| Scheda | last-verified | Stato |
|---|---|---|
| STACK.md | 7ba6100 | aggiornata (working tree Fase 0, non ancora committata) |
| design-and-security.md | 7ba6100 | aggiornata (working tree Fase 0, non ancora committata) |
| deployment.md | 7ba6100 | aggiornata (working tree Fase 0, non ancora committata) |
| dev-testing.md | 7ba6100 | aggiornata (working tree Fase 0, non ancora committata) |
| current-work.md | 7ba6100 | aggiornata (working tree Fase 0, non ancora committata) |
| roadmap.md | 7ba6100 | aggiornata (direzione e priorità; il dettaglio in fasi resta `design_handoff_civitanext/ROADMAP.md`) |
| studio-didattico-master.md | 7ba6100 | nuova, 4 voci (working tree Fase 0, non ancora committata) |

## Punto di ripresa

Fase 0 (fondamenta) quasi chiusa: allineamento `.claude`, scelta stack (ADR-004/005/006),
bootstrap Next.js+TypeScript, design system, schema Prisma e schede `context/` tutti fatti nel
working tree corrente. Restano aperti, in ordine: impostare `DATABASE_URL` locale in
`webapp/.env` (azione dell'utente) per lanciare `prisma migrate dev`; scrivere la sintesi non
tecnica per lo stakeholder (Step 2bis); eseguire `sync-context` e il primo commit reale di
questo blocco, che ancorerà tutte le voci "7ba6100 (working tree)" sopra al commit vero.
