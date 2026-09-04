import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: { absolute: "The Real Cost of Overtrading, Measured in Fees and Slippage · getALPHA" },
  description:
    "Overtrading rarely shows up as a single bad decision. It shows up as a fee line and a slippage line that quietly outgrow the P&L they're supposed to be a rounding error on.",
  alternates: { canonical: "/blog/real-cost-of-overtrading" },
};

export default function Page() {
  return (
    <BlogPost title="The Real Cost of Overtrading, Measured in Fees and Slippage" date="2026-09-04">
      <p>
        Overtrading gets talked about as a discipline problem — too many setups taken, not enough
        patience between them. That framing is correct, but it skips the part that actually shows
        up in the account balance: every one of those extra trades pays a spread, a commission, and
        a slippage cost before it has any chance of being profitable. A strategy can have a
        genuinely positive edge per trade and still lose money once trade count goes up, because
        the fixed cost per trade doesn&apos;t scale down with the size of the decision behind it.
      </p>

      <h2>The cost of a trade is not one number</h2>
      <p>
        Three separate costs get paid on every entry and exit, and most journals only track one of
        them:
      </p>
      <ul>
        <li>
          <strong>Spread</strong> — the gap between bid and ask, paid the instant a market order
          fills. Fixed per instrument, and identical whether the trade was well-planned or
          impulsive.
        </li>
        <li>
          <strong>Commission</strong> — a flat or per-lot fee charged by the broker, separate from
          spread on ECN-style accounts. Easy to see on a statement, easy to ignore when eyeballing
          P&L.
        </li>
        <li>
          <strong>Slippage</strong> — the difference between the price a trade was intended to fill
          at and the price it actually filled at. Usually small on a calm market order, and
          considerably larger during news spikes or on a market order sent in a hurry — which is
          exactly the condition an overtraded entry tends to be sent in.
        </li>
      </ul>
      <p>
        None of these move with conviction. A trade taken on a high-quality setup after a full
        pre-trade checklist pays the exact same spread as a trade taken on a whim thirty seconds
        after the last one closed. The only variable that changes is how many times the cost gets
        paid.
      </p>

      <h2>Why it disappears from the P&L line</h2>
      <p>
        Most trading platforms show a single net P&L number per trade, with spread and commission
        already folded in and slippage not broken out at all. That&apos;s convenient for reading a
        single trade and actively misleading for reading a pattern, because it makes ten small
        trades look like ten independent outcomes instead of one outcome minus ten cost
        deductions. Add them up separately and a different number appears: total cost paid this
        month as a percentage of gross P&L, before the win/loss split is even considered.
      </p>
      <p>
        A strategy averaging 20 pips of profit per winning trade and paying 1.5 pips of spread
        looks fine at 10 trades a month. The same strategy at 80 trades a month is paying the same
        1.5 pips eight times as often, against a profit per trade that didn&apos;t get any bigger.
        The edge didn&apos;t change. The trade count multiplied the one part of the equation that was
        never supposed to scale.
      </p>

      <h2>What to actually track</h2>
      <ul>
        <li>
          <strong>Total cost per month</strong> — spread, commission, and estimated slippage summed
          across every trade, not read off a single one.
        </li>
        <li>
          <strong>Cost as a percentage of gross profit</strong> — the number that shows whether
          fees are a rounding error or a second, silent losing strategy running alongside the real
          one.
        </li>
        <li>
          <strong>Average holding time against trade count</strong> — a rising trade count paired
          with a falling average holding time is the signature of entries being taken for the sake
          of being in a trade, not because a setup appeared.
        </li>
        <li>
          <strong>Slippage on market orders taken during news windows</strong>, tracked separately
          from calm-market fills — this is usually where the real damage concentrates, not in the
          spread line most traders already know to expect.
        </li>
      </ul>
      <p>
        None of these numbers require guessing at intent. They come straight out of the fill data
        the broker already records — the only thing missing is usually a place that adds them up
        instead of showing each trade in isolation.
      </p>

      <h2>The trade count number that matters more than win rate</h2>
      <p>
        Two traders with identical win rates and identical average reward-to-risk can end the month
        with opposite results if one of them took three times as many trades. The extra trades
        didn&apos;t need to be bad calls — plenty of overtrading happens on setups that would have
        passed the checklist on a slower day. They just needed to exist, because existing is what
        costs money before the market ever weighs in. Tracking cost per trade against trade count,
        month over month, is one of the few numbers that catches overtrading directly instead of
        inferring it after the fact from a shrinking account.
      </p>
      <p>
        This is exactly the kind of pattern that&apos;s invisible trade-by-trade and obvious in
        aggregate — which is the point of keeping a{" "}
        <Link href="/features/trading-journal">trading journal</Link> that totals cost across a
        stretch of trades rather than one that only shows what a single position made or lost.
      </p>
    </BlogPost>
  );
}
