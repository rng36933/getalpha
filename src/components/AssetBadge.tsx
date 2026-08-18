/**
 * A monogram standing in for an instrument's logo — same reasoning as
 * `PairNews.tsx`'s source badges: no icon-fetch dependency, nothing to
 * break when an instrument doesn't have one, and a repeat symbol reads as
 * the same badge everywhere it appears rather than reshuffling per render.
 */
const TONES = [
  { bg: "bg-accent/15", text: "text-accent" },
  { bg: "bg-positive/15", text: "text-positive" },
  { bg: "bg-negative/15", text: "text-negative" },
  { bg: "bg-[#a78bfa]/15", text: "text-[#a78bfa]" },
] as const;

function tone(symbol: string): (typeof TONES)[number] {
  const hash = [...symbol].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return TONES[hash % TONES.length];
}

function initials(label: string): string {
  const letters = label.replace(/[^A-Za-z]/g, "");
  return (letters.slice(0, 2) || label.slice(0, 2)).toUpperCase();
}

export default function AssetBadge({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  const { bg, text } = tone(label);

  return (
    <span
      aria-hidden="true"
      className={`grid size-7 shrink-0 place-items-center rounded-full font-mono text-[10px] font-semibold ${bg} ${text} ${className}`}
    >
      {initials(label)}
    </span>
  );
}
