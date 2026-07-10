# Snapshot di sincronizzazione

> Da leggere per primo a inizio sessione. Fotografa lo stato del progetto al commit di
> riferimento e mappa ogni scheda al suo stato di verifica. È la fonte di verità su cosa è fatto,
> non le spunte del diario.

## Stato

```
Branch attivo:        main
Commit di riferimento: d619e8b
Data snapshot:        2026-07-10
```

## Stato di verifica delle schede

| Scheda | last-verified | Stato |
|---|---|---|
| STACK.md | d619e8b | aggiornata |
| design-and-security.md | d619e8b | aggiornata |
| deployment.md | d619e8b | aggiornata |
| dev-testing.md | d619e8b | aggiornata |
| current-work.md | d619e8b | aggiornata |
| roadmap.md | d619e8b | aggiornata (direzione e priorità; il dettaglio in fasi resta `design_handoff_civitanext/ROADMAP.md`) |
| studio-didattico-master.md | d619e8b | 4 voci |

## Punto di ripresa

Fase 0 (fondamenta) sostanzialmente chiusa e committata in un unico commit radice (`d619e8b`),
dopo una riscrittura completa della storia git per rimuovere un'email aziendale trapelata nei
commit originali (vedi `progress.md`) e un force-push di correzione sul remote pubblico, già
verificato senza residui. Resta aperto un solo punto: impostare `DATABASE_URL` locale in
`webapp/.env` (azione dell'utente) per lanciare `prisma migrate dev` e chiudere lo Step 5 dello
schema dati. `memory/progress.md` ha una voce non ancora committata che documenta la riscrittura
della storia: va incluso nel prossimo commit.
