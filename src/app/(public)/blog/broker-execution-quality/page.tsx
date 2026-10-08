import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Broker Execution Quality: What Slippage Patterns in Your Journal Actually Reveal · getALPHA",
  },
  description:
    "Slippage on its own is just noise — a few pips better, a few pips worse, roughly cancelling out. The pattern behind it is what tells you whether your broker's execution is costing you money.",
  alternates: { canonical: "/blog/broker-execution-quality" },
};

export default function Page() {
  return (
    <BlogPost
      title="Broker Execution Quality: What Slippage Patterns in Your Journal Actually Reveal"
      date="2026-10-08"
    >
      <p>
        Most traders notice slippage once: a market order fills a few pips worse than the price on
        screen, there&apos;s a flash of irritation, and it gets written off as the cost of trading.
        On its own, that single instance is close to meaningless — prices move in the time it takes
        an order to reach the server, and some of that difference will run in your favour and some
        against it. The pattern across dozens of fills is a different story, and it&apos;s one most
        journals never actually surface.
      </p>

      <h2>What slippage actually is</h2>
      <p>
        Slippage is the gap between the price you requested and the price you were filled at. It
        has a sign: <strong>positive slippage</strong> fills better than requested, <strong>
        negative slippage</strong> fills worse. On a market order during normal conditions, both
        happen, and over enough trades they should land close to symmetric — roughly as much
        positive as negative, netting out to something small.
      </p>
      <p>
        That symmetry is the baseline worth checking. It&apos;s not whether slippage happened —
        it always will — it&apos;s whether it happened to you evenly, or whether it was quietly
        one-sided.
      </p>

      <h2>The pattern that actually matters: one-sided slippage</h2>
      <p>
        If you pull every filled order from your history and split the slippage into positive and
        negative, a healthy execution venue produces something close to a wash. A venue with a
        problem produces a lopsided split — negative slippage shows up more often, or shows up
        larger, than positive slippage does. That asymmetry doesn&apos;t average out over time the
        way normal noise does; it compounds, quietly, trade after trade.
      </p>
      <p>
        A strategy with a real statistical edge can still show a flat or losing equity curve once
        a few pips of one-sided slippage are subtracted from every single fill. It never shows up
        as a single bad trade worth investigating — it shows up as an edge that should be working
        and somehow isn&apos;t, which is exactly the kind of problem a win-rate or P&amp;L column
        will never point you toward.
      </p>

      <h2>Where to actually look for it</h2>
      <ul>
        <li>
          <strong>By order type.</strong> Market orders are exposed to slippage by nature; limit
          orders either fill at your price or don&apos;t fill at all. If your limit fills are also
          coming back worse than the price you set, that&apos;s not slippage in the normal sense —
          that&apos;s a broker filling outside the price you agreed to.
        </li>
        <li>
          <strong>By time of day.</strong> Slippage during a scheduled news release or at a session
          open is expected — liquidity thins and prices gap. The same size slippage at 10am on a
          quiet Tuesday is a different problem entirely, and worth separating from the first case
          before drawing any conclusion.
        </li>
        <li>
          <strong>By order size.</strong> If slippage gets consistently worse as position size
          increases, beyond what thinner liquidity at size would explain, that points at a dealing
          desk pricing against larger orders rather than a market-depth issue.
        </li>
        <li>
          <strong>By direction.</strong> Slippage that&apos;s consistently worse on orders that
          close a profitable position than on orders that open or close a losing one is the
          clearest single tell of execution working against you rather than with the market.
        </li>
      </ul>

      <h2>What this tells you about the broker, not the market</h2>
      <p>
        A dealing-desk broker that takes the other side of your trade has a direct incentive for
        your fills to be worse than requested; an ECN or STP broker passing orders to a liquidity
        provider mostly doesn&apos;t, which is why the same strategy can show a genuinely different
        slippage signature depending purely on which broker it&apos;s run through. None of this
        shows up in a spread comparison done before opening the account — spread is advertised,
        execution quality isn&apos;t, and the only way to actually see it is from your own fills
        after the fact.
      </p>
      <p>
        This is also why the comparison has to be made from your own numbers rather than a
        broker&apos;s marketing page. Two brokers quoting the same spread on the same pair can
        deliver meaningfully different average slippage once you account for how each one actually
        fills orders during volatility, and that difference is only visible in a log that records
        the requested price next to the fill, trade by trade.
      </p>

      <h2>Why this is easy to miss in a manual log</h2>
      <p>
        Catching this requires the requested price and the filled price on every single trade,
        not just the entry you remember setting. A manually kept journal usually only has the fill
        — by the time you&apos;re writing the row down, the price you clicked at is already gone
        from memory, rounded to whatever you think it was.{" "}
        <Link href="/features/trading-journal">getALPHA</Link>&apos;s sync pulls both numbers
        straight from the broker&apos;s own trade history, so the slippage on every fill is a
        computed field in the journal rather than something you&apos;d have to reconstruct by hand
        — which is the only way a one-sided pattern across hundreds of trades becomes visible
        instead of invisible.
      </p>
    </BlogPost>
  );
}
