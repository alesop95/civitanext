# civitanext

> Istruzioni di progetto, versionate. Indice dei satelliti e procedura di ripresa. Le preferenze personali vivono in `CLAUDE.local.md` (ignorato).

## Cos'e questo progetto

CivitaNext e' la piattaforma di partecipazione civica per l'associazione di giovani cittadini di
Civitanova Marche (eventi, quiz civici, forum, proposte e votazioni, profilo socio, sezioni
citta' e community). Il repository contiene il prototipo di design ad alta fedelta' in
`design_handoff_civitanext/` (React 18 + Babel via CDN, dati statici, auth finta in
localStorage: riferimento di sola lettura, non codice di produzione), alcuni file `.html` di
mockup monolitici in radice, e da questo blocco di lavoro (Fase 0, fondamenta) un progetto reale
in `webapp/` (Next.js + TypeScript). Lo stack effettivo e' documentato in
`.claude/context/STACK.md`; questa scheda non assume funzionalita' non verificate.

## Sviluppo e identita

git locale, identita `alesop95` / `alessio.sopranzi.95@gmail.com`, alias SSH `github-personal`. Remoto gia' collegato (`git@github-personal:alesop95/civitanext.git`), ancora senza alcun push. Commit e push restano manuali.

## Standard

Allineato a `.claude/PROJECT-SYSTEM.md`: regole, engine skills (`sync-context`, `git-sync`, `repo-status`, `onboard`), catalogo `.claude/templates/PACKAGES.md`, schede `context/` popolate da Fase 0 in poi. Il pacchetto `code-context` (MCP) e disponibile se serve mappare i componenti. Livello didattico adottato dalla Fase 0: `.claude/context/studio-didattico-master.md` e i deep-dive `refactor-NN-*.md` associati raccontano le scelte non ovvie, distinti dallo stato registrato nelle altre schede.
