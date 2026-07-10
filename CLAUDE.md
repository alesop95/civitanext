# civitanext

> Istruzioni di progetto, versionate. Indice dei satelliti e procedura di ripresa. Le preferenze personali vivono in `CLAUDE.local.md` (ignorato).

## Cos'e questo progetto

CivitaNext e' la piattaforma di partecipazione civica per l'associazione di giovani cittadini di
Civitanova Marche (eventi, quiz civici, forum, proposte e votazioni, profilo socio, sezioni
citta' e community). Il repository contiene il prototipo di design ad alta fedelta' in
`design_handoff_civitanext/` (React 18 + Babel via CDN, dati statici, auth finta in
localStorage: riferimento di sola lettura, non codice di produzione) e, da questo blocco di
lavoro (Fase 0, fondamenta), il progetto reale in Next.js + TypeScript alla radice del
repository stesso (non in una sottocartella: vedi ADR in `memory/decisions.md` sulla
riorganizzazione). I mockup HTML monolitici del prototipo storico vivono in `_notes/`, non
tracciati. Lo stack effettivo e' documentato in `.claude/context/STACK.md`; questa scheda non
assume funzionalita' non verificate.

**Prima di scrivere codice Next.js**, leggere `AGENTS.md` in radice: la versione di Next.js
installata (16.x) ha cambiamenti sostanziali rispetto alle convenzioni piu' note, e quel file
rimanda alla documentazione reale inclusa nel pacchetto (`node_modules/next/dist/docs/`).

## Sviluppo e identita

git locale, identita `alesop95` / `alessio.sopranzi.95@gmail.com`, alias SSH `github-personal`. Remoto gia' collegato e pushato (`git@github-personal:alesop95/civitanext.git`, repository pubblico). Commit e push restano manuali.

## Standard

Allineato a `.claude/PROJECT-SYSTEM.md`: regole, engine skills (`sync-context`, `git-sync`, `repo-status`, `onboard`), catalogo `.claude/templates/PACKAGES.md`, schede `context/` popolate da Fase 0 in poi. Il pacchetto `code-context` (MCP) e disponibile se serve mappare i componenti. Livello didattico adottato dalla Fase 0: `.claude/context/studio-didattico-master.md` e i deep-dive `refactor-NN-*.md` associati raccontano le scelte non ovvie, distinti dallo stato registrato nelle altre schede.
