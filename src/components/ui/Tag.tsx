import type { ReactNode } from "react";

interface TagProps {
  children: ReactNode;
  color?: string;
}

export function Tag({ children, color = "var(--ink)" }: TagProps) {
  return (
    <span
      className="rounded-cn border font-ui text-xs font-bold uppercase tracking-wide px-2 py-0.5"
      style={{ color, borderColor: color }}
    >
      {children}
    </span>
  );
}
