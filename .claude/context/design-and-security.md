---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - src/**
  - prisma/**
last-verified-commit: 4da8cf9
---

# Design e sicurezza applicativa

> Popolare leggendo il codice attuale. Nessun diagramma prodotto ancora in Fase 0: la tabella
> sotto resta vuota finché non se ne crea uno reale.

## Paradigmi di software design

Server Component per default, Client Component solo dove serve interattività reale: nessuno dei
componenti del design system (`src/components/ui/`) usa `"use client"`, perché sono puramente
presentazionali e non spediscono JavaScript inutile al browser. I design token (colori, raggio,
ombra) vivono come variabili CSS in `:root` e sono esposti a Tailwind tramite `@theme inline`,
non come valori statici nelle classi: l'accento colore in particolare resta rideclinabile a
runtime da un solo punto, coerente con il fatto che il prototipo lo tratta come tema
personalizzabile.

Accesso al database esclusivamente da codice server-side tramite Prisma, mai da client: nessuna
chiave o connection string è mai esposta al browser. Il client Prisma va istanziato per-richiesta
(non un singleton globale con pool persistente), vincolo imposto dal runtime Cloudflare Workers
di destinazione (vedi ADR-005) e comunque una pratica corretta anche a prescindere dal target di
deploy specifico.

## Sicurezza applicativa

Autenticazione non ancora implementata (prevista in Fase 1, fuori dal perimetro di questo
blocco): NextAuth self-hosted, hashing password con `bcryptjs`, due ruoli (`Role.SOCIO`,
`Role.ADMIN`) già presenti nello schema dati. Il vincolo di voto unico per utente
(`Vote.@@unique([userId, targetType, targetId])`) è un vincolo di integrità imposto a livello di
database, non solo di validazione applicativa: non è aggirabile da una richiesta malformata.
`.env` e i file di credenziali sono esclusi dalla lettura dell'agente per regola di
`settings.json`, coerente con `rules/security-permissions.md`.

Punto aperto, non ancora deciso: la tabella `Vote` usa `targetId` come riferimento generico
(pattern polimorfico), senza vincolo di chiave esterna reale verso `Thread`/`Proposal`/`Poll` —
un compromesso deliberato (vedi `prisma/schema.prisma`, commento sul modello `Vote`) che
va tenuto presente quando si scriverà la validazione applicativa in Fase 1/2: il database da
solo non garantisce che `targetId` punti a un record esistente del tipo dichiarato in
`targetType`.

## Diagrammi

| Diagramma | Sorgente | Componenti rappresentati |
|---|---|---|
| — | — | nessuno prodotto in Fase 0 |
