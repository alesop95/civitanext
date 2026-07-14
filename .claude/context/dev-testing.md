---
generated-from-commit: 4da8cf9
generated-from-branch: main
generated-date: 2026-07-10
covers-paths:
  - src/**
last-verified-commit: 4da8cf9
---

# Test di sviluppo

> Popolare leggendo la configurazione reale dei test. La checklist operativa locale dei test
> manuali vive invece in `_notes/TEST-CHECKLIST.md`, ignorata da git.

## Test runner e comandi

Nessun framework di test automatico installato ancora in Fase 0 (nessuna feature da testare
oltre al design system statico). Controlli disponibili oggi: `npx tsc --noEmit` (type-check),
`npm run build` (build Next.js standard, Node), `npm run lint` (ESLint, configurazione
`eslint-config-next` di default). Un framework di test (probabilmente Jest o Vitest più
Playwright per gli e2e) va scelto quando si apre Fase 1, guardando anche
`design_handoff_civitanext/Flusso di Test.html`, già segnalato dal ROADMAP di handoff come
specifica di test pronta per i flussi utente.

## Rotte e dati mockati

`src/app/api/diag-fase0/route.ts`: route diagnostica temporanea (non applicativa),
verifica bcryptjs e la connessione Prisma. Da rimuovere quando la verifica del runtime
Cloudflare reale (ADR-006) sarà stata eseguita almeno una volta con esito noto. Nessun altro
dato mockato: a differenza del prototipo (`design_handoff_civitanext/civitanext-data.jsx`, array
statici), l'app reale non introduce dati finti propri.

## Hook e controlli di qualità

Nessun hook pre-commit installato in Fase 0 (pacchetto opzionale `hooks-starter` non ancora
istanziato, valutabile più avanti). Prima di un commit, eseguire a mano dalla radice del
repository `npx tsc --noEmit`, `npm run build`, `npm run lint`.
