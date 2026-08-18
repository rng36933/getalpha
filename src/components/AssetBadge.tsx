/**
 * An icon standing in for an instrument's logo — hand-drawn line icons per
 * asset category rather than a text monogram, so a watchlist/positions row
 * reads at a glance the way a coin logo does on a crypto dashboard, without
 * depending on a third-party icon set or fetching a real brand mark for
 * something this app has no license to display.
 *
 * Category is inferred from the symbol text rather than the `Instrument`
 * table's `kind` column: `OpenPosition`/`ClosedTrade` only ever carry the
 * plain asset string (e.g. "XAUUSD"), not a join back to the catalogue, and
 * pattern-matching the text works identically everywhere the badge is used.
 */
type Category = "gold" | "silver" | "index" | "crypto" | "forex";

const TONES: Record<Category, { bg: string; text: string }> = {
  gold: { bg: "bg-accent/15", text: "text-accent" },
  silver: { bg: "bg-muted/20", text: "text-foreground" },
  index: { bg: "bg-[#a78bfa]/15", text: "text-[#a78bfa]" },
  crypto: { bg: "bg-positive/15", text: "text-positive" },
  forex: { bg: "bg-negative/15", text: "text-negative" },
};

function categorise(label: string): Category {
  const s = label.toUpperCase();
  if (/XAU|GOLD/.test(s)) return "gold";
  if (/XAG|SILVER/.test(s)) return "silver";
  if (/^BTC|^ETH|^SOL|^BNB|^XRP|^DOGE/.test(s)) return "crypto";
  if (/DXY|USDX/.test(s)) return "index";
  return "forex";
}

function CategoryIcon({ category }: { category: Category }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "size-4",
    "aria-hidden": true,
  };

  switch (category) {
    case "gold":
    case "silver":
      // A stacked ingot — the shape everyone reads as a bar of metal.
      return (
        <svg {...common}>
          <path d="M6 9h12l2 8H4l2-8Z" />
          <path d="M8 9l1.4-3h5.2L16 9" />
        </svg>
      );
    case "index":
      // A dollar sign in a ring — DXY is a basket priced against the dollar.
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 7v10M14.5 9.5c0-1.1-1.1-2-2.5-2s-2.5.9-2.5 2 1.1 1.6 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2-2.5-.9-2.5-2" />
        </svg>
      );
    case "crypto":
      // A hexagonal coin, generic on purpose — not any one chain's mark.
      return (
        <svg {...common}>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="M12 8v8M9 10l3-2 3 2M9 14l3 2 3-2" />
        </svg>
      );
    case "forex":
    default:
      // Two arrows exchanging places — the standard "FX pair" glyph.
      return (
        <svg {...common}>
          <path d="M4 8h13M13 4l4 4-4 4" />
          <path d="M20 16H7M11 12l-4 4 4 4" />
        </svg>
      );
  }
}

export default function AssetBadge({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  const category = categorise(label);
  const { bg, text } = TONES[category];

  return (
    <span
      aria-hidden="true"
      className={`grid size-7 shrink-0 place-items-center rounded-full ${bg} ${text} ${className}`}
    >
      <CategoryIcon category={category} />
    </span>
  );
}
