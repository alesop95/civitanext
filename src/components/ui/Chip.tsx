import type { ButtonHTMLAttributes } from "react";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function Chip({ active = false, className, children, ...buttonProps }: ChipProps) {
  return (
    <button
      className={[
        "rounded-cn border-2 px-3 py-1 font-ui text-xs font-bold uppercase tracking-wide transition-colors",
        active
          ? "bg-accent border-ink text-white"
          : "bg-paper-card border-ink text-ink",
        className ?? "",
      ].join(" ")}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
