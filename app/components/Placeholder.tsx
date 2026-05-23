const palette = ["#1b5e3f", "#2563a8", "#d49a3a", "#7a4f9c", "#c0594a", "#3b8f6c"];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function placeholderColors(seed: string): { c1: string; c2: string } {
  const h = hash(seed);
  return {
    c1: palette[h % palette.length],
    c2: palette[(h + 3) % palette.length],
  };
}

export function Placeholder({
  seed,
  label,
  className = "",
  showLabel = true,
}: {
  seed: string;
  label: string;
  className?: string;
  showLabel?: boolean;
}) {
  const { c1, c2 } = placeholderColors(seed);
  return (
    <div
      className={`flex items-center justify-center text-center text-white font-semibold px-2 ${className}`}
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      aria-label={label}
    >
      {showLabel ? (
        <span className="break-words drop-shadow-md text-sm">{label}</span>
      ) : null}
    </div>
  );
}

export function isRealImageUrl(src: string | undefined): src is string {
  if (!src) return false;
  return /^(https?:|blob:|data:|\/)/.test(src);
}
