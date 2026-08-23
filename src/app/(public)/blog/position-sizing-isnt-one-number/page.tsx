import type { Metadata } from "next";
import Link from "next/link";
import BlogPost from "@/components/BlogPost";

export const metadata: Metadata = {
  title: {
    absolute:
      "Position Sizing Isn't One Number: Why the Same 1% Risk Produces Different Trades · getALPHA",
  },
  description:
    "\"Risk 1% per trade\" sounds like a single rule. In practice it produces a different position size, exposure and volatility profile every time, depending on where the stop sits.",
  alternates: { canonical: "/blog/position-sizing-isnt-one-number" },
};

export default function Page() {
  return (
    <BlogPost
      title="Position Sizing Isn't One Number: Why the Same 1% Risk Produces Different Trades"
      date="2026-08-23"
    >
      <p>
        &ldquo;I risk 1% per trade&rdquo; is one of the most repeated rules in trading, and it is
        also one of the most misleading to say out loud, because it sounds like a fixed quantity
        when it is actually the output of a calculation with two moving parts. The 1% is fixed.
        The stop distance is not. Change the stop, and the position size, the notional exposure,
        and the trade&apos;s sensitivity to a bad tick all change with it — while the risk figure
        on the journal entry stays identical.
      </p>

      <h2>What &ldquo;1% risk&rdquo; is actually computing</h2>
      <p>
        Position size from a fixed risk percentage is not a single number, it is a ratio: account
        balance times the risk percentage, divided by the stop distance. A wider stop divides that
        risk budget across a larger price range, which means a smaller position. A tighter stop
        divides it across a smaller range, which means a larger position. Two trades that both
        risk exactly 1% of the account can differ in size by a factor of three or more, purely
        because one setup called for a stop twice as far away as the other. The risk line in the
        journal is identical. Everything downstream of it is not.
      </p>

      <h2>A tight stop trades one risk for another</h2>
      <p>
        The instinct to use a tighter stop is usually about discipline — get out fast if wrong, cap
        the damage quickly. What it actually does to the position is the opposite of cautious: to
        keep the risk at 1%, the tighter stop forces a larger position size to compensate. That
        larger position is now more exposed to spread, slippage, and the stop simply being run by
        noise that has nothing to do with the trade thesis. The percentage risked on paper stayed
        the same. The trade got more fragile, not less.
      </p>

      <h2>A wide stop trades it back the other way</h2>
      <p>
        A wider stop produces a smaller position for the same 1%, which feels safer and in one
        sense is — less exposure to a single bad print. But the position now needs a much bigger
        favorable move to reach the same reward-to-risk target, which means longer holding time,
        more exposure to unrelated news and session changes, and more opportunities for the
        original thesis to simply become stale before the trade resolves either way. Smaller size
        is not the same thing as lower risk once time in the market is counted as its own kind of
        exposure.
      </p>

      <h2>Instrument volatility moves the same lever again</h2>
      <p>
        Even holding the stop distance in pips or points constant, the same nominal distance means
        something different on a low-volatility pair than it does on gold or an index during a
        volatile session. A 20-pip stop that comfortably sits outside normal noise on one
        instrument can sit well inside normal noise on another, which means the position sized off
        that stop is calibrated to the wrong thing — the round number chosen, not the actual
        behavior of the instrument being traded. &ldquo;1% risk&rdquo; without reference to the
        instrument&apos;s own volatility is a rule that only works by coincidence.
      </p>

      <h2>Two trades, same risk line, opposite exposure</h2>
      <p>
        Put a tight-stop trade and a wide-stop trade side by side in a trade log and, by the risk
        column alone, they look the same — both 1%. Look at what actually sits behind that number
        and they are close to opposite trades: one large and fast, sensitive to short-term noise
        and slippage; one small and slow, sensitive to time and unrelated drift. A trader who only
        ever checks the risk percentage before entering has no way to tell these two trades apart,
        which means the account can be running two very different risk profiles under a rule that
        looks perfectly consistent from the outside.
      </p>

      <h2>What to actually log next to the risk percentage</h2>
      <ul>
        <li>
          <strong>Stop distance in price and in the instrument&apos;s own volatility terms</strong>{" "}
          (ATR at entry, for instance) — so a 20-pip stop can be checked against whether that was
          tight, wide, or ordinary for that instrument that day.
        </li>
        <li>
          <strong>Resulting position size and notional exposure</strong>, not just the risk
          percentage — the two trades that both said 1% often reveal very different stories once
          size is next to them.
        </li>
        <li>
          <strong>Reward-to-risk target and expected holding time</strong> — a wide stop that
          implies a multi-hour or multi-day hold is a different commitment than the same
          percentage risked on a scalp, even when the risk column matches.
        </li>
        <li>
          <strong>Slippage and spread relative to position size</strong>, especially on the tighter,
          larger-size trades — this is where a technically correct 1% risk quietly loses more than
          1% by the time it is filled and closed.
        </li>
      </ul>
      <p>
        None of this means the 1%-per-trade rule is wrong. It means the rule only describes one
        axis of the trade, and treating it as the whole risk picture hides the axis that actually
        varies from trade to trade — how tight the stop was, how large the resulting position got,
        and how exposed that size was to costs that do not show up until the fill.
      </p>
      <p>
        This is why <Link href="/features/trading-journal">getALPHA</Link> logs stop distance and
        resulting position size alongside the risk percentage on every trade, instead of
        collapsing them into a single &ldquo;1% risked&rdquo; label, and why{" "}
        <Link href="/features/ai-trade-coach">the AI coach</Link> flags when position sizing is
        drifting toward tighter stops and larger size over time — a pattern that looks identical
        to disciplined risk management on the risk-percentage line alone.
      </p>
    </BlogPost>
  );
}
