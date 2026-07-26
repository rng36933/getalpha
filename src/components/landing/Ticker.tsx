/**
 * The instrument strip along the top of the landing page.
 *
 * Illustrative, not live, and marked `aria-hidden` — it is atmosphere that
 * says "this is a trading product" before a word is read. Wiring it to the
 * real feed would spend a provider credit on every visit from someone who has
 * not signed up, and the free plan allows eight a minute in total.
 */

const INSTRUMENTS = [
  { symbol: "XAUUSD", price: "4056.01", change: 0.42 },
  { symbol: "EURUSD", price: "1.0847", change: -0.11 },
  { symbol: "GBPUSD", price: "1.2913", change: 0.08 },
  { symbol: "USDJPY", price: "149.62", change: -0.27 },
  { symbol: "AUDUSD", price: "0.6588", change: 0.19 },
  { symbol: "USDCHF", price: "0.8794", change: -0.05 },
  { symbol: "BTCUSD", price: "94820", change: 1.34 },
  { symbol: "ETHUSD", price: "3182", change: -0.88 },
] as const;

export default function Ticker() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-b border-line bg-surface whitespace-nowrap"
    >
      <div className="animate-ticker inline-flex gap-10 py-2 font-mono text-xs">
        {/* Rendered twice so the -50% translate wraps without a visible seam. */}
        {[0, 1].map((pass) =>
          INSTRUMENTS.map((instrument) => (
            <span key={`${pass}-${instrument.symbol}`} className="text-muted">
              <span className="font-medium text-foreground">
                {instrument.symbol}
              </span>{" "}
              {instrument.price}{" "}
              <span
                className={
                  instrument.change >= 0 ? "text-positive" : "text-negative"
                }
              >
                {instrument.change >= 0 ? "+" : ""}
                {instrument.change.toFixed(2)}%
              </span>
            </span>
          )),
        )}
      </div>
    </div>
  );
}
