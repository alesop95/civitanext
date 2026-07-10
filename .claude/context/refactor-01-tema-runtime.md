# Refactor 01 — Il tema colore come variabile CSS, non come classe Tailwind statica

Riferimento: voce 1 di `studio-didattico-master.md`.

## Prima (prototipo, `design_handoff_civitanext/civitanext-ui.jsx`)

Il prototipo usa già una variabile CSS, ma dentro un ambiente senza bundler dove ogni componente
la referenzia come stringa passata a JavaScript inline:

```jsx
function Starburst({ size = 120, points = 14, color = 'var(--accent)', style = {} }) {
  // ...
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style} aria-hidden="true">
      <path d={path} fill={color}></path>
    </svg>
  );
}
```

Il pattern regge finché ogni componente riceve `color` come prop con default `'var(--accent)'`
scritto a mano. La tentazione, ricostruendo con Tailwind, sarebbe stata di risolvere subito il
valore esadecimale in build (`#E8503A`) e usarlo in classi statiche tipo `bg-[#E8503A]`, perché è
il modo più immediato di scrivere Tailwind senza pensare a variabili.

## Dopo (`webapp/src/app/globals.css`)

```css
:root {
  --accent: #e8503a;
  /* ... */
}

@theme inline {
  --color-accent: var(--accent);
  /* ... */
}
```

Tailwind v4 genera comunque `bg-accent`, `text-accent`, `border-accent` come utility di prima
classe, ma il valore vero resta un'unica riga in `:root`. Un componente come
`webapp/src/components/ui/Btn.tsx` usa `bg-accent` nella classe, non un valore esadecimale:

```ts
const KIND_CLASSES: Record<BtnKind, string> = {
  primary: "bg-accent text-white border-ink",
  // ...
};
```

Cambiare l'accento in blu o verde (le alternative testate nel prototipo) significa cambiare una
riga in `globals.css`, non cercare occorrenze del colore in tutto il codebase.

## Come estendere il pattern

Ogni nuovo token di design (un colore aggiuntivo, un nuovo raggio, una nuova ombra) va dichiarato
prima in `:root` come variabile CSS con un nome descrittivo, poi esposto in `@theme inline` con
il prefisso che genera l'utility Tailwind corrispondente (`--color-*` per `bg-*`/`text-*`/
`border-*`, `--radius-*` per `rounded-*`, `--shadow-*` per `shadow-*`, `--font-*` per `font-*`).
Non introdurre mai un valore di design direttamente in una classe Tailwind o in uno style inline,
nemmeno "solo per questa volta": è esattamente l'eccezione che nel tempo rompe l'unica fonte di
verità.
