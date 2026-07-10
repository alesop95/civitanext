interface LogoProps {
  size?: number;
}

export function Logo({ size = 34 }: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <circle
          cx="20"
          cy="17"
          r="13"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3.5"
        />
        <line
          x1="14"
          y1="34"
          x2="26"
          y2="34"
          stroke="var(--accent)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M14 23 L23 14 M23 14 H16.5 M23 14 V20.5"
          fill="none"
          stroke="var(--ink)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {/* Wordmark su due righe, come da README del design handoff. */}
      <span className="font-ui leading-none flex flex-col">
        <b className="font-black tracking-wide">CIVITA</b>
        <span className="font-medium text-ink-soft">NEXT</span>
      </span>
    </span>
  );
}
