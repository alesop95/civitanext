interface WavesProps {
  width?: number;
  rows?: number;
  color?: string;
  className?: string;
}

const WAVE_PATH =
  "M0 6 Q 7.5 0, 15 6 T 30 6 T 45 6 T 60 6 T 75 6 T 90 6 T 105 6 T 120 6";

export function Waves({
  width = 180,
  rows = 4,
  color = "var(--ink)",
  className,
}: WavesProps) {
  return (
    <svg
      width={width}
      height={rows * 13}
      viewBox={`0 0 120 ${rows * 13}`}
      className={className}
      aria-hidden="true"
    >
      {Array.from({ length: rows }).map((_, i) => (
        <path
          key={i}
          d={WAVE_PATH}
          transform={`translate(0 ${i * 13})`}
          fill="none"
          stroke={color}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
