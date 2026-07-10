import type { ButtonHTMLAttributes } from "react";

type BtnKind = "primary" | "secondary" | "ghost";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: BtnKind;
  small?: boolean;
}

const KIND_CLASSES: Record<BtnKind, string> = {
  primary: "bg-accent text-white border-ink",
  secondary: "bg-paper-card text-ink border-ink",
  ghost: "bg-transparent text-ink border-transparent",
};

export function Btn({
  kind = "primary",
  small = false,
  className,
  children,
  ...buttonProps
}: BtnProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center rounded-cn border-2 font-ui font-bold uppercase tracking-wide shadow-hard transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        small ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm",
        KIND_CLASSES[kind],
        className ?? "",
      ].join(" ")}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
