import type { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

// Esportata per i chip di navigazione: un <Link> non puo' annidare un <button> (HTML non
// valido), quindi il <Link> usa direttamente questa stessa classe invece del componente Chip.
export function chipClassName({
  active = false,
  className,
}: { active?: boolean; className?: string } = {}) {
  return [
    "rounded-cn border-2 px-3 py-1 font-ui text-xs font-bold uppercase tracking-wide transition-colors",
    active ? "bg-accent border-ink text-white" : "bg-paper-card border-ink text-ink",
    className ?? "",
  ].join(" ");
}

export function Chip({ active = false, className, children, ...buttonProps }: ChipProps) {
  return (
    <button className={chipClassName({ active, className })} {...buttonProps}>
      {children}
    </button>
  );
}
