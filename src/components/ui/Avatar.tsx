interface AvatarProps {
  name: string;
  size?: number;
}

const HUES = ["var(--accent)", "var(--ink)", "#C4853A"];

export function Avatar({ name, size = 36 }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
  const hue = HUES[name.length % HUES.length];

  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-ui font-bold text-white"
      style={{ width: size, height: size, background: hue, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}
